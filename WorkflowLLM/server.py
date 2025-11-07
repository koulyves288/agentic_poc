import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

import os
import sys
from dotenv import load_dotenv
load_dotenv()  # This should be at the very top, before any other imports that use env vars

import uvicorn
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, Body, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from dapr.ext.fastapi import DaprApp
from models import Message, Chat
import subprocess
import socket
import json
import asyncio

WORKFLOW_PORT = 8005

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic here
    yield
    # Shutdown logic here

app = FastAPI(title="Dapr Agent API", lifespan=lifespan)
dapr_app = DaprApp(app)

@app.get("/healthz")
async def healthcheck():
    return "Healthy!"

@app.get("/status", response_model=Chat)
async def status():
    try:
        url = f"http://localhost:{WORKFLOW_PORT}/status"
        async with httpx.AsyncClient(timeout=30.0) as client:  # 30 second timeout for status checks
            response = await client.get(url)
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Downstream error: {response.text}")
            try:
                response_json = response.json()
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Invalid JSON: {response.text}")
            message = response_json.get("message", str(response_json))
            chat = Chat(message=message)
        return chat
    except Exception as e:
        logging.exception("Error in /status endpoint")
        raise HTTPException(status_code=500, detail=str(e))

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def _workflow_script_path():
    return os.path.join(os.path.dirname(__file__), "app.py")

async def _wait_for_workflow_ready(port: int, timeout: float = 30.0) -> bool:
    """Poll the workflow service until it responds or timeout expires."""
    url = f"http://localhost:{port}/status"
    deadline = asyncio.get_event_loop().time() + timeout
    while True:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    logging.info("Workflow service is ready")
                    return True
        except Exception:
            # Not ready yet
            pass
        if asyncio.get_event_loop().time() >= deadline:
            logging.error(f"Workflow service did not become ready within {timeout} seconds")
            return False
        await asyncio.sleep(1)

@app.post("/start", response_model=Chat)
async def start_and_converse(update: Message):
    workflow_port = WORKFLOW_PORT
    if not is_port_in_use(workflow_port):
        try:
            logging.info("Starting workflow subprocess...")
            subprocess.Popen([sys.executable, _workflow_script_path(), "--port", str(workflow_port)],
                             cwd=os.path.dirname(__file__), env=os.environ.copy())
            # Wait for readiness instead of sleeping blindly
            ready = await _wait_for_workflow_ready(workflow_port, timeout=30.0)
            if ready:
                logging.info(f"Workflow subprocess started successfully on port {workflow_port}.")
            else:
                logging.error("Workflow subprocess failed to become ready")
        except Exception as e:
            logging.exception(f"Exception while starting workflow subprocess: {e}")

    url = f"http://localhost:{workflow_port}/start-workflow"
    payload = {"task": update.message}
    async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minute timeout for LLM calls
        response = await client.post(url, json=payload)
        if response.status_code not in (200, 202):
            raise HTTPException(status_code=500, detail=f"Downstream error: {response.text}")
        try:
            response_json = response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Invalid JSON: {response.text}")
        message = response_json.get("message", str(response_json))
        chat = Chat(message=message)
    return chat

LLM_STATE_PATH = r"C:\Users\kouly\Downloads\agenticdemo-lordofrings2\AgenticDaprDemoAspire\WorkflowLLM\LLMOrchestrator_state.json"

async def get_latest_content_from_json_async(retries=20, delay=2):
    import errno
    for attempt in range(retries):
        if not os.path.exists(LLM_STATE_PATH):
            logging.warning(f"File not found: {LLM_STATE_PATH}. Retry {attempt+1}/{retries}")
            await asyncio.sleep(delay)
            continue
        try:
            loop = asyncio.get_running_loop()
            # Try to open and read the file
            with open(LLM_STATE_PATH, "r", encoding="utf-8") as f:
                data = await loop.run_in_executor(None, json.load, f)
            instances = data.get("instances", {})
            if not instances:
                logging.warning("No instances found in JSON. Retrying...")
                await asyncio.sleep(delay)
                continue
            instance = next(reversed(instances.values()))
            last_message = instance.get("last_message")
            if last_message and "content" in last_message:
                return last_message["content"]
            messages = instance.get("messages", [])
            if messages:
                return messages[-1].get("content")
            logging.warning("No messages found in instance. Retrying...")
            await asyncio.sleep(delay)
        except (OSError, PermissionError) as e:
            logging.warning(f"File is locked or inaccessible: {e}. Retry {attempt+1}/{retries}")
            await asyncio.sleep(delay)
        except Exception as e:
            logging.exception(f"Error reading {LLM_STATE_PATH}: {e}")
            await asyncio.sleep(delay)
    return None




@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logging.info("WebSocket handler started and connection accepted")
    logging.info(f"WebSocket client info: {websocket.client}")
    logging.info(f"WebSocket headers: {websocket.headers}")

    workflow_port = WORKFLOW_PORT

    try:
        # No initial ping/handshake messages sent to clients to avoid UI noise
        while True:
            logging.info("Waiting to receive text from client...")
            try:
                # Add timeout to prevent hanging indefinitely
                data = await asyncio.wait_for(websocket.receive_text(), timeout=60.0)
                logging.info(f"Received from client: {data}")
                
                # Handle ping/pong for connection health
                if data.strip().lower() in ['ping', '{"type":"ping"}']:
                    # Silently ignore to avoid broadcasting ping/pong artifacts
                    continue
                
                # Handle handshake/connection messages
                if data.strip().lower() in ['gateway connected and ready', 'handshake']:
                    # Silently ignore handshake to avoid UI noise
                    continue
                    
            except asyncio.TimeoutError:
                logging.warning("Timeout waiting for WebSocket message from client (60s)")
                continue
            except Exception as e:
                logging.error(f"Error receiving WebSocket message: {e}")
                continue

            # Start workflow subprocess only if not running
            if not is_port_in_use(workflow_port):
                try:
                    logging.info("Starting workflow subprocess...")
                    subprocess.Popen([sys.executable, _workflow_script_path(), "--port", str(workflow_port)],
                                     cwd=os.path.dirname(__file__), env=os.environ.copy())
                    ready = await _wait_for_workflow_ready(workflow_port, timeout=30.0)
                    if ready:
                        logging.info(f"Workflow subprocess started successfully on port {workflow_port}.")
                    else:
                        logging.error("Workflow subprocess failed to become ready")
                except Exception as e:
                    logging.exception(f"Exception while starting workflow subprocess: {e}")

            url = f"http://localhost:{workflow_port}/start-workflow"
            logging.info(f"Sending message to workflow at {url}")
            async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minute timeout for LLM calls
                response = await client.post(url, json={"task": data})
                if response.status_code not in (200, 202):
                    await websocket.send_text(json.dumps({"error": f"Downstream error: {response.text}"}))
                    continue
                try:
                    response_json = response.json()
                except Exception:
                    await websocket.send_text(json.dumps({"error": f"Invalid JSON: {response.text}"}))
                    continue
                message = response_json.get("message", str(response_json))
                await websocket.send_text(json.dumps({"message": message}))

            # After sending the workflow response, send the latest message content from the JSON file
            latest_content = await get_latest_content_from_json_async(retries=20, delay=2)

            if latest_content:
                await websocket.send_text(latest_content)
            else:
                await websocket.send_text(json.dumps({"error": "No workflow response found in LLMOrchestrator_state.json."}))
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logging.exception("Exception in websocket loop")
        await websocket.send_text(f"Exception: {e}")

# Serve the UI
app.mount("/", StaticFiles(directory="static", html=True), name="static")
