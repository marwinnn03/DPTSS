import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.database.supabase_client import supabase
from app.models.schemas import EvaluationCreate, EvaluationResponse

router = APIRouter(
    prefix="/api/evaluations",
    tags=["Assessor Evaluations"]
)


@router.get("/", response_model=List[EvaluationResponse])
def get_evaluations(
    assessor_name: Optional[str] = None,
    program: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0)
):
    try:
        query = supabase.table("evaluations").select("*")

        if assessor_name:
            query = query.ilike("assessor_name", f"%{assessor_name}%")
        if program:
            query = query.ilike("program", f"%{program}%")

        response = (
            query
            .order("date", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return response.data or []

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch evaluations: {str(e)}")


@router.get("/assessor/{assessor_name}", response_model=List[EvaluationResponse])
def get_evaluations_for_assessor(assessor_name: str):
    try:
        response = (
            supabase
            .table("evaluations")
            .select("*")
            .ilike("assessor_name", f"%{assessor_name}%")
            .order("date", desc=True)
            .execute()
        )
        return response.data or []

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching assessor evaluations: {str(e)}")


@router.post("/", response_model=EvaluationResponse, status_code=201)
def submit_evaluation(evaluation: EvaluationCreate):
    try:
        eval_id = evaluation.id or f"EVL-{uuid.uuid4().hex[:6].upper()}"
        payload = evaluation.model_dump()
        payload["id"] = eval_id

        # Insert evaluation
        response = (
            supabase
            .table("evaluations")
            .insert(payload)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to record evaluation.")

        # If attendance_id is provided, mark that record as evaluated
        if evaluation.attendance_id:
            try:
                supabase.table("attendance_records").update({"evaluated": True}).eq("id", evaluation.attendance_id).execute()
            except Exception:
                pass  # Non-blocking if table or record doesn't exist yet

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting evaluation: {str(e)}")
