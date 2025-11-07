from dapr_agents import DurableAgent
from redis_publisher import AgentResponsePublisher
import logging
import asyncio

class DurableAgentWithRedis(DurableAgent):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.redis_publisher = AgentResponsePublisher(self.name)
        
    async def _handle_message_with_redis(self, original_handler, *args, **kwargs):
        """Wrapper to intercept and publish responses"""
        try:
            # Call the original message handler
            result = await original_handler(*args, **kwargs)
            
            # Extract response text from result if possible
            response_text = None
            if isinstance(result, str):
                response_text = result
            elif isinstance(result, dict) and 'content' in result:
                response_text = result['content']
            elif hasattr(result, 'content'):
                response_text = result.content
            
            if response_text:
                # Publish to Redis for Chainlit to receive
                formatted_response = f"[{self.name}] {response_text}"
                await self.redis_publisher.publish_response(formatted_response)
                
            return result
            
        except Exception as e:
            logging.error(f"Error in Redis message handler: {e}")
            # Continue with original functionality even if Redis fails
            return await original_handler(*args, **kwargs)
            
    def _monkey_patch_handlers(self):
        """Monkey patch message handlers to add Redis publishing"""
        # This is a simplified approach - the actual implementation would depend
        # on how dapr-agents exposes message handling hooks
        # For now, we'll add Redis publishing in the main response generation
        pass