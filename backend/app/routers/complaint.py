from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.complaint import Complaint
from app.schemas.complaint import ComplaintCreate, ComplaintResponse

router = APIRouter(
    prefix="/complaints",
    tags=["Complaints"]
)


@router.post("/", response_model=ComplaintResponse)
def create_complaint(
    complaint: ComplaintCreate,
    db: Session = Depends(get_db)
):
    new_complaint = Complaint(
        customer_name=complaint.customer_name,
        complaint_source=complaint.complaint_source,
        product_name=complaint.product_name,
        product_strength=complaint.product_strength,
        batch_number=complaint.batch_number,
        manufacture_date=complaint.manufacture_date,
        expiry_date=complaint.expiry_date,
        quantity_affected=complaint.quantity_affected,
        complaint_type=complaint.complaint_type,
        complaint_description=complaint.complaint_description,
        severity=complaint.severity,
        priority=complaint.priority,
        ai_summary=complaint.ai_summary
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    return new_complaint
@router.get("/")
def get_complaints(db: Session = Depends(get_db)):
    complaints = db.query(Complaint).order_by(Complaint.id.desc()).all()
    return complaints