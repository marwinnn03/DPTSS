-- ==============================================================================
-- DISASTER PREPAREDNESS TRAINING & SIMULATION SYSTEM (DPTSS)
-- Supabase PostgreSQL Database Schema
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New query
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROGRAMS TABLE
CREATE TABLE IF NOT EXISTS public.programs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'Basic', -- 'Basic', 'Intermediate', 'Advanced'
    modules INTEGER NOT NULL DEFAULT 1,
    duration TEXT NOT NULL DEFAULT '1 Day',
    status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Draft', 'Archived'
    description TEXT,
    objectives JSONB DEFAULT '[]'::jsonb,
    prerequisites TEXT,
    target_audience TEXT,
    certification_name TEXT,
    passing_score INTEGER DEFAULT 80,
    tags JSONB DEFAULT '[]'::jsonb,
    created_by TEXT DEFAULT 'Admin',
    disaster_type TEXT,
    estimated_cost NUMERIC(10, 2) DEFAULT 0.00,
    module_list JSONB DEFAULT '[]'::jsonb,
    assessor TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.sessions (
    id TEXT PRIMARY KEY,
    course TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    trainer TEXT NOT NULL,
    enrolled INTEGER NOT NULL DEFAULT 0,
    capacity INTEGER NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'Scheduled', -- 'Scheduled', 'Launched', 'Cancelled', 'Completed'
    description TEXT,
    session_type TEXT DEFAULT 'In-Person',
    contact_email TEXT,
    materials JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    waitlist INTEGER DEFAULT 0,
    created_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.participants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    department TEXT DEFAULT 'General',
    role TEXT DEFAULT 'Resident',
    level TEXT DEFAULT 'Tier 1',
    status TEXT DEFAULT 'Active',
    certifications JSONB DEFAULT '[]'::jsonb,
    enrolled INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ATTENDANCE & DRILL RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    participant_id TEXT,
    participant_name TEXT NOT NULL,
    program TEXT NOT NULL,
    session_id TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'In Progress', -- 'Completed', 'In Progress', 'No Show', 'Enrolled'
    score INTEGER,
    certificate TEXT,
    assessor TEXT,
    evaluated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ASSESSOR EVALUATIONS TABLE
CREATE TABLE IF NOT EXISTS public.evaluations (
    id TEXT PRIMARY KEY,
    attendance_id TEXT,
    assessor_name TEXT NOT NULL,
    participant_name TEXT NOT NULL,
    program TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'Session', 'System', 'Evaluation', 'Alert', 'Attendance', 'Export'
    subject TEXT NOT NULL,
    body TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'Sent',
    read BOOLEAN DEFAULT FALSE,
    audience JSONB DEFAULT '["user", "admin", "superadmin"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. USER ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.user_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', -- 'user', 'admin', 'superadmin'
    dept TEXT DEFAULT 'Barangay Office',
    avatar TEXT DEFAULT 'U',
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Suspended'
    password TEXT DEFAULT 'password123',
    last_login TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR HIGH QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_programs_status ON public.programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_disaster ON public.programs(disaster_type);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(date);
CREATE INDEX IF NOT EXISTS idx_attendance_participant ON public.attendance_records(participant_name);
CREATE INDEX IF NOT EXISTS idx_attendance_program ON public.attendance_records(program);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON public.user_accounts(email);

-- SEED ESSENTIAL DEMO ACCOUNTS (ONLY IF NOT ALREADY PRESENT)
INSERT INTO public.user_accounts (id, name, email, role, dept, avatar, phone, status, password)
VALUES 
    ('USR-001', 'Director Reyes', 'superadmin@ems.gov', 'superadmin', 'Command HQ', 'DR', '+63 917 200 1141', 'Active', 'password123'),
    ('USR-002', 'Capt. Santos', 'admin@ems.gov', 'admin', 'Training Division', 'CS', '+63 917 200 2278', 'Active', 'password123'),
    ('USR-003', 'Lt. Cruz', 'lcruz@ems.gov', 'admin', 'Operations', 'LC', '+63 917 200 3419', 'Active', 'password123'),
    ('USR-004', 'Maria Santos', 'm.santos@ems.gov', 'user', 'Rescue Alpha', 'MS', '+63 917 200 5104', 'Active', 'password123'),
    ('USR-005', 'Jose Reyes', 'j.reyes@ems.gov', 'user', 'Medical Bravo', 'JR', '+63 917 200 5871', 'Active', 'password123')
ON CONFLICT (email) DO NOTHING;
