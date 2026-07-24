from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.models.complaint import Complaint
from app.routers.complaint import router as complaint_router
from app.routers.ai import router as ai_router
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AIVOA Complaint Management API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(complaint_router)
app.include_router(ai_router)

@app.get("/")
def root():
    return {
        "message": "AIVOA AI Complaint Management System is running!"
    }