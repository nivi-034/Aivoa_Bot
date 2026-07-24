from pydantic import BaseModel
from typing import Optional


class ComplaintCreate(BaseModel):
    customer_name: Optional[str] = None
    complaint_source: Optional[str] = None

    product_name: Optional[str] = None
    product_strength: Optional[str] = None
    batch_number: Optional[str] = None

    manufacture_date: Optional[str] = None
    expiry_date: Optional[str] = None

    quantity_affected: Optional[str] = None

    complaint_type: Optional[str] = None
    complaint_description: Optional[str] = None

    severity: Optional[str] = None
    priority: Optional[str] = None

    ai_summary: Optional[str] = None


class ComplaintResponse(ComplaintCreate):
    id: int

    class Config:
        from_attributes = True