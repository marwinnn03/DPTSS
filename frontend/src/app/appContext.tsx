import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export type ProgramModule = { title: string; duration: string };
export type Program = {
  id: string;
  title: string;
  level: string;
  modules: number;
  duration: string;
  status: string;
  description?: string;
  objectives?: string[];
  prerequisites?: string;
  targetAudience?: string;
  certificationName?: string;
  passingScore?: number;
  tags?: string[];
  createdBy?: string;
  createdDate?: string;
  lastUpdated?: string;
  moduleList?: ProgramModule[];
  assessor?: string;
  disasterType?: string;
  estimatedCost?: number;
};

export type Session = {
  id: string;
  course: string;
  date: string;
  time: string;
  location: string;
  trainer: string;
  enrolled: number;
  capacity: number;
  status?: string;
  description?: string;
  sessionType?: string;
  contactEmail?: string;
  materials?: string[];
  notes?: string;
  waitlist?: number;
  createdBy?: string;
  createdDate?: string;
  lastUpdated?: string;
};

export type Participant = { id?: string; name: string; dept?: string; department?: string; role?: string; level?: string; status?: string; email?: string };
export type NotifAudience = "user" | "admin" | "superadmin";
export type Notification = { id: string; type: string; subject: string; body?: string; date: string; status?: string; read?: boolean; audience?: NotifAudience[] };

export type AttendanceRecord = {
  id: string;
  participantId?: string;
  participantName: string;
  program: string;
  sessionId?: string;
  date: string;
  status: "Completed" | "In Progress" | "No Show" | "Enrolled";
  score?: number;
  certificate?: string;
  assessor?: string;
  evaluated?: boolean;
};

export type AssessorEvaluation = {
  id: string;
  attendanceId: string;
  assessorName: string;
  participantName: string;
  program: string;
  rating: number;
  comments?: string;
  date: string;
};

export type ToastType = "success" | "error" | "warning" | "info";
export type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
};

export type AuthRole = "user" | "admin" | "superadmin";

export type AuthAccount = {
  id?: string;
  name: string;
  email: string;
  role: AuthRole;
  dept: string;
  avatar: string;
  phone?: string;
  status: "Active" | "Suspended";
  password?: string;
};

export type EvalObjective = {
  id: number;
  text: string;
  done: boolean;
  time: string;
  limit: string;
  benchmarkTime?: string;
  verifiedBy?: string;
  verifiedAt?: string;
};

export const INITIAL_EVAL_OBJECTIVES: EvalObjective[] = [
  { id: 1, text: "IC assumes command on radio net", done: false, time: "—", limit: "2 min", benchmarkTime: "1:42" },
  { id: 2, text: "Gas valve shut off at utility panel", done: false, time: "—", limit: "2 min", benchmarkTime: "1:58" },
  { id: 3, text: "Evacuation route cleared and opened", done: false, time: "—", limit: "5 min", benchmarkTime: "4:15" },
  { id: 4, text: "Triage zone with START protocol", done: false, time: "—", limit: "5 min", benchmarkTime: "4:31" },
  { id: 5, text: "SITREP transmitted to EOC", done: false, time: "—", limit: "10 min", benchmarkTime: "9:05" },
  { id: 6, text: "Accountability check completed", done: false, time: "—", limit: "10 min", benchmarkTime: "8:40" },
];

export const SEED_ACCOUNTS: AuthAccount[] = [
  { id: "USR-001", name: "Director Reyes", email: "superadmin@ems.gov", role: "superadmin", dept: "Command HQ", avatar: "DR", phone: "+63 917 200 1141", status: "Active", password: "password123" },
  { id: "USR-002", name: "Capt. Santos", email: "admin@ems.gov", role: "admin", dept: "Training Division", avatar: "CS", phone: "+63 917 200 2278", status: "Active", password: "password123" },
  { id: "USR-003", name: "Lt. Cruz", email: "lcruz@ems.gov", role: "admin", dept: "Operations", avatar: "LC", phone: "+63 917 200 3419", status: "Active", password: "password123" },
  { id: "USR-004", name: "Maria Santos", email: "m.santos@ems.gov", role: "user", dept: "Rescue Alpha", avatar: "MS", phone: "+63 917 200 5104", status: "Active", password: "password123" },
  { id: "USR-005", name: "Jose Reyes", email: "j.reyes@ems.gov", role: "user", dept: "Medical Bravo", avatar: "JR", phone: "+63 917 200 5871", status: "Active", password: "password123" },
  { id: "USR-006", name: "Ana Cruz", email: "a.cruz@ems.gov", role: "user", dept: "Command HQ", avatar: "AC", phone: "+63 917 200 1236", status: "Active", password: "password123" },
  { id: "USR-007", name: "Carlos Bautista", email: "c.bautista@ems.gov", role: "user", dept: "Supply Delta", avatar: "CB", phone: "+63 917 200 9982", status: "Suspended", password: "password123" },
  { id: "USR-008", name: "Elena Villanueva", email: "e.villanueva@ems.gov", role: "user", dept: "Hazmat Echo", avatar: "EV", phone: "+63 917 200 2011", status: "Active", password: "password123" },
];

type AppContextType = {
  programs: Program[];
  sessions: Session[];
  participants: Participant[];
  notifications: Notification[];
  attendanceRecords: AttendanceRecord[];
  assessorEvaluations: AssessorEvaluation[];
  accounts: AuthAccount[];
  toast: Toast | null;
  darkMode: boolean;
  toggleDarkMode: () => void;
  showToast: (toastOrMessage: Omit<Toast, "id"> | string, type?: ToastType, title?: string, duration?: number) => void;
  dismissToast: () => void;
  addProgram: (p: Program) => void;
  updateProgram: (id: string, updates: Partial<Program>) => void;
  deleteProgram: (id: string) => void;
  createSession: (s: Session) => string;
  updateSession: (id: string, updates: Partial<Session>) => void;
  cancelSession: (id: string) => void;
  launchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  registerParticipant: (p: Participant) => void;
  addNotification: (n: Omit<Notification, "id" | "date" | "read">, triggerToast?: boolean) => void;
  exportCSV: (type: "programs" | "sessions" | "participants" | "attendance") => void;
  addUser: (u: Participant) => void;
  addAccount: (acc: AuthAccount) => void;
  updateAccount: (id: string, updates: Partial<AuthAccount>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addAttendanceRecord: (r: Omit<AttendanceRecord, "id">) => void;
  updateAttendanceRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  removeAttendanceRecord: (id: string) => void;
  getAttendanceFor: (participantNameOrId: string) => AttendanceRecord[];
  submitAssessorEvaluation: (e: Omit<AssessorEvaluation, "id" | "date">) => void;
  getEvaluationsFor: (assessorName: string) => AssessorEvaluation[];
  evalObjectives: EvalObjective[];
  toggleEvalObjective: (id: number, verifiedBy?: string) => void;
  resetEvalObjectives: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const LS_KEYS = { 
  programs: "dptss_programs", 
  sessions: "dptss_sessions", 
  participants: "dptss_participants", 
  notifications: "dptss_notifications", 
  darkMode: "dptss_dark_mode", 
  attendance: "dptss_attendance_v2", 
  evaluations: "dptss_assessor_evaluations",
  accounts: "dptss_accounts",
  evalObjectives: "dptss_eval_objectives"
};

function uid(prefix = "id") { return `${prefix}-${Math.random().toString(36).slice(2, 9)}`; }

function isValidUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function minutesAgo(m: number) { return new Date(Date.now() - m * 60000).toISOString(); }

function seedNotifications(): Notification[] {
  return [
    { id: uid("N"), type: "Session", subject: "New session scheduled: Wildfire Response Drill", body: "Session SES-014 has been scheduled for Aug 5, 9:00 AM at Field Station 2.", date: minutesAgo(25), status: "Sent", read: false },
    { id: uid("N"), type: "System", subject: "Welcome to DPTSS", body: "Your training dashboard is ready. Explore your modules from the sidebar.", date: minutesAgo(90), status: "Sent", read: false },
    { id: uid("N"), type: "Evaluation", subject: "Performance review completed", body: "Your latest assessment results are now available for review.", date: minutesAgo(60 * 6), status: "Sent", read: false },
    { id: uid("N"), type: "Alert", subject: "Certification expiring soon", body: "Your HAZMAT certification expires in 14 days. Renew to stay compliant.", date: minutesAgo(60 * 20), status: "Pending", read: true },
    { id: uid("N"), type: "Export", subject: "Compliance report exported", body: "The Q3 compliance report has been generated and downloaded.", date: minutesAgo(60 * 48), status: "Sent", read: true },
    { id: uid("N"), type: "System", subject: "System maintenance scheduled", body: "Platform maintenance window on Saturday, 12:00 AM - 2:00 AM.", date: minutesAgo(60 * 96), status: "Sent", read: true },
  ];
}

function seedAttendance(): AttendanceRecord[] {
  return [
    { id: uid("ATT"), participantId: "P-001", participantName: "Maria Santos", program: "Earthquake Response", date: "2026-06-29", status: "Completed", score: 94, certificate: "CERT-EQR-2026", assessor: "Eval. Torres" },
    { id: uid("ATT"), participantId: "P-001", participantName: "Maria Santos", program: "Flood Evacuation Protocol", date: "2026-06-22", status: "Completed", score: 88, certificate: "CERT-FEP-2026", assessor: "Eval. Lim" },
    { id: uid("ATT"), participantId: "P-001", participantName: "Maria Santos", program: "Hazmat Level 1", date: "2026-06-08", status: "Completed", score: 91, certificate: "CERT-HZ1-2026", assessor: "Eval. Torres" },
    { id: uid("ATT"), participantId: "P-002", participantName: "Jose Reyes", program: "Wildfire Response Drill", date: "2026-06-25", status: "Completed", score: 85, assessor: "Eval. Cruz" },
    { id: uid("ATT"), participantId: "P-002", participantName: "Jose Reyes", program: "CPR Recertification", date: "2026-06-10", status: "Completed", score: 96, assessor: "Eval. Lim" },
    { id: uid("ATT"), participantId: "P-003", participantName: "Ana Cruz", program: "ICS-200 Command Structure", date: "2026-06-18", status: "Completed", score: 90, assessor: "Eval. Torres" },
    { id: uid("ATT"), participantId: "P-003", participantName: "Ana Cruz", program: "Earthquake Response", date: "2026-06-29", status: "Completed", score: 92, assessor: "Eval. Torres" },
    { id: uid("ATT"), participantId: "P-004", participantName: "Carlos Bautista", program: "Basic First Aid", date: "2026-06-14", status: "No Show" },
    { id: uid("ATT"), participantId: "P-005", participantName: "Elena Villanueva", program: "Hazmat Level 2", date: "2026-07-02", status: "In Progress", assessor: "Eval. Cruz" },
    { id: uid("ATT"), participantId: "P-005", participantName: "Elena Villanueva", program: "SCBA Field Operations", date: "2026-06-05", status: "Completed", score: 97, assessor: "Eval. Lim" },
  ];
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [programs, setPrograms] = useState<Program[]>(() => {
    try { const v = localStorage.getItem(LS_KEYS.programs); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const [sessions, setSessions] = useState<Session[]>(() => {
    try { const v = localStorage.getItem(LS_KEYS.sessions); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const [participants, setParticipants] = useState<Participant[]>(() => {
    try { const v = localStorage.getItem(LS_KEYS.participants); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try { const v = localStorage.getItem(LS_KEYS.notifications); return v ? JSON.parse(v) : seedNotifications(); } catch { return seedNotifications(); }
  });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try { const v = localStorage.getItem(LS_KEYS.attendance); return v ? JSON.parse(v) : seedAttendance(); } catch { return seedAttendance(); }
  });
  const [assessorEvaluations, setAssessorEvaluations] = useState<AssessorEvaluation[]>(() => {
    try { const v = localStorage.getItem(LS_KEYS.evaluations); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const [accounts, setAccounts] = useState<AuthAccount[]>(() => {
    try {
      const v = localStorage.getItem(LS_KEYS.accounts);
      return v ? JSON.parse(v) : SEED_ACCOUNTS;
    } catch {
      return SEED_ACCOUNTS;
    }
  });

  const [evalObjectives, setEvalObjectives] = useState<EvalObjective[]>(() => {
    try {
      const v = localStorage.getItem(LS_KEYS.evalObjectives);
      if (v) {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_EVAL_OBJECTIVES;
    } catch {
      return INITIAL_EVAL_OBJECTIVES;
    }
  });

  const [toast, setToast] = useState<Toast | null>(null);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(LS_KEYS.darkMode);
      if (v !== null) return v === "true";
      return true;
    } catch { return true; }
  });

  useEffect(() => { localStorage.setItem(LS_KEYS.programs, JSON.stringify(programs)); }, [programs]);
  useEffect(() => { localStorage.setItem(LS_KEYS.sessions, JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem(LS_KEYS.participants, JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem(LS_KEYS.notifications, JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem(LS_KEYS.attendance, JSON.stringify(attendanceRecords)); }, [attendanceRecords]);
  useEffect(() => { localStorage.setItem(LS_KEYS.evaluations, JSON.stringify(assessorEvaluations)); }, [assessorEvaluations]);
  useEffect(() => { localStorage.setItem(LS_KEYS.accounts, JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem(LS_KEYS.evalObjectives, JSON.stringify(evalObjectives)); }, [evalObjectives]);

  // Synchronize accounts from Supabase public.users table on mount
  useEffect(() => {
    const fetchSupabaseUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*");

        if (!error && data && data.length > 0) {
          const remoteAccounts: AuthAccount[] = data.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: (u.role || "user") as AuthRole,
            dept: u.department || "Community Residents",
            avatar: u.avatar_initials || (u.name || "U").slice(0, 2).toUpperCase(),
            phone: u.phone || "0917-000-0000",
            status: u.is_active ? "Active" : "Suspended",
          }));

          setAccounts(prev => {
            const accMap = new Map<string, AuthAccount>();
            prev.forEach(a => accMap.set(a.email.toLowerCase(), a));
            remoteAccounts.forEach(r => {
              const existing = accMap.get(r.email.toLowerCase());
              accMap.set(r.email.toLowerCase(), existing ? { ...existing, ...r } : r);
            });
            return Array.from(accMap.values());
          });
        }
      } catch (err) {
        console.warn("Supabase initial users load notice:", err);
      }
    };

    fetchSupabaseUsers();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem(LS_KEYS.darkMode, String(darkMode));
  }, [darkMode]);

  // Auto-dismiss toast after duration
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, toast.duration ?? 4200);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (
    toastOrMessage: Omit<Toast, "id"> | string,
    type?: ToastType,
    title?: string,
    duration?: number
  ) => {
    if (typeof toastOrMessage === "string") {
      setToast({
        id: uid("T"),
        type: type || "info",
        title: title || "Notification",
        message: toastOrMessage,
        duration,
      });
    } else {
      setToast({
        id: uid("T"),
        ...toastOrMessage,
      });
    }
  };

  const dismissToast = () => setToast(null);

  const [hasExtendedCols, setHasExtendedCols] = useState<boolean | null>(null);

  // Synchronize programs from Supabase public.programs table on mount
  useEffect(() => {
    const fetchSupabasePrograms = async () => {
      try {
        // Probe if extended column 'assessor' exists in the Supabase schema
        const { error: probeErr } = await supabase.from("programs").select("assessor").limit(0);
        const hasExt = !probeErr;
        setHasExtendedCols(hasExt);

        const { data, error } = await supabase
          .from("programs")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const remotePrograms: Program[] = data.map((p: any) => {
            const rawDesc = p.description || "";
            const levelMatch = rawDesc.match(/\[Level:\s*([^\]]+)\]/);
            const modulesMatch = rawDesc.match(/\[Modules:\s*([^\]]+)\]/);
            const durationMatch = rawDesc.match(/\[Duration:\s*([^\]]+)\]/);
            const assessorMatch = rawDesc.match(/\[Assessor:\s*([^\]]+)\]/);
            const disasterMatch = rawDesc.match(/\[Disaster:\s*([^\]]+)\]/);
            const cleanDesc = rawDesc.replace(/\s*\[(Level|Modules|Duration|Assessor|Disaster):[^\]]+\]/g, "").trim();

            return {
              id: p.id,
              title: p.title,
              level: p.level || (levelMatch ? levelMatch[1] : "Basic"),
              modules: p.modules || (modulesMatch ? Number(modulesMatch[1]) : 1),
              duration: p.duration || (durationMatch ? durationMatch[1] : "1 Day"),
              status: p.status || "Active",
              description: cleanDesc || rawDesc,
              objectives: Array.isArray(p.objectives) ? p.objectives : [],
              prerequisites: p.prerequisites || "None",
              targetAudience: p.target_audience || "",
              certificationName: p.certification_name || "",
              passingScore: p.passing_score || 80,
              tags: Array.isArray(p.tags) ? p.tags : [],
              createdBy: p.created_by || "Admin",
              createdDate: p.created_at || new Date().toISOString(),
              lastUpdated: p.updated_at || new Date().toISOString(),
              moduleList: Array.isArray(p.module_list) ? p.module_list : [],
              assessor: p.assessor || (assessorMatch ? assessorMatch[1] : undefined),
              disasterType: p.disaster_type || (disasterMatch ? disasterMatch[1] : undefined),
              estimatedCost: p.estimated_cost ? Number(p.estimated_cost) : undefined,
            };
          });

          setPrograms(prev => {
            const progMap = new Map<string, Program>();
            // Remote database programs take priority
            remotePrograms.forEach(rp => progMap.set(rp.id || rp.title, rp));
            prev.forEach(lp => {
              const key = lp.id || lp.title;
              if (!progMap.has(key)) {
                progMap.set(key, lp);
              }
            });
            return Array.from(progMap.values());
          });
        }
      } catch (err) {
        console.warn("Supabase initial programs load notice:", err);
      }
    };

    fetchSupabasePrograms();
  }, []);

  const insertProgramToSupabase = async (newProg: Program) => {
    try {
      // Build metadata summary in description if database has only core columns
      const metaTokens = [
        newProg.level ? `[Level: ${newProg.level}]` : "",
        newProg.modules ? `[Modules: ${newProg.modules}]` : "",
        newProg.duration ? `[Duration: ${newProg.duration}]` : "",
        newProg.assessor ? `[Assessor: ${newProg.assessor}]` : "",
        newProg.disasterType ? `[Disaster: ${newProg.disasterType}]` : "",
      ].filter(Boolean).join(" ");

      const compositeDesc = newProg.description
        ? `${newProg.description}${metaTokens ? ` — ${metaTokens}` : ""}`
        : metaTokens || "Disaster preparedness training curriculum";

      // If extended columns are confirmed to exist, send full payload; otherwise send safe compatible payload
      const insertPayload: Record<string, any> = hasExtendedCols === true ? {
        title: newProg.title,
        level: newProg.level,
        modules: newProg.modules,
        duration: newProg.duration,
        status: newProg.status || "Draft",
        description: newProg.description || null,
        objectives: newProg.objectives || [],
        prerequisites: newProg.prerequisites || null,
        target_audience: newProg.targetAudience || null,
        certification_name: newProg.certificationName || null,
        passing_score: newProg.passingScore || 80,
        tags: newProg.tags || [],
        disaster_type: newProg.disasterType || null,
        estimated_cost: newProg.estimatedCost || 0,
        module_list: newProg.moduleList || [],
        assessor: newProg.assessor || null,
      } : {
        title: newProg.title,
        description: compositeDesc,
        status: newProg.status || "Draft",
      };

      // Only pass UUID for created_by or id if valid (avoids 22P02 invalid UUID syntax)
      if (newProg.createdBy && isValidUUID(newProg.createdBy)) {
        insertPayload.created_by = newProg.createdBy;
      }
      if (isValidUUID(newProg.id)) {
        insertPayload.id = newProg.id;
      }

      let { data, error } = await supabase.from("programs").insert(insertPayload).select();

      // If full payload failed because of missing column, fallback to safe core payload
      if (error && (error.message?.includes("Could not find") || error.code === "PGRST204")) {
        setHasExtendedCols(false);
        const safeFallback: Record<string, any> = {
          title: newProg.title,
          description: compositeDesc,
          status: newProg.status || "Draft",
        };
        if (isValidUUID(newProg.id)) {
          safeFallback.id = newProg.id;
        }
        const retryRes = await supabase.from("programs").insert(safeFallback).select();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) {
        console.warn("Supabase programs insert note:", error.message, error.code);
        if (error.code === "42501" || error.message?.includes("row-level security")) {
          showToast({
            type: "warning",
            title: "Supabase RLS Restriction",
            message: "Database blocked insert due to RLS. Run 'ALTER TABLE public.programs DISABLE ROW LEVEL SECURITY;' in your Supabase SQL Editor.",
            duration: 10000
          });
        } else if (error.code === "23502" || error.message?.includes("not-null constraint")) {
          showToast({
            type: "warning",
            title: "Database Constraint Notice",
            message: "Run 'ALTER TABLE public.programs ALTER COLUMN created_by DROP NOT NULL;' in your Supabase SQL Editor.",
            duration: 12000
          });
        } else if (error.code === "23503" || error.message?.includes("foreign key constraint")) {
          showToast({
            type: "warning",
            title: "Database Foreign Key Notice",
            message: "Run 'ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS fk_programs_created_by;' in your Supabase SQL Editor.",
            duration: 12000
          });
        } else {
          showToast({
            type: "warning",
            title: "Database Sync Note",
            message: `Saved locally. Database note: ${error.message}`
          });
        }
      } else {
        console.log("Supabase programs insert successful:", data);
        showToast({
          type: "success",
          title: "Database Synchronized",
          message: `Program "${newProg.title}" successfully saved to your database!`
        });
        if (data && data[0] && data[0].id) {
          setPrograms(prev => prev.map(p => (p.title === newProg.title && (!p.id || p.id === newProg.id)) ? { ...p, id: data[0].id } : p));
        }
      }
    } catch (err: any) {
      console.warn("Supabase insert program exception:", err);
    }
  };

  const addProgram = (p: Program) => {
    const assignedId = p.id && isValidUUID(p.id) ? p.id : generateUUID();
    const newProg: Program = { ...p, id: assignedId, createdDate: p.createdDate || new Date().toISOString() };
    setPrograms(prev => [newProg, ...prev]);
    showToast({ type: "success", title: "Program Created", message: `"${newProg.title}" has been saved.` });
    addNotification({ type: "System", subject: `New program added: ${newProg.title}`, status: "Sent" });
    insertProgramToSupabase(newProg);
  };

  const updateProgram = (id: string, updates: Partial<Program>) => {
    setPrograms(prev => prev.map(p => p.id === id ? { ...p, ...updates, lastUpdated: new Date().toISOString() } : p));
    showToast({ type: "info", title: "Program Updated", message: "Program changes saved." });

    if (isValidUUID(id)) {
      supabase.from("programs").update({
        ...(updates.title && { title: updates.title }),
        ...(updates.description && { description: updates.description }),
        ...(updates.level && { level: updates.level }),
        ...(updates.modules !== undefined && { modules: updates.modules }),
        ...(updates.status && { status: updates.status }),
        ...(updates.duration && { duration: updates.duration }),
      }).eq("id", id).then(res => {
        if (res.error) console.warn("Supabase update program error:", res.error);
      });
    }
  };

  const deleteProgram = (id: string) => {
    const target = programs.find(p => p.id === id);
    setPrograms(prev => prev.filter(p => p.id !== id));
    showToast({ type: "warning", title: "Program Deleted", message: target ? `"${target.title}" was removed.` : "Program removed." });

    if (isValidUUID(id)) {
      supabase.from("programs").delete().eq("id", id).then(res => {
        if (res.error) console.warn("Supabase delete program error:", res.error);
      });
    }
  };

  const createSession = (s: Session): string => {
    const id = s.id || uid("SES");
    const newS: Session = { ...s, id, enrolled: s.enrolled ?? 0, createdDate: s.createdDate || new Date().toISOString() };
    setSessions(prev => [newS, ...prev]);
    showToast({ type: "success", title: "Session Created", message: `Session for "${newS.course}" scheduled.` });
    addNotification({ type: "Session", subject: `New session scheduled: ${newS.course}`, status: "Sent" }, true);
    return id;
  };

  const updateSession = (id: string, updates: Partial<Session>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates, lastUpdated: new Date().toISOString() } : s));
    showToast({ type: "info", title: "Session Updated", message: "Session details updated." });
  };

  const cancelSession = (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: "Cancelled" } : s));
    showToast({ type: "warning", title: "Session Cancelled", message: "Session has been marked as cancelled." });
  };

  const launchSession = (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: "Launched" } : s));
    showToast({ type: "success", title: "Session Launched", message: "Session is now active and in progress." });
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    showToast({ type: "warning", title: "Session Removed", message: "Session was removed from schedule." });
  };

  const registerParticipant = (p: Participant) => {
    setParticipants(prev => [{ ...p, id: uid("P") }, ...prev]);
    showToast({ type: "success", title: "Participant Registered", message: `${p.name} enrolled.` });
  };

  const addNotification = (n: Omit<Notification, "id" | "date" | "read">, triggerToast = true) => {
    const note: Notification = { id: uid("N"), date: new Date().toISOString(), read: false, ...n };
    setNotifications(prev => [note, ...prev]);
    if (triggerToast) {
      showToast({
        type: n.status === "Failed" ? "error" : "info",
        title: n.subject,
        message: n.body,
      });
    }
  };

  const addUser = (u: Participant) => setParticipants(prev => [{ ...u, id: uid("U") }, ...prev]);

  const addAccount = (acc: AuthAccount) => {
    const newAcc: AuthAccount = {
      ...acc,
      id: acc.id || uid("USR"),
      status: acc.status || "Active",
    };
    setAccounts(prev => [newAcc, ...prev.filter(a => a.email.toLowerCase() !== acc.email.toLowerCase())]);
    showToast({ type: "success", title: "User Account Created", message: `${acc.name} (${acc.role}) can now sign in.` });

    // Sync to Supabase public.users table directly
    (async () => {
      try {
        const { error } = await supabase
          .from("users")
          .upsert({
            name: newAcc.name,
            email: newAcc.email.toLowerCase().trim(),
            role: newAcc.role,
            department: newAcc.dept,
            avatar_initials: newAcc.avatar,
            phone: newAcc.phone || null,
            is_active: newAcc.status !== "Suspended",
          }, { onConflict: "email" });

        if (error) {
          console.warn("Supabase public.users sync note:", error.message);
        } else {
          console.log("Account successfully written to Supabase public.users:", newAcc.email);
        }
      } catch (e) {
        console.warn("Supabase addAccount sync error:", e);
      }
    })();
  };

  const updateAccount = (idOrEmail: string, updates: Partial<AuthAccount>) => {
    setAccounts(prev => prev.map(a => (a.id === idOrEmail || a.email.toLowerCase() === idOrEmail.toLowerCase()) ? { ...a, ...updates } : a));
    showToast({ type: "info", title: "Account Updated", message: `Account permissions updated.` });

    // Sync updates to Supabase public.users table directly
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.role) dbUpdates.role = updates.role;
    if (updates.dept) dbUpdates.department = updates.dept;
    if (updates.avatar) dbUpdates.avatar_initials = updates.avatar;
    if (updates.phone) dbUpdates.phone = updates.phone;
    if (updates.status) dbUpdates.is_active = updates.status !== "Suspended";

    if (Object.keys(dbUpdates).length > 0 && idOrEmail.includes("@")) {
      (async () => {
        try {
          const { error } = await supabase
            .from("users")
            .update(dbUpdates)
            .eq("email", idOrEmail.toLowerCase().trim());

          if (error) {
            console.warn("Supabase user update note:", error.message);
          }
        } catch (e) {
          console.warn("Supabase user update error:", e);
        }
      })();
    }
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const addAttendanceRecord = (r: Omit<AttendanceRecord, "id">) => {
    setAttendanceRecords(prev => [{ id: uid("ATT"), ...r }, ...prev]);
    addNotification({ type: "Attendance", subject: `${r.participantName} — ${r.program} marked ${r.status}`, status: "Sent" }, true);
  };

  const updateAttendanceRecord = (id: string, updates: Partial<AttendanceRecord>) => {
    setAttendanceRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    showToast({ type: "info", title: "Attendance Updated", message: "Participant record updated." });
  };

  const removeAttendanceRecord = (id: string) => {
    setAttendanceRecords(prev => prev.filter(r => r.id !== id));
    showToast({ type: "warning", title: "Application Removed", message: "Application record removed." });
  };

  const getAttendanceFor = (participantNameOrId: string) =>
    attendanceRecords.filter(r => r.participantId === participantNameOrId || r.participantName === participantNameOrId);

  const submitAssessorEvaluation = (e: Omit<AssessorEvaluation, "id" | "date">) => {
    const evalRecord: AssessorEvaluation = { id: uid("EVL"), date: new Date().toISOString(), ...e };
    setAssessorEvaluations(prev => [evalRecord, ...prev]);
    setAttendanceRecords(prev => prev.map(r => r.id === e.attendanceId ? { ...r, evaluated: true } : r));
    addNotification({ type: "Evaluation", subject: `${e.participantName} rated ${e.assessorName} (${e.rating}/5) for ${e.program}`, status: "Sent" }, true);
  };

  const getEvaluationsFor = (assessorName: string) => assessorEvaluations.filter(e => e.assessorName === assessorName);

  const toggleEvalObjective = (id: number, verifiedBy = "Admin Evaluator") => {
    setEvalObjectives(prev => {
      const target = prev.find(o => o.id === id);
      if (!target) return prev;
      const nextDone = !target.done;
      const updated = prev.map(o => {
        if (o.id !== id) return o;
        return {
          ...o,
          done: nextDone,
          time: nextDone ? (o.benchmarkTime || "1:42") : "—",
          verifiedBy: nextDone ? verifiedBy : undefined,
          verifiedAt: nextDone ? new Date().toISOString() : undefined,
        };
      });

      addNotification({
        type: "Evaluation",
        subject: `Objective ${nextDone ? "Passed" : "Reset"}: "${target.text}"`,
        body: `Objective "${target.text}" was ${nextDone ? "verified and checked as Passed" : "reset to unchecked"} by ${verifiedBy}. Recorded in Performance Evaluation Dashboard.`,
        status: "Sent",
        audience: ["admin", "superadmin", "user"],
      }, true);

      return updated;
    });
  };

  const resetEvalObjectives = () => {
    setEvalObjectives(INITIAL_EVAL_OBJECTIVES);
    showToast({
      type: "info",
      title: "Evaluation Objectives Reset",
      message: "All drill performance objectives have been reset to unchecked.",
    });
  };

  const markNotificationRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllNotificationsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const clearNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));
  const clearAllNotifications = () => setNotifications([]);

  const exportCSV = (type: "programs" | "sessions" | "participants" | "attendance") => {
    let data: any[] = [];
    if (type === "programs") data = programs;
    if (type === "sessions") data = sessions;
    if (type === "participants") data = participants;
    if (type === "attendance") data = attendanceRecords;
    if (!data.length) { addNotification({ type: "Export", subject: `No ${type} to export`, status: "Failed" }, true); return; }
    const keys = Object.keys(data[0]);
    const csv = [keys.join(","), ...data.map(r => keys.map(k => `${((r as any)[k] ?? "").toString().replace(/"/g, '""')}`).join(",")).join("\n")];
    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${type}.csv`; a.click();
    URL.revokeObjectURL(url);
    addNotification({ type: "Export", subject: `Exported ${type}`, status: "Sent" }, true);
  };

  return (
    <AppContext.Provider value={{ 
      programs, sessions, participants, notifications, attendanceRecords, assessorEvaluations, 
      accounts, toast, darkMode, toggleDarkMode, showToast, dismissToast,
      addProgram, updateProgram, deleteProgram, createSession, updateSession, cancelSession, launchSession, deleteSession, 
      registerParticipant, addNotification, exportCSV, addUser, addAccount, updateAccount,
      markNotificationRead, markAllNotificationsRead, clearNotification, clearAllNotifications, 
      addAttendanceRecord, updateAttendanceRecord, removeAttendanceRecord, getAttendanceFor, submitAssessorEvaluation, getEvaluationsFor,
      evalObjectives, toggleEvalObjective, resetEvalObjectives
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

export default AppContext;
