from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database.supabase_client import supabase

router = APIRouter(
    prefix="/api/programs",
    tags=["Programs"]
)


# =========================
# REQUEST MODEL
# =========================

class ProgramCreate(BaseModel):
    title: str
    description: str | None = None
    status: str = "draft"
    program_type: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    created_by: str


# =========================
# GET ALL PROGRAMS
# =========================

@router.get("/")
def get_programs():
    response = (
        supabase
        .table("programs")
        .select("*")
        .execute()
    )

    return response.data


# =========================
# GET PROGRAM BY ID
# =========================

@router.get("/{program_id}")
def get_program(program_id: str):

    response = (
        supabase
        .table("programs")
        .select("*")
        .eq("id", program_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Program not found"
        )

    return response.data[0]


# =========================
# CREATE PROGRAM
# =========================

@router.post("/")
def create_program(program: ProgramCreate):

    response = (
        supabase
        .table("programs")
        .insert({
            "title": program.title,
            "description": program.description,
            "status": program.status,
            "program_type": program.program_type,
            "start_date": program.start_date,
            "end_date": program.end_date,
            "created_by": program.created_by
        })
        .execute()
    )

    return {
        "message": "Program created successfully",
        "data": response.data
    }