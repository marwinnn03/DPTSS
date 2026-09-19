import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.database.supabase_client import supabase
from app.models.schemas import ProgramCreate, ProgramUpdate, ProgramResponse

router = APIRouter(
    prefix="/api/programs",
    tags=["Programs"]
)


@router.get("/", response_model=List[ProgramResponse])
def get_programs(
    search: Optional[str] = None,
    level: Optional[str] = None,
    disaster_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0)
):
    try:
        query = supabase.table("programs").select("*")

        if search:
            query = query.ilike("title", f"%{search}%")
        if level:
            query = query.eq("level", level)
        if disaster_type:
            query = query.eq("disaster_type", disaster_type)
        if status:
            query = query.eq("status", status)

        response = (
            query
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return response.data or []

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch programs: {str(e)}")


@router.get("/{program_id}", response_model=ProgramResponse)
def get_program(program_id: str):
    try:
        response = (
            supabase
            .table("programs")
            .select("*")
            .eq("id", program_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Program with ID '{program_id}' not found.")
        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve program: {str(e)}")


@router.post("/", response_model=ProgramResponse, status_code=201)
def create_program(program: ProgramCreate):
    try:
        program_id = program.id or f"PRG-{uuid.uuid4().hex[:6].upper()}"
        payload = program.model_dump()
        payload["id"] = program_id

        # Clean null values if needed
        response = (
            supabase
            .table("programs")
            .insert(payload)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create program in database.")

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating program: {str(e)}")


@router.put("/{program_id}", response_model=ProgramResponse)
def update_program(program_id: str, updates: ProgramUpdate):
    try:
        payload = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not payload:
            raise HTTPException(status_code=400, detail="No fields provided to update.")

        response = (
            supabase
            .table("programs")
            .update(payload)
            .eq("id", program_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail=f"Program '{program_id}' not found.")

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating program: {str(e)}")


@router.delete("/{program_id}")
def delete_program(program_id: str):
    try:
        response = (
            supabase
            .table("programs")
            .delete()
            .eq("id", program_id)
            .execute()
        )

        return {"message": f"Program '{program_id}' successfully deleted.", "deleted": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting program: {str(e)}")