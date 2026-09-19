import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.database.supabase_client import supabase
from app.models.schemas import UserAccountCreate, UserAccountUpdate, UserStatusUpdate, UserAccountResponse

router = APIRouter(
    prefix="/api/users",
    tags=["User Management"]
)


@router.get("/", response_model=List[UserAccountResponse])
def get_users(
    role: Optional[str] = None,
    dept: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0)
):
    try:
        query = supabase.table("user_accounts").select("id, name, email, role, dept, avatar, phone, status, last_login, created_at")

        if role and role != "all":
            query = query.eq("role", role)
        if dept:
            query = query.ilike("dept", f"%{dept}%")
        if status:
            query = query.eq("status", status)
        if search:
            query = query.or_(f"name.ilike.%{search}%,email.ilike.%{search}%,dept.ilike.%{search}%")

        response = (
            query
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return response.data or []

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")


@router.get("/{user_id}", response_model=UserAccountResponse)
def get_user(user_id: str):
    try:
        response = (
            supabase
            .table("user_accounts")
            .select("id, name, email, role, dept, avatar, phone, status, last_login, created_at")
            .eq("id", user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail=f"User '{user_id}' not found.")
        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")


@router.post("/", response_model=UserAccountResponse, status_code=201)
def create_user(user: UserAccountCreate):
    try:
        user_id = user.id or f"USR-{uuid.uuid4().hex[:6].upper()}"
        payload = user.model_dump()
        payload["id"] = user_id

        response = (
            supabase
            .table("user_accounts")
            .insert(payload)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create user account.")

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")


@router.put("/{user_id}", response_model=UserAccountResponse)
def update_user(user_id: str, updates: UserAccountUpdate):
    try:
        payload = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not payload:
            raise HTTPException(status_code=400, detail="No fields provided to update.")

        response = (
            supabase
            .table("user_accounts")
            .update(payload)
            .eq("id", user_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail=f"User '{user_id}' not found.")

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")


@router.patch("/{user_id}/status", response_model=UserAccountResponse)
def update_user_status(user_id: str, status_data: UserStatusUpdate):
    try:
        response = (
            supabase
            .table("user_accounts")
            .update({"status": status_data.status})
            .eq("id", user_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail=f"User '{user_id}' not found.")

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user status: {str(e)}")


@router.delete("/{user_id}")
def delete_user(user_id: str):
    try:
        response = (
            supabase
            .table("user_accounts")
            .delete()
            .eq("id", user_id)
            .execute()
        )
        return {"message": f"User '{user_id}' deleted.", "deleted": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")
