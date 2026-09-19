import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.database.supabase_client import supabase
from app.models.schemas import AttendanceCreate, AttendanceUpdate, AttendanceResponse

router = APIRouter(
    prefix="/api/attendance",
    tags=["Attendance & Drills"]
)


@router.get("/", response_model=List[AttendanceResponse])
def get_attendance_records(
    participant_name: Optional[str] = None,
    program: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0)
):
    try:
        query = supabase.table("attendance_records").select("*")

        if participant_name:
            query = query.ilike("participant_name", f"%{participant_name}%")
        if program:
            query = query.ilike("program", f"%{program}%")
        if status:
            query = query.eq("status", status)

        response = (
            query
            .order("date", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return response.data or []

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch attendance records: {str(e)}")


@router.get("/participant/{name_or_id}", response_model=List[AttendanceResponse])
def get_attendance_by_participant(name_or_id: str):
    try:
        # Check by participant_id first, then by participant_name
        response = (
            supabase
            .table("attendance_records")
            .select("*")
            .or_(f"participant_id.eq.{name_or_id},participant_name.eq.{name_or_id}")
            .order("date", desc=True)
            .execute()
        )
        return response.data or []

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching participant attendance: {str(e)}")


@router.get("/{record_id}", response_model=AttendanceResponse)
def get_attendance_record(record_id: str):
    try:
        response = (
            supabase
            .table("attendance_records")
            .select("*")
            .eq("id", record_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Attendance record '{record_id}' not found.")
        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving attendance record: {str(e)}")


@router.post("/", response_model=AttendanceResponse, status_code=201)
def record_attendance(record: AttendanceCreate):
    try:
        record_id = record.id or f"ATT-{uuid.uuid4().hex[:6].upper()}"
        payload = record.model_dump()
        payload["id"] = record_id

        response = (
            supabase
            .table("attendance_records")
            .insert(payload)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create attendance record.")

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating attendance record: {str(e)}")


@router.put("/{record_id}", response_model=AttendanceResponse)
def update_attendance_record(record_id: str, updates: AttendanceUpdate):
    try:
        payload = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not payload:
            raise HTTPException(status_code=400, detail="No updates provided.")

        response = (
            supabase
            .table("attendance_records")
            .update(payload)
            .eq("id", record_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail=f"Attendance record '{record_id}' not found.")

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating attendance record: {str(e)}")


@router.delete("/{record_id}")
def delete_attendance_record(record_id: str):
    try:
        response = (
            supabase
            .table("attendance_records")
            .delete()
            .eq("id", record_id)
            .execute()
        )
        return {"message": f"Attendance record '{record_id}' deleted.", "deleted": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting attendance record: {str(e)}")
