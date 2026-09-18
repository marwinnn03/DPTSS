from app.database.supabase_client import supabase


def get_notifications(user_id):
    response = (
        supabase
        .table("notifications")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    return response.data