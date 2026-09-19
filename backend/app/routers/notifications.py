import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.database.supabase_client import supabase
from app.models.schemas import NotificationCreate, NotificationResponse

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"]
)


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    read: Optional[bool] = None,
    notification_type: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0)
):
    try:
        query = supabase.table("notifications").select("*")

        if read is not None:
            query = query.eq("read", read)
        if notification_type:
            query = query.eq("type", notification_type)

        response = (
            query
            .order("date", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return response.data or []

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")


@router.post("/", response_model=NotificationResponse, status_code=201)
def create_notification(notification: NotificationCreate):
    try:
        notif_id = notification.id or f"N-{uuid.uuid4().hex[:6].upper()}"
        payload = notification.model_dump()
        payload["id"] = notif_id

        response = (
            supabase
            .table("notifications")
            .insert(payload)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create notification.")

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating notification: {str(e)}")


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(notification_id: str):
    try:
        response = (
            supabase
            .table("notifications")
            .update({"read": True})
            .eq("id", notification_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail=f"Notification '{notification_id}' not found.")

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating notification: {str(e)}")


@router.patch("/mark-all-read")
def mark_all_notifications_read():
    try:
        response = (
            supabase
            .table("notifications")
            .update({"read": True})
            .eq("read", False)
            .execute()
        )
        return {"message": "All notifications marked as read.", "updated": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking all read: {str(e)}")


@router.delete("/{notification_id}")
def delete_notification(notification_id: str):
    try:
        response = (
            supabase
            .table("notifications")
            .delete()
            .eq("id", notification_id)
            .execute()
        )
        return {"message": f"Notification '{notification_id}' deleted.", "deleted": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting notification: {str(e)}")


@router.delete("/clear-all")
def clear_all_notifications():
    try:
        # Delete all records
        response = (
            supabase
            .table("notifications")
            .delete()
            .neq("id", "")
            .execute()
        )
        return {"message": "All notifications cleared.", "deleted": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing notifications: {str(e)}")
