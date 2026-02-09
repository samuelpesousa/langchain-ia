import json
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from agent import graph 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat/stream")
async def chat_stream(request: Request):
    body = await request.json()
    user_input = body.get("message", "")

    async def event_generator():
        async for event in graph.astream(
            {"messages": [("user", user_input)]},
            stream_mode="messages"
        ):
       
            if isinstance(event, tuple) and len(event) > 0:
                msg = event[0]
                if msg.type == "ai":
                    data = json.dumps({"content": msg.content}, ensure_ascii=False)
                    yield f"data: {data}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)