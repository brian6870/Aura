# run_waitress.py
from waitress import serve
from app import app
import os

if __name__ == "__main__":
    # Get port from environment variable or default to 5000
    port = int(os.environ.get('PORT', 5000))
    
    print(f"Starting Waitress server on port {port}...")
    print("Press Ctrl+C to stop the server")
    
    # Start the Waitress server
    serve(app, host='0.0.0.0', port=port)