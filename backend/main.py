import os
import json
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from typing import Annotated, TypedDict, List
from fastapi.middleware.cors import CORSMiddleware

from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from dotenv import load_dotenv
from langgraph.prebuilt import ToolNode
from langchain_core.tools import tool


@tool
def ncm_classification(code: str) -> str:
    """
    Navigates a local NCM (Mercosur Common Nomenclature) classification system.

    This function acts as a tool for an automated agent to explore the
    hierarchical structure of the NCM classification by reading files directly
    from the assets/siscomex directory.

    Args:
        code: The NCM code to navigate.
             Use "index" for the root level, or one of the specified code inside brackets in CHILDREN

    Returns:
        A string containing the content from the specified NCM classification file.
        This content is expected to be a list of the next classification
        categories or items available at that level of the NCM hierarchy.
        In case of a file not found or other exception, an error message will be returned.
    """  # noqa: E501
    try:
        print(f"ncm_classification: {code}")
        return f"ncm_classification: {code}"
    except Exception as e:
        print(f"Tool ncm_classification error: {e}")
        return f"code: {code} does not exist, PASS THE EXACT CODE INSIDE BRACKET"


load_dotenv()
# 1. Setup Models
llm = ChatOpenAI(model="gpt-4o-mini").bind_tools([ncm_classification])


class State(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]


async def agent_node(state: State):
    response = await llm.ainvoke(state["messages"])
    # Python log (Standard JSON format)
    # print("LLM Response:", json.dumps(response.dict(), indent=2, default=str))
    return {"messages": [response]}


workflow = StateGraph(State)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", ToolNode([ncm_classification]))

workflow.set_entry_point("agent")
workflow.add_edge("agent", "tools")  # after tools execute -> go back to agent
workflow.add_edge("tools", END)  # after tools execute -> go back to agent
graph = workflow.compile()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# 2. Helper to handle object serialization
def json_serializer(obj):
    if hasattr(obj, "dict"):
        return obj.dict()
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    return str(obj)


@app.post("/api/stream")
async def stream_endpoint(request: Request):
    body = await request.json()
    input_data = body.get("input", {})
    config = body.get("config", {})

    async def event_generator():
        async for event in graph.astream(
            input_data, config=config, stream_mode=["updates", "values", "messages"]
        ):
            # sdk expects the event name to be "values"
            # print(event[0])
            yield f"event: {event[0]}\n"
            yield f"data: {json.dumps(event[1], default=json_serializer)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
