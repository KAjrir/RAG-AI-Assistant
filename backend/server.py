import time
from flask import Flask, Response, request
from flask_cors import CORS
import asyncio

from vectorized_ai_chatbot import promptAI

app = Flask(__name__)
CORS(app)

async def collect_chunks(callable_fn, chunk_fnc):
    async for chunk in callable_fn():
        yield chunk_fnc(chunk)

def __iter_over_async(async_generator):
    """
    Iterates over the async iterable and yields formatted chunks.

    Yields:
        str: Formatted chunk of response text.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    iterator = async_generator.__aiter__()

    async def get_next():
        """
        Retrieves the next chunk from the iterator.

        Returns:
            tuple[bool, Any]: A tuple with a boolean indicating if the iteration is done and the chunk.
        """
        try:
            obj = await iterator.__anext__()
            return False, obj
        except StopAsyncIteration:
            return True, None
        except Exception as e:
            print(f"Error in get_next: {e}")
            # Handle exceptions from callable_fn or chunk_fnc
            return True, None

    try:
        while True:
            done, obj = loop.run_until_complete(get_next())
            if done:
                break
            yield obj
    finally:
        loop.close()

def generate_stream(callable_fn, chunk_fnc):
    # Adapt collect_chunks to receive arguments and apply them
    return __iter_over_async(collect_chunks(callable_fn, chunk_fnc))

def send_chunk(chunk, newline=False):
    """
    Sends a chunk to the client using the Assistant UI pattern.
    """
    # extra_char = "\\n" if newline else ""
    # chunk = chunk.replace("\n", "\\n").replace('"', '\\"')

    return chunk

@app.route("/chat-stream")
def chat_stream():
    message = request.args.get("message", "")
    session_id = request.args.get("session_id", "")

    return Response(
        generate_stream(lambda: promptAI(message, session_id), send_chunk),
        mimetype="text/plain",
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)