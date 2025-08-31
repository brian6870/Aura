# run_waitress_advanced.py
from waitress import serve
from app import app
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('waitress')
logger.setLevel(logging.INFO)

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    threads = int(os.environ.get('WAITRESS_THREADS', 4))
    
    print(f"Starting Waitress server on port {port} with {threads} threads...")
    
    # Advanced configuration
    serve(
        app,
        host='0.0.0.0',
        port=port,
        threads=threads,
        channel_timeout=60,
        connection_limit=1000,
        asyncore_loop_timeout=1,
        cleanup_interval=30,
        expose_tracebacks=False
    )