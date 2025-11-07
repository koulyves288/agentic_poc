from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import random

app = FastAPI(title="Mock LLM API")

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    max_tokens: int = 150
    temperature: float = 0.7

class ChatResponse(BaseModel):
    choices: list[dict]

# Predefined responses for different agents
AGENT_RESPONSES = {
    "legolas": [
        "The path ahead is clear, but I sense danger in the shadows. We must proceed with caution.",
        "My keen elven sight reveals movement in the distance. Allow me to scout ahead.",
        "The wind carries whispers of our enemies. We are not alone in these lands.",
    ],
    "frodo": [
        "The Ring grows heavy, but I must bear this burden. We shall see this through.",
        "I fear what lies ahead, but with friends by my side, I find courage.",
        "Every step takes us closer to Mount Doom. We must not lose hope.",
    ],
    "gandalf": [
        "Patience, young ones. All who wander are not lost, and great deeds await small folk.",
        "Dark forces gather, but light endures even in the deepest shadows.",
        "Trust in your strength and wisdom. The path is treacherous, but not without hope.",
    ]
}

@app.post("/v1/chat/completions", response_model=ChatResponse)
async def chat_completions(request: ChatRequest):
    """Mock OpenAI chat completions endpoint"""
    try:
        # Get the last user message
        user_messages = [msg for msg in request.messages if msg.role == "user"]
        if not user_messages:
            raise HTTPException(status_code=400, detail="No user message found")
        
        last_message = user_messages[-1].content.lower()
        
        # Determine which agent is speaking based on context
        response_text = "I understand your request and shall assist you accordingly."
        
        if "legolas" in last_message or "elf" in last_message:
            response_text = random.choice(AGENT_RESPONSES["legolas"])
        elif "frodo" in last_message or "hobbit" in last_message:
            response_text = random.choice(AGENT_RESPONSES["frodo"])
        elif "gandalf" in last_message or "wizard" in last_message:
            response_text = random.choice(AGENT_RESPONSES["gandalf"])
        else:
            # Generic response
            responses = [
                "I shall consider this matter carefully and provide counsel.",
                "The path forward requires wisdom and determination.",
                "Together we shall face whatever challenges await us.",
            ]
            response_text = random.choice(responses)
        
        return ChatResponse(
            choices=[
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": response_text
                    },
                    "finish_reason": "stop"
                }
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8888)