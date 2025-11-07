from pydantic import BaseModel


# response from agent
class Chat(BaseModel):
    message: str = ''

# message to agent
class Message(BaseModel):
    message: str = ''
