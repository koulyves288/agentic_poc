# redis_consumer.py
import redis
from redis_config import REDIS_HOST, REDIS_PORT, REDIS_STREAM_KEY, REDIS_GROUP

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

def init_consumer_group():
    try:
        r.xgroup_create(name=REDIS_STREAM_KEY, groupname=REDIS_GROUP, id='0', mkstream=True)
    except redis.exceptions.ResponseError as e:
        if "BUSYGROUP" not in str(e):
            raise

def read_messages(consumer_name):
    import logging
    logging.info(f"[RedisConsumer] Reading messages: host={REDIS_HOST}, port={REDIS_PORT}, stream={REDIS_STREAM_KEY}, group={REDIS_GROUP}, consumer={consumer_name}")
    messages = r.xreadgroup(groupname=REDIS_GROUP,
                            consumername=consumer_name,
                            streams={REDIS_STREAM_KEY: '>'},
                            count=10,
                            block=5000)
    logging.info(f"[RedisConsumer] xreadgroup returned: {messages}")
    return messages

def get_latest_history(n=10):
    # Get the last n messages from the stream (history)
    messages = r.xrevrange(REDIS_STREAM_KEY, max='+', min='-', count=n)
    # xrevrange returns newest first, so reverse to get chronological order
    return list(reversed(messages))

def subscribe_to_new_messages(consumer_name):
    # Generator for continuous subscription to new messages for a given consumer
    while True:
        messages = read_messages(consumer_name)
        if messages:
            yield messages