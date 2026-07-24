from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any

from app.services.groq_service import extract_complaint_details, chat_about_complaint

router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


class ComplaintText(BaseModel):
    text: str


@router.post("/extract")
def extract(data: ComplaintText):
    result = extract_complaint_details(data.text)
    return result


class ChatMessage(BaseModel):
    sender: str
    text: str


class ChatRequest(BaseModel):
    complaint_text: str
    user_message: str
    history: List[ChatMessage] = []


@router.post("/chat")
def chat(data: ChatRequest):
    history_dicts = [{"sender": m.sender, "text": m.text} for m in data.history]
    result = chat_about_complaint(data.complaint_text, data.user_message, history_dicts)
    return {"response": result}