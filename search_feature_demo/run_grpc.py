import sys
import os
import time
import logging

logging.basicConfig(level=logging.INFO)

sys.path.insert(0, os.path.abspath("."))
from grpc_app.server import serve

print("Starting server on port 50052...")
server = serve(50052)
print("Server started. Waiting...")
while True:
    time.sleep(10)
