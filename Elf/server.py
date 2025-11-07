import os
from dotenv import load_dotenv
load_dotenv(os.getenv('ENV_PATH', '.env'))

import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, Body, HTTPException, WebSocket
from fastapi.staticfiles import StaticFiles
from dapr.ext.fastapi import DaprApp
from models import Message, Chat
# from agent1 import make_agent, start_agent, stop_agent
# from agent1 import get_agent_reply

# This port must match what is used in the dapr run --app-id argument:
PORT = int(os.getenv('PORT', 30212))

# Register actor when fastapi starts up
from app import make_elf_agent, start_elf_agent, stop_elf_agent

@asynccontextmanager
async def lifespan(app: FastAPI):
    agent = make_elf_agent()
    await start_elf_agent(agent)
    app.state.elf_agent = agent
    yield
    await stop_elf_agent(agent)


# Create fastapi and register dapr, and agents
app = FastAPI(title="Dapr Agent API", lifespan=lifespan)
dapr_app = DaprApp(app)

# Dapr hits this to see if your service is running
@app.get("/healthz")
async def healthcheck():
    return "Healthy!"

# send message to agent1
# @app.post("/agent1", response_model=Chat)
# async def converse(update: Message):
#     try:
#         agent = app.state.agent1
#         reply = await get_agent_reply(agent, update.message)
#         if not isinstance(reply, str):
#             # Try to extract the message if reply is a dict/object
#             reply = reply.get("message") if isinstance(reply, dict) else str(reply)
#             if not reply:
#                 reply = "No response from agent."
#         chat = Chat(message=reply)
#         return chat
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# Serve the UI
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
