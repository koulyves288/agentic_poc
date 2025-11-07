#!/usr/bin/env python3
"""
Simple WebSocket test client to debug WorkflowLLM hanging issue
"""
import asyncio
import websockets
import json
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

async def test_websocket():
    uri = "ws://localhost:8003/ws"
    
    try:
        logging.info(f"Connecting to {uri}")
        async with websockets.connect(uri) as websocket:
            logging.info("Connected to WebSocket")
            
            # Wait for initial ping message
            try:
                initial_message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                logging.info(f"Received initial message: {initial_message}")
            except asyncio.TimeoutError:
                logging.warning("No initial message received")
            
            # Send test message
            test_message = "Hello, this is a test message"
            logging.info(f"Sending test message: {test_message}")
            await websocket.send(test_message)
            
            # Wait for responses
            response_count = 0
            while response_count < 5:  # Limit to 5 responses to prevent infinite loop
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=30.0)
                    response_count += 1
                    logging.info(f"Received response #{response_count}: {response}")
                except asyncio.TimeoutError:
                    logging.warning("Timeout waiting for response")
                    break
                except websockets.exceptions.ConnectionClosed:
                    logging.info("WebSocket connection closed")
                    break
                    
    except Exception as e:
        logging.exception(f"Error during WebSocket test: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())