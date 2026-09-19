from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.supabase_client import supabase
from app.routers import (
    programs,
    sessions,
    attendance,
    notifications,
    evaluations,
    users,
    analytics
)

app = FastAPI(
    title="DPTSS Backend API",
    description="Disaster Preparedness Training & Simulation System (DPTSS) - Unified REST API",
    version="1.0.0"
)

# Enable CORS for local Vite dev server and Vercel cloud domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All API Routers
app.include_router(programs.router)
app.include_router(sessions.router)
app.include_router(attendance.router)
app.include_router(notifications.router)
app.include_router(evaluations.router)
app.include_router(users.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {
        "system": "Disaster Preparedness Training & Simulation System (DPTSS)",
        "status": "Online",
        "version": "1.0.0",
        "documentation": "/docs"
    }


@app.get("/health")
def health_check():
    supabase_connected = False
    details = "Checking connection"
    try:
        res = supabase.table("programs").select("id").limit(1).execute()
        supabase_connected = True
        details = "Supabase PostgreSQL reachable"
    except Exception as e:
        details = str(e)

    return {
        "status": "healthy" if supabase_connected else "degraded",
        "supabase_connected": supabase_connected,
        "details": details
    }