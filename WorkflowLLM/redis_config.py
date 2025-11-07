# config.py
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_STREAM_KEY = "LLMOrchestrator"
REDIS_GROUP = "workflow"

# Use a function to generate a unique consumer name (UUID) per session
import uuid

def get_redis_consumer_name():
	"""Generate a unique consumer name for each session/request."""
	return f"ui-consumer-{uuid.uuid4()}"