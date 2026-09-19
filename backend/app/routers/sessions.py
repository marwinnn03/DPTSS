import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.database.supabase_client import supabase
from app.models.schemas import SessionCreate, SessionUpdate, SessionStatusUpdate, SessionResponse

router = APIRouter(
    prefix="/api/sessions",
    tags=["Sessions"]
)


@router.get("/", response_model=List[SessionResponse])
def get_sessions(
    course: Optional[str] = None,
    trainer: Optional[str] = None,
    status: Optional[str] = None,
    date: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0)
):
    try:
        query = supabase.table("sessions").select("*")

        if course:
            query = query.ilike("course", f"%{course}%")
        if trainer:
            query = query.ilike("trainer", f"%{trainer}%")
        if status:
            query = query.eq("status", status)
        if date:
            query = query.eq("date", date)

        response = (
            query
            .order("date", desc=False)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return response.data or []

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sessions: {str(e)}")


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str):
    try:
        response = (
            supabase
            .table("sessions")
            .select("*")
            .eq("id", session_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving session: {str(e)}")


@router.post("/", response_model=SessionResponse, status_code=201)
def create_session(session: SessionCreate):
    try:
        session_id = session.id or f"SES-{uuid.uuid4().hex[:6].upper()}"
        payload = session.model_dump()
        payload["id"] = session_id

        response = (
            supabase
            .table("sessions")
            .insert(payload)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create session.")

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")


@router.put("/{session_id}", response_model=SessionResponse)
def update_session(session_id: str, updates: SessionUpdate):
    try:
        payload = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not payload:
            raise HTTPException(status_code=400, detail="No update parameters provided.")

        response = (
            supabase
            .table("sessions")
            .update(payload)
            .eq("id", session_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating session: {str(e)}")


@router.patch("/{session_id}/status", response_model=SessionResponse)
def update_session_status(session_id: str, status_data: SessionStatusUpdate):
    try:
        response = (
            supabase
            .table("sessions")
            .update({"status": status_data.status})
            .eq("id", session_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating session status: {str(e)}")


@router.delete("/{session_id}")
def delete_session(session_id: str):
    try:
        response = (
            supabase
            .table("sessions")
            .delete()
            .eq("id", session_id)
            .execute()
        )
        return {"message": f"Session '{session_id}' deleted successfully.", "deleted": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting session: {str(e)}")
