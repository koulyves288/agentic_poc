from dapr_agents import DurableAgent
from dotenv import load_dotenv
import asyncio
import logging
import os

from dotenv import load_dotenv

load_dotenv()  # Loads variables from .env

api_key = os.getenv("OPENAI_API_KEY")
deployment_name = os.getenv("OPENAI_DEPLOYMENT_NAME")
endpoint = os.getenv("OPENAI_ENDPOINT")
version = os.getenv("OPENAI_VERSION")


async def main():
    try:
        elf_service = DurableAgent(
            name="Legolas",
            role="Elf",
            goal="Act as a scout, marksman, and protector, using keen senses and deadly accuracy to ensure the success of the journey.",
            instructions=[
                "Speak like Legolas, with grace, wisdom, and keen observation.",
                "Be swift, silent, and precise, moving effortlessly across any terrain.",
                "Use superior vision and heightened senses to scout ahead and detect threats.",
                "Excel in ranged combat, delivering pinpoint arrow strikes from great distances.",
                "Respond concisely, accurately, and relevantly, ensuring clarity and strict alignment with the task.",
            ],
            message_bus_name="messagepubsub",
            state_store_name="workflowstatestore",
            state_key="workflow_state",
            agents_registry_store_name="agentstatestore",
            agents_registry_key="agents_registry",
            broadcast_topic_name="beacon_channel",
            #openai_api_key=api_key,
            #openai_deployment_name=deployment_name,
            #openai_endpoint=endpoint,
            #openai_version=version
        )

        await elf_service.start()
    except Exception as e:
        print(f"Error starting service: {e}")


def make_elf_agent():
    return DurableAgent(
        name="Legolas",
        role="Elf",
        goal="Act as a scout, marksman, and protector, using keen senses and deadly accuracy to ensure the success of the journey.",
        instructions=[
            "Speak like Legolas, with grace, wisdom, and keen observation.",
            "Be swift, silent, and precise, moving effortlessly across any terrain.",
            "Use superior vision and heightened senses to scout ahead and detect threats.",
            "Excel in ranged combat, delivering pinpoint arrow strikes from great distances.",
            "Respond concisely, accurately, and relevantly, ensuring clarity and strict alignment with the task.",
        ],
        message_bus_name="messagepubsub",
        state_store_name="workflowstatestore",
        state_key="workflow_state",
        agents_registry_store_name="agentstatestore",
        agents_registry_key="agents_registry",
        broadcast_topic_name="beacon_channel",
    )

async def start_elf_agent(agent):
    await agent.start()

async def stop_elf_agent(agent):
    await agent.stop()


if __name__ == "__main__":
    load_dotenv()

    logging.basicConfig(level=logging.INFO)

    asyncio.run(main())