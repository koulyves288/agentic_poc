# redis_consumer.py
import redis
from config import REDIS_HOST, REDIS_PORT, REDIS_STREAM_KEY, REDIS_GROUP, REDIS_CONSUMER_NAME

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

def init_consumer_group():
    try:
        r.xgroup_create(name=REDIS_STREAM_KEY, groupname=REDIS_GROUP, id='0', mkstream=True)
    except redis.exceptions.ResponseError as e:
        if "BUSYGROUP" not in str(e):
            raise

def read_messages():
    messages = r.xreadgroup(groupname=REDIS_GROUP,
                            consumername=REDIS_CONSUMER_NAME,
                            streams={REDIS_STREAM_KEY: '>'},
                            count=10,
                            block=5000)
    return messages