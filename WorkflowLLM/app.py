from dapr_agents import LLMOrchestrator
from dotenv import load_dotenv
import asyncio
import logging

import sys
import argparse
import os

load_dotenv()  # Loads variables from .env

api_key = os.getenv("OPENAI_API_KEY")

async def main(port=8005):
    try:
        # Optional debug breakpoint (enable by setting WORKFLOW_DEBUG=1)
        debug_flag = os.getenv("WORKFLOW_DEBUG", "").lower() in ("1", "true", "yes")
        if debug_flag:
            import pdb; pdb.set_trace()
        workflow_service = LLMOrchestrator(
            name="LLMOrchestrator",
            message_bus_name="messagepubsub",
            state_store_name="workflowstatestore",
            state_key="workflow_state",
            agents_registry_store_name="agentstatestore",
            agents_registry_key="agents_registry",
            broadcast_topic_name="beacon_channel",
            max_iterations=3,
            openai_api_key=api_key
        ).as_service(port=port)
        await workflow_service.start()
    except Exception as e:
        print(f"Error starting service: {e}")


if __name__ == "__main__":
    load_dotenv()
    logging.basicConfig(level=logging.INFO)

    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8005, help='Port to run the workflow service on')
    args = parser.parse_args()

    asyncio.run(main(port=args.port))