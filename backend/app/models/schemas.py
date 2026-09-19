from typing import Optional, List, Any
from pydantic import BaseModel, Field


# ==============================================================================
# PROGRAMS SCHEMAS
# ==============================================================================

class ProgramModuleSchema(BaseModel):
    title: str
    duration: str

class ProgramBase(BaseModel):
    title: str
    level: str = "Basic"
    modules: int = 1
    duration: str = "1 Day"
    status: str = "Active"
    description: Optional[str] = None
    objectives: Optional[List[str]] = Field(default_factory=list)
    prerequisites: Optional[str] = None
    target_audience: Optional[str] = None
    certification_name: Optional[str] = None
    passing_score: Optional[int] = 80
    tags: Optional[List[str]] = Field(default_factory=list)
    created_by: Optional[str] = "Admin"
    disaster_type: Optional[str] = None
    estimated_cost: Optional[float] = 0.0
    module_list: Optional[List[ProgramModuleSchema]] = Field(default_factory=list)
    assessor: Optional[str] = None

class ProgramCreate(ProgramBase):
    id: Optional[str] = None

class ProgramUpdate(BaseModel):
    title: Optional[str] = None
    level: Optional[str] = None
    modules: Optional[int] = None
    duration: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    objectives: Optional[List[str]] = None
    prerequisites: Optional[str] = None
    target_audience: Optional[str] = None
    certification_name: Optional[str] = None
    passing_score: Optional[int] = None
    tags: Optional[List[str]] = None
    disaster_type: Optional[str] = None
    estimated_cost: Optional[float] = None
    module_list: Optional[List[ProgramModuleSchema]] = None
    assessor: Optional[str] = None

class ProgramResponse(ProgramBase):
    id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ==============================================================================
# SESSIONS SCHEMAS
# ==============================================================================

class SessionBase(BaseModel):
    course: str
    date: str
    time: str
    location: str
    trainer: str
    enrolled: int = 0
    capacity: int = 30
    status: str = "Scheduled"
    description: Optional[str] = None
    session_type: Optional[str] = "In-Person"
    contact_email: Optional[str] = None
    materials: Optional[List[str]] = Field(default_factory=list)
    notes: Optional[str] = None
    waitlist: Optional[int] = 0
    created_by: Optional[str] = "Admin"

class SessionCreate(SessionBase):
    id: Optional[str] = None

class SessionUpdate(BaseModel):
    course: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    trainer: Optional[str] = None
    enrolled: Optional[int] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
    description: Optional[str] = None
    session_type: Optional[str] = None
    contact_email: Optional[str] = None
    materials: Optional[List[str]] = None
    notes: Optional[str] = None
    waitlist: Optional[int] = None

class SessionStatusUpdate(BaseModel):
    status: str

class SessionResponse(SessionBase):
    id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ==============================================================================
# ATTENDANCE & DRILL SCHEMAS
# ==============================================================================

class AttendanceCreate(BaseModel):
    id: Optional[str] = None
    participant_id: Optional[str] = None
    participant_name: str
    program: str
    session_id: Optional[str] = None
    date: Optional[str] = None
    status: str = "In Progress"
    score: Optional[int] = None
    certificate: Optional[str] = None
    assessor: Optional[str] = None
    evaluated: Optional[bool] = False

class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    score: Optional[int] = None
    certificate: Optional[str] = None
    assessor: Optional[str] = None
    evaluated: Optional[bool] = None

class AttendanceResponse(AttendanceCreate):
    id: str
    created_at: Optional[str] = None


# ==============================================================================
# EVALUATIONS SCHEMAS
# ==============================================================================

class EvaluationCreate(BaseModel):
    id: Optional[str] = None
    attendance_id: Optional[str] = None
    assessor_name: str
    participant_name: str
    program: str
    rating: int = Field(ge=1, le=5)
    comments: Optional[str] = None
    date: Optional[str] = None

class EvaluationResponse(EvaluationCreate):
    id: str
    created_at: Optional[str] = None


# ==============================================================================
# NOTIFICATIONS SCHEMAS
# ==============================================================================

class NotificationCreate(BaseModel):
    id: Optional[str] = None
    type: str
    subject: str
    body: Optional[str] = None
    date: Optional[str] = None
    status: Optional[str] = "Sent"
    read: Optional[bool] = False
    audience: Optional[List[str]] = Field(default_factory=lambda: ["user", "admin", "superadmin"])

class NotificationResponse(NotificationCreate):
    id: str
    created_at: Optional[str] = None


# ==============================================================================
# USER ACCOUNT SCHEMAS
# ==============================================================================

class UserAccountCreate(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    role: str = "user"
    dept: Optional[str] = "Barangay Office"
    avatar: Optional[str] = "U"
    phone: Optional[str] = None
    status: Optional[str] = "Active"
    password: Optional[str] = "password123"

class UserAccountUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    dept: Optional[str] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None

class UserStatusUpdate(BaseModel):
    status: str

class UserAccountResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    dept: Optional[str] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None
    status: str
    last_login: Optional[str] = None
    created_at: Optional[str] = None


# ==============================================================================
# ANALYTICS SCHEMAS
# ==============================================================================

class AnalyticsSummary(BaseModel):
    total_programs: int
    active_programs: int
    total_sessions: int
    scheduled_sessions: int
    total_participants: int
    completed_drills: int
    average_score: float
    total_evaluations: int
    average_assessor_rating: float
