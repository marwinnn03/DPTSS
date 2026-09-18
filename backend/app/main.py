from fastapi import FastAPI
from app.database.supabase_client import supabase
from app.routers import programs

app = FastAPI(title="DPTSS Backend")

app.include_router(programs.router)


@app.get("/")
def root():
    return {
        "message": "DPTSS Backend is running!"
    }


@app.get("/test-supabase")
def test_supabase():
    response = (
        supabase
        .table("programs")
        .select("id")
        .limit(1)
        .execute()
    )
    return {
        "connected": True,
        "data": response.data
    }