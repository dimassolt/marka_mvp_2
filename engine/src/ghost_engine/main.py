"""Start the Engine on 127.0.0.1:8765 only."""

import uvicorn

HOST = "127.0.0.1"
PORT = 8765


def run() -> None:
    uvicorn.run("ghost_engine.api:app", host=HOST, port=PORT)
