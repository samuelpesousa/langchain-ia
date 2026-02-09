from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import AIMessage

class State(TypedDict):
    messages: Annotated[list, add_messages]

def chatbot(state: State):

    user_message = state["messages"][-1].content
    
    response_text = f"Recebi sua mensagem: '{user_message}'. O backend está funcionando!"
    
    return {"messages": [AIMessage(content=response_text)]}

workflow = StateGraph(State)
workflow.add_node("agent", chatbot)
workflow.add_edge(START, "agent")
workflow.add_edge("agent", END)

graph = workflow.compile()