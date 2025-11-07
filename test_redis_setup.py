#!/usr/bin/env python3
"""
Test script to verify the agent-to-Chainlit communication setup
"""
import redis
import json
import time

def test_redis_publish():
    """Test publishing a message to the agent_responses channel"""
    try:
        redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
        
        # Test message
        test_message = {
            "agent": "TestAgent",
            "response": "[TestAgent] This is a test message to verify the setup works!",
            "timestamp": time.time()
        }
        
        # Publish to the channel
        result = redis_client.publish("agent_responses", json.dumps(test_message))
        print(f"✅ Published test message. Subscribers: {result}")
        
        if result == 0:
            print("⚠️  No subscribers found. Make sure Chainlit is running and connected.")
        else:
            print("🎉 Test message sent successfully!")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_redis_publish()