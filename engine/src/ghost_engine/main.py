"""Start the Engine on 127.0.0.1:8765 only."""

import threading

import uvicorn

from ghost_engine.rephrase_model import rephraser

HOST = "127.0.0.1"
PORT = 8765


def run() -> None:
    # Load the rephrase model in the background, so the first Rephrase click is quick.
    threading.Thread(target=rephraser().warm, name="rephrase-warm", daemon=True).start()
    uvicorn.run("ghost_engine.api:app", host=HOST, port=PORT)
