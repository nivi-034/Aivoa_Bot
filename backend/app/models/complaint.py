from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime

from app.db.database import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)

    customer_name = Column(String(255))
    complaint_source = Column(String(255))

    product_name = Column(String(255))
    product_strength = Column(String(255))
    batch_number = Column(String(100))

    manufacture_date = Column(String(100))
    expiry_date = Column(String(100))

    quantity_affected = Column(String(100))

    complaint_type = Column(String(255))
    complaint_description = Column(Text)

    severity = Column(String(50))
    priority = Column(String(50))

    ai_summary = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)