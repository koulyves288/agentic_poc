import chainlit as cl # type: ignore
import asyncio
import websockets # type: ignore
import json
import logging
import os
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse

# Set up logging
logging.basicConfig(level=logging.INFO)

WS_URL = "ws://localhost:8003/ws"

@cl.on_message
async def on_message(message: cl.Message):
    logging.info(f"Chainlit received message: {message.content}")
    await cl.Message(content=f"➡️ Sending to WorkflowLLM: {message.content}").send()
    try:
        logging.info(f"Attempting to connect to {WS_URL}")
        async with websockets.connect(WS_URL) as ws:
            logging.info("WebSocket connection established")
            await ws.send(message.content)
            logging.info(f"Message sent to WorkflowLLM: {message.content}")
            
            # Read all messages until timeout or connection closes
            received_any = False
            message_count = 0
            while True:
                try:
                    response = await asyncio.wait_for(ws.recv(), timeout=30)
                    message_count += 1
                    logging.info(f"Received response #{message_count}: {response}")
                    await cl.Message(content=f"💬 {response}").send()
                    received_any = True
                except asyncio.TimeoutError:
                    logging.warning("Timeout waiting for response from WorkflowLLM")
                    break
                except websockets.exceptions.ConnectionClosed:
                    logging.info("WebSocket connection closed by server")
                    break
            if received_any:
                await cl.Message(content="✅ Workflow complete.").send()
            else:
                await cl.Message(content="⚠️ No response received from workflow.").send()
    except Exception as e:
        logging.exception(f"Error communicating with WorkflowLLM: {e}")
        await cl.Message(content=f"❌ Error communicating with WorkflowLLM: {e}").send()
