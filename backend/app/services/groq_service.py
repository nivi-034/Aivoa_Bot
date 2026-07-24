import os
import json
import re
from typing import TypedDict
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END

load_dotenv()

# Define primary and fallback models
primary_model = "gemma2-9b-it"
fallback_model = "llama-3.3-70b-versatile"

def get_llm(model_name: str):
    return ChatGroq(
        model=model_name,
        groq_api_key=os.getenv("GROQ_API_KEY"),
        temperature=0
    )

# Instantiate primary LLM
llm = get_llm(primary_model)

# Define LangGraph Agent State
class AgentState(TypedDict):
    complaint_text: str
    extracted_data: dict

# Define the extraction node function
def extract_node(state: AgentState) -> dict:
    complaint_text = state["complaint_text"]

    prompt = f"""
You are an AI assistant for a Pharmaceutical Complaint Management System.

Extract the complaint information.

Return ONLY valid JSON.

Fields:

customer_name
complaint_source
product_name
product_strength
batch_number
manufacture_date
expiry_date
quantity_affected
complaint_type
complaint_description
severity
priority
ai_summary

Complaint:

{complaint_text}
"""
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        print(f"\n========== GROQ RESPONSE ({primary_model}) ==========")
    except Exception as err:
        print(f"Error invoking primary model ({primary_model}): {err}. Falling back to {fallback_model}...")
        fallback_llm = get_llm(fallback_model)
        response = fallback_llm.invoke([HumanMessage(content=prompt)])
        print(f"\n========== GROQ RESPONSE ({fallback_model} Fallback) ==========")
        
    output = response.content.strip()
    print(output)
    print("==================================================\n")

    # Clean markdown json blocks if any
    output = re.sub(r"^```json", "", output, flags=re.IGNORECASE).strip()
    output = re.sub(r"```$", "", output).strip()

    # Extract JSON boundary
    start = output.find("{")
    end = output.rfind("}")

    if start != -1 and end != -1:
        output = output[start:end+1]

    try:
        extracted = json.loads(output)
    except Exception as e:
        print(f"JSON parsing error: {e}, attempting raw regex backup")
        extracted = {
            "customer_name": "",
            "complaint_source": "",
            "product_name": "",
            "product_strength": "",
            "batch_number": "",
            "manufacture_date": "",
            "expiry_date": "",
            "quantity_affected": "",
            "complaint_type": "",
            "complaint_description": "",
            "severity": "",
            "priority": "",
            "ai_summary": "Parsing failure fallback"
        }

    return {"extracted_data": extracted}

# Build the LangGraph State Machine
workflow = StateGraph(AgentState)
workflow.add_node("extractor", extract_node)
workflow.add_edge(START, "extractor")
workflow.add_edge("extractor", END)

# Compile graph
compiled_agent = workflow.compile()


def extract_complaint_details(complaint_text: str) -> dict:
    """
    Executes the LangGraph Agent pipeline to extract details from unstructured text.
    """
    initial_state = {
        "complaint_text": complaint_text,
        "extracted_data": {}
    }
    
    # Run graph execution
    result = compiled_agent.invoke(initial_state)
    return result["extracted_data"]


# ==========================================================================
# CHATBOT SYSTEM (LANGGRAPH AGENT)
# ==========================================================================

class ChatState(TypedDict):
    complaint_text: str
    user_message: str
    history: list
    response: str


def chat_node(state: ChatState) -> dict:
    complaint_text = state["complaint_text"]
    user_message = state["user_message"]
    history = state["history"]
    
    history_str = ""
    for msg in history:
        sender = msg.get("sender", "user")
        text = msg.get("text", "")
        history_str += f"{sender.capitalize()}: {text}\n"

    prompt = f"""
You are a helpful, professional AI Intake Assistant in a Pharmaceutical Quality Management System (QMS).
Answer the user's question regarding the active customer complaint. Use the provided context to answer clearly and accurately.

Complaint Text Context:
{complaint_text}

Conversation History:
{history_str}

User Question:
{user_message}

Answer:
"""
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
    except Exception as err:
        print(f"Error calling primary model in chat: {err}. Using fallback...")
        fallback_llm = get_llm(fallback_model)
        response = fallback_llm.invoke([HumanMessage(content=prompt)])
        
    return {"response": response.content.strip()}


# Build chat workflow
chat_workflow = StateGraph(ChatState)
chat_workflow.add_node("chatbot", chat_node)
chat_workflow.add_edge(START, "chatbot")
chat_workflow.add_edge("chatbot", END)

compiled_chat = chat_workflow.compile()


def chat_about_complaint(complaint_text: str, user_message: str, history: list) -> str:
    """
    Executes the LangGraph Chatbot pipeline to answer user questions about a complaint.
    """
    initial_state = {
        "complaint_text": complaint_text,
        "user_message": user_message,
        "history": history,
        "response": ""
    }
    result = compiled_chat.invoke(initial_state)
    return result["response"]