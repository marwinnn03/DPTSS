import React, { useMemo } from 'react';
import { LocationMap } from './components/LocationMap';
//import { supabase } from '../supabaseClient' // (o kung nasaan ang path ng supabaseClient.ts)
import { useState, useRef, useEffect } from "react";
import { AppProvider, useApp, type Program, type Session, type Notification, type AttendanceRecord, type AssessorEvaluation } from "./appContext";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen, Cpu, Users, BarChart3, FileText, Bell, ChevronRight,
  Plus, Search, Filter, MoreHorizontal, CheckCircle, Clock, XCircle,
  Activity, Target, Layers, MapPin, Calendar, Download, Play, Edit2,
  Eye, TrendingUp, TrendingDown, Shield, Zap, Wind, Flame, Droplets,
  User, ChevronDown, AlertTriangle, Mail, BookMarked, Sliders, List,
  PlusCircle, Trash2, ChevronUp, CheckSquare, Square, Timer, Smartphone,
  FileCheck, TrendingUp as Trend, Building2, Package, UserCheck, LogIn,
  Send, Info, Check, X, Lock, LogOut, Key, Settings, ShieldCheck,
  UserPlus, UserX, RefreshCw, ToggleLeft, ToggleRight, Hash, Globe,
  ClipboardList, Star, Award, Sun, Moon, Phone, Briefcase, MapPinned, ArrowRight,
  CheckCircle2,
  Facebook, Twitter, Youtube, Instagram,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, AreaChart, Area,
} from "recharts";
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.07 } }),
};
const fadeIn = {
  hidden: { opacity: 0 },
  show: (i = 0) => ({ opacity: 1, transition: { duration: 0.28, delay: i * 0.06 } }),
};
const slideRight = {
  hidden: { opacity: 0, x: -16 },
  show: (i = 0) => ({ opacity: 1, x: 0, transition: { duration: 0.3, delay: i * 0.05 } }),
};
const pageTransition = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};
const tabTransition = {
  hidden: { opacity: 0, x: 10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.15 } },
};

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function rowsToCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return "";
  const keySet = new Set<string>();
  rows.forEach(r => Object.keys(r).forEach(k => keySet.add(k)));
  const keys: string[] = Array.from(keySet);
  const escape = (v: any) => `"${(v ?? "").toString().replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map(r => keys.map(k => escape(r[k])).join(","))].join("\n");
}

function rowsToReportText(title: string, rows: Record<string, any>[]): string {
  const generated = new Date().toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const lines = [`${title}`, `Generated: ${generated}`, `Records: ${rows.length}`, "=".repeat(48), ""];
  rows.forEach((r, i) => {
    lines.push(`[${i + 1}]`);
    Object.entries(r).forEach(([k, v]) => lines.push(`  ${k}: ${v ?? "—"}`));
    lines.push("");
  });
  return lines.join("\n");
}

function exportRows(filename: string, title: string, rows: Record<string, any>[], format: "csv" | "json" | "pdf") {
  if (format === "json") { downloadBlob(`${filename}.json`, JSON.stringify(rows, null, 2), "application/json"); return; }
  if (format === "pdf") { downloadBlob(`${filename}.txt`, rowsToReportText(title, rows), "text/plain"); return; }
  downloadBlob(`${filename}.csv`, rowsToCSV(rows), "text/csv");
}

type Role = "user" | "admin" | "superadmin";
type AdminModule = "dashboard" | "training" | "simulation" | "participants" | "evaluation" | "reporting";
type SuperAdminModule = AdminModule | "usermgmt" | "settings";
type UserModule = "myDashboard" | "mySessions" | "myPerformance" | "browsedrills" | "myAlerts";
type TrainingTab = "curriculum" | "schedule" | "resources";
type SimTab = "selector" | "injector" | "roles";
type ParticipantTab = "portal" | "profiles" | "byProgram" | "attendance" | "notifications";
type EvalTab = "objectives" | "analytics" | "assessor";
type ReportTab = "aar" | "compliance" | "trends";

interface AuthUser {
  name: string;
  email: string;
  role: Role;
  dept: string;
  avatar: string;
  phone?: string;
}

const DEMO_ACCOUNTS: AuthUser[] = [
  { name: "Maria Santos", email: "m.santos@ems.gov", role: "user", dept: "Rescue Alpha", avatar: "MS", phone: "+63 917 200 1044" },
  { name: "Capt. Santos", email: "admin@ems.gov", role: "admin", dept: "Training Division", avatar: "CS", phone: "+63 917 200 2278" },
  { name: "Director Reyes", email: "superadmin@ems.gov", role: "superadmin", dept: "Command HQ", avatar: "DR", phone: "+63 917 200 1141" },
];

function Badge({ status, children }: { status?: string; children: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    Active: "bg-green-500/15 text-green-400 border-green-500/20",
    Draft: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    Archived: "bg-gray-500/15 text-gray-400 border-gray-500/20",
    Completed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    "In Progress": "bg-orange-500/15 text-orange-400 border-orange-500/20",
    Critical: "bg-red-500/15 text-red-400 border-red-500/20",
    Scheduled: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    Launched: "bg-green-500/15 text-green-400 border-green-500/20",
    Cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
    Low: "bg-green-500/15 text-green-400 border-green-500/20",
    Medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    High: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    Extreme: "bg-red-500/15 text-red-400 border-red-500/20",
    Passed: "bg-green-500/15 text-green-400 border-green-500/20",
    Failed: "bg-red-500/15 text-red-400 border-red-500/20",
    Pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    Inactive: "bg-gray-500/15 text-gray-400 border-gray-500/20",
    "No Show": "bg-red-500/15 text-red-400 border-red-500/20",
    Enrolled: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
    Sent: "bg-green-500/15 text-green-400 border-green-500/20",
    Queued: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    user: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    admin: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    superadmin: "bg-primary/15 text-primary border-primary/20",
    Suspended: "bg-red-500/15 text-red-400 border-red-500/20",
    Advanced: "bg-primary/15 text-primary border-primary/20",
    Intermediate: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    Basic: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  };
  const k = status ?? (children as string);
  const cls = colorMap[k] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[13px] font-mono font-medium border ${cls}`}>
      {children}
    </span>
  );
}

function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string; icon: React.ElementType }[]; active: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-0.5 bg-secondary p-1 rounded-lg w-fit flex-wrap">
      {tabs.map(t => {
        const Icon = t.icon;
        return (
          <motion.button key={t.id} onClick={() => onChange(t.id)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${active === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon size={14} />{t.label}
          </motion.button>
        );
      })}
    </div>
  );
}

type MenuItem = { label: string; icon?: React.ElementType; onClick: () => void; danger?: boolean };

function DropdownMenu({ items, align = "right" }: { items: MenuItem[]; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary transition-colors">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className={`absolute z-40 top-full mt-1 ${align === "right" ? "right-0" : "left-0"} w-52 bg-card border border-border rounded-md shadow-2xl py-1 overflow-hidden`}>
            {items.map((it, i) => {
              const Icon = it.icon;
              return (
                <button key={i} onClick={(e) => { e.stopPropagation(); it.onClick(); setOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-secondary/60 transition-colors ${it.danger ? "text-red-400" : "text-foreground"}`}>
                  {Icon && <Icon size={13} />}{it.label}
                </button>
              );
            })}
          </motion.div>
        </>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
      <div className="text-sm text-foreground">{value ?? <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

function AvatarCircle({ initials, color = "bg-secondary" }: { initials: string; color?: string }) {
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-sm font-bold text-foreground flex-shrink-0`}>
      {initials}
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function notificationIcon(type: string): React.ElementType {
  const map: Record<string, React.ElementType> = {
    System: Info,
    Session: Calendar,
    Evaluation: BarChart3,
    Export: Download,
    Alert: AlertTriangle,
    Registration: UserCheck,
    Withdrawal: UserX,
  };
  return map[type] ?? Mail;
}

function NotificationBell({ role }: { role: Role }) {
  const app = useApp();
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<Notification | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const visible = app.notifications.filter(n => !n.audience || n.audience.includes(role));
  const sorted = [...visible].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const unreadCount = sorted.filter(n => !n.read).length;

  const openNotification = (n: Notification) => {
    if (!n.read) app.markNotificationRead(n.id);
    setViewing(n);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
        className="relative text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary text-[10px] font-mono text-primary-foreground flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary">{unreadCount} new</span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                {unreadCount > 0 && (
                  <button onClick={() => app.markAllNotificationsRead()} className="text-[12px] font-mono text-primary hover:underline flex items-center gap-1">
                    <Check size={12} />Mark all read
                  </button>
                )}
                {sorted.length > 0 && (
                  <button onClick={() => app.clearAllNotifications()} title="Clear all" className="text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {sorted.length === 0 && (
                <div className="px-3 py-10 flex flex-col items-center gap-2 text-center">
                  <Bell size={22} className="text-muted-foreground/40" />
                  <div className="text-[13px] text-muted-foreground">You're all caught up</div>
                </div>
              )}
              {sorted.map(n => {
                const Icon = notificationIcon(n.type);
                return (
                  <div
                    key={n.id}
                    onClick={() => openNotification(n)}
                    className={`group flex gap-2.5 px-3 py-2.5 border-b border-border last:border-b-0 cursor-pointer transition-colors ${!n.read ? "bg-primary/5" : "hover:bg-secondary/40"}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.read ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                      <Icon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`text-[13px] leading-tight ${!n.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}>
                          {n.subject}
                        </div>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />}
                      </div>
                      {n.body && <div className="text-[12px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{n.body}</div>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1"><Clock size={10} />{timeAgo(n.date)}</span>
                        {n.status && <Badge status={n.status}>{n.status}</Badge>}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); app.clearNotification(n.id); }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity flex-shrink-0"
                      title="Dismiss"
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {viewing && <NotificationDetailModal notification={viewing} onClose={() => setViewing(null)} onClear={() => { app.clearNotification(viewing.id); setViewing(null); }} />}
    </div>
  );
}

function NotificationDetailModal({ notification, onClose, onClear }: { notification: Notification; onClose: () => void; onClear: () => void }) {
  const Icon = notificationIcon(notification.type);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-lg shadow-xl overflow-hidden"
      >
        <div className="flex items-start gap-3 px-4 py-3.5 border-b border-border bg-secondary/30">
          <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
            <Icon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground leading-snug">{notification.subject}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{notification.type}</span>
              {notification.status && <Badge status={notification.status}>{notification.status}</Badge>}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"><X size={16} /></button>
        </div>
        <div className="px-4 py-4 space-y-3">
          <p className="text-sm text-foreground leading-relaxed">{notification.body ?? "No additional details for this notification."}</p>
          <div className="flex items-center gap-1.5 text-[12px] font-mono text-muted-foreground">
            <Clock size={11} />
            {new Date(notification.date).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-secondary/20">
          <button onClick={onClear} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/20 transition-colors flex items-center gap-1.5">
            <Trash2 size={13} />Dismiss
          </button>
          <button onClick={onClose} className="text-xs text-foreground px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/70 transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = useApp();
  return (
    <button
      onClick={toggleDarkMode}
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      className="relative w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
    >
      <AnimatePresence mode="wait" initial={false}>
        {darkMode ? (
          <motion.span key="sun" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.18 }} className="absolute">
            <Sun size={16} />
          </motion.span>
        ) : (
          <motion.span key="moon" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.18 }} className="absolute">
            <Moon size={16} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function LogoutConfirmModal({ auth, onConfirm, onCancel }: { auth: AuthUser; onConfirm: () => void; onCancel: () => void }) {
  const roleLabel = auth.role === "superadmin" ? "Super Admin" : auth.role === "admin" ? "Admin" : "Participant";
  const roleColor = auth.role === "superadmin" ? "bg-primary/20 text-primary" : auth.role === "admin" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={onCancel}
        />

        {/* Dialog */}
        <motion.div
          className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />

          <div className="p-6">
            {/* Icon */}
            <motion.div
              className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4"
              initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <LogOut size={22} className="text-red-400" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <h2 className="text-center text-lg font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">
                CONFIRM SIGN OUT
              </h2>
              <p className="text-center text-xs text-muted-foreground mt-1">
                You are about to end your session. Any unsaved changes may be lost.
              </p>
            </motion.div>

            {/* User info card */}
            <motion.div
              className="mt-4 flex items-center gap-3 bg-secondary rounded-lg p-3 border border-border"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${roleColor}`}>
                {auth.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{auth.name}</div>
                <div className="text-[12px] font-mono text-muted-foreground">{auth.email}</div>
              </div>
              <Badge status={auth.role}>{roleLabel}</Badge>
            </motion.div>

            {/* Buttons */}
            <motion.div
              className="flex gap-2.5 mt-5"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            >
              <motion.button
                onClick={onCancel}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={onConfirm}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-sm font-semibold text-red-400 hover:bg-red-500/25 transition-colors"
              >
                <LogOut size={16} />Sign Out
              </motion.button>
            </motion.div>

            <p className="text-center text-[12px] font-mono text-muted-foreground mt-3">
              Session will be cleared from this device
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

type WithdrawTarget = { id: string; name: string; date?: string; time?: string; location?: string };

function WithdrawConfirmModal({ target, onConfirm, onCancel }: { target: WithdrawTarget; onConfirm: () => void; onCancel: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={onCancel}
        />
        <motion.div
          className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-red-400 via-red-400/60 to-transparent" />
          <div className="p-6">
            <motion.div
              className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4"
              initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <UserX size={22} className="text-red-400" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <h2 className="text-center text-lg font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">
                CONFIRM WITHDRAWAL
              </h2>
              <p className="text-center text-xs text-muted-foreground mt-1">
                You're about to give up your seat in this session. Admins will be notified and your slot may be reassigned.
              </p>
            </motion.div>

            <motion.div
              className="mt-4 bg-secondary rounded-lg p-3 border border-border"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            >
              <div className="text-sm font-semibold text-foreground truncate">{target.name}</div>
              {(target.date || target.time || target.location) && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[12px] font-mono text-muted-foreground">
                  {target.date && <span className="flex items-center gap-1"><Calendar size={11} />{target.date}</span>}
                  {target.time && <span className="flex items-center gap-1"><Clock size={11} />{target.time}</span>}
                  {target.location && <span className="flex items-center gap-1"><MapPin size={11} />{target.location}</span>}
                </div>
              )}
            </motion.div>

            <motion.div
              className="flex gap-2.5 mt-5"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            >
              <motion.button
                onClick={onCancel}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors"
              >
                Keep My Spot
              </motion.button>
              <motion.button
                onClick={onConfirm}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-sm font-semibold text-red-400 hover:bg-red-500/25 transition-colors"
              >
                <UserX size={16} />Withdraw
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CertificateModal({ auth, record, onClose }: { auth: AuthUser; record: AttendanceRecord; onClose: () => void }) {
  const certId = record.certificate || `CERT-${record.id}`;
  const completedDate = new Date(record.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const issuedDate = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #certificate-print-area, #certificate-print-area * { visibility: visible; }
            #certificate-print-area { position: fixed; inset: 0; margin: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
            @page { size: landscape; margin: 0.4in; }
          }
        `}</style>
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={onClose}
        />
        <motion.div
          className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden print:shadow-none print:border-0 print:max-w-none print:rounded-none"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/30 print:hidden">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Award size={16} className="text-primary" />Certificate of Completion</div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
          </div>

          <div id="certificate-print-area" className="bg-white p-10">
            <div className="border-[3px] border-double p-8 text-center" style={{ borderColor: "#b91c1c" }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ backgroundColor: "#b91c1c" }}>
                  <Shield size={18} color="#ffffff" />
                </div>
                <div className="text-left leading-none">
                  <div className="text-xs font-bold tracking-widest" style={{ color: "#111827" }}>DPTSS</div>
                  <div className="text-[10px] tracking-widest" style={{ color: "#6b7280" }}>Disaster Preparedness Training &amp; Simulation System</div>
                </div>
              </div>

              <div className="text-[11px] tracking-[0.3em] uppercase mt-6" style={{ color: "#6b7280" }}>Certificate of Completion</div>
              <div className="text-3xl font-bold font-['Barlow_Condensed'] tracking-wide mt-2" style={{ color: "#111827" }}>THIS IS TO CERTIFY THAT</div>

              <div className="text-2xl font-semibold mt-5 pb-2 inline-block" style={{ color: "#b91c1c", borderBottom: "1px solid #d1d5db" }}>{auth.name}</div>

              <p className="text-sm mt-5 leading-relaxed max-w-md mx-auto" style={{ color: "#374151" }}>
                has successfully completed the training program
              </p>
              <div className="text-xl font-bold font-['Barlow_Condensed'] mt-1" style={{ color: "#111827" }}>{record.program}</div>

              <div className="flex items-center justify-center gap-8 mt-6 text-xs" style={{ color: "#374151" }}>
                <div><div className="tracking-widest uppercase text-[10px]" style={{ color: "#9ca3af" }}>Date Completed</div><div className="font-semibold mt-0.5">{completedDate}</div></div>
                {typeof record.score === "number" && (
                  <div><div className="tracking-widest uppercase text-[10px]" style={{ color: "#9ca3af" }}>Score</div><div className="font-semibold mt-0.5">{record.score}%</div></div>
                )}
                <div><div className="tracking-widest uppercase text-[10px]" style={{ color: "#9ca3af" }}>Certificate ID</div><div className="font-semibold mt-0.5 font-mono">{certId}</div></div>
              </div>

              <div className="flex items-end justify-center gap-16 mt-10">
                <div className="text-center">
                  <div className="w-40 border-t pt-1" style={{ borderColor: "#9ca3af" }}>
                    <div className="text-xs font-semibold" style={{ color: "#111827" }}>Training Command</div>
                    <div className="text-[10px]" style={{ color: "#9ca3af" }}>DPTSS Program Director</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-40 border-t pt-1" style={{ borderColor: "#9ca3af" }}>
                    <div className="text-xs font-semibold" style={{ color: "#111827" }}>{issuedDate}</div>
                    <div className="text-[10px]" style={{ color: "#9ca3af" }}>Date Issued</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-secondary/20 print:hidden">
            <button onClick={onClose} className="text-xs text-foreground px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/70 transition-colors">Close</button>
            <button onClick={() => window.print()} className="text-xs text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5">
              <Download size={13} />Download PDF
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star size={26} className={(hover || value) >= n ? "text-primary fill-primary" : "text-muted-foreground"} />
        </button>
      ))}
    </div>
  );
}

function EvaluateAssessorModal({ record, onClose, onSubmit }: { record: AttendanceRecord; onClose: () => void; onSubmit: (rating: number, comments: string) => void }) {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (rating === 0) { setError("Please select a star rating."); return; }
    onSubmit(rating, comments.trim());
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
        <motion.div
          className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><UserCheck size={16} className="text-primary" />Evaluate Assessor</div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
          </div>
          <div className="p-5 space-y-4">
            <div className="bg-secondary/40 border border-border rounded-lg p-3">
              <div className="text-sm font-semibold text-foreground">{record.program}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Assessor: <span className="text-foreground font-medium">{record.assessor ?? "Unassigned"}</span></div>
            </div>
            <div>
              <label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Rate the Assessor</label>
              <StarRatingInput value={rating} onChange={v => { setRating(v); setError(""); }} />
            </div>
            <div>
              <label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Comments (optional)</label>
              <textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                rows={3}
                placeholder="Share feedback on instruction quality, clarity, or conduct during the drill..."
                className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
            {error && <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertTriangle size={13} />{error}</p>}
          </div>
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-secondary/20">
            <button onClick={onClose} className="text-xs text-foreground px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/70 transition-colors">Cancel</button>
            <button onClick={handleSubmit} className="text-xs text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5">
              <Send size={13} />Submit Evaluation
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const BARANGAY_LOGO_IMG = "data:image/jpeg;base64,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";
const BARANGAY_HQ_IMG = "data:image/jpeg;base64,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";

function LandingPage({ onLogin }: { onLogin: () => void }) {
  const [dark, setDark] = useState(true);
  const [active, setActive] = useState("home");

  const navLinks = [
    { id: "home", label: "Home" },
    { id: "systems", label: "Systems" },
    { id: "preparedness", label: "Preparedness" },
    { id: "news", label: "News" },
  ];

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const sections = navLinks.map(l => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const systemsList = [
    { icon: Activity, code: "IRS", title: "Incident Response", desc: "Real-time dispatch and coordination for barangay first responders.", color: "#ef4444", updated: "July 28, 2026" },
    { icon: Bell, code: "CABS", title: "Community Alert Broadcasting", desc: "Instant SMS, app, and siren alerts reaching 15,000+ residents.", color: "#8b5cf6", updated: "July 25, 2026" },
    { icon: Eye, code: "CCTV", title: "CCTV & Surveillance", desc: "Live monitoring feeds across barangay checkpoints and public areas.", color: "#06b6d4", updated: "July 22, 2026" },
    { icon: UserCheck, code: "VRDS", title: "Volunteer & Resource Deployment", desc: "Track available responders, equipment, and relief supplies.", color: "#10b981", updated: "July 20, 2026" },
    { icon: MapPinned, code: "ERMS", title: "Evacuation Route Mapping", desc: "Live hazard zones and shortest-path evacuation guidance.", color: "#f59e0b", updated: "July 18, 2026" },
    { icon: ClipboardList, code: "DBRS", title: "Digital Blotter & Reporting", desc: "Paperless incident logging with case tracking and audit trail.", color: "#ef4444", updated: "July 15, 2026" },
  ];

  const hazards = [
    {
      tag: "Earthquake", color: "#ef4444", title: "Earthquake Preparedness",
      desc: "The West Valley Fault runs near Barangay Culiat. Knowing what to do before, during, and after shaking can save lives.",
      points: [
        "Identify safe spots in every room — under sturdy tables, away from windows",
        "Secure heavy furniture and appliances to walls",
        "Prepare a 72-hour emergency kit with food, water, and documents",
        "Practice Drop, Cover, and Hold On with all household members",
        "Know your purok evacuation route and assembly area",
      ],
    },
    {
      tag: "Fire Safety", color: "#f59e0b", title: "Fire Safety Tips",
      desc: "House fires are a frequent emergency. Simple precautions dramatically reduce risk.",
      points: [
        "Install smoke detectors in every bedroom and hallway",
        "Never leave cooking unattended — the leading cause of fires",
        "Keep a working fire extinguisher in the kitchen",
        "Plan and practice two exit routes from every room",
        "Call 8426 (BFP) immediately — do not attempt to fight large fires",
      ],
    },
    {
      tag: "Flood Response", color: "#06b6d4", title: "Flood Response Guide",
      desc: "During typhoon season, low-lying areas in Barangay Culiat face flooding risk. Early action is critical.",
      points: [
        "Monitor PAGASA bulletins and Barangay DRRM alerts during typhoons",
        "Move important documents and valuables to higher floors",
        "Never walk or drive through floodwaters — 15cm can knock a person over",
        "Know your purok's pre-emptive evacuation signal",
        "Report blocked drains to 122 before rain events",
      ],
    },
    {
      tag: "Emergency Contacts", color: "#10b981", title: "Key Emergency Contacts",
      desc: "Save these numbers before you need them. Program them into your phone today.",
      points: [
        "National Emergency Hotline — 911",
        "Barangay DRRM Command Center — 8988-4242",
        "BFP — 8426-0246",
        "QC Police District — 8352-8880",
        "Quezon City General Hospital — 8988-8965",
      ],
    },
  ];

  const featuredNews = {
    date: "Aug 1, 2026",
    author: "Barangay Culiat DRRM",
    badge: "Emergency Advisory",
    title: "Barangay-wide Earthquake Drill Set for August 15 — All Puroks Required to Participate",
    description: "The Barangay Culiat Disaster Risk Reduction and Management Office has scheduled a full-barangay earthquake drill covering all 24 puroks. Residents, businesses, and institutions are advised to review evacuation routes and designated assembly areas ahead of the exercise.",
  };

  const news = [
    { date: "Jul 28, 2026", tag: "Infrastructure", title: "12 New CCTV Units Installed Along Culiat Road", color: "#3b82f6" },
    { date: "Jul 22, 2026", tag: "Advisory", title: "Flood Advisory Lifted for Purok 3 and Purok 5", color: "#10b981" },
    { date: "Jul 15, 2026", tag: "Training", title: "Volunteer Rescue Team Completes SCBA Certification", color: "#f59e0b" },
    { date: "Jul 10, 2026", tag: "System Update", title: "LEIRS Upgraded: Real-Time Case Tracking Now Live", color: "#8b5cf6" },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? "bg-[#0a0c12] text-white" : "bg-slate-50 text-slate-900"}`} style={{ fontFamily: "'DM Sans', 'Barlow', sans-serif" }}>
      {/* NAV */}
      <nav className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${dark ? "border-white/10 bg-[#0a0c12]/90" : "border-slate-200 bg-white/90"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-1 bg-white ${dark ? "ring-white/15" : "ring-slate-200"}`}>
              <img src={BARANGAY_LOGO_IMG} alt="Barangay Culiat Seal" className="w-full h-full object-cover" />
            </div>
            <div className="leading-none">
              <div className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.2em]">Barangay Culiat Government</div>
              <div className={`text-sm font-bold tracking-tight mt-0.5 ${dark ? "text-white" : "text-slate-900"}`}>Integrated Public Safety & Security</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)} className={`text-sm font-medium transition-colors relative pb-1 ${l.id === active ? (dark ? "text-white" : "text-slate-900") : (dark ? "text-white/60 hover:text-white" : "text-slate-500 hover:text-slate-900")}`}>
                {l.label}
                {l.id === active && <motion.span layoutId="nav-underline" className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-emerald-400 rounded-full" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-semibold px-3 py-1.5 rounded-full">
              <Phone size={12} />Emergency: 911
            </div>
            <motion.button onClick={() => setDark(d => !d)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              aria-label="Toggle theme"
              className={`w-8 h-8 flex items-center justify-center rounded-full border transition-colors ${dark ? "border-white/15 text-white/80 hover:bg-white/10" : "border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </motion.button>
            <motion.button onClick={onLogin} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-colors ${dark ? "bg-white text-[#0a0c12] hover:bg-white/90" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
              <LogIn size={13} />Login
            </motion.button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={BARANGAY_HQ_IMG} alt="Barangay Culiat Government Hall" className="w-full h-full object-cover" />
        </div>
        {dark ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0c12]/55 via-[#151020]/40 to-[#1a0d14]/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c12]/85 via-transparent to-[#0a0c12]/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c12]/75 via-[#0a0c12]/20 to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-white/75 via-white/55 to-white/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/40 to-white/25" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/35 to-transparent" />
          </>
        )}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `linear-gradient(${dark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.4)"} 1px, transparent 1px), linear-gradient(90deg, ${dark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.4)"} 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-20 md:pb-32">
          <motion.div initial="hidden" animate="show" custom={0} variants={fadeIn}
            className="inline-flex items-center gap-2 border border-emerald-500/30 text-emerald-500 text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Barangay Culiat Smart Government Platform · Est. 2026
          </motion.div>

          <div className="grid lg:grid-cols-[1fr_320px] gap-10">
            <div>
              <motion.h1 initial="hidden" animate="show" custom={1} variants={fadeUp}
                className={`font-serif font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight max-w-3xl ${dark ? "text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.4)]" : "text-slate-900"}`}>
                Barangay Culiat <span className="text-emerald-500">Integrated</span> Public Safety & Security
              </motion.h1>
              <motion.p initial="hidden" animate="show" custom={2} variants={fadeUp}
                className={`mt-6 text-lg max-w-2xl leading-relaxed ${dark ? "text-white/60" : "text-slate-600"}`}>
                A unified platform connecting 15,000+ residents, first responders, and barangay agencies — delivering real-time safety, intelligence-led policing, and community resilience in Barangay Culiat.
              </motion.p>

              <motion.div initial="hidden" animate="show" custom={3} variants={fadeUp} className={`mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono uppercase tracking-wider ${dark ? "text-white/50" : "text-slate-500"}`}>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />All Systems Operational</span>
                <span className={`w-px h-3 hidden sm:block ${dark ? "bg-white/15" : "bg-slate-300"}`} />
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />6 Modules Active</span>
                <span className={`w-px h-3 hidden sm:block ${dark ? "bg-white/15" : "bg-slate-300"}`} />
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />911 Lines Open</span>
              </motion.div>

              <motion.div initial="hidden" animate="show" custom={4} variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-3">
                <motion.button onClick={() => scrollTo("systems")} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 bg-emerald-500 text-[#06150f] font-semibold px-6 py-3 rounded-full hover:bg-emerald-400 transition-colors">
                  <Layers size={15} />Explore Systems
                </motion.button>
                <motion.button onClick={() => scrollTo("preparedness")} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-2 border font-semibold px-6 py-3 rounded-full transition-colors ${dark ? "border-white/20 text-white hover:bg-white/5" : "border-slate-300 text-slate-900 hover:bg-slate-100"}`}>
                  Preparedness Guides<ChevronRight size={15} />
                </motion.button>
              </motion.div>
            </div>

            <div className="hidden lg:block relative">
              <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: [0, -8, 0] }} transition={{ opacity: { duration: 0.5, delay: 0.5 }, y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
                className={`backdrop-blur-md border rounded-xl p-4 mb-6 ${dark ? "bg-white/[0.06] border-white/10" : "bg-white/80 border-slate-200 shadow-sm"}`}>
                <div className={`text-[10px] font-mono uppercase tracking-widest mb-2 ${dark ? "text-white/40" : "text-slate-500"}`}>Active Incidents</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-3xl font-bold">28</span></div>
                <div className={`text-[11px] mt-1 ${dark ? "text-white/40" : "text-slate-500"}`}>Live · Updated now</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: [0, 8, 0] }} transition={{ opacity: { duration: 0.5, delay: 0.65 }, y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 } }}
                className={`backdrop-blur-md border rounded-xl p-4 ${dark ? "bg-white/[0.06] border-white/10" : "bg-white/80 border-slate-200 shadow-sm"}`}>
                <div className={`text-[10px] font-mono uppercase tracking-widest mb-2 ${dark ? "text-white/40" : "text-slate-500"}`}>Response Time</div>
                <div className="text-3xl font-bold">4 min</div>
                <div className={`text-[11px] mt-1 ${dark ? "text-white/40" : "text-slate-500"}`}>Barangay-wide avg.</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* SYSTEMS */}
      <section id="systems" className={`relative py-24 border-t transition-colors duration-300 ${dark ? "border-white/10 bg-[#0d0f16]" : "border-slate-200 bg-white"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="max-w-2xl mb-12">
            <div className="text-[11px] font-mono text-emerald-500 uppercase tracking-widest mb-2">Platform Modules</div>
            <h2 className={`font-serif font-bold text-3xl sm:text-4xl ${dark ? "text-white" : "text-slate-900"}`}>Everything the barangay needs, in one system</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {systemsList.map((s, i) => { const Icon = s.icon; return (
              <motion.div key={s.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.05 }}
                className={`group relative rounded-xl overflow-hidden border transition-all duration-200 hover:-translate-y-0.5 ${dark ? "bg-white/[0.03] border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.05]" : "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"}`}>
                <div className="h-1" style={{ backgroundColor: s.color }} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: s.color }}>{s.code}</span>
                    <span className={`flex items-center gap-1.5 text-[10px] font-semibold ${dark ? "text-emerald-400" : "text-emerald-600"}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Online
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${s.color}1A` }}>
                    <Icon size={18} style={{ color: s.color }} />
                  </div>
                  <div className={`font-semibold mb-1.5 ${dark ? "text-white" : "text-slate-900"}`}>{s.title}</div>
                  <div className={`text-sm leading-relaxed mb-5 ${dark ? "text-white/50" : "text-slate-500"}`}>{s.desc}</div>
                  <div className={`flex items-center justify-between pt-4 border-t ${dark ? "border-white/10" : "border-slate-100"}`}>
                    <span className={`text-[11px] ${dark ? "text-white/40" : "text-slate-400"}`}>Updated: {s.updated}</span>
                    <motion.button onClick={onLogin} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full transition-colors ${dark ? "bg-white text-[#0a0c12] hover:bg-white/90" : "bg-[#1f2937] text-white hover:bg-[#111827]"}`}>
                      Access System<ArrowRight size={12} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ); })}
          </div>
        </div>
      </section>

      {/* PREPAREDNESS */}
      <section id="preparedness" className={`relative py-24 border-t transition-colors duration-300 ${dark ? "border-white/10" : "border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="max-w-2xl mb-12">
            <div className="flex items-center gap-2 text-[11px] font-mono text-blue-500 uppercase tracking-widest mb-3">
              <span className="w-4 h-px bg-blue-500" />Emergency Preparedness
            </div>
            <h2 className={`font-serif font-bold text-3xl sm:text-4xl leading-tight ${dark ? "text-white" : "text-slate-900"}`}>Be Ready Before Emergencies Happen</h2>
            <p className={`mt-3 text-sm leading-relaxed ${dark ? "text-white/50" : "text-slate-500"}`}>Practical guides developed with Barangay Culiat's emergency management experts to help residents prepare for the most common hazards.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-5">
            {hazards.map((h, i) => (
              <motion.div key={h.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }}
                className={`rounded-xl p-6 border transition-colors duration-300 ${dark ? "bg-white/[0.03] border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                <span className="inline-flex items-center text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-4" style={{ backgroundColor: `${h.color}1A`, color: h.color }}>{h.tag}</span>
                <div className={`font-serif font-bold text-lg mb-2 ${dark ? "text-white" : "text-slate-900"}`}>{h.title}</div>
                <div className={`text-sm leading-relaxed mb-4 ${dark ? "text-white/50" : "text-slate-500"}`}>{h.desc}</div>
                <ul className="space-y-2">
                  {h.points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: h.color }} />
                      <span className={`text-sm leading-relaxed ${dark ? "text-white/70" : "text-slate-600"}`}>{pt}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWS */}
      <section id="news" className={`relative py-24 border-t transition-colors duration-300 ${dark ? "border-white/10 bg-[#0d0f16]" : "border-slate-200 bg-white"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="max-w-2xl mb-12">
            <div className="text-[11px] font-mono text-emerald-500 uppercase tracking-widest mb-2">Latest Updates</div>
            <h2 className={`font-serif font-bold text-3xl sm:text-4xl ${dark ? "text-white" : "text-slate-900"}`}>News & Announcements</h2>
          </motion.div>
          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-stretch">
            {/* Featured advisory card */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
              className={`rounded-2xl overflow-hidden border flex flex-col ${dark ? "bg-white/[0.03] border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="relative h-56 sm:h-64 flex items-end p-6 overflow-hidden" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)" }}>
                <span className="absolute inset-0 flex items-center justify-center font-serif font-black uppercase tracking-widest select-none pointer-events-none text-white/[0.07] text-6xl sm:text-8xl">
                  Advisory
                </span>
                <span className="relative inline-flex items-center bg-emerald-500 text-white text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 rounded">
                  {featuredNews.badge}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className={`text-xs mb-2 ${dark ? "text-white/40" : "text-slate-400"}`}>{featuredNews.date} · {featuredNews.author}</div>
                <h3 className={`font-serif font-bold text-xl sm:text-2xl leading-snug mb-3 ${dark ? "text-white" : "text-slate-900"}`}>{featuredNews.title}</h3>
                <p className={`text-sm leading-relaxed ${dark ? "text-white/50" : "text-slate-500"}`}>{featuredNews.description}</p>
              </div>
            </motion.div>

            {/* Side list */}
            <div className="flex flex-col gap-3">
              {news.map((n, i) => (
                <motion.div key={n.title} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.06 }}
                  className={`flex-1 rounded-xl px-5 py-4 border transition-colors ${dark ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.05]" : "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"}`}>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5" style={{ color: n.color }}>{n.tag}</div>
                  <div className={`font-serif font-bold text-sm leading-snug mb-1.5 ${dark ? "text-white" : "text-slate-900"}`}>{n.title}</div>
                  <div className={`text-xs ${dark ? "text-white/40" : "text-slate-400"}`}>{n.date}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
<footer className={`border-t pt-16 pb-8 transition-colors duration-300 ${dark ? "border-white/10" : "border-slate-200"}`}>
  <div className="max-w-[88rem] mx-auto px-6">
    {/* Updated to a 12-column grid layout */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
      
      {/* 1. Brand column (3 cols) */}
      <div className="lg:col-span-3">
        <div className={`inline-flex items-center gap-3 rounded-xl border px-4 py-3 mb-6 ${dark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50"}`}>
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-white">
            <img src={BARANGAY_LOGO_IMG} alt="Barangay Culiat Seal" className="w-full h-full object-cover" />
          </div>
          <div className="leading-tight">
            <div className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Barangay Culiat Government</div>
            <div className={`text-xs ${dark ? "text-white/40" : "text-slate-500"}`}>Barangay Local Government Unit</div>
          </div>
        </div>
        <p className={`text-sm leading-relaxed ${dark ? "text-white/40" : "text-slate-500"}`}>
          The Barangay Culiat Integrated Public Safety & Security System is an official platform dedicated to delivering transparent, efficient, and technology-driven public safety services.
        </p>
        <div className="flex items-center gap-2 mt-5">
          {[Facebook, Twitter, Youtube, Instagram].map((Icon, i) => (
            <button key={i} className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${dark ? "border-white/10 bg-white/[0.03] text-white/50 hover:text-white hover:border-white/20" : "border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 hover:border-slate-300"}`}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* 2. Emergency Hotlines (2 cols) */}
      <div className="lg:col-span-2">
        <div className={`text-[11px] font-mono font-bold uppercase tracking-widest mb-5 ${dark ? "text-white/70" : "text-slate-700"}`}>Emergency Hotlines</div>
        <div className="space-y-4">
          {[
            { label: "National Emergency", value: "911" },
            { label: "Barangay Helpline", value: "122" },
            { label: "Fire Department", value: "8426-0246" },
            { label: "Police District", value: "117" },
          ].map(h => (
            <div key={h.label}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 mb-0.5">{h.label}</div>
              <div className={`text-lg font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{h.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Quick Links (2 cols) */}
      <div className="lg:col-span-2">
        <div className={`text-[11px] font-mono font-bold uppercase tracking-widest mb-5 ${dark ? "text-white/70" : "text-slate-700"}`}>Quick Links</div>
        <div className="flex flex-col gap-3">
          {navLinks.map(l => (
            <button key={l.id} onClick={() => scrollTo(l.id)} className={`text-left text-sm transition-colors ${dark ? "text-white/50 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>{l.label}</button>
          ))}
        </div>
      </div>

      {/* 4. Transparency (2 cols) */}
      <div className="lg:col-span-2">
        <div className={`text-[11px] font-mono font-bold uppercase tracking-widest mb-5 ${dark ? "text-white/70" : "text-slate-700"}`}>Transparency</div>
        <div className="flex flex-col gap-3">
          {["Freedom of Information", "Annual Reports", "Budget Disclosure", "PhilSys Integration", "Privacy Policy", "Terms of Use"].map(t => (
            <button key={t} className={`text-left text-sm transition-colors ${dark ? "text-white/50 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* 5. Location Map Column (3 cols) */}
      <div className="lg:col-span-3">
        <div className={`text-[11px] font-mono font-bold uppercase tracking-widest mb-5 ${dark ? "text-white/70" : "text-slate-700"}`}>
          Our Location
        </div>
        <LocationMap />
      </div>

    </div>

    {/* Bottom bar */}
    <div className={`mt-14 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${dark ? "border-white/10" : "border-slate-200"}`}>
      <span className={`text-xs ${dark ? "text-white/40" : "text-slate-500"}`}>© 2026 Barangay Culiat Government · All rights reserved · Official Barangay Website</span>
      <div className="flex items-center gap-5">
        {["Privacy Policy", "Accessibility", "Sitemap"].map(l => (
          <button key={l} className={`text-xs transition-colors ${dark ? "text-white/40 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>{l}</button>
        ))}
      </div>
    </div>
  </div>
</footer>
    </div>
  );
}

function LoginScreen({ onLogin, onBack }: { onLogin: (u: AuthUser) => void; onBack?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleLogin = () => {
    const account = DEMO_ACCOUNTS.find(a => a.email === email.trim().toLowerCase());
    if (!account) { setError("No account found for this email."); return; }
    if (password !== "password123") { setError("Incorrect password."); return; }
    setError("");
    onLogin(account);
  };

  return (
    <div className="min-h-screen bg-[#0a0c12] flex items-center justify-center p-6 relative overflow-hidden" style={{ fontFamily: "'DM Sans', 'Barlow', sans-serif" }}>
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="w-full max-w-sm relative">
        {/* Logo */}
        {onBack && (
          <motion.button onClick={onBack} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            whileHover={{ x: -2 }} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-6">
            <ChevronRight size={14} className="rotate-180" />Back to home
          </motion.button>
        )}
        <motion.div className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
          <motion.div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/15 bg-white flex-shrink-0"
            initial={{ scale: 0.5, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 200 }}>
            <img src={BARANGAY_LOGO_IMG} alt="Barangay Culiat Seal" className="w-full h-full object-cover" />
          </motion.div>
          <div>
            <div className="text-sm font-bold font-['Barlow_Condensed'] tracking-widest text-white uppercase">DPTSS</div>
            <div className="text-[12px] font-mono text-white/40 tracking-wider">Disaster Preparedness Training & Simulation</div>
          </div>
        </motion.div>

        <motion.div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-5"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}>
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-wide text-white">Sign in to your account</h1>
            <p className="text-base text-white/50 mt-0.5">Authorized personnel only. All sessions are logged.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-mono text-white/40 uppercase tracking-widest block mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="you@ems.gov"
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-base text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="text-sm font-mono text-white/40 uppercase tracking-widest block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••••••"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-base text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-400 pr-10"
                />
                <button onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                  <Eye size={15} />
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-base text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertTriangle size={13} />{error}
              </div>
            )}
            <motion.button onClick={handleLogin}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-[#06150f] py-3 rounded-full text-lg font-semibold hover:bg-emerald-400 transition-colors">
              <LogIn size={16} />Sign In
            </motion.button>
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="text-[12px] font-mono text-white/40 uppercase tracking-widest mb-2">Demo Accounts (password: password123)</div>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map((a, i) => (
                <motion.button key={a.email} onClick={() => { setEmail(a.email); setPassword("password123"); setError(""); }}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.07, duration: 0.28 }}
                  whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-left group">
                  <AvatarCircle initials={a.avatar} color={a.role === "superadmin" ? "bg-red-500/20" : a.role === "admin" ? "bg-purple-500/20" : "bg-blue-500/20"} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white">{a.name}</div>
                    <div className="text-[12px] font-mono text-white/40">{a.email}</div>
                  </div>
                  <Badge status={a.role}>{a.role === "superadmin" ? "Super Admin" : a.role === "admin" ? "Admin" : "User"}</Badge>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.p className="text-center text-[12px] font-mono text-white/30 mt-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          Emergency Management Systems · v2.4.1 · RESTRICTED
        </motion.p>
      </div>
    </div>
  );
}

const userSessions = [
  { id: "SES-001", name: "Basic Earthquake Response", date: "Jul 03, 2026", time: "08:00–12:00", location: "District 4 EOC", type: "In-person", status: "Scheduled", level: "Basic", assessor: "Eval. Torres" },
  { id: "SES-004", name: "Mass Casualty Management", date: "Jul 15, 2026", time: "08:00–16:00", location: "General Hospital Annex", type: "In-person", status: "Scheduled", level: "Intermediate", assessor: "Eval. Lim" },
];

const upcomingBrowse = [
  { id: "SES-002", name: "Advanced Flood Evacuation", date: "Jul 08", slots: 11, type: "Virtual", level: "Advanced", desc: "Flood zone mapping, evacuation route planning, and victim rescue in swift water conditions." },
  { id: "SES-003", name: "Hazmat Level 2", date: "Jul 10", slots: 13, type: "In-person", level: "Advanced", desc: "HAZMAT identification, decontamination procedures, and chemical agent response." },
  { id: "SES-005", name: "SAR Night Operations", date: "Jul 15", slots: 4, type: "In-person", level: "Intermediate", desc: "Nighttime search and rescue techniques, lighting protocols, and victim extraction." },
  { id: "SES-006", name: "Typhoon Preparedness 101", date: "Jul 22", slots: 28, type: "Virtual", level: "Basic", desc: "Typhoon watch protocols, shelter-in-place guidance, and community evacuation." },
];

const userScores = [
  { drill: "D1", score: 71 }, { drill: "D2", score: 78 }, { drill: "D3", score: 75 },
  { drill: "D4", score: 82 }, { drill: "D5", score: 88 }, { drill: "D6", score: 94 },
];

const userObjectives = [
  { text: "Incident Commander assumes command on radio net", done: true, time: "1:42", limit: "2 min" },
  { text: "Gas valve shut off at utility panel", done: true, time: "1:58", limit: "2 min" },
  { text: "Evacuation route cleared and opened", done: false, time: "6:12", limit: "5 min" },
  { text: "Triage zone established with START protocol", done: true, time: "4:31", limit: "5 min" },
  { text: "SITREP transmitted to EOC", done: true, time: "9:05", limit: "10 min" },
];

function UserPortal({ auth, onLogout }: { auth: AuthUser; onLogout: () => void }) {
  const app = useApp();
  const [mod, setMod] = useState<UserModule>("myDashboard");
  const [signedUp, setSignedUp] = useState<string[]>(["SES-001", "SES-004"]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState<WithdrawTarget | null>(null);
  const [certRecord, setCertRecord] = useState<AttendanceRecord | null>(null);
  const [evalTarget, setEvalTarget] = useState<AttendanceRecord | null>(null);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [sentAlerts, setSentAlerts] = useState<{ id: string; channel: "SMS" | "Push"; subject: string; body: string; date: string }[]>([]);
  const myAttendance = app.getAttendanceFor(auth.name);
  const myCompleted = myAttendance.filter(r => r.status === "Completed");

  const myUpcoming = userSessions.filter(s => signedUp.includes(s.id));
  const eventReminders = myUpcoming.map(s => ({
    id: `evt-${s.id}`,
    channel: "SMS" as const,
    subject: `Reminder: ${s.name} starts ${s.date}`,
    body: `${s.name} begins ${s.date}, ${s.time} at ${s.location}. Please arrive 15 minutes early with a valid ID and required PPE.`,
  }));
  const requirementReminders = myUpcoming.map(s => ({
    id: `req-${s.id}`,
    channel: "SMS" as const,
    subject: `Requirements for ${s.name}`,
    body: `Before ${s.date}: complete your pre-drill checklist, confirm your certification is up to date, and bring closed-toe shoes / field gear if applicable.`,
  }));
  const certReminders = myCompleted.filter(r => r.certificate).map(r => ({
    id: `cert-${r.id}`,
    channel: "Push" as const,
    subject: `Certificate ready: ${r.program}`,
    body: `Your certificate (${r.certificate}) for ${r.program} is ready to view or download from My Performance.`,
  }));
  const upcomingAlerts = [...eventReminders, ...requirementReminders, ...certReminders];

  const handleSendTestAlert = (channel: "SMS" | "Push") => {
    const alert = { id: `test-${Date.now()}`, channel, subject: `Test ${channel} alert`, date: new Date().toISOString(), body: `This is a test ${channel} notification sent to ${auth.phone ?? "your registered device"}.` };
    setSentAlerts(prev => [alert, ...prev]);
    app.addNotification({ type: "Alert", subject: `${channel} sent to ${auth.name}: ${alert.subject}`, body: alert.body, status: "Sent", audience: ["user"] });
  };

  const handleSubmitEvaluation = (rating: number, comments: string) => {
    if (!evalTarget) return;
    app.submitAssessorEvaluation({
      attendanceId: evalTarget.id,
      assessorName: evalTarget.assessor ?? "Unassigned",
      participantName: auth.name,
      program: evalTarget.program,
      rating,
      comments: comments || undefined,
    });
    setEvalTarget(null);
  };

  const handleSignUp = (drillId: string, drillName: string) => {
    setSignedUp(prev => prev.includes(drillId) ? prev : [...prev, drillId]);
    app.addNotification({
      type: "Registration",
      subject: `${auth.name} signed up for ${drillName}`,
      body: `${auth.name} (${auth.dept}) self-registered for session ${drillId} — ${drillName}. Review the roster in Participants.`,
      status: "Sent",
      audience: ["admin", "superadmin"],
    });
  };

  const handleWithdraw = (drillId: string, drillName: string) => {
    setSignedUp(prev => prev.filter(x => x !== drillId));
    app.addNotification({
      type: "Withdrawal",
      subject: `${auth.name} withdrew from ${drillName}`,
      body: `${auth.name} (${auth.dept}) withdrew from session ${drillId} — ${drillName}. The roster and headcount have been updated.`,
      status: "Sent",
      audience: ["admin", "superadmin"],
    });
  };

  const USER_NAV = [
    { id: "myDashboard" as UserModule, label: "My Dashboard", icon: Activity },
    { id: "mySessions" as UserModule, label: "My Sessions", icon: Calendar },
    { id: "myPerformance" as UserModule, label: "My Performance", icon: BarChart3 },
    { id: "browsedrills" as UserModule, label: "Browse Drills", icon: Search },
    { id: "myAlerts" as UserModule, label: "Notifications & SMS", icon: Smartphone },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'DM Sans', 'Barlow', sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col" style={{ minHeight: "100vh" }}>
        <div className="px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 bg-white flex-shrink-0">
              <img src={BARANGAY_LOGO_IMG} alt="Barangay Culiat Seal" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[13px] font-bold font-['Barlow_Condensed'] tracking-widest text-foreground uppercase leading-none">DPTSS</div>
              <div className="text-[11px] font-mono text-muted-foreground mt-0.5 leading-none">Participant Portal</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest px-2 mb-2">Navigation</div>
          {USER_NAV.map((item, i) => {
            const Icon = item.icon;
            const active = mod === item.id;
            return (
              <motion.button key={item.id} onClick={() => setMod(item.id)}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.25 }}
                whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors text-xs font-medium ${active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"}`}>
                <Icon size={15} className={active ? "text-primary" : "text-current"} />
                <span>{item.label}</span>
                {active && <motion.span layoutId="user-nav-indicator" className="ml-auto"><ChevronRight size={12} className="text-primary" /></motion.span>}
              </motion.button>
            );
          })}
        </nav>
        <div className="px-3 pb-3">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="text-[11px] font-mono text-blue-400 uppercase tracking-widest mb-1">Access Level</div>
            <div className="text-xs font-semibold text-foreground">Participant</div>
            <div className="text-[12px] text-muted-foreground">{auth.dept}</div>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-sidebar-border flex items-center gap-2.5">
          <AvatarCircle initials={auth.avatar} color="bg-blue-500/20" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{auth.name}</div>
            <div className="text-[12px] font-mono text-muted-foreground">Participant</div>
          </div>
          <motion.button onClick={() => setShowLogoutModal(true)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} className="text-muted-foreground hover:text-red-400 transition-colors"><LogOut size={15} /></motion.button>
        </div>
      </aside>

      {showLogoutModal && (
        <LogoutConfirmModal auth={auth} onConfirm={onLogout} onCancel={() => setShowLogoutModal(false)} />
      )}
      {withdrawTarget && (
        <WithdrawConfirmModal
          target={withdrawTarget}
          onCancel={() => setWithdrawTarget(null)}
          onConfirm={() => { handleWithdraw(withdrawTarget.id, withdrawTarget.name); setWithdrawTarget(null); }}
        />
      )}
      {evalTarget && (
        <EvaluateAssessorModal
          record={evalTarget}
          onClose={() => setEvalTarget(null)}
          onSubmit={handleSubmitEvaluation}
        />
      )}
      {certRecord && (
        <CertificateModal auth={auth} record={certRecord} onClose={() => setCertRecord(null)} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/60 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>DPTSS</span><ChevronRight size={12} /><span className="text-foreground">{USER_NAV.find(n => n.id === mod)?.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />ONLINE</div>
            <DarkModeToggle />
            <NotificationBell role={auth.role} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <AnimatePresence mode="wait">
          <motion.div key={mod} variants={pageTransition} initial="hidden" animate="show" exit="exit">
          {mod === "myDashboard" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">WELCOME BACK, {auth.name.split(" ")[0].toUpperCase()}</h1>
                <p className="text-muted-foreground text-sm mt-0.5">{auth.dept} · Participant Portal · June 30, 2026</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Sessions Enrolled", value: signedUp.length, icon: Calendar, color: "text-primary" },
                  { label: "Drills Completed", value: String(myCompleted.length), icon: CheckCircle, color: "text-green-400" },
                  { label: "Latest Score", value: "94%", icon: Star, color: "text-primary" },
                  { label: "Certifications", value: "3", icon: Award, color: "text-blue-400" },
                ].map(s => (
                  <div key={s.label} className="bg-card border border-border rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">{s.label}</span>
                      <s.icon size={16} className={s.color} />
                    </div>
                    <div className="text-3xl font-bold font-['Barlow_Condensed'] text-foreground">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-3">My Score Trend</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={userScores} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="user-dash-score-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f0a500" stopOpacity={0.2} /><stop offset="95%" stopColor="#f0a500" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,246,252,0.06)" />
                      <XAxis dataKey="drill" tick={{ fill: "#8b949e", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[60, 100]} tick={{ fill: "#8b949e", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#1c2128", border: "1px solid rgba(240,246,252,0.1)", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono" }} />
                      <Area key="area-user-dash-score" type="monotone" dataKey="score" name="Score" stroke="#f0a500" fill="url(#user-dash-score-grad)" strokeWidth={2} dot={{ fill: "#f0a500", r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Upcoming Sessions</h3>
                  <div className="space-y-2">
                    {userSessions.map(s => (
                      <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-md bg-secondary/60">
                        <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center text-[12px] font-mono text-primary font-bold">{s.date.split(", ")[0].split(" ")[1]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">{s.name}</div>
                          <div className="text-[12px] font-mono text-muted-foreground">{s.date} · {s.type}</div>
                        </div>
                        <Badge status="Scheduled">Scheduled</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Last Drill Objectives — Earthquake Response</h3>
                <div className="space-y-2">
                  {userObjectives.map((o, i) => (
                    <div key={i} className={`flex items-center gap-3 p-2.5 rounded-md ${o.done ? "bg-green-500/5 border border-green-500/10" : "bg-red-500/5 border border-red-500/10"}`}>
                      {o.done ? <CheckCircle size={15} className="text-green-400 flex-shrink-0" /> : <XCircle size={15} className="text-red-400 flex-shrink-0" />}
                      <span className="flex-1 text-xs text-foreground">{o.text}</span>
                      <span className={`text-xs font-mono font-bold ${o.done ? "text-green-400" : "text-red-400"}`}>{o.time}</span>
                      <span className="text-[12px] font-mono text-muted-foreground">/ {o.limit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mod === "mySessions" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">MY SESSIONS</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Your enrolled training sessions and completion history</p>
              </div>
              <div className="space-y-3">
                {userSessions.map(s => (
                  <div key={s.id} className="bg-card border border-border rounded-lg p-4 hover:border-[rgba(240,165,0,0.25)] transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex flex-col items-center justify-center flex-shrink-0">
                        <div className="text-xs font-mono text-muted-foreground">{s.date.split(" ")[0]}</div>
                        <div className="text-lg font-bold font-['Barlow_Condensed'] text-primary leading-none">{s.date.split(" ")[1].replace(",", "")}</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                          <Badge status={s.status}>{s.status}</Badge>
                          <Badge status={s.level}>{s.level}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock size={12} />{s.time}</span>
                          <span className="flex items-center gap-1"><MapPin size={12} />{s.location}</span>
                          <span className="flex items-center gap-1"><Globe size={12} />{s.type}</span>
                        </div>
                        {s.assessor && (
                          <div className="flex items-center gap-1.5 mt-2 text-[12px] font-mono text-muted-foreground">
                            <UserCheck size={12} className="text-primary" />
                            <span>Evaluation Assessor: <span className="text-foreground">{s.assessor}</span></span>
                          </div>
                        )}
                      </div>
                      <button onClick={() => setWithdrawTarget({ id: s.id, name: s.name, date: s.date, time: s.time, location: s.location })}
                        className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/20 transition-colors flex items-center gap-1.5">
                        <X size={13} />Withdraw
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList size={14} className="text-muted-foreground" />
                  <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">My Training Attendance Record</h3>
                </div>
                {myAttendance.length === 0 ? (
                  <div className="bg-card border border-border rounded-lg p-4 text-xs text-muted-foreground">No attendance records yet. Completed and in-progress drills will appear here.</div>
                ) : (
                  <div className="space-y-2">
                    {myAttendance.map(r => (
                      <div key={r.id} className="bg-card border border-border rounded-lg p-4 opacity-90">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-secondary flex flex-col items-center justify-center flex-shrink-0">
                            <div className="text-xs font-mono text-muted-foreground">{new Date(r.date).toLocaleDateString(undefined, { month: "short" })}</div>
                            <div className="text-lg font-bold font-['Barlow_Condensed'] text-muted-foreground leading-none">{new Date(r.date).getDate()}</div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-foreground">{r.program}</h3>
                              <Badge status={r.status}>{r.status}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-muted-foreground">
                              <span>{new Date(r.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                              {typeof r.score === "number" && <span className="flex items-center gap-1"><Star size={12} />Score: {r.score}%</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {r.status === "Completed" && (
                              <button onClick={() => setCertRecord(r)} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md bg-secondary transition-colors flex items-center gap-1.5"><Award size={13} />Certificate</button>
                            )}
                            {r.status === "Completed" && r.assessor && (
                              r.evaluated ? (
                                <span className="text-xs text-green-400 px-3 py-1.5 rounded-md bg-green-500/10 border border-green-500/20 flex items-center gap-1.5"><CheckCircle size={13} />Evaluated</span>
                              ) : (
                                <button onClick={() => setEvalTarget(r)} className="text-xs text-primary hover:text-primary/80 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 transition-colors flex items-center gap-1.5"><Star size={13} />Evaluate Assessor</button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {mod === "myPerformance" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">MY PERFORMANCE</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Personal evaluation history and competency progress</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Latest Score", value: "94%", color: "text-green-400" },
                  { label: "Avg Score", value: "81%", color: "text-primary" },
                  { label: "Drills Completed", value: "6", color: "text-foreground" },
                  { label: "Pass Rate", value: "100%", color: "text-green-400" },
                ].map(s => (
                  <div key={s.label} className="bg-card border border-border rounded-lg p-4">
                    <div className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{s.label}</div>
                    <div className={`text-2xl font-bold font-['Barlow_Condensed'] ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-4">Score History</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={userScores} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="user-perf-score-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f0a500" stopOpacity={0.2} /><stop offset="95%" stopColor="#f0a500" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,246,252,0.06)" />
                      <XAxis dataKey="drill" tick={{ fill: "#8b949e", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[60, 100]} tick={{ fill: "#8b949e", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#1c2128", border: "1px solid rgba(240,246,252,0.1)", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono" }} />
                      <Area key="area-user-perf-score" type="monotone" dataKey="score" name="Score" stroke="#f0a500" fill="url(#user-perf-score-grad)" strokeWidth={2} dot={{ fill: "#f0a500", r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Competency Areas</h3>
                  <div className="space-y-2.5">
                    {[
                      { area: "Command & Control", score: 88 },
                      { area: "Protocol Adherence", score: 94 },
                      { area: "Response Speed", score: 76 },
                      { area: "Communication", score: 91 },
                      { area: "Team Coordination", score: 85 },
                    ].map(c => (
                      <div key={c.area}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{c.area}</span>
                          <span className={`font-mono font-bold ${c.score >= 80 ? "text-green-400" : c.score >= 65 ? "text-primary" : "text-red-400"}`}>{c.score}</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${c.score >= 80 ? "bg-green-400" : c.score >= 65 ? "bg-primary" : "bg-red-400"}`} style={{ width: `${c.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Drill History</h3>
                <div className="space-y-2">
                  {[
                    { drill: "Earthquake Response — Advanced", date: "Jun 28", score: 94, result: "Passed", assessor: "Eval. Torres" },
                    { drill: "Flood Evacuation Protocol", date: "Jun 22", score: 88, result: "Passed", assessor: "Eval. Lim" },
                    { drill: "Hazmat Level 1", date: "Jun 08", score: 82, result: "Passed", assessor: "Eval. Torres" },
                    { drill: "SAR Night Ops", date: "May 30", score: 78, result: "Passed", assessor: "Eval. Cruz" },
                    { drill: "Mass Casualty", date: "May 15", score: 75, result: "Passed", assessor: "Eval. Lim" },
                    { drill: "Basic First Response", date: "Apr 20", score: 71, result: "Passed", assessor: "Eval. Torres" },
                  ].map((h, i) => (
                    <div key={i} className="flex items-center gap-4 p-2.5 rounded-md bg-secondary/50 hover:bg-secondary transition-colors">
                      <span className="text-[12px] font-mono text-muted-foreground w-12">{h.date}</span>
                      <span className="flex-1 text-xs text-foreground">{h.drill}</span>
                      <span className="text-[12px] font-mono text-muted-foreground">by {h.assessor}</span>
                      <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-green-400" style={{ width: `${h.score}%` }} />
                      </div>
                      <span className="text-xs font-mono font-bold text-green-400 w-8 text-right">{h.score}</span>
                      <Badge status={h.result}>{h.result}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mod === "browsedrills" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">BROWSE DRILLS</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Upcoming training sessions open for self-registration</p>
              </div>
              <div className="relative max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input placeholder="Search drills..." className="w-full bg-input-background border border-border rounded-md pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {upcomingBrowse.map(d => {
                  const joined = signedUp.includes(d.id);
                  return (
                    <div key={d.id} className={`bg-card border rounded-lg p-4 transition-all ${joined ? "border-primary/40" : "border-border hover:border-border/70"}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{d.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge status={d.level}>{d.level}</Badge>
                            <span className="text-[12px] font-mono text-muted-foreground">{d.type}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold font-['Barlow_Condensed'] text-primary">{d.date}</div>
                          <div className={`text-[12px] font-mono ${d.slots < 5 ? "text-red-400" : "text-muted-foreground"}`}>{d.slots} slots left</div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{d.desc}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary/40 rounded-full" style={{ width: `${100 - (d.slots / 30) * 100}%` }} />
                        </div>
                        <button onClick={() => joined ? setWithdrawTarget({ id: d.id, name: d.name, date: d.date }) : handleSignUp(d.id, d.name)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap ${joined ? "bg-secondary text-muted-foreground hover:text-red-400" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
                          {joined ? <><X size={13} />Withdraw</> : <><Plus size={13} />Sign Up</>}
                        </button>
                      </div>
                      {joined && <div className="mt-2 flex items-center gap-1.5 text-[12px] font-mono text-green-400"><CheckCircle size={12} />Registered — confirmation sent</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {mod === "myAlerts" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">NOTIFICATIONS &amp; SMS ALERTS</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Stay aware before your events start — reminders, requirements, and certificates sent straight to your device.</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-4">Device Notification Settings</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0"><Phone size={15} className="text-primary" /></div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">SMS Alerts</div>
                        <div className="text-[12px] text-muted-foreground">{auth.phone ?? "No number on file"}</div>
                      </div>
                    </div>
                    <button onClick={() => setSmsEnabled(p => !p)} className={smsEnabled ? "text-primary" : "text-muted-foreground"}>
                      {smsEnabled ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0"><Smartphone size={15} className="text-blue-400" /></div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">Push Notifications</div>
                        <div className="text-[12px] text-muted-foreground">This device</div>
                      </div>
                    </div>
                    <button onClick={() => setPushEnabled(p => !p)} className={pushEnabled ? "text-primary" : "text-muted-foreground"}>
                      {pushEnabled ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <button disabled={!smsEnabled} onClick={() => handleSendTestAlert("SMS")} className="flex items-center gap-1.5 bg-secondary text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-md text-xs font-semibold hover:text-foreground"><Send size={12} />Send test SMS</button>
                  <button disabled={!pushEnabled} onClick={() => handleSendTestAlert("Push")} className="flex items-center gap-1.5 bg-secondary text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-md text-xs font-semibold hover:text-foreground"><Send size={12} />Send test push</button>
                </div>
              </div>

              <div className="bg-card border border-primary/15 rounded-lg p-4 flex items-center gap-3">
                <Info size={16} className="text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground">You're automatically notified before an event starts, when a certificate is ready, and about anything you need to bring or complete beforehand.</p>
              </div>

              {sentAlerts.length > 0 && (
                <div>
                  <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Just Sent</h3>
                  <div className="space-y-2">
                    {sentAlerts.map(a => (
                      <div key={a.id} className="flex items-start gap-3 bg-card border border-border rounded-lg p-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0"><CheckCircle size={14} className="text-green-400" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{a.subject}</span>
                            <Badge status="Sent">{a.channel}</Badge>
                          </div>
                          <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">{a.body}</p>
                          <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 mt-1"><Clock size={10} />{timeAgo(a.date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Upcoming Reminders</h3>
                {upcomingAlerts.length === 0 ? (
                  <div className="bg-card border border-border rounded-lg p-6 text-center text-xs text-muted-foreground">No reminders yet — sign up for a drill to get event, requirement, and certificate alerts.</div>
                ) : (
                  <div className="space-y-2">
                    {upcomingAlerts.map(a => {
                      const Icon = a.channel === "SMS" ? Phone : Smartphone;
                      return (
                        <div key={a.id} className="flex items-start gap-3 bg-card border border-border rounded-lg p-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${a.channel === "SMS" ? "bg-primary/15" : "bg-blue-500/15"}`}>
                            <Icon size={14} className={a.channel === "SMS" ? "text-primary" : "text-blue-400"} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">{a.subject}</span>
                              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{a.channel}</span>
                            </div>
                            <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">{a.body}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}


const drillActivity = [
  { month: "Jan", drills: 4, participants: 62 }, { month: "Feb", drills: 6, participants: 89 },
  { month: "Mar", drills: 5, participants: 74 }, { month: "Apr", drills: 8, participants: 110 },
  { month: "May", drills: 7, participants: 98 }, { month: "Jun", drills: 11, participants: 143 },
];

function AdminDashboard() {
  return (
    <motion.div className="space-y-6" variants={{ show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <h1 className="text-4xl font-bold font-['Barlow_Condensed'] text-foreground tracking-wide">COMMAND OVERVIEW</h1>
        <p className="text-muted-foreground text-base mt-0.5">Monday, June 30, 2026 — Operational Status: <span className="text-green-400 font-mono">NOMINAL</span></p>
      </motion.div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Programs", value: "12", delta: "+3", icon: BookOpen },
          { label: "Scheduled Drills", value: "7", delta: "+1", icon: Calendar },
          { label: "Participants", value: "348", delta: "+24", icon: Users },
          { label: "Avg. Score", value: "82%", delta: "+4%", icon: Target },
        ].map((s, i) => (
          <motion.div key={s.label} custom={i} variants={fadeUp} whileHover={{ y: -2, borderColor: "rgba(240,165,0,0.35)" }} className="bg-card border border-border rounded-lg p-5 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">{s.label}</span>
              <s.icon size={15} className="text-primary" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold font-['Barlow_Condensed'] text-foreground leading-none">{s.value}</span>
              <span className="flex items-center gap-0.5 text-xs font-mono text-green-400 mb-0.5"><TrendingUp size={12} />{s.delta}</span>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={fadeUp} className="bg-card border border-border rounded-lg p-5">
          <h3 className="font-semibold text-[13px] font-mono uppercase tracking-widest text-muted-foreground mb-4">Drill Activity — 6 Months</h3>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={drillActivity} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,246,252,0.06)" />
              <XAxis dataKey="month" tick={{ fill: "#8b949e", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8b949e", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1c2128", border: "1px solid rgba(240,246,252,0.1)", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono" }} />
              <Bar key="bar-drills" dataKey="drills" name="Drills" fill="#f0a500" radius={[3, 3, 0, 0]} />
              <Bar key="bar-participants" dataKey="participants" name="Participants" fill="#58a6ff" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div variants={fadeUp} className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 className="font-semibold text-[13px] font-mono uppercase tracking-widest text-muted-foreground">Active Alerts</h3>
          {[
            { type: "Earthquake", severity: "Critical", location: "District 4", time: "09:14" },
            { type: "Wildfire", severity: "High", location: "Northern Ridge", time: "08:52" },
            { type: "Flood", severity: "Medium", location: "River Basin", time: "07:30" },
          ].map((a, i) => (
            <motion.div key={a.type} custom={i} variants={slideRight} className="flex items-center gap-3 p-2.5 rounded-md bg-secondary/50">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.severity === "Critical" ? "bg-red-400" : a.severity === "High" ? "bg-orange-400" : "bg-yellow-400"}`} />
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-foreground">{a.type}</span>
                  <span className="text-[12px] font-mono text-muted-foreground">{a.time}</span>
                </div>
                <div className="flex items-center gap-1 text-[12px] text-muted-foreground"><MapPin size={11} />{a.location}</div>
              </div>
              <Badge status={a.severity}>{a.severity}</Badge>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

const DISASTER_TYPES = ["Earthquake", "Flood / Storm Surge", "Wildfire", "Typhoon", "Hazmat Spill", "Multi-Hazard Cascade"];
//const DISASTER_TYPES = ["Earthquake", "Flood / Storm Surge", "Wildfire", "Typhoon"];

const DISASTER_MODULE_TOPICS: Record<string, { title: string; duration: string }[]> = {
  "Earthquake": [
    { title: "Seismic Fundamentals & Fault Mechanics", duration: "45 min" },
    { title: "Structural Hazard Identification", duration: "50 min" },
    { title: "Drop-Cover-Hold Drills", duration: "45 min" },
    { title: "Building Collapse Search Patterns", duration: "60 min" },
    { title: "Post-Quake Triage & Field Medicine", duration: "50 min" },
    { title: "Aftershock Risk Management", duration: "40 min" },
    { title: "Utility Shutoff Procedures (Gas / Electric / Water)", duration: "45 min" },
    { title: "Urban Search & Rescue Basics", duration: "60 min" },
    { title: "Communications Under Grid Failure", duration: "40 min" },
    { title: "Shelter-in-Place vs Evacuation Decisions", duration: "45 min" },
    { title: "Incident Command Coordination", duration: "50 min" },
    { title: "Field Exercise & Certification Assessment", duration: "90 min" },
  ],
  "Flood / Storm Surge": [
    { title: "Flood Risk Assessment & Mapping", duration: "45 min" },
    { title: "Storm Surge Forecasting Basics", duration: "40 min" },
    { title: "Evacuation Route Planning", duration: "45 min" },
    { title: "Swift-Water Rescue Techniques", duration: "60 min" },
    { title: "Personal Flotation & Rescue Equipment", duration: "40 min" },
    { title: "Water Rescue Boat Operations", duration: "60 min" },
    { title: "Shelter Intake & Logistics", duration: "45 min" },
    { title: "Waterborne Disease & Sanitation Risks", duration: "40 min" },
    { title: "Levee & Drainage System Basics", duration: "35 min" },
    { title: "Incident Command Coordination", duration: "45 min" },
    { title: "Post-Flood Damage Assessment", duration: "50 min" },
    { title: "Simulation Drill & Certification Assessment", duration: "90 min" },
  ],
  "Wildfire": [
    { title: "Fire Behavior & Weather Fundamentals", duration: "45 min" },
    { title: "Fuel Types & Fire Spread Patterns", duration: "45 min" },
    { title: "Containment Line Construction", duration: "50 min" },
    { title: "PPE & Personal Protective Equipment", duration: "40 min" },
    { title: "Firefighting Equipment Operations", duration: "50 min" },
    { title: "Structure Protection Techniques", duration: "45 min" },
    { title: "Evacuation Triggers & Zone Management", duration: "40 min" },
    { title: "Smoke Inhalation & Air Quality Hazards", duration: "35 min" },
    { title: "Aerial Support Coordination", duration: "40 min" },
    { title: "Incident Command & Communications", duration: "45 min" },
    { title: "Post-Fire Mop-Up & Hotspot Detection", duration: "45 min" },
    { title: "Field Exercise & Certification Assessment", duration: "90 min" },
  ],
  "Typhoon": [
    { title: "Storm Track & Intensity Forecasting", duration: "40 min" },
    { title: "Pre-Landfall Preparedness Checklist", duration: "40 min" },
    { title: "Wind Hazard & Debris Safety", duration: "45 min" },
    { title: "Storm Surge & Coastal Flooding Response", duration: "50 min" },
    { title: "Evacuation Route & Shelter Planning", duration: "45 min" },
    { title: "Emergency Communications Under Grid Failure", duration: "40 min" },
    { title: "Search & Rescue in Flooded Areas", duration: "60 min" },
    { title: "Power Line & Utility Hazard Management", duration: "40 min" },
    { title: "Relief Goods Logistics & Distribution", duration: "45 min" },
    { title: "Post-Typhoon Damage Assessment", duration: "45 min" },
    { title: "Incident Command Coordination", duration: "45 min" },
    { title: "Simulation Drill & Certification Assessment", duration: "90 min" },
  ],
  "Hazmat Spill": [
    { title: "Hazardous Materials Classification", duration: "60 min" },
    { title: "PPE Levels A–D Selection", duration: "70 min" },
    { title: "Detection & Monitoring Equipment", duration: "60 min" },
    { title: "Containment & Spill Control Techniques", duration: "60 min" },
    { title: "Decontamination Procedures", duration: "70 min" },
    { title: "Chemical Incident Command Structure", duration: "60 min" },
    { title: "Evacuation & Exclusion Zone Setup", duration: "45 min" },
    { title: "Victim Decontamination & Triage", duration: "60 min" },
    { title: "Regulatory Compliance & Reporting", duration: "50 min" },
    { title: "Transportation Incident Response", duration: "50 min" },
    { title: "Tabletop Exercise: Multi-Agency Response", duration: "90 min" },
    { title: "Certification Assessment", duration: "60 min" },
  ],
  "Multi-Hazard Cascade": [
    { title: "Cascading Hazard Risk Modeling", duration: "50 min" },
    { title: "Multi-Agency Coordination Fundamentals", duration: "50 min" },
    { title: "Resource Prioritization Under Compound Events", duration: "50 min" },
    { title: "Communications Resilience Planning", duration: "45 min" },
    { title: "Cross-Hazard Evacuation Strategies", duration: "50 min" },
    { title: "Infrastructure Interdependency Analysis", duration: "45 min" },
    { title: "Mass Casualty Triage Across Hazard Types", duration: "60 min" },
    { title: "Command Structure for Complex Incidents", duration: "50 min" },
    { title: "Public Information & Rumor Control", duration: "40 min" },
    { title: "Long-Duration Response Logistics", duration: "45 min" },
    { title: "Tabletop Simulation: Compound Disaster Scenario", duration: "90 min" },
    { title: "Certification Assessment", duration: "60 min" },
  ],
};

function NewProgramModal({ trainers, onConfirm, onCancel }: { trainers: Resource[]; onConfirm: (title: string, level: string, modules: number, description: string, assessor: string, disasterType: string, estimatedCost: number) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<"Basic" | "Intermediate" | "Advanced">("Basic");
  const [modules, setModules] = useState(4);
  const [desc, setDesc] = useState("");
  const availableAssessors = trainers.filter(t => t.available);
  const [assessor, setAssessor] = useState("");
  const [disasterType, setDisasterType] = useState("");
  const [cost, setCost] = useState(2400);
  const suggestedModules = disasterType ? DISASTER_MODULE_TOPICS[disasterType].slice(0, modules) : [];

  const levelInfo: Record<string, { desc: string; color: string }> = {
    Basic: { desc: "Introductory level suitable for new personnel", color: "text-gray-400" },
    Intermediate: { desc: "Mid-level for experienced responders", color: "text-primary" },
    Advanced: { desc: "Expert-level for specialized roles", color: "text-orange-400" },
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onCancel} />
      <motion.div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent shrink-0" />
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto min-h-0">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-xl sm:text-2xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">CREATE NEW TRAINING PROGRAM</h2>
            <p className="text-xs text-muted-foreground mt-1">Define curriculum, level, and module structure for your new disaster preparedness training program.</p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Program Title</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Advanced Earthquake Response" className="w-full bg-input-background border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Difficulty Level</label><select value={level} onChange={e => setLevel(e.target.value as any)} className="w-full bg-input-background border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"><option value="Basic">Basic</option><option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option></select></div>
          </div>

          <div className="p-2.5 rounded-lg bg-secondary/50 border border-border"><div className="flex items-start gap-2"><Info size={14} className="text-primary flex-shrink-0 mt-0.5" /><div className="text-xs text-muted-foreground"><span className="font-semibold text-foreground block">{level}</span><span>{levelInfo[level].desc}</span></div></div></div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Disaster Type</label>
              <select value={disasterType} onChange={e => setDisasterType(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">— Not Specified —</option>
                {DISASTER_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Training Assessor</label>
              <select value={assessor} onChange={e => setAssessor(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">— Unassigned —</option>
                {availableAssessors.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
              {!availableAssessors.length && <p className="text-[11px] text-muted-foreground mt-1">No trainers currently marked available.</p>}
            </div>
          </div>

          <div><label className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Number of Modules: <span className="text-foreground font-bold">{modules}</span></label><input type="range" min="1" max="12" value={modules} onChange={e => setModules(Number(e.target.value))} className="w-full" /><p className="text-[11px] text-muted-foreground mt-1.5">Estimated Duration: <span className="text-foreground font-mono font-bold">{modules * 2} hours</span> (assuming 2 hrs per module)</p></div>

          <div className="p-2.5 rounded-lg bg-secondary/30 border border-border">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Suggested Module Breakdown{disasterType ? ` — ${disasterType}` : ""}</div>
            {disasterType ? (
              <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                {suggestedModules.map((m, i) => (
                  <div key={i} className="flex items-center justify-between px-2.5 py-1 rounded-md bg-secondary/50 border border-border">
                    <div className="flex items-center gap-2 text-[11px] text-foreground"><span className="text-[10px] font-mono text-muted-foreground">M{i + 1}</span>{m.title}</div>
                    <span className="text-[10px] font-mono text-muted-foreground">{m.duration}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">Select a disaster type above to auto-generate a suggested module breakdown.</p>
            )}
          </div>

          <div><label className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Program Description (Optional)</label><textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Add key topics, learning objectives, prerequisites..." rows={2} className="w-full bg-input-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" /></div>

          <div className="grid grid-cols-4 gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border text-[11px]">
            <div><div className="text-muted-foreground uppercase tracking-widest">Status</div><div className="text-foreground font-bold">Draft</div></div>
            <div><div className="text-muted-foreground uppercase tracking-widest">Created</div><div className="text-foreground font-bold">Today</div></div>
            <div><div className="text-muted-foreground uppercase tracking-widest">Est. Hours</div><div className="text-foreground font-bold">{modules * 2}</div></div>
            <div>
              <div className="text-muted-foreground uppercase tracking-widest">Estimated Cost</div>
              <div className="flex items-center gap-1">
                <span className="text-foreground font-bold">₱</span>
                <input type="number" min={0} value={cost} onChange={e => setCost(Number(e.target.value))} className="w-full min-w-0 bg-transparent border-b border-border text-foreground font-bold focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 pt-1">
            <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
            <button onClick={() => { if (!title.trim()) { alert("Program title required"); return; } onConfirm(title, level, modules, desc, assessor, disasterType, cost); }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"><Plus size={16} />Create Program</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LaunchScenarioModal({ scenario, onConfirm, onCancel }: { scenario: any; onConfirm: () => void; onCancel: () => void }) {
  const [duration, setDuration] = useState("4 hours");
  const [area, setArea] = useState("12.5");
  const [casualties, setCasualties] = useState("45");
  const [level, setLevel] = useState("Level 2");

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onCancel} />
      <motion.div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className={`h-1 w-full bg-gradient-to-r ${scenario.color === "text-orange-400" ? "from-orange-400" : "from-primary"} via-primary/60 to-transparent`} />
        <div className="p-6 space-y-5">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-2">
              <scenario.icon size={22} className={scenario.color} />
              <h2 className="text-lg font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">{scenario.name}</h2>
              <Badge status={scenario.severity}>{scenario.severity}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Configure and launch this disaster simulation scenario with participants.</p>
          </motion.div>

          <div className="bg-secondary/30 border border-border rounded-lg p-3 space-y-2">
            <div className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Simulation Parameters</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[12px] text-muted-foreground block mb-1">Simulation Duration</label><select value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-input-background border border-border rounded px-2 py-1 text-xs text-foreground"><option>2 hours</option><option>4 hours</option><option>6 hours</option><option>8 hours</option></select></div>
              <div><label className="text-[12px] text-muted-foreground block mb-1">Affected Area (km²)</label><input type="number" value={area} onChange={e => setArea(e.target.value)} className="w-full bg-input-background border border-border rounded px-2 py-1 text-xs text-foreground" /></div>
              <div><label className="text-[12px] text-muted-foreground block mb-1">Est. Casualties</label><input type="number" value={casualties} onChange={e => setCasualties(e.target.value)} className="w-full bg-input-background border border-border rounded px-2 py-1 text-xs text-foreground" /></div>
              <div><label className="text-[12px] text-muted-foreground block mb-1">Response Level</label><select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-input-background border border-border rounded px-2 py-1 text-xs text-foreground"><option>Level 1</option><option>Level 2</option><option>Level 3</option><option>Level 4</option></select></div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-secondary/30 border border-border text-[12px]">
            {[{ label: "Start Time", value: "Now" }, { label: "Duration", value: duration }, { label: "Participants", value: "~30" }, { label: "Status", value: "Ready" }].map(s => (<div key={s.label}><div className="text-muted-foreground uppercase tracking-widest">{s.label}</div><div className="text-foreground font-bold">{s.value}</div></div>))}
          </div>

          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-2"><AlertTriangle size={16} className="text-primary flex-shrink-0 mt-0.5" /><div className="text-xs text-muted-foreground"><span className="font-semibold text-foreground block">Pre-Launch Checklist</span><span>Ensure all trainers are notified, participants briefed, and equipment ready before launch.</span></div></div>

          <div className="flex gap-2.5 pt-2">
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
            <button onClick={onConfirm} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"><Play size={16} />Launch Scenario</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RegisterParticipantModal({ onConfirm, onCancel }: { onConfirm: (name: string, email: string, dept: string, role: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dept, setDept] = useState("");
  const [role, setRole] = useState("Responder");

  const depts = ["Rescue Alpha", "Medical Bravo", "Command HQ", "Supply Delta", "Hazmat Echo"];
  const roles = ["First Responder", "Team Leader", "Trainer", "Medical Officer", "Communications", "Logistics"];

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onCancel} />
      <motion.div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-primary/60 to-transparent" />
        <div className="p-6 space-y-5">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-lg font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">REGISTER NEW PARTICIPANT</h2>
            <p className="text-xs text-muted-foreground mt-1">Add a new personnel to the disaster preparedness training system with full profile information.</p>
          </motion.div>

          <div className="space-y-3">
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Full Name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., John Smith" className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Email Address *</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g., john.smith@ems.gov" className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Department *</label><select value={dept} onChange={e => setDept(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"><option value="">Select Department</option>{depts.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Role *</label><select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"><option value="">Select Role</option>{roles.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
            <div className="text-[12px] font-mono text-blue-400 uppercase tracking-widest font-bold">Registration Details</div>
            <div className="grid grid-cols-2 gap-2 text-[12px]"><div><span className="text-muted-foreground">Name:</span> <span className="text-foreground font-mono">{name || "—"}</span></div><div><span className="text-muted-foreground">Email:</span> <span className="text-foreground font-mono">{email || "—"}</span></div><div><span className="text-muted-foreground">Department:</span> <span className="text-foreground font-mono">{dept || "—"}</span></div><div><span className="text-muted-foreground">Role:</span> <span className="text-foreground font-mono">{role || "—"}</span></div></div>
          </div>

          <div className="p-3 rounded-lg bg-secondary/30 border border-border text-[12px] space-y-1">
            <div className="text-muted-foreground"><span className="font-semibold">✓</span> Welcome email will be sent automatically</div>
            <div className="text-muted-foreground"><span className="font-semibold">✓</span> Temporary password created and sent securely</div>
            <div className="text-muted-foreground"><span className="font-semibold">✓</span> Participant can self-register for available drills</div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
            <button onClick={() => { if (!name.trim() || !email.trim() || !dept || !role) { alert("All fields required"); return; } onConfirm(name, email, dept, role); }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"><UserPlus size={16} />Register Participant</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ExportContextModal({ title, desc, color, rows, coreFields, filename, onExported, onCancel }: { title: string; desc: string; color: string; rows: Record<string, any>[]; coreFields?: string[]; filename: string; onExported: (format: string) => void; onCancel: () => void }) {
  const [format, setFormat] = useState<"csv" | "json" | "pdf">("csv");
  const [includeDetails, setIncludeDetails] = useState(true);

  const allFields = rows.length ? Object.keys(rows[0]) : (coreFields || []);
  const displayFields = includeDetails ? allFields : (coreFields || allFields);
  const count = rows.length;

  const handleExport = () => {
    if (!count) return;
    const finalRows = includeDetails ? rows : rows.map(r => {
      const picked: Record<string, any> = {};
      (coreFields || allFields).forEach(k => { picked[k] = r[k]; });
      return picked;
    });
    exportRows(filename, title, finalRows, format);
    onExported(format);
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onCancel} />
      <motion.div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
        <div className="p-6 space-y-5">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-lg font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">EXPORT DATA</h2>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          </motion.div>

          <div className="p-3 rounded-lg bg-secondary/50 border border-border"><div className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Export Summary</div><div className="flex justify-between items-center"><span className="text-sm font-semibold text-foreground">{title}</span><span className={`text-lg font-bold ${color}`}>{count}</span></div><div className="text-[12px] text-muted-foreground mt-2">{count ? `${count} record${count !== 1 ? "s" : ""} will be exported` : "No records currently available to export."}</div></div>

          <div className="space-y-3">
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Export Format</label><div className="flex gap-2">{[{ id: "csv", label: "CSV", desc: "Spreadsheet compatible" }, { id: "json", label: "JSON", desc: "Data interchange format" }, { id: "pdf", label: "PDF", desc: "Formatted report" }].map(f => <button key={f.id} onClick={() => setFormat(f.id as any)} className={`flex-1 p-2 rounded-md border transition-colors ${format === f.id ? "bg-primary/20 border-primary text-primary" : "bg-secondary border-border text-muted-foreground hover:border-primary/50"}`}><div className="text-xs font-semibold">{f.label}</div><div className="text-[12px] text-muted-foreground">{f.desc}</div></button>)}</div></div>

            <label className="flex items-center gap-2 p-2 rounded-md bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"><input type="checkbox" checked={includeDetails} onChange={e => setIncludeDetails(e.target.checked)} className="w-4 h-4" /><span className="text-xs text-foreground flex-1">Include detailed information & metadata (all fields)</span></label>
          </div>

          <div className="p-3 rounded-lg bg-secondary/30 border border-border"><div className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Fields Included ({displayFields.length})</div><div className="flex flex-wrap gap-1">{displayFields.map(f => <span key={f} className="text-[12px] font-mono px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary">{f}</span>)}</div></div>

          <div className="flex gap-2.5 pt-2">
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
            <button onClick={handleExport} disabled={!count} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${count ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-muted-foreground cursor-not-allowed"}`}><Download size={16} />Export {count} Record{count !== 1 ? "s" : ""}</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

type CurriculumProgram = Program & { source: "Seed Catalog" | "Admin-Added" };

function ProgramDetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
      <div className="text-sm text-foreground">{value ?? <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

function ViewProgramModal({ program, onEdit, onClose }: { program: CurriculumProgram; onEdit: () => void; onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent sticky top-0" />
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1"><span className="text-[12px] font-mono text-muted-foreground">{program.id}</span><Badge status={program.status}>{program.status}</Badge><Badge status={program.level}>{program.level}</Badge>{program.disasterType && <Badge status={program.disasterType}>{program.disasterType}</Badge>}<span className="text-[11px] font-mono text-muted-foreground">{program.source}</span></div>
              <h2 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">{program.title}</h2>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground flex-shrink-0"><X size={18} /></button>
          </div>

          {program.description && (
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Description</div>
              <p className="text-sm text-foreground leading-relaxed">{program.description}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
            <ProgramDetailRow label="Modules" value={program.modules} />
            <ProgramDetailRow label="Duration" value={program.duration} />
            <ProgramDetailRow label="Passing Score" value={program.passingScore ? `${program.passingScore}%` : undefined} />
            <ProgramDetailRow label="Certification" value={program.certificationName} />
            <ProgramDetailRow label="Estimated Cost" value={program.estimatedCost !== undefined ? `₱${program.estimatedCost.toLocaleString()}` : undefined} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ProgramDetailRow label="Target Audience" value={program.targetAudience} />
            <ProgramDetailRow label="Prerequisites" value={program.prerequisites} />
            <ProgramDetailRow label="Training Assessor" value={program.assessor} />
            <ProgramDetailRow label="Created By" value={program.createdBy} />
            <ProgramDetailRow label="Created Date" value={program.createdDate} />
          </div>

          {program.lastUpdated && (
            <ProgramDetailRow label="Last Updated" value={new Date(program.lastUpdated).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
          )}

          {!!program.tags?.length && (
            <div>
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Tags</div>
              <div className="flex flex-wrap gap-1.5">{program.tags.map(t => <span key={t} className="px-2 py-0.5 rounded text-[12px] font-mono bg-secondary text-muted-foreground border border-border">{t}</span>)}</div>
            </div>
          )}

          {!!program.objectives?.length && (
            <div>
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Learning Objectives</div>
              <ul className="space-y-1.5">{program.objectives.map((o, i) => (<li key={i} className="flex items-start gap-2 text-sm text-foreground"><CheckSquare size={14} className="text-primary flex-shrink-0 mt-0.5" /><span>{o}</span></li>))}</ul>
            </div>
          )}

          {!!program.moduleList?.length && (
            <div>
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Module Breakdown</div>
              <div className="space-y-1.5">
                {program.moduleList.map((m, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md bg-secondary/40 border border-border">
                    <div className="flex items-center gap-2 text-sm text-foreground"><span className="text-[12px] font-mono text-muted-foreground">M{i + 1}</span>{m.title}</div>
                    <span className="text-[12px] font-mono text-muted-foreground">{m.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors">Close</button>
            <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"><Edit2 size={15} />Edit Program</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EditProgramModal({ program, trainers, onSave, onCancel }: { program: CurriculumProgram; trainers: Resource[]; onSave: (updates: Partial<Program>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(program.title);
  const [level, setLevel] = useState(program.level);
  const [status, setStatus] = useState(program.status);
  const [modules, setModules] = useState(program.modules);
  const [duration, setDuration] = useState(program.duration);
  const [description, setDescription] = useState(program.description ?? "");
  const [prerequisites, setPrerequisites] = useState(program.prerequisites ?? "");
  const [targetAudience, setTargetAudience] = useState(program.targetAudience ?? "");
  const [certificationName, setCertificationName] = useState(program.certificationName ?? "");
  const [passingScore, setPassingScore] = useState(program.passingScore ?? 80);
  const [objectivesText, setObjectivesText] = useState((program.objectives ?? []).join("\n"));
  const [tagsText, setTagsText] = useState((program.tags ?? []).join(", "));
  const [assessor, setAssessor] = useState(program.assessor ?? "");
  const [disasterType, setDisasterType] = useState(program.disasterType ?? "");
  const [estimatedCost, setEstimatedCost] = useState(program.estimatedCost ?? 0);
  const availableAssessors = trainers.filter(t => t.available);

  const handleSave = () => {
    if (!title.trim()) { alert("Program title required"); return; }
    onSave({
      title, level, status, modules, duration, description,
      prerequisites, targetAudience, certificationName,
      passingScore: Number(passingScore) || undefined,
      objectives: objectivesText.split("\n").map(s => s.trim()).filter(Boolean),
      tags: tagsText.split(",").map(s => s.trim()).filter(Boolean),
      assessor: assessor || undefined, disasterType: disasterType || undefined, estimatedCost: estimatedCost || undefined,
    });
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onCancel} />
      <motion.div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent sticky top-0" />
        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1"><span className="text-[12px] font-mono text-muted-foreground">{program.id}</span><span className="text-[11px] font-mono text-muted-foreground">{program.source}</span></div>
            <h2 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">EDIT TRAINING PROGRAM</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Program Title</label><input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Difficulty Level</label><select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"><option value="Basic">Basic</option><option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option></select></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Status</label><select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"><option value="Draft">Draft</option><option value="Active">Active</option><option value="Archived">Archived</option></select></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Number of Modules</label><input type="number" min={1} max={20} value={modules} onChange={e => setModules(Number(e.target.value))} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Duration</label><input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g., 6 hrs" className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
          </div>

          <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Program Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" /></div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Target Audience</label><input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="e.g., Field responders, Tier 1" className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Prerequisites</label><input value={prerequisites} onChange={e => setPrerequisites(e.target.value)} placeholder="e.g., None, or Basic First Aid" className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Certification Awarded</label><input value={certificationName} onChange={e => setCertificationName(e.target.value)} placeholder="e.g., CERT-EQR-2026" className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Passing Score (%)</label><input type="number" min={0} max={100} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Estimated Cost (₱)</label><div className="flex items-center gap-2 bg-input-background border border-border rounded-md px-3 py-2 focus-within:ring-1 focus-within:ring-primary"><span className="text-sm text-muted-foreground">₱</span><input type="number" min={0} value={estimatedCost} onChange={e => setEstimatedCost(Number(e.target.value))} className="w-full bg-transparent text-sm text-foreground focus:outline-none" /></div></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Disaster Type</label>
              <select value={disasterType} onChange={e => setDisasterType(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">— Not Specified —</option>
                {DISASTER_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Training Assessor</label>
              <select value={assessor} onChange={e => setAssessor(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">— Unassigned —</option>
                {availableAssessors.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Learning Objectives (one per line)</label><textarea value={objectivesText} onChange={e => setObjectivesText(e.target.value)} rows={3} placeholder={"Identify structural collapse hazards\nApply triage protocols under field conditions"} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" /></div>

          <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Tags (comma separated)</label><input value={tagsText} onChange={e => setTagsText(e.target.value)} placeholder="e.g., Seismic, Field Ops, Tier 1" className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>

          <div className="flex gap-2.5 pt-2">
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
            <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"><CheckCircle size={15} />Save Changes</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

type CurriculumSession = Session & { source: "Seed Catalog" | "Admin-Added" };
type Resource = { id: string; name: string; type: "Trainer" | "Equipment" | "Venue"; spec: string; available: boolean; description?: string; contactEmail?: string; phone?: string; location?: string; certifications?: string[]; condition?: string; lastMaintenance?: string; capacity?: number; assignedPrograms?: string[]; notes?: string; lastUpdated?: string };

function ViewSessionModal({ session, onEdit, onClose }: { session: CurriculumSession; onEdit: () => void; onClose: () => void }) {
  const pct = session.capacity ? Math.round((session.enrolled / session.capacity) * 100) : 0;
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent sticky top-0" />
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1"><span className="text-[12px] font-mono text-muted-foreground">{session.id}</span><Badge status={session.status ?? "Scheduled"}>{session.status ?? "Scheduled"}</Badge><span className="text-[11px] font-mono text-muted-foreground">{session.source}</span></div>
              <h2 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">{session.course}</h2>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground flex-shrink-0"><X size={18} /></button>
          </div>

          {session.description && (
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Description</div>
              <p className="text-sm text-foreground leading-relaxed">{session.description}</p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
            <DetailRow label="Date" value={session.date} />
            <DetailRow label="Time" value={session.time} />
            <DetailRow label="Format" value={session.sessionType} />
            <DetailRow label="Trainer" value={session.trainer} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Location" value={session.location} />
            <DetailRow label="Contact" value={session.contactEmail} />
            <DetailRow label="Enrollment" value={<span>{session.enrolled}/{session.capacity} <span className="text-muted-foreground font-mono text-[12px]">({pct}% full)</span></span>} />
            <DetailRow label="Waitlist" value={session.waitlist ?? 0} />
            <DetailRow label="Created By" value={session.createdBy} />
            <DetailRow label="Created Date" value={session.createdDate} />
          </div>

          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden"><div className={`h-full rounded-full ${pct > 85 ? "bg-red-400" : "bg-primary"}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>

          {session.lastUpdated && (
            <DetailRow label="Last Updated" value={new Date(session.lastUpdated).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
          )}

          {!!session.materials?.length && (
            <div>
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Materials & Requirements</div>
              <ul className="space-y-1.5">{session.materials.map((m, i) => (<li key={i} className="flex items-start gap-2 text-sm text-foreground"><CheckSquare size={14} className="text-primary flex-shrink-0 mt-0.5" /><span>{m}</span></li>))}</ul>
            </div>
          )}

          {session.notes && (
            <div>
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Notes</div>
              <p className="text-sm text-foreground leading-relaxed">{session.notes}</p>
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors">Close</button>
            <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"><Edit2 size={15} />Edit Session</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EditSessionModal({ session, onSave, onCancel }: { session: CurriculumSession; onSave: (updates: Partial<Session>) => void; onCancel: () => void }) {
  const [course, setCourse] = useState(session.course);
  const [date, setDate] = useState(session.date);
  const [time, setTime] = useState(session.time);
  const [location, setLocation] = useState(session.location);
  const [trainer, setTrainer] = useState(session.trainer);
  const [status, setStatus] = useState(session.status ?? "Scheduled");
  const [sessionType, setSessionType] = useState(session.sessionType ?? "In-Person");
  const [enrolled, setEnrolled] = useState(session.enrolled);
  const [capacity, setCapacity] = useState(session.capacity);
  const [waitlist, setWaitlist] = useState(session.waitlist ?? 0);
  const [contactEmail, setContactEmail] = useState(session.contactEmail ?? "");
  const [description, setDescription] = useState(session.description ?? "");
  const [materialsText, setMaterialsText] = useState((session.materials ?? []).join("\n"));
  const [notes, setNotes] = useState(session.notes ?? "");

  const handleSave = () => {
    if (!course.trim()) { alert("Course name required"); return; }
    onSave({
      course, date, time, location, trainer, status, sessionType,
      enrolled: Number(enrolled) || 0, capacity: Number(capacity) || 0, waitlist: Number(waitlist) || 0,
      contactEmail, description, notes,
      materials: materialsText.split("\n").map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onCancel} />
      <motion.div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent sticky top-0" />
        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1"><span className="text-[12px] font-mono text-muted-foreground">{session.id}</span><span className="text-[11px] font-mono text-muted-foreground">{session.source}</span></div>
            <h2 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">EDIT TRAINING SESSION</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Course / Program</label><input value={course} onChange={e => setCourse(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Date</label><input value={date} onChange={e => setDate(e.target.value)} placeholder="e.g., Jul 03" className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Time</label><input value={time} onChange={e => setTime(e.target.value)} placeholder="e.g., 08:00–12:00" className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Format</label><select value={sessionType} onChange={e => setSessionType(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"><option value="In-Person">In-Person</option><option value="Virtual">Virtual</option><option value="Hybrid">Hybrid</option></select></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Status</label><select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"><option value="Scheduled">Scheduled</option><option value="Launched">Launched</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></select></div>
            <div className="col-span-2"><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Location</label><input value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Trainer</label><input value={trainer} onChange={e => setTrainer(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Contact Email</label><input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="trainer@ems.gov" className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Enrolled</label><input type="number" min={0} value={enrolled} onChange={e => setEnrolled(Number(e.target.value))} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Capacity</label><input type="number" min={0} value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Waitlist</label><input type="number" min={0} value={waitlist} onChange={e => setWaitlist(Number(e.target.value))} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
          </div>

          <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Materials & Requirements (one per line)</label><textarea value={materialsText} onChange={e => setMaterialsText(e.target.value)} rows={3} placeholder={"Bring PPE\nField manual"} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" /></div>

          <div className="flex gap-2.5 pt-2">
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
            <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"><CheckCircle size={15} />Save Changes</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ViewResourceModal({ resource, onEdit, onClose }: { resource: Resource; onEdit: () => void; onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent sticky top-0" />
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1"><span className="text-[12px] font-mono text-muted-foreground">{resource.id}</span><Badge status={resource.available ? "Active" : "Draft"}>{resource.available ? "Available" : "Committed"}</Badge><span className="text-[11px] font-mono text-muted-foreground">{resource.type}</span></div>
              <h2 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">{resource.name}</h2>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground flex-shrink-0"><X size={18} /></button>
          </div>

          {resource.description && (
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Description</div>
              <p className="text-sm text-foreground leading-relaxed">{resource.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Specialization" value={resource.spec} />
            <DetailRow label="Location" value={resource.location} />
            {resource.type === "Trainer" && <DetailRow label="Contact Email" value={resource.contactEmail} />}
            {resource.type === "Trainer" && <DetailRow label="Phone" value={resource.phone} />}
            {resource.type === "Equipment" && <DetailRow label="Condition" value={resource.condition} />}
            {resource.type === "Equipment" && <DetailRow label="Last Maintenance" value={resource.lastMaintenance} />}
            {resource.type === "Venue" && <DetailRow label="Capacity" value={resource.capacity} />}
          </div>

          {!!resource.certifications?.length && (
            <div>
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Certifications</div>
              <div className="flex flex-wrap gap-1.5">{resource.certifications.map(c => <span key={c} className="px-2 py-0.5 rounded text-[12px] font-mono bg-secondary text-muted-foreground border border-border">{c}</span>)}</div>
            </div>
          )}

          {!!resource.assignedPrograms?.length && (
            <div>
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Assigned Programs</div>
              <div className="flex flex-wrap gap-1.5">{resource.assignedPrograms.map(p => <span key={p} className="px-2 py-0.5 rounded text-[12px] font-mono bg-secondary text-muted-foreground border border-border">{p}</span>)}</div>
            </div>
          )}

          {resource.notes && (
            <div>
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Notes</div>
              <p className="text-sm text-foreground leading-relaxed">{resource.notes}</p>
            </div>
          )}

          {resource.lastUpdated && (
            <DetailRow label="Last Updated" value={new Date(resource.lastUpdated).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
          )}

          <div className="flex gap-2.5 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors">Close</button>
            <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"><Edit2 size={15} />Edit Resource</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EditResourceModal({ resource, onSave, onCancel }: { resource: Resource; onSave: (updates: Partial<Resource>) => void; onCancel: () => void }) {
  const [name, setName] = useState(resource.name);
  const [type, setType] = useState(resource.type);
  const [spec, setSpec] = useState(resource.spec);
  const [available, setAvailable] = useState(resource.available);
  const [location, setLocation] = useState(resource.location ?? "");
  const [contactEmail, setContactEmail] = useState(resource.contactEmail ?? "");
  const [phone, setPhone] = useState(resource.phone ?? "");
  const [condition, setCondition] = useState(resource.condition ?? "");
  const [lastMaintenance, setLastMaintenance] = useState(resource.lastMaintenance ?? "");
  const [capacity, setCapacity] = useState(resource.capacity ?? 0);
  const [description, setDescription] = useState(resource.description ?? "");
  const [certificationsText, setCertificationsText] = useState((resource.certifications ?? []).join(", "));
  const [notes, setNotes] = useState(resource.notes ?? "");

  const handleSave = () => {
    if (!name.trim()) { alert("Resource name required"); return; }
    onSave({
      name, type, spec, available, location, contactEmail, phone, condition, lastMaintenance,
      capacity: Number(capacity) || undefined, description, notes,
      certifications: certificationsText.split(",").map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onCancel} />
      <motion.div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent sticky top-0" />
        <div className="p-6 space-y-5">
          <div>
            <div className="text-[12px] font-mono text-muted-foreground mb-1">{resource.id}</div>
            <h2 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">EDIT RESOURCE</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Type</label><select value={type} onChange={e => setType(e.target.value as Resource["type"])} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"><option value="Trainer">Trainer</option><option value="Equipment">Equipment</option><option value="Venue">Venue</option></select></div>
            <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Availability</label><select value={available ? "1" : "0"} onChange={e => setAvailable(e.target.value === "1")} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"><option value="1">Available</option><option value="0">Committed</option></select></div>
            <div className="col-span-2"><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Specialization</label><input value={spec} onChange={e => setSpec(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            <div className="col-span-2"><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Location</label><input value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            {type === "Trainer" && (<>
              <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Contact Email</label><input value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
              <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            </>)}
            {type === "Equipment" && (<>
              <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Condition</label><input value={condition} onChange={e => setCondition(e.target.value)} placeholder="e.g., Good, Needs Inspection" className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
              <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Last Maintenance</label><input value={lastMaintenance} onChange={e => setLastMaintenance(e.target.value)} placeholder="e.g., 2026-06-01" className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            </>)}
            {type === "Venue" && (
              <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Capacity</label><input type="number" min={0} value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            )}
          </div>

          <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Certifications (comma separated)</label><input value={certificationsText} onChange={e => setCertificationsText(e.target.value)} placeholder="e.g., ICS-300, HAZMAT Tech" className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
          <div><label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" /></div>

          <div className="flex gap-2.5 pt-2">
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
            <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"><CheckCircle size={15} />Save Changes</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TrainingModule() {
  const [tab, setTab] = useState<TrainingTab>("curriculum");
  const [showNewProgram, setShowNewProgram] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<"programs" | "sessions" | "resources">("programs");
  const [viewingProgram, setViewingProgram] = useState<CurriculumProgram | null>(null);
  const [editingProgram, setEditingProgram] = useState<CurriculumProgram | null>(null);
  const [seedCourses, setSeedCourses] = useState<Program[]>([
    {
      id: "CRS-001", title: "Basic Earthquake Response", level: "Basic", modules: 5, duration: "4 hrs", status: "Active",
      description: "Foundational course covering drop-cover-hold procedures, structural collapse hazards, and post-quake triage for first responders.",
      objectives: ["Identify structural collapse hazards", "Execute drop-cover-hold and evacuation drills", "Apply initial triage protocols after a seismic event", "Coordinate with EOC during response"],
      prerequisites: "None", targetAudience: "New field personnel, Rescue teams", certificationName: "CERT-EQR-2026", passingScore: 80,
      tags: ["Seismic", "Field Ops", "Tier 1"], createdBy: "Maj. Reyes", createdDate: "2025-11-04", lastUpdated: "2026-06-29T09:00:00.000Z",
      moduleList: [{ title: "Seismic Fundamentals", duration: "45 min" }, { title: "Structural Hazard ID", duration: "50 min" }, { title: "Drop-Cover-Hold Drills", duration: "45 min" }, { title: "Post-Quake Triage", duration: "50 min" }, { title: "Field Exercise & Assessment", duration: "60 min" }],
    },
    {
      id: "CRS-002", title: "Advanced Flood Evacuation Protocols", level: "Advanced", modules: 8, duration: "6 hrs", status: "Active",
      description: "Advanced water rescue and mass-evacuation planning for flood-prone districts, including swift-water hazards and shelter logistics.",
      objectives: ["Plan district-level evacuation routes", "Operate swift-water rescue equipment safely", "Manage shelter intake and logistics", "Brief incident command on flood status"],
      prerequisites: "Basic Water Safety, 1 yr field experience", targetAudience: "Rescue Alpha, Water Rescue units", certificationName: "CERT-FEP-2026", passingScore: 85,
      tags: ["Flood", "Water Rescue", "Tier 2"], createdBy: "Capt. Santos", createdDate: "2025-09-18", lastUpdated: "2026-06-22T10:00:00.000Z",
      moduleList: [{ title: "Flood Risk Assessment", duration: "45 min" }, { title: "Evacuation Route Planning", duration: "45 min" }, { title: "Swift-Water Hazards", duration: "50 min" }, { title: "Rescue Equipment Ops", duration: "50 min" }, { title: "Shelter Logistics", duration: "40 min" }, { title: "Incident Command Coordination", duration: "40 min" }, { title: "Simulation Drill", duration: "60 min" }, { title: "Assessment", duration: "30 min" }],
    },
    {
      id: "CRS-003", title: "Wildfire Containment Basics", level: "Basic", modules: 4, duration: "3 hrs", status: "Active",
      description: "Introductory wildfire behavior, containment line basics, and personal protective equipment for ground crews.",
      objectives: ["Read basic fire behavior indicators", "Establish and hold a containment line", "Use PPE and equipment correctly", "Communicate status to command"],
      prerequisites: "None", targetAudience: "Ground crew, New personnel", certificationName: "CERT-WFC-2026", passingScore: 75,
      tags: ["Wildfire", "Field Ops", "Tier 1"], createdBy: "Dr. Villanueva", createdDate: "2025-10-02", lastUpdated: "2026-06-25T08:00:00.000Z",
      moduleList: [{ title: "Fire Behavior Basics", duration: "45 min" }, { title: "Containment Line Techniques", duration: "50 min" }, { title: "PPE & Equipment", duration: "40 min" }, { title: "Field Exercise", duration: "45 min" }],
    },
    {
      id: "CRS-004", title: "Chemical Hazmat Level 2", level: "Advanced", modules: 10, duration: "12 hrs", status: "Draft",
      description: "Intermediate-to-advanced hazardous materials handling, decontamination procedures, and chemical incident command.",
      objectives: ["Classify hazardous materials by type", "Perform decontamination procedures", "Operate in Level A/B protective suits", "Lead a hazmat incident briefing"],
      prerequisites: "Hazmat Level 1", targetAudience: "Hazmat-certified responders", certificationName: "CERT-HZ2-2026", passingScore: 90,
      tags: ["Hazmat", "Chemical", "Tier 3"], createdBy: "Dr. Villanueva", createdDate: "2026-05-14", lastUpdated: "2026-05-14T12:00:00.000Z",
      moduleList: [{ title: "Chemical Classification", duration: "60 min" }, { title: "PPE Levels A–D", duration: "70 min" }, { title: "Decontamination Procedures", duration: "70 min" }, { title: "Detection Equipment", duration: "60 min" }, { title: "Containment Strategies", duration: "60 min" }, { title: "Incident Command", duration: "60 min" }, { title: "Casualty Management", duration: "60 min" }, { title: "Regulatory Compliance", duration: "50 min" }, { title: "Tabletop Exercise", duration: "90 min" }, { title: "Certification Assessment", duration: "60 min" }],
    },
    {
      id: "CRS-005", title: "Mass Casualty Incident Management", level: "Intermediate", modules: 7, duration: "8 hrs", status: "Active",
      description: "Structured triage, resource allocation, and command coordination for multi-casualty disaster scenarios.",
      objectives: ["Apply START/SALT triage methodology", "Allocate limited medical resources under pressure", "Coordinate multi-agency response", "Document incident timeline accurately"],
      prerequisites: "Basic First Aid, CPR Certification", targetAudience: "Medical teams, Incident commanders", certificationName: "CERT-MCI-2026", passingScore: 85,
      tags: ["Medical", "Command", "Tier 2"], createdBy: "Capt. Santos", createdDate: "2026-01-20", lastUpdated: "2026-06-18T14:00:00.000Z",
      moduleList: [{ title: "Triage Methodology", duration: "60 min" }, { title: "Resource Allocation", duration: "60 min" }, { title: "Multi-Agency Coordination", duration: "70 min" }, { title: "Field Documentation", duration: "45 min" }, { title: "Communications Protocol", duration: "45 min" }, { title: "Tabletop Simulation", duration: "90 min" }, { title: "Assessment", duration: "50 min" }],
    },
  ]);
  const courses = seedCourses;
  const [viewingSession, setViewingSession] = useState<CurriculumSession | null>(null);
  const [editingSession, setEditingSession] = useState<CurriculumSession | null>(null);
  const [seedSessions, setSeedSessions] = useState<Session[]>([
    {
      id: "SES-001", course: "Basic Earthquake Response", date: "Jul 03", time: "08:00–12:00", location: "District 4 EOC", trainer: "Maj. Reyes", enrolled: 42, capacity: 60, status: "Scheduled",
      description: "Hands-on drop-cover-hold drills and structural hazard walkthrough for District 4 field personnel.",
      sessionType: "In-Person", contactEmail: "reyes@ems.gov", waitlist: 3,
      materials: ["Field manual (provided on-site)", "Closed-toe boots required", "Hard hat provided"],
      notes: "Coordinate parking with EOC front desk; overflow lot available.",
      createdBy: "Maj. Reyes", createdDate: "2026-06-10", lastUpdated: "2026-06-29T09:00:00.000Z",
    },
    {
      id: "SES-002", course: "Advanced Flood Evacuation", date: "Jul 08", time: "09:00–15:00", location: "Virtual — MS Teams", trainer: "Capt. Santos", enrolled: 89, capacity: 100, status: "Scheduled",
      description: "Remote session covering district evacuation planning and shelter logistics coordination.",
      sessionType: "Virtual", contactEmail: "admin@ems.gov", waitlist: 0,
      materials: ["MS Teams link (emailed 24 hrs prior)", "District evacuation map handout"],
      notes: "Session will be recorded for personnel on shift.",
      createdBy: "Capt. Santos", createdDate: "2026-06-01", lastUpdated: "2026-06-22T10:00:00.000Z",
    },
    {
      id: "SES-003", course: "Hazmat Level 2", date: "Jul 10", time: "07:00–19:00", location: "Industrial Zone Fac.", trainer: "Dr. Villanueva", enrolled: 17, capacity: 30, status: "Scheduled",
      description: "Full-day certification session covering Level A/B PPE, decontamination lines, and a tabletop exercise.",
      sessionType: "In-Person", contactEmail: "villanueva@ems.gov", waitlist: 5,
      materials: ["Level A/B suits provided", "Respirator fit-test required beforehand", "Lunch provided"],
      notes: "Participants must complete Hazmat Level 1 prerequisite check-in by 06:45.",
      createdBy: "Dr. Villanueva", createdDate: "2026-06-15", lastUpdated: "2026-06-25T08:00:00.000Z",
    },
  ]);
  const sessions = seedSessions;
  const [viewingResource, setViewingResource] = useState<Resource | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [seedResources, setSeedResources] = useState<Resource[]>([
    { id: "RES-001", name: "Maj. Reyes", type: "Trainer", spec: "Seismic Response", available: true, description: "Lead seismic response instructor with 12 years of field command experience.", contactEmail: "reyes@ems.gov", phone: "+63 917 200 1145", location: "District 4 EOC", certifications: ["ICS-300 Intermediate Command", "Seismic Response Specialist"], assignedPrograms: ["Basic Earthquake Response"], notes: "Prefers morning sessions.", lastUpdated: "2026-06-28T09:00:00.000Z" },
    { id: "RES-002", name: "Capt. Santos", type: "Trainer", spec: "Flood/Water Rescue", available: true, description: "Training Division captain overseeing curriculum design and water rescue instruction.", contactEmail: "admin@ems.gov", phone: "+63 917 200 2278", location: "Training Division HQ", certifications: ["ICS-300 Intermediate Command", "Master Training Specialist", "CPR/AED Instructor"], assignedPrograms: ["Advanced Flood Evacuation Protocols"], notes: "", lastUpdated: "2026-06-20T09:00:00.000Z" },
    { id: "RES-003", name: "Dr. Villanueva", type: "Trainer", spec: "Hazmat / Chemical", available: false, description: "Hazmat program lead, currently committed to onsite certification sessions through mid-July.", contactEmail: "villanueva@ems.gov", phone: "+63 917 200 3390", location: "Industrial Zone Fac.", certifications: ["Hazmat Technician", "Chemical Incident Command"], assignedPrograms: ["Chemical Hazmat Level 2"], notes: "Committed through Jul 15 — do not double-book.", lastUpdated: "2026-06-25T08:00:00.000Z" },
    { id: "RES-004", name: "SCBA Units (×12)", type: "Equipment", spec: "Hazmat / Fire", available: true, description: "Self-contained breathing apparatus sets for hazmat and fire response training.", location: "Equipment Depot A", condition: "Good — inspected quarterly", lastMaintenance: "2026-06-01", assignedPrograms: ["Chemical Hazmat Level 2", "Wildfire Containment Basics"], notes: "2 units currently reserved for Jul 10 session.", lastUpdated: "2026-06-15T09:00:00.000Z" },
    { id: "RES-005", name: "District 4 EOC", type: "Venue", spec: "Multi-purpose", available: true, description: "Primary multi-purpose training venue with classroom and field exercise space.", location: "District 4, Quezon City", capacity: 80, assignedPrograms: ["Basic Earthquake Response"], notes: "Overflow parking available on-site.", lastUpdated: "2026-06-10T09:00:00.000Z" },
  ]);
  const resources = seedResources;
  const app = useApp();

  const allPrograms = [...courses.map(c => ({ ...c, source: "Seed Catalog" })), ...app.programs.map(p => ({ ...p, source: "Admin-Added" }))];
  const allSessions = [...sessions.map(s => ({ ...s, source: "Seed Catalog" })), ...app.sessions.map(s => ({ ...s, status: s.status || "Scheduled", source: "Admin-Added" }))];
  const resourceRows = resources.map(r => ({ id: r.id, name: r.name, type: r.type, specialization: r.spec, availability: r.available ? "Available" : "Committed" }));

  const exportConfig = {
    programs: { title: "Training Programs", desc: "Export all training programs and curriculum data, including newly created programs.", color: "text-orange-400", rows: allPrograms, coreFields: ["id", "title", "level", "modules", "duration", "status"] },
    sessions: { title: "Training Sessions", desc: "Export all scheduled training sessions, including newly scheduled sessions.", color: "text-green-400", rows: allSessions, coreFields: ["id", "course", "date", "location", "trainer", "enrolled", "capacity", "status"] },
    resources: { title: "Resource Allocation", desc: "Export trainer, equipment, and venue resource allocation data.", color: "text-purple-400", rows: resourceRows, coreFields: ["id", "name", "type", "specialization", "availability"] },
  }[exportType];

  return (
    <div className="space-y-5">
      {showNewProgram && (
        <NewProgramModal
          trainers={resources.filter(r => r.type === "Trainer")}
          onConfirm={(title, level, modules, description, assessor, disasterType, estimatedCost) => {
            app.addProgram({
              id: "", title, level, modules, duration: `${modules * 2} hrs`, status: "Draft",
              description, objectives: [], prerequisites: "None", targetAudience: "",
              certificationName: "", passingScore: 80, tags: [], createdBy: "Capt. Santos",
              createdDate: new Date().toISOString().slice(0, 10), lastUpdated: new Date().toISOString(),
              moduleList: disasterType ? DISASTER_MODULE_TOPICS[disasterType].slice(0, modules) : [],
              assessor: assessor || undefined, disasterType: disasterType || undefined, estimatedCost: estimatedCost || undefined,
            });
            app.addNotification({ type: "Program", subject: `Program created: ${title}`, status: "Sent" });
            setShowNewProgram(false);
          }}
          onCancel={() => setShowNewProgram(false)}
        />
      )}
      {showExportModal && (
        <ExportContextModal
          title={exportConfig.title}
          desc={exportConfig.desc}
          color={exportConfig.color}
          rows={exportConfig.rows}
          coreFields={exportConfig.coreFields}
          filename={`dptss-${exportType}-${new Date().toISOString().slice(0, 10)}`}
          onExported={(format) => {
            app.addNotification({ type: "Export", subject: `Exported ${exportConfig.title} (${format.toUpperCase()})`, status: "Sent" });
            setShowExportModal(false);
          }}
          onCancel={() => setShowExportModal(false)}
        />
      )}
      <div className="flex items-center justify-between">
        <div><h1 className="text-4xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">TRAINING PROGRAM MANAGEMENT</h1><p className="text-muted-foreground text-base mt-0.5">Curriculum · scheduling · resource allocation</p></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNewProgram(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-base font-semibold hover:bg-primary/90 transition-colors"><Plus size={16} />New Program</button>
          <button onClick={() => { setExportType(tab === "curriculum" ? "programs" : tab === "schedule" ? "sessions" : "resources"); setShowExportModal(true); }} className="flex items-center gap-2 bg-secondary text-muted-foreground px-3 py-2 rounded-md text-base font-semibold hover:bg-secondary/90 transition-colors"><Download size={16} />Export</button>
        </div>
      </div>
      <TabBar tabs={[{ id: "curriculum", label: "Curriculum Builder", icon: BookMarked }, { id: "schedule", label: "Scheduling", icon: Calendar }, { id: "resources", label: "Resource Allocation", icon: Package }]} active={tab} onChange={v => setTab(v as TrainingTab)} />
      {viewingProgram && (
        <ViewProgramModal
          program={viewingProgram}
          onClose={() => setViewingProgram(null)}
          onEdit={() => { setEditingProgram(viewingProgram); setViewingProgram(null); }}
        />
      )}
      {editingProgram && (
        <EditProgramModal
          program={editingProgram}
          trainers={resources.filter(r => r.type === "Trainer")}
          onCancel={() => setEditingProgram(null)}
          onSave={(updates) => {
            if (editingProgram.source === "Seed Catalog") {
              setSeedCourses(prev => prev.map(c => c.id === editingProgram.id ? { ...c, ...updates, lastUpdated: new Date().toISOString() } : c));
              app.addNotification({ type: "Program", subject: `Program updated: ${updates.title ?? editingProgram.title}`, status: "Sent" });
            } else {
              app.updateProgram(editingProgram.id, updates);
            }
            setEditingProgram(null);
          }}
        />
      )}
      {tab === "curriculum" && (
        <div className="space-y-2">
          {allPrograms.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-lg p-4 hover:border-[rgba(240,165,0,0.2)] transition-colors group">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5"><span className="text-[12px] font-mono text-muted-foreground">{c.id || "—"}</span><Badge status={c.status}>{c.status}</Badge><Badge status={c.level}>{c.level}</Badge><span className="text-[11px] font-mono text-muted-foreground">{c.source}</span></div>
                  <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                </div>
                <div className="flex gap-6 text-center">
                  <div><div className="text-lg font-bold font-['Barlow_Condensed'] text-foreground">{c.modules}</div><div className="text-[12px] font-mono text-muted-foreground">modules</div></div>
                  <div><div className="text-lg font-bold font-['Barlow_Condensed'] text-foreground">{c.duration}</div><div className="text-[12px] font-mono text-muted-foreground">duration</div></div>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingProgram(c as CurriculumProgram)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-secondary flex items-center gap-1"><Edit2 size={12} />Edit</button>
                  <button onClick={() => setViewingProgram(c as CurriculumProgram)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-secondary flex items-center gap-1"><Eye size={12} />View</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {viewingSession && (
        <ViewSessionModal
          session={viewingSession}
          onClose={() => setViewingSession(null)}
          onEdit={() => { setEditingSession(viewingSession); setViewingSession(null); }}
        />
      )}
      {editingSession && (
        <EditSessionModal
          session={editingSession}
          onCancel={() => setEditingSession(null)}
          onSave={(updates) => {
            if (editingSession.source === "Seed Catalog") {
              setSeedSessions(prev => prev.map(s => s.id === editingSession.id ? { ...s, ...updates, lastUpdated: new Date().toISOString() } : s));
              app.addNotification({ type: "Session", subject: `Session updated: ${updates.course ?? editingSession.course}`, status: "Sent" });
            } else {
              app.updateSession(editingSession.id, updates);
            }
            setEditingSession(null);
          }}
        />
      )}
      {tab === "schedule" && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/40">{["ID", "Course", "Date", "Location", "Trainer", "Enrollment", "Status", ""].map(h => <th key={h} className="text-left text-[12px] font-mono font-medium text-muted-foreground uppercase tracking-widest px-4 py-3">{h}</th>)}</tr></thead>
            <tbody>{allSessions.map((s, i) => { const pct = Math.round(s.enrolled / s.capacity * 100); return (<tr key={s.id} className={`border-b border-border hover:bg-secondary/30 ${i === allSessions.length - 1 ? "border-b-0" : ""}`}><td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.id}</td><td className="px-4 py-3 text-xs font-semibold text-foreground">{s.course}</td><td className="px-4 py-3"><div className="text-xs font-mono text-foreground">{s.date}</div><div className="text-[12px] font-mono text-muted-foreground">{s.time}</div></td><td className="px-4 py-3 text-xs text-muted-foreground">{s.location}</td><td className="px-4 py-3 text-xs text-muted-foreground">{s.trainer}</td><td className="px-4 py-3 min-w-[120px]"><div className="flex items-center gap-2"><div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden"><div className={`h-full rounded-full ${pct > 85 ? "bg-red-400" : "bg-primary"}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div><span className="text-[12px] font-mono text-muted-foreground">{s.enrolled}/{s.capacity}</span></div></td><td className="px-4 py-3"><Badge status={s.status}>{s.status}</Badge></td><td className="px-4 py-3">
              <DropdownMenu items={[
                { label: "View Details", icon: Eye, onClick: () => setViewingSession(s as CurriculumSession) },
                { label: "Edit Session", icon: Edit2, onClick: () => setEditingSession(s as CurriculumSession) },
                { label: "Duplicate Session", icon: PlusCircle, onClick: () => { const { source: _src, ...base } = s as CurriculumSession; app.createSession({ ...base, id: "", status: "Scheduled", enrolled: 0 }); app.addNotification({ type: "Session", subject: `Duplicated session: ${s.course}`, status: "Sent" }); } },
                ...(s.status !== "Cancelled" ? [{ label: "Cancel Session", icon: XCircle, danger: true, onClick: () => {
                  if (s.source === "Seed Catalog") { setSeedSessions(prev => prev.map(x => x.id === s.id ? { ...x, status: "Cancelled" } : x)); app.addNotification({ type: "Session", subject: `Session ${s.id} cancelled`, status: "Sent" }); }
                  else { app.cancelSession(s.id); }
                } }] : []),
              ]} />
            </td></tr>); })}</tbody>
          </table>
        </div>
      )}
      {viewingResource && (
        <ViewResourceModal
          resource={viewingResource}
          onClose={() => setViewingResource(null)}
          onEdit={() => { setEditingResource(viewingResource); setViewingResource(null); }}
        />
      )}
      {editingResource && (
        <EditResourceModal
          resource={editingResource}
          onCancel={() => setEditingResource(null)}
          onSave={(updates) => {
            setSeedResources(prev => prev.map(r => r.id === editingResource.id ? { ...r, ...updates, lastUpdated: new Date().toISOString() } as Resource : r));
            app.addNotification({ type: "Resource", subject: `Resource updated: ${updates.name ?? editingResource.name}`, status: "Sent" });
            setEditingResource(null);
          }}
        />
      )}
      {tab === "resources" && (
        <div className="space-y-2">
          {resources.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-4 hover:border-[rgba(240,165,0,0.2)] transition-colors">
              <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                {r.type === "Trainer" ? <User size={15} className="text-muted-foreground" /> : r.type === "Equipment" ? <Package size={15} className="text-muted-foreground" /> : <Building2 size={15} className="text-muted-foreground" />}
              </div>
              <div className="flex-1"><div className="text-sm font-semibold text-foreground">{r.name}</div><div className="text-[12px] font-mono text-muted-foreground">{r.type} · {r.spec}</div></div>
              <span className={`flex items-center gap-1 text-[12px] font-mono ${r.available ? "text-green-400" : "text-orange-400"}`}><span className={`w-1.5 h-1.5 rounded-full ${r.available ? "bg-green-400" : "bg-orange-400"}`} />{r.available ? "Available" : "Committed"}</span>
              <DropdownMenu items={[
                { label: "View Details", icon: Eye, onClick: () => setViewingResource(r) },
                { label: "Edit Resource", icon: Edit2, onClick: () => setEditingResource(r) },
                { label: r.available ? "Mark Committed" : "Mark Available", icon: RefreshCw, onClick: () => { setSeedResources(prev => prev.map(x => x.id === r.id ? { ...x, available: !x.available, lastUpdated: new Date().toISOString() } : x)); app.addNotification({ type: "Resource", subject: `${r.name} marked ${!r.available ? "Available" : "Committed"}`, status: "Sent" }); } },
                { label: "Remove Resource", icon: Trash2, danger: true, onClick: () => setSeedResources(prev => prev.filter(x => x.id !== r.id)) },
              ]} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import {
   Copy, Printer, RotateCcw,  
} from "lucide-react";

// Narrative Story Generator Engine
const createScenarioStory = (disaster: any, config: any, injects: any[], roles: any[]) => {
  const storyTemplates: Record<string, any> = {
    EQ: {
      title: "Operation Earthquake: Epicenter Shaking",
      background: `A powerful earthquake with an estimated magnitude of 7.2 suddenly struck the area covering ${config.affectedArea} km² at around 9:00 AM. Due to intense shaking, several older structures suffered severe cracks and structural failures. Grid power failed across the sector while widespread panic broke out.`,
      objective: "Rapidly assess facility structural integrity, safely evacuate personnel within 15 minutes, and administer triage and first aid to casualties.",
      defaultEvac: "Open Ground Athletic Field (Zone A)",
      hazardDetails: "Collapsing debris, aftershocks, power outages, and secondary fire hazards."
    },
    FL: {
      title: "Operation Deluge: Severe Torrential Flood",
      background: `Continuous heavy rainfall from a Super Typhoon caused floodwaters to rise rapidly across ${config.affectedArea} km². Waters have reached the second floor of several facilities with strong currents carrying submerged debris. Moving outdoors without floating gear poses extreme hazard.`,
      objective: "Execute vertical evacuation to higher floors, deploy rescue boats, and ensure no personnel remain in ground-level risk zones.",
      defaultEvac: "3rd Floor Assembly Deck & Elevated Gymnasium",
      hazardDetails: "Rapidly rising floodwaters, electrocution risks from submerged power lines, and hypothermia."
    },
    FR: {
      title: "Operation Blaze: Industrial Fire Outbreak",
      background: `A major fire broke out in the eastern wing of the facility following an electrical short circuit. Driven by strong winds and combustible materials, flames and thick smoke rapidly spread across ${config.affectedArea} km². Primary evacuation corridors are obstructed and visibility is severely degraded.`,
      objective: "Isolate the fire source, guide evacuees to the upwind area (against wind direction), and triage inhalation injuries.",
      defaultEvac: "East Parking Open Area (Upwind Evacuation Zone)",
      hazardDetails: "Thick toxic smoke, extreme heat exposure, and structural collapse of burning facilities."
    },
    TY: {
      title: "Operation Tempest: Typhoon Onslaught",
      background: `The area is under Signal No. 4. Wind gusts exceeding 200 km/h have blown off roofing, uprooted trees, and downed utility poles. The surrounding ${config.affectedArea} km² sector has lost all landline communications and grid power.`,
      objective: "Remain in fortified shelters, manage emergency backup power, and prepare medical teams to treat victims struck by airborne debris.",
      defaultEvac: "Reinforced Concrete Evacuation Center (Building C)",
      hazardDetails: "Airborne debris, structural damage, and total loss of communication infrastructure."
    },
    HZ: {
      title: "Operation Spill: Hazmat Alert Phase 3",
      background: `An accident in the chemical storage building caused a major leak of highly toxic chemical gas. Dangerous fumes are currently drifting windward toward nearby facilities within ${config.affectedArea} km². Individuals in close proximity are experiencing dizziness and severe respiratory distress.`,
      objective: "Contain the chemical spill using Hazmat equipment, enforce an immediate 500-meter radius evacuation zone, and set up a Decontamination Station.",
      defaultEvac: "Safe Zone Delta (500-Meter Upwind Assembly Point)",
      hazardDetails: "Chemical poisoning, asphyxiation, and environmental contamination."
    },
    MH: {
      title: "Operation Crisis: Multi-Hazard Cascade",
      background: `Following a major earthquake, a simultaneous structural fire and gas leak broke out in the primary facility. The surrounding ${config.affectedArea} km² area is under full crisis status. Multiple emergency events are unfolding concurrently while first responder resources are stretched thin.`,
      objective: "Establish Unified Command, prioritize rescue operations based on life-threat severity, and evacuate all personnel to safety.",
      defaultEvac: "Central Regional Disaster Staging Area",
      hazardDetails: "Simultaneous earthquake, fire outbreak, gas leak, and responder shortages."
    }
  };

  const base = storyTemplates[disaster.id] || storyTemplates["EQ"];

  return {
    title: base.title,
    disasterType: disaster.name,
    severity: disaster.severity,
    backgroundStory: base.background,
    objective: base.objective,
    hazardDetails: base.hazardDetails,
    duration: config.duration,
    affectedArea: `${config.affectedArea} km²`,
    estCasualties: config.casualties,
    responseLevel: config.responseLevel,
    evacuationArea: config.customEvacArea || base.defaultEvac,
    injectEvents: injects,
    assignedRoles: roles.filter(r => r.count > 0)
  };
};

export function SimModule() {
  const [tab, setTab] = useState<"selector" | "injector" | "roles" | "script">("selector");
  const [generatedStory, setGeneratedStory] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const templates = [
    { id: "EQ", name: "Earthquake", icon: Zap, severity: "Extreme", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
    { id: "FL", name: "Flood / Storm Surge", icon: Droplets, severity: "High", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
    { id: "FR", name: "Wildfire / Industrial Fire", icon: Flame, severity: "High", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
    { id: "TY", name: "Typhoon", icon: Wind, severity: "Extreme", color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20" },
    { id: "HZ", name: "Hazmat Spill", icon: Shield, severity: "Critical", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
    { id: "MH", name: "Multi-Hazard Cascade", icon: Layers, severity: "Extreme", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
  ];

  const [sel, setSel] = useState(templates[0]);

  const [config, setConfig] = useState({
    duration: "2 hours",
    affectedArea: "12.5",
    casualties: "45 casualties (10 critical, 35 minor injuries)",
    responseLevel: "Level 2 (Local & Regional Responders)",
    customEvacArea: ""
  });

  const [injects, setInjects] = useState([
    { time: "T+05:00", event: "Main building grid power fails — backup generators engage.", type: "Complication" },
    { time: "T+12:00", event: "Fallen structural debris blocks primary Evacuation Exit A.", type: "Complication" },
    { time: "T+18:00", event: "Additional Medical Team from the Red Cross arrives on scene.", type: "Resource" },
    { time: "T+25:00", event: "Secondary gas leak detected — expand exclusion zone perimeter.", type: "Decision Point" },
    { time: "T+40:00", event: "Radio and cellular tower signals drop — switch to analog handheld radios.", type: "Complication" },
  ]);

  const [roles, setRoles] = useState([
    { name: "Incident Commander (IC)", abbr: "IC", count: 1 },
    { name: "Operations Section Chief", abbr: "OPS", count: 2 },
    { name: "First Responder / Rescue Team", abbr: "FR", count: 8 },
    { name: "Medical / Triage Officer", abbr: "MED", count: 4 },
    { name: "Safety & Communications Officer", abbr: "COMM", count: 2 },
    { name: "Evacuees & Victims (Roleplay Actors)", abbr: "ACT", count: 15 },
  ]);

  // Generate story script and automatically switch tab
  const handleGenerateStory = () => {
    const story = createScenarioStory(sel, config, injects, roles);
    setGeneratedStory(story);
    setTab("script");
  };

  const copyToClipboard = () => {
    if (!generatedStory) return;
    const text = `
=== ${generatedStory.title} ===
Disaster Type: ${generatedStory.disasterType} (${generatedStory.severity})
Duration: ${generatedStory.duration} | Affected Area: ${generatedStory.affectedArea}

[SCENARIO STORY & SITUATION]
${generatedStory.backgroundStory}

[DRILL OBJECTIVE]
${generatedStory.objective}

[PRIMARY EVACUATION AREA]
${generatedStory.evacuationArea}

[ESTIMATED CASUALTIES]
${generatedStory.estCasualties}

[EVENT TIMELINE & INJECTS]
${generatedStory.injectEvents.map((i: any) => `- ${i.time}: ${i.event} (${i.type})`).join("\n")}

[ASSIGNED PERSONNEL ROLES]
${generatedStory.assignedRoles.map((r: any) => `- ${r.name}: ${r.count} personnel`).join("\n")}
    `;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 text-foreground bg-background p-6 rounded-xl border border-border">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">
            SIMULATION SCENARIO BUILDER
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Disaster type · variable injector · role configuration · script generator</p>
        </div>

        <button 
          onClick={handleGenerateStory} 
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-bold hover:bg-primary/90 shadow-md transition-all"
        >
          <Play size={15} /> Generate
        </button>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex bg-muted/30 p-1 rounded-lg border border-border gap-1 w-fit">
        {[
          { id: "selector", label: "Disaster Type Selector", icon: Target },
          { id: "injector", label: "Variable Injector", icon: Sliders },
          { id: "roles", label: "Role Configuration", icon: Users },
          { 
            id: "script", 
            label: generatedStory ? "📜 Active Drill Script" : "📜 Drill Script Preview", 
            icon: BookOpen,
            highlight: !!generatedStory
          },
        ].map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                active 
                  ? "bg-card text-foreground shadow-sm border border-border" 
                  : t.highlight 
                    ? "text-primary hover:text-primary font-bold" 
                    : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DISASTER SELECTOR */}
      {tab === "selector" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {templates.map(t => {
              const Icon = t.icon;
              const active = sel.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSel(t)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    active ? `${t.border} ${t.bg}` : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} className={active ? t.color : "text-muted-foreground"} />
                    <span className="text-xs font-semibold text-foreground">{t.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${t.color}`}>
                    {t.severity}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="text-sm font-semibold text-foreground">Configure Scenario Parameters: {sel.name}</div>
            
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">Drill Duration</label>
                <input 
                  value={config.duration} 
                  onChange={(e) => setConfig({ ...config, duration: e.target.value })}
                  className="w-full bg-input border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">Affected Area (km²)</label>
                <input 
                  value={config.affectedArea} 
                  onChange={(e) => setConfig({ ...config, affectedArea: e.target.value })}
                  className="w-full bg-input border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">Est. Casualties</label>
                <input 
                  value={config.casualties} 
                  onChange={(e) => setConfig({ ...config, casualties: e.target.value })}
                  className="w-full bg-input border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">Response Level</label>
                <input 
                  value={config.responseLevel} 
                  onChange={(e) => setConfig({ ...config, responseLevel: e.target.value })}
                  className="w-full bg-input border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                Custom Evacuation Area (Optional)
              </label>
              <input 
                placeholder="Example: Grand Plaza Grounds / North Gym"
                value={config.customEvacArea} 
                onChange={(e) => setConfig({ ...config, customEvacArea: e.target.value })}
                className="w-full bg-input border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INJECTOR */}
      {tab === "injector" && (
        <div className="space-y-3">
          {injects.map((inj, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
              <span className="text-xs font-mono font-bold text-primary">{inj.time}</span>
              <span className="flex-1 text-xs text-foreground">{inj.event}</span>
              <span className="text-[10px] font-mono uppercase bg-muted px-2 py-0.5 rounded text-muted-foreground">{inj.type}</span>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ROLES */}
      {tab === "roles" && (
        <div className="grid grid-cols-2 gap-3">
          {roles.map((r, idx) => (
            <div key={r.name} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{r.name}</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    const updated = [...roles];
                    if (updated[idx].count > 0) updated[idx].count--;
                    setRoles(updated);
                  }}
                  className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-xs text-muted-foreground hover:text-foreground"
                >
                  −
                </button>
                <span className="text-xs font-mono text-foreground w-6 text-center">{r.count}</span>
                <button 
                  onClick={() => {
                    const updated = [...roles];
                    updated[idx].count++;
                    setRoles(updated);
                  }}
                  className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-xs text-muted-foreground hover:text-foreground"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: GENERATED DRILL SCRIPT */}
      {tab === "script" && (
        <div className="space-y-5">
          {!generatedStory ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center space-y-3">
              <AlertTriangle className="mx-auto text-amber-400" size={32} />
              <h3 className="text-lg font-bold text-foreground">No Drill Script Generated Yet</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Click the **"Launch & Generate Drill Story"** button above to compile a narrative script based on your selected settings.
              </p>
              <button 
                onClick={handleGenerateStory}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-xs font-bold hover:bg-primary/90"
              >
                Generate Script Now
              </button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
              
              {/* Script Title Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase bg-primary/20 text-primary px-2 py-0.5 rounded font-bold">
                      {generatedStory.severity} SEVERITY DRILL
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">• {generatedStory.disasterType}</span>
                  </div>
                  <h2 className="text-3xl font-bold font-['Barlow_Condensed'] text-foreground tracking-wide">
                    {generatedStory.title}
                  </h2>
                </div>

                {/* Actions Inside Script View */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded text-xs font-medium hover:bg-muted/80 text-foreground"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copied ? "Copied!" : "Copy Script"}
                  </button>

                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-bold hover:bg-primary/90"
                  >
                    <Printer size={14} /> Print Script
                  </button>
                </div>
              </div>

              {/* Story Background / Narrative */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-primary font-bold">
                  📖 Scenario Background & Story
                </h3>
                <p className="p-4 bg-muted/20 border border-border rounded-lg text-sm leading-relaxed text-foreground/90 italic">
                  "{generatedStory.backgroundStory}"
                </p>
              </div>

              {/* Objectives & Evacuation Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">🎯 Drill Objective</h4>
                  <div className="p-3.5 bg-muted/10 border border-border rounded-md text-xs leading-relaxed text-foreground">
                    {generatedStory.objective}
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">📍 Evacuation Area</h4>
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs rounded-md">
                    {generatedStory.evacuationArea}
                  </div>
                </div>
              </div>

              {/* Scenario Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-muted/20 border border-border p-3 rounded-lg">
                  <span className="text-[10px] font-mono text-muted-foreground block uppercase">Est. Casualties</span>
                  <span className="font-semibold text-red-400">{generatedStory.estCasualties}</span>
                </div>
                <div className="bg-muted/20 border border-border p-3 rounded-lg">
                  <span className="text-[10px] font-mono text-muted-foreground block uppercase">Drill Duration</span>
                  <span className="font-semibold">{generatedStory.duration}</span>
                </div>
                <div className="bg-muted/20 border border-border p-3 rounded-lg">
                  <span className="text-[10px] font-mono text-muted-foreground block uppercase">Affected Area</span>
                  <span className="font-semibold">{generatedStory.affectedArea}</span>
                </div>
                <div className="bg-muted/20 border border-border p-3 rounded-lg">
                  <span className="text-[10px] font-mono text-muted-foreground block uppercase">Primary Hazards</span>
                  <span className="font-semibold text-amber-400">{generatedStory.hazardDetails}</span>
                </div>
              </div>

              {/* Timeline Injects */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-primary font-bold">
                  ⏱️ Event Timeline (Injects)
                </h3>
                <div className="space-y-2">
                  {generatedStory.injectEvents.map((inj: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-muted/20 border border-border p-3 rounded-lg text-xs">
                      <span className="font-mono text-primary font-bold min-w-[60px]">{inj.time}</span>
                      <p className="flex-1 text-foreground font-medium">{inj.event}</p>
                      <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase">{inj.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personnel Roles Assigned */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  👥 Assigned Personnel & Roles
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {generatedStory.assignedRoles.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-muted/20 border border-border p-2.5 rounded text-xs">
                      <span className="text-foreground">{r.name}</span>
                      <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Re-configure Footer Action */}
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <button 
                  onClick={() => setTab("selector")}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw size={14} /> Re-configure Settings
                </button>

                <span className="text-[11px] font-mono text-muted-foreground">
                  Status: Ready for Drill Execution
                </span>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}

function MessageParticipantModal({ participant, onSend, onCancel }: {
  participant: { id: string; name: string; email: string; dept: string; role: string };
  onSend: (subject: string, body: string) => void;
  onCancel: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) { alert("Subject and message body are required"); return; }
    onSend(subject.trim(), body.trim());
    setSent(true);
    setTimeout(onCancel, 900);
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onCancel} />
      <motion.div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-primary/60 to-transparent" />
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">MESSAGE PARTICIPANT</h2>
              <p className="text-xs text-muted-foreground mt-1">Compose a direct message to this participant. It will be delivered to their notifications.</p>
            </div>
            <button onClick={onCancel} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary transition-colors flex-shrink-0"><X size={16} /></button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
            <AvatarCircle initials={participant.name.split(" ").map(n => n[0]).join("")} color="bg-blue-500/20" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">{participant.name}</div>
              <div className="text-[12px] text-muted-foreground truncate">{participant.role} · {participant.dept}</div>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-mono text-muted-foreground flex-shrink-0"><Mail size={12} />{participant.email}</div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Subject *</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Upcoming Hazmat Level 2 session" className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Message *</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="Write your message to this participant..." className="w-full bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
            <button onClick={handleSend} disabled={sent} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${sent ? "bg-green-500/90 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
              {sent ? <CheckCircle size={16} /> : <Send size={16} />}{sent ? "Sent" : "Send Message"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ParticipantProfileModal({ participant, onClose, onMessage }: {
  participant: { id: string; name: string; dept: string; role: string; level: string; certs: string[]; status: string; enrolled: number; email: string; phone: string; location: string; employeeId: string; joinDate: string; notes: string };
  onClose: () => void;
  onMessage: () => void;
}) {
  const app = useApp();
  const attendance = app.getAttendanceFor(participant.id);
  const completed = attendance.filter(r => r.status === "Completed").length;
  const avgScore = attendance.filter(r => typeof r.score === "number").length
    ? Math.round(attendance.reduce((s, r) => s + (r.score ?? 0), 0) / attendance.filter(r => typeof r.score === "number").length)
    : null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
        <motion.div
          className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col"
          initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent flex-shrink-0" />

          <div className="p-6 flex items-start justify-between gap-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3.5">
              <AvatarCircle initials={participant.name.split(" ").map(n => n[0]).join("")} color="bg-blue-500/20" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">{participant.name}</h2>
                  <Badge status={participant.status}>{participant.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{participant.role} · {participant.dept}</div>
                <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{participant.id} · {participant.employeeId}</div>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary flex-shrink-0"><X size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center gap-2">
              <Badge status={participant.level}>{participant.level}</Badge>
              <span className="text-[12px] font-mono text-muted-foreground">Enrolled in {participant.enrolled} program{participant.enrolled === 1 ? "" : "s"}</span>
            </div>

            <div>
              <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-2.5">Contact Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 bg-secondary/40 rounded-md p-2.5"><Mail size={14} className="text-muted-foreground flex-shrink-0" /><span className="text-xs font-mono text-foreground truncate">{participant.email}</span></div>
                <div className="flex items-center gap-2.5 bg-secondary/40 rounded-md p-2.5"><Phone size={14} className="text-muted-foreground flex-shrink-0" /><span className="text-xs font-mono text-foreground">{participant.phone}</span></div>
                <div className="flex items-center gap-2.5 bg-secondary/40 rounded-md p-2.5"><Briefcase size={14} className="text-muted-foreground flex-shrink-0" /><span className="text-xs text-foreground">{participant.dept}</span></div>
                <div className="flex items-center gap-2.5 bg-secondary/40 rounded-md p-2.5"><MapPinned size={14} className="text-muted-foreground flex-shrink-0" /><span className="text-xs text-foreground truncate">{participant.location}</span></div>
                <div className="flex items-center gap-2.5 bg-secondary/40 rounded-md p-2.5"><Calendar size={14} className="text-muted-foreground flex-shrink-0" /><span className="text-xs text-foreground">Joined {participant.joinDate}</span></div>
                <div className="flex items-center gap-2.5 bg-secondary/40 rounded-md p-2.5"><Hash size={14} className="text-muted-foreground flex-shrink-0" /><span className="text-xs font-mono text-foreground">{participant.employeeId}</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-2.5">Certifications</h3>
              <div className="flex flex-wrap gap-1.5">
                {participant.certs.length ? participant.certs.map(c => (
                  <span key={c} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"><Award size={12} />{c}</span>
                )) : <span className="text-xs text-muted-foreground">No certifications on record.</span>}
              </div>
            </div>

            <div>
              <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-2.5">Training Summary</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/40 rounded-md p-3"><div className="text-lg font-bold text-foreground">{attendance.length}</div><div className="text-[11px] text-muted-foreground">Total Sessions</div></div>
                <div className="bg-secondary/40 rounded-md p-3"><div className="text-lg font-bold text-foreground">{completed}</div><div className="text-[11px] text-muted-foreground">Completed</div></div>
                <div className="bg-secondary/40 rounded-md p-3"><div className="text-lg font-bold text-foreground">{avgScore !== null ? `${avgScore}%` : "—"}</div><div className="text-[11px] text-muted-foreground">Avg. Score</div></div>
              </div>
            </div>

            <div>
              <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-2.5">Training Attendance History</h3>
              {attendance.length ? (
                <div className="bg-secondary/40 rounded-md overflow-hidden divide-y divide-border">
                  {attendance.map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{r.program}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">{new Date(r.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}{r.certificate ? ` · ${r.certificate}` : ""}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {typeof r.score === "number" && <span className="text-[11px] font-mono text-muted-foreground">{r.score}%</span>}
                        <Badge status={r.status}>{r.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground">No attendance records found for this participant.</p>}
            </div>

            {participant.notes && (
              <div>
                <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-2.5">Notes</h3>
                <p className="text-xs text-muted-foreground bg-secondary/40 rounded-md p-3 leading-relaxed">{participant.notes}</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border flex items-center justify-end gap-2 flex-shrink-0 bg-card">
            <button onClick={onMessage} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"><Mail size={14} />Message Participant</button>
            <button onClick={onClose} className="px-3 py-2 rounded-md text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Close</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ParticipantsModule() {
  const [tab, setTab] = useState<ParticipantTab>("profiles");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewProfile, setViewProfile] = useState<(typeof participants)[number] | null>(null);
  const [messageTarget, setMessageTarget] = useState<(typeof participants)[number] | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive" | "Pending">("all");
  const [attendanceFilter, setAttendanceFilter] = useState<"all" | "Completed" | "In Progress" | "No Show" | "Enrolled">("all");
  const [participantSearch, setParticipantSearch] = useState("");
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [programSearch, setProgramSearch] = useState("");
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const app = useApp();
  const participants = [
    { id: "P-001", name: "Maria Santos", dept: "Rescue Alpha", role: "Team Leader", level: "Advanced", certs: ["CERT-A", "First Aid", "SCBA"], status: "Active", enrolled: 3, email: "m.santos@ems.gov", phone: "+63 917 200 1044", location: "Quezon City, NCR", employeeId: "EMP-1042", joinDate: "Jan 14, 2024", notes: "Team lead for Rescue Alpha; primary point of contact for earthquake response drills." },
    { id: "P-002", name: "Jose Reyes", dept: "Medical Bravo", role: "Medic", level: "Intermediate", certs: ["EMT-B", "CPR"], status: "Active", enrolled: 2, email: "j.reyes@ems.gov", phone: "+63 917 200 1055", location: "Makati City, NCR", employeeId: "EMP-1078", joinDate: "Mar 2, 2024", notes: "" },
    { id: "P-003", name: "Ana Cruz", dept: "Command HQ", role: "Communications", level: "Advanced", certs: ["CERT-A", "ICS-200"], status: "Active", enrolled: 4, email: "a.cruz@ems.gov", phone: "+63 917 200 1066", location: "Pasig City, NCR", employeeId: "EMP-1015", joinDate: "Nov 8, 2023", notes: "Handles comms net during multi-agency drills." },
    { id: "P-004", name: "Carlos Bautista", dept: "Supply Delta", role: "Logistics", level: "Basic", certs: ["First Aid"], status: "Pending", enrolled: 1, email: "c.bautista@ems.gov", phone: "+63 917 200 1077", location: "Mandaluyong City, NCR", employeeId: "EMP-1103", joinDate: "Jun 19, 2024", notes: "Pending certification review before Active status." },
    { id: "P-005", name: "Elena Villanueva", dept: "Hazmat Echo", role: "Hazmat Specialist", level: "Advanced", certs: ["HAZMAT-OPS", "SCBA"], status: "Active", enrolled: 5, email: "e.villanueva@ems.gov", phone: "+63 917 200 1088", location: "Taguig City, NCR", employeeId: "EMP-1029", joinDate: "Feb 27, 2023", notes: "Certified SCBA field operations instructor." },
    { id: "P-006", name: "Miguel Torres", dept: "Rescue Alpha", role: "Rescue Technician", level: "Intermediate", certs: ["First Aid"], status: "Inactive", enrolled: 1, email: "m.torres@ems.gov", phone: "+63 917 200 1099", location: "San Juan City, NCR", employeeId: "EMP-1061", joinDate: "May 5, 2023", notes: "On extended leave; not currently available for deployment." },
  ];

  const allParticipants = [
    ...participants.map(p => ({ id: p.id, name: p.name, department: p.dept, role: p.role, level: p.level, certifications: p.certs.join("; "), status: p.status, enrolledPrograms: p.enrolled, source: "Seed Roster" })),
    ...app.participants.map(p => ({ id: p.id, name: p.name, department: p.dept || "—", role: p.role || "—", level: p.level || "—", certifications: "—", status: p.status || "Pending", enrolledPrograms: 0, source: "Self-Registered" })),
  ];
  const allAttendance = app.attendanceRecords.map(r => ({ id: r.id, participant: r.participantName, program: r.program, date: r.date, status: r.status, score: r.score ?? "—", certificate: r.certificate ?? "—" }));

  const filteredParticipants = (statusFilter === "all" ? participants : participants.filter(p => p.status === statusFilter))
    .filter(p => {
      const q = participantSearch.trim().toLowerCase();
      if (!q) return true;
      return [p.name, p.dept, p.role, p.level, p.email, p.employeeId, ...p.certs].join(" ").toLowerCase().includes(q);
    });
  const deployableCount = participants.filter(p => p.status === "Active").length;
  const filteredAttendance = (attendanceFilter === "all" ? app.attendanceRecords : app.attendanceRecords.filter(r => r.status === attendanceFilter))
    .filter(r => {
      const q = attendanceSearch.trim().toLowerCase();
      if (!q) return true;
      return [r.participantName, r.program, r.participantId ?? "", r.assessor ?? ""].join(" ").toLowerCase().includes(q);
    });

  const programGroups = Object.entries(
    app.attendanceRecords.reduce<Record<string, typeof app.attendanceRecords>>((acc, r) => {
      (acc[r.program] ??= []).push(r);
      return acc;
    }, {})
  )
    .map(([program, records]) => ({
      program,
      records,
      completed: records.filter(r => r.status === "Completed").length,
      inProgress: records.filter(r => r.status === "In Progress").length,
    }))
    .filter(g => !programSearch.trim() || [g.program, ...g.records.map(r => r.participantName)].join(" ").toLowerCase().includes(programSearch.trim().toLowerCase()))
    .sort((a, b) => b.records.length - a.records.length);

  const exportConfig = tab === "attendance"
    ? { title: "Attendance Records", desc: "Export every participant's training attendance record, including scores and certificates.", color: "text-primary", rows: allAttendance, coreFields: ["id", "participant", "program", "date", "status", "score"] }
    : { title: "Participant Profiles", desc: "Export all registered participants and their complete profiles, including self-registered accounts.", color: "text-blue-400", rows: allParticipants, coreFields: ["id", "name", "department", "role", "level", "status"] };

  return (
    <div className="space-y-5">
      {showRegisterModal && (
        <RegisterParticipantModal
          onConfirm={(name, email, dept, role) => {
            app.registerParticipant({ id: "", name, email, dept, role, status: "Pending" });
            app.addNotification({ type: "Registration", subject: `Registered: ${name}`, status: "Queued" });
            setShowRegisterModal(false);
          }}
          onCancel={() => setShowRegisterModal(false)}
        />
      )}
      {showExportModal && (
        <ExportContextModal
          title={exportConfig.title}
          desc={exportConfig.desc}
          color={exportConfig.color}
          rows={exportConfig.rows}
          coreFields={exportConfig.coreFields}
          filename={`dptss-${tab === "attendance" ? "attendance" : "participants"}-${new Date().toISOString().slice(0, 10)}`}
          onExported={(format) => {
            app.addNotification({ type: "Export", subject: `Exported ${exportConfig.title} (${format.toUpperCase()})`, status: "Sent" });
            setShowExportModal(false);
          }}
          onCancel={() => setShowExportModal(false)}
        />
      )}
      {viewProfile && (
        <ParticipantProfileModal
          participant={viewProfile}
          onClose={() => setViewProfile(null)}
          onMessage={() => setMessageTarget(viewProfile)}
        />
      )}
      {messageTarget && (
        <MessageParticipantModal
          participant={messageTarget}
          onSend={(subject, body) => {
            app.addNotification({ type: "Registration", subject: `Message to ${messageTarget.name}: ${subject}`, body, status: "Sent" });
          }}
          onCancel={() => setMessageTarget(null)}
        />
      )}
      <div className="flex items-center justify-between">
        <div><h1 className="text-4xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">PARTICIPANT REGISTRATION</h1><p className="text-muted-foreground text-base mt-0.5">Profiles · attendance records · self-service portal · notifications</p></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowRegisterModal(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-base font-semibold hover:bg-primary/90"><Plus size={16} />Register</button>
          <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 bg-secondary text-muted-foreground px-3 py-2 rounded-md text-base font-semibold hover:bg-secondary/90"><ClipboardList size={16} />Export</button>
        </div>
      </div>
      <TabBar tabs={[{ id: "profiles", label: "User Profiles", icon: UserCheck }, { id: "byProgram", label: "Users Per Program", icon: Layers }, { id: "attendance", label: "Attendance Records", icon: ClipboardList }, { id: "portal", label: "Self-Service Portal", icon: LogIn }, { id: "notifications", label: "Notifications", icon: Mail }]} active={tab} onChange={v => setTab(v as ParticipantTab)} />
      {tab === "profiles" && (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter size={13} className="text-primary" />
              <span>Filtered Participants — sort roster by deployment status: <span className="text-foreground font-semibold">{deployableCount} Active</span> participant{deployableCount === 1 ? "" : "s"} available for deployment.</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={participantSearch} onChange={e => setParticipantSearch(e.target.value)} placeholder="Search name, dept, role, cert..."
                  className="bg-input-background border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-56" />
              </div>
              <div className="flex gap-1.5">
                {(["all", "Active", "Inactive", "Pending"] as const).map(f => {
                  const count = f === "all" ? participants.length : participants.filter(p => p.status === f).length;
                  const Icon = f === "Active" ? UserCheck : f === "Inactive" ? UserX : f === "Pending" ? Clock : Users;
                  return (
                    <button key={f} onClick={() => setStatusFilter(f)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${statusFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                      <Icon size={12} />{f === "all" ? "All" : f}<span className="opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {filteredParticipants.length === 0 && (
            <div className="bg-card border border-border rounded-lg p-6 text-center text-xs text-muted-foreground">No participants match this filter.</div>
          )}
          {filteredParticipants.map(p => {
          const history = app.getAttendanceFor(p.id);
          const completedCount = history.filter(r => r.status === "Completed").length;
          const isOpen = expandedId === p.id;
          return (
            <div key={p.id} className="bg-card border border-border rounded-lg hover:border-[rgba(240,165,0,0.2)] transition-colors">
              <div className="p-3 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">{p.name.split(" ").map(n => n[0]).join("")}</div>
                <div className="flex-1 grid grid-cols-4 gap-4">
                  <div><div className="text-xs font-semibold text-foreground">{p.name}</div><div className="text-[12px] text-muted-foreground">{p.role} · {p.dept}</div></div>
                  <div><div className="flex flex-wrap gap-1">{p.certs.map(c => <span key={c} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{c}</span>)}</div></div>
                  <div className="flex items-center gap-1.5"><Badge status={p.status}>{p.status}</Badge><Badge status={p.level}>{p.level}</Badge></div>
                  <div className="text-xs font-mono text-muted-foreground">{completedCount} program{completedCount === 1 ? "" : "s"} attended</div>
                </div>
                <button onClick={() => setExpandedId(isOpen ? null : p.id)} className="flex items-center gap-1 text-[12px] font-mono text-muted-foreground hover:text-foreground px-2 py-1 rounded-md bg-secondary/60">
                  <ClipboardList size={13} />Attendance{isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <DropdownMenu items={[
                  { label: "View Full Profile", icon: Eye, onClick: () => setViewProfile(p) },
                  { label: "Message Participant", icon: Mail, onClick: () => setMessageTarget(p) },
                  { label: "Export Profile", icon: Download, onClick: () => exportRows(`dptss-profile-${p.id}`, `Participant Profile — ${p.name}`, [{ id: p.id, name: p.name, department: p.dept, role: p.role, level: p.level, status: p.status, email: p.email, phone: p.phone, employeeId: p.employeeId, joinDate: p.joinDate, certifications: p.certs.join("; "), enrolledPrograms: p.enrolled }], "csv") },
                ]} />
              </div>
              {isOpen && (
                <div className="border-t border-border bg-secondary/30 p-3 space-y-1.5 rounded-b-lg overflow-hidden">
                  {history.length === 0 ? (
                    <p className="text-[12px] text-muted-foreground px-1">No attendance records for this participant yet.</p>
                  ) : history.map(r => (
                    <div key={r.id} className="flex items-center gap-3 bg-card border border-border rounded-md px-3 py-2">
                      <span className="text-xs text-foreground flex-1">{r.program}</span>
                      <span className="text-[12px] font-mono text-muted-foreground">{new Date(r.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                      {typeof r.score === "number" && <span className="text-[12px] font-mono text-muted-foreground">{r.score}%</span>}
                      <Badge status={r.status}>{r.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}</div>
      )}
      {tab === "byProgram" && (
        <div className="space-y-2">
          <div className="bg-card border border-primary/15 rounded-lg p-4 flex items-center gap-3"><Info size={16} className="text-primary" /><p className="text-xs text-muted-foreground">Participants grouped by the program they joined — based on enrollment and attendance records. Expand a program to see its roster.</p></div>
          <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={programSearch} onChange={e => setProgramSearch(e.target.value)} placeholder="Search program or participant..."
                className="bg-input-background border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-64" />
            </div>
            <span className="text-[12px] font-mono text-muted-foreground">{programGroups.length} program{programGroups.length === 1 ? "" : "s"} with joined participants</span>
          </div>
          {programGroups.length === 0 && (
            <div className="bg-card border border-border rounded-lg p-6 text-center text-xs text-muted-foreground">No programs match this search.</div>
          )}
          {programGroups.map(g => {
            const isOpen = expandedProgram === g.program;
            return (
              <div key={g.program} className="bg-card border border-border rounded-lg hover:border-[rgba(240,165,0,0.2)] transition-colors">
                <button onClick={() => setExpandedProgram(isOpen ? null : g.program)} className="w-full p-3 flex items-center gap-4 text-left">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"><Layers size={14} className="text-primary" /></div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-foreground">{g.program}</div>
                    <div className="text-[12px] text-muted-foreground">{g.records.length} joined · {g.completed} completed · {g.inProgress} in progress</div>
                  </div>
                  <div className="flex -space-x-2 flex-shrink-0">
                    {g.records.slice(0, 4).map(r => (
                      <div key={r.id} title={r.participantName} className="w-6 h-6 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        {r.participantName.split(" ").map(n => n[0]).join("")}
                      </div>
                    ))}
                    {g.records.length > 4 && <div className="w-6 h-6 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[9px] font-bold text-muted-foreground">+{g.records.length - 4}</div>}
                  </div>
                  {isOpen ? <ChevronUp size={13} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={13} className="text-muted-foreground flex-shrink-0" />}
                </button>
                {isOpen && (
                  <div className="border-t border-border bg-secondary/30 p-3 space-y-1.5 rounded-b-lg overflow-hidden">
                    {g.records.map(r => (
                      <div key={r.id} className="flex items-center gap-3 bg-card border border-border rounded-md px-3 py-2">
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">{r.participantName.split(" ").map(n => n[0]).join("")}</div>
                        <span className="text-xs text-foreground flex-1">{r.participantName}</span>
                        <span className="text-[12px] font-mono text-muted-foreground">{new Date(r.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                        {typeof r.score === "number" && <span className="text-[12px] font-mono text-muted-foreground">{r.score}%</span>}
                        <Badge status={r.status}>{r.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {tab === "attendance" && (
        <div className="space-y-2">
          <div className="bg-card border border-primary/15 rounded-lg p-4 flex items-center gap-3"><Info size={16} className="text-primary" /><p className="text-xs text-muted-foreground">Every registered participant's training attendance is logged here — visible to Admin and Super Admin roles, and mirrored on each participant's own portal.</p></div>
          <div className="bg-card border border-border rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={attendanceSearch} onChange={e => setAttendanceSearch(e.target.value)} placeholder="Search participant, program, ID..."
                className="bg-input-background border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-64" />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(["all", "Completed", "In Progress", "No Show", "Enrolled"] as const).map(f => {
                const count = f === "all" ? app.attendanceRecords.length : app.attendanceRecords.filter(r => r.status === f).length;
                const Icon = f === "Completed" ? CheckCircle : f === "In Progress" ? Clock : f === "No Show" ? XCircle : f === "Enrolled" ? UserPlus : ClipboardList;
                return (
                  <button key={f} onClick={() => setAttendanceFilter(f)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${attendanceFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                    <Icon size={12} />{f === "all" ? "All" : f}<span className="opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
          {filteredAttendance.length === 0 && (
            <div className="bg-card border border-border rounded-lg p-6 text-center text-xs text-muted-foreground">No attendance records match this filter.</div>
          )}
          {filteredAttendance.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">{r.participantName.split(" ").map(n => n[0]).join("")}</div>
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div><div className="text-xs font-semibold text-foreground">{r.participantName}</div><div className="text-[12px] text-muted-foreground">{r.participantId ?? "—"}</div></div>
                <div><div className="text-xs text-foreground">{r.program}</div><div className="text-[12px] font-mono text-muted-foreground">{new Date(r.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</div></div>
                <div className="flex items-center gap-2"><Badge status={r.status}>{r.status}</Badge>{typeof r.score === "number" && <span className="text-[12px] font-mono text-muted-foreground">{r.score}%</span>}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === "portal" && (
        <div className="bg-card border border-primary/15 rounded-lg p-4 flex items-center gap-3"><Info size={16} className="text-primary" /><p className="text-xs text-muted-foreground">Self-service drill sign-up portal is available to all registered participants. Manage slot capacity and open/close registration per session.</p></div>
      )}
      {tab === "notifications" && (
        <div className="space-y-2">{[
          { id: "NTF-001", type: "Confirmation", recipient: "Maria Santos", subject: "Drill Confirmation — Jul 03 Earthquake Response", status: "Sent", sent: "Jun 29" },
          { id: "NTF-002", type: "Waiver", recipient: "Carlos Bautista", subject: "Digital Waiver — Hazmat Level 2 (action required)", status: "Queued", sent: "—" },
          { id: "NTF-003", type: "Study Material", recipient: "All SES-002 Enrollees", subject: "Pre-drill reading: Advanced Flood Evacuation SOP v3", status: "Sent", sent: "Jun 28" },
        ].map(n => (<div key={n.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-4"><span className="text-[11px] font-mono px-2 py-1 rounded bg-secondary text-muted-foreground">{n.type}</span><div className="flex-1"><div className="text-xs text-foreground">{n.subject}</div><div className="text-[12px] font-mono text-muted-foreground">{n.recipient}</div></div><Badge status={n.status}>{n.status}</Badge><span className="text-[12px] font-mono text-muted-foreground">{n.sent}</span></div>))}</div>
      )}
    </div>
  );
}

import { 
  Sparkles, ShieldAlert
} from "lucide-react";

type EvalModuleTab = "objectives" | "analytics" | "ai" | "assessor";

const trendHistory = [
  { drill: "D1", avgScore: 61, passRate: 58, respTime: 8.2 },
  { drill: "D2", avgScore: 67, passRate: 64, respTime: 7.5 },
  { drill: "D3", avgScore: 72, passRate: 70, respTime: 6.8 },
  { drill: "D4", avgScore: 69, passRate: 66, respTime: 7.1 },
  { drill: "D5", avgScore: 78, passRate: 75, respTime: 5.9 },
  { drill: "D6", avgScore: 82, passRate: 81, respTime: 5.2 },
];

const ASSESSOR_PARTICIPANTS = ["Maria Santos", "Jose Reyes", "Carlos Bautista"];
const SCORE_CATEGORIES = ["Command", "Protocols", "Response Speed", "Coordination"];

export function EvalModule() {
  const app = useApp();
  const [tab, setTab] = useState<EvalTab>("objectives");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [objs, setObjs] = useState([
    { id: 1, text: "IC assumes command on radio net", done: true, time: "1:42", limit: "2 min" },
    { id: 2, text: "Gas valve shut off at utility panel", done: true, time: "1:58", limit: "2 min" },
    { id: 3, text: "Evacuation route cleared and opened", done: false, time: "6:12", limit: "5 min" },
    { id: 4, text: "Triage zone with START protocol", done: true, time: "4:31", limit: "5 min" },
    { id: 5, text: "SITREP transmitted to EOC", done: true, time: "9:05", limit: "10 min" },
    { id: 6, text: "Accountability check completed", done: false, time: "—", limit: "10 min" },
  ]);

  const passed = objs.filter(o => o.done).length;
  const radarData = [
    { subject: "Command", A: 88, B: 72 },
    { subject: "Response", A: 75, B: 80 },
    { subject: "Comms", A: 92, B: 65 },
    { subject: "Protocols", A: 85, B: 78 },
    { subject: "Safety", A: 90, B: 82 },
    { subject: "Coord.", A: 78, B: 70 },
  ];

  const [assessParticipant, setAssessParticipant] = useState(ASSESSOR_PARTICIPANTS[0]);
  const [assessScores, setAssessScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(SCORE_CATEGORIES.map(c => [c, Math.floor(Math.random() * 20 + 75)]))
  );
  const [assessNotes, setAssessNotes] = useState("");
  const [submissions, setSubmissions] = useState([
    { name: "Maria Santos", score: 94, note: "Excellent command presence." },
    { name: "Ana Cruz", score: 88, note: "Strong comms, minor SITREP delay." },
    { name: "Jose Reyes", score: 76, note: "Triage initiated, slow IC comms." },
  ]);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const overallScore = Math.round(SCORE_CATEGORIES.reduce((sum, c) => sum + (assessScores[c] ?? 0), 0) / SCORE_CATEGORIES.length);

  const knownAssessorNames = Array.from(new Set([
    ...app.attendanceRecords.map(r => r.assessor).filter(Boolean) as string[],
    ...app.assessorEvaluations.map(e => e.assessorName),
  ]));
  const displayAssessors = knownAssessorNames.length ? knownAssessorNames : ["Eval. Torres", "Eval. Lim", "Eval. Cruz"];
  const [selectedAssessor, setSelectedAssessor] = useState(displayAssessors[0]);
  const selectedEvals = app.getEvaluationsFor(selectedAssessor);
  const avgSelected = selectedEvals.length ? selectedEvals.reduce((s, e) => s + e.rating, 0) / selectedEvals.length : 0;
  const ratingChartData = [...selectedEvals].reverse().map((e, i) => ({ label: `#${i + 1}`, rating: e.rating }));

  const handleSubmitScore = () => {
    if (!assessParticipant) return;
    setSubmissions(prev => [{ name: assessParticipant, score: overallScore, note: assessNotes.trim() || "No field observations recorded." }, ...prev]);
    app.addNotification({ type: "Evaluation", subject: `Score submitted for ${assessParticipant}: ${overallScore}%`, status: "Sent" });
    setAssessNotes("");
    setAssessScores(Object.fromEntries(SCORE_CATEGORIES.map(c => [c, Math.floor(Math.random() * 20 + 75)])));
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 1800);
  };

  // Upgraded AI Evaluation Logic Engine with Assessor Data Integration
  const aiReport = useMemo(() => {
    const total = objs.length;
    const missedObjs = objs.filter(o => !o.done);
    const passPercentage = Math.round((passed / total) * 100);

    // 1. Compute Assessor Dashboard Scores
    const totalAssessorScore = submissions.reduce((acc, s) => acc + s.score, 0);
    const avgAssessorScore = submissions.length ? Math.round(totalAssessorScore / submissions.length) : 0;

    // 2. Discrepancy & Gap Analysis
    const scoreGap = avgAssessorScore - passPercentage;
    let gapInsight = "Field evaluations align well with drill objective completion.";
    if (scoreGap > 15) {
      gapInsight = "High field scores despite missed time limits suggest lenient assessor grading or execution bottlenecks.";
    } else if (scoreGap < -15) {
      gapInsight = "Strict assessor grading detected relative to objective completion rates.";
    }

    // 3. Trend & Radar Analysis
    const firstDrill = trendHistory[0];
    const latestDrill = trendHistory[trendHistory.length - 1];
    const scoreGain = latestDrill.avgScore - firstDrill.avgScore;
    const speedGain = (firstDrill.respTime - latestDrill.respTime).toFixed(1);

    const sortedRadar = [...radarData].sort((a, b) => (a.A + a.B) - (b.A + b.B));
    const lowestCompetency = sortedRadar[0]?.subject || "Coordination";

    // Readiness Level Assessment
    let readinessStatus = "CRITICAL";
    let statusColor = "text-red-400";
    if (passPercentage >= 85) {
      readinessStatus = "OPERATIONAL READY";
      statusColor = "text-green-400";
    } else if (passPercentage >= 65) {
      readinessStatus = "MODERATE CAPABILITY";
      statusColor = "text-yellow-400";
    }

    return {
      passPercentage,
      avgAssessorScore,
      missedObjs,
      scoreGain,
      speedGain,
      lowestCompetency,
      readinessStatus,
      statusColor,
      summaryText: `The unit demonstrates an overall objective completion rate of ${passPercentage}%. Field assessor evaluations average ${avgAssessorScore}%. ${gapInsight} Response times have improved by ${speedGain} mins across drills (D1-D6).`
    };
  }, [objs, passed, submissions]);

  const triggerAiReassessment = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 1200);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">PERFORMANCE EVALUATION</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Objective tracking · analytics · AI evaluation engine</p>
        </div>
        <div className="text-xs font-mono text-muted-foreground bg-secondary px-3 py-2 rounded-md">Earthquake Response — Advanced · Jun 28</div>
      </div>

      <TabBar 
        tabs={[
          { id: "objectives", label: "Objective Tracking", icon: CheckSquare },
          { id: "analytics", label: "Analytics", icon: BarChart3 },
          { id: "ai", label: "AI Evaluation", icon: Sparkles },
          { id: "assessor", label: "Assessor Dashboard", icon: Smartphone }
        ]} 
        active={tab} 
        onChange={v => setTab(v as EvalTab)} 
      />

      {/* Tab 1: Objectives */}
      {tab === "objectives" && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            {[{ label: "Total", value: objs.length, color: "text-foreground" }, { label: "Passed", value: passed, color: "text-green-400" }, { label: "Missed", value: objs.length - passed, color: "text-red-400" }, { label: "Score", value: `${Math.round(passed / objs.length * 100)}%`, color: "text-primary" }].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-lg p-4">
                <div className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{s.label}</div>
                <div className={`text-2xl font-bold font-['Barlow_Condensed'] ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {objs.map(o => (
              <div key={o.id} className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/30">
                <button onClick={() => setObjs(prev => prev.map(x => x.id === o.id ? { ...x, done: !x.done } : x))}>
                  {o.done ? <CheckSquare size={17} className="text-green-400" /> : <Square size={17} className="text-muted-foreground" />}
                </button>
                <span className="flex-1 text-xs text-foreground">{o.text}</span>
                <span className={`text-xs font-mono font-bold ${o.done ? "text-green-400" : "text-red-400"}`}>{o.time}</span>
                <span className="text-[12px] font-mono text-muted-foreground">/ {o.limit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Analytics */}
      {tab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-4">Competency Radar</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(240,246,252,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#8b949e", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                <Radar key="radar-eval-alpha" name="Rescue Alpha" dataKey="A" stroke="#f0a500" fill="#f0a500" fillOpacity={0.15} strokeWidth={2} />
                <Radar key="radar-eval-bravo" name="Medical Bravo" dataKey="B" stroke="#58a6ff" fill="#58a6ff" fillOpacity={0.1} strokeWidth={2} />
                <Tooltip contentStyle={{ background: "#1c2128", border: "1px solid rgba(240,246,252,0.1)", borderRadius: 6, fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Individual Scores</h3>
            <div className="space-y-2">
              {[{ name: "Maria Santos", score: 94 }, { name: "Jose Reyes", score: 76 }, { name: "Carlos Bautista", score: 58 }, { name: "Ana Cruz", score: 88 }, { name: "Elena Villanueva", score: 91 }].map(p => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs text-foreground w-36 truncate">{p.name}</span>
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.score >= 80 ? "bg-green-400" : p.score >= 65 ? "bg-primary" : "bg-red-400"}`} style={{ width: `${p.score}%` }} />
                  </div>
                  <span className={`text-xs font-mono font-bold w-8 text-right ${p.score >= 80 ? "text-green-400" : p.score >= 65 ? "text-primary" : "text-red-400"}`}>{p.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AI Evaluation Module */}
      {(tab as string) === "ai" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="text-primary" size={20} />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider font-['Barlow_Condensed']">AI Evaluation & Tactical Insights</h3>
              </div>
              <button 
                onClick={triggerAiReassessment} 
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 text-xs bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-md text-foreground transition-colors disabled:opacity-50"
              >
                <RefreshCw size={13} className={isAnalyzing ? "animate-spin" : ""} />
                {isAnalyzing ? "Analyzing Drill..." : "Re-Run AI Analysis"}
              </button>
            </div>

            {/* Top Cards: Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-secondary/40 border border-border p-3.5 rounded-md">
                <div className="text-[11px] font-mono text-muted-foreground uppercase">Readiness Assessment</div>
                <div className={`text-lg font-bold font-['Barlow_Condensed'] mt-1 ${aiReport.statusColor}`}>
                  {aiReport.readinessStatus}
                </div>
              </div>
              <div className="bg-secondary/40 border border-border p-3.5 rounded-md">
                <div className="text-[11px] font-mono text-muted-foreground uppercase">Field Assessor Avg</div>
                <div className="text-lg font-bold font-['Barlow_Condensed'] mt-1 text-primary">
                  {aiReport.avgAssessorScore}%
                </div>
              </div>
              <div className="bg-secondary/40 border border-border p-3.5 rounded-md">
                <div className="text-[11px] font-mono text-muted-foreground uppercase">Response Efficiency</div>
                <div className="text-lg font-bold font-['Barlow_Condensed'] mt-1 text-foreground flex items-center gap-1">
                  <TrendingUp size={16} className="text-green-400" />
                  +{aiReport.speedGain} min
                </div>
              </div>
              <div className="bg-secondary/40 border border-border p-3.5 rounded-md">
                <div className="text-[11px] font-mono text-muted-foreground uppercase">Focus Gap Sector</div>
                <div className="text-lg font-bold font-['Barlow_Condensed'] mt-1 text-primary">
                  {aiReport.lowestCompetency}
                </div>
              </div>
            </div>

            {/* AI Narrative Analysis */}
            <div className="bg-secondary/20 border border-primary/20 rounded-md p-4 space-y-2">
              <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase font-semibold">
                <Sparkles size={14} /> Executive Summary Directive
              </div>
              <p className="text-xs leading-relaxed text-foreground/90 font-mono">
                {aiReport.summaryText}
              </p>
            </div>

            {/* Bottlenecks and Failure Points */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-md p-4 space-y-2">
                <h4 className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert size={15} /> Identified Failure Points ({aiReport.missedObjs.length})
                </h4>
                {aiReport.missedObjs.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">All drill objectives completed successfully.</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {aiReport.missedObjs.map(m => (
                      <li key={m.id} className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 p-2 rounded">
                        <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-foreground">{m.text}</span>
                          <div className="text-[11px] font-mono text-muted-foreground">Recorded Time: {m.time} (Target Limit: {m.limit})</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Actionable Recommendations */}
              <div className="bg-card border border-border rounded-md p-4 space-y-2">
                <h4 className="text-xs font-mono font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle size={15} /> Tactical Action Items
                </h4>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-start gap-2 bg-secondary/50 p-2 rounded border border-border">
                    <span className="text-primary font-bold">1.</span>
                    <span className="text-foreground">Re-evaluate staging protocols for <b>{aiReport.lowestCompetency}</b> team units in subsequent scenarios.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-secondary/50 p-2 rounded border border-border">
                    <span className="text-primary font-bold">2.</span>
                    <span className="text-foreground">Enforce mandatory radio check-in procedures prior to the 5-minute mark to fix timing gaps.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Assessor Dashboard */}
      {tab === "assessor" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">Quick Score Entry</h3>
              <select value={assessParticipant} onChange={e => setAssessParticipant(e.target.value)} className="w-full bg-input-background border border-border rounded-md px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {ASSESSOR_PARTICIPANTS.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                {SCORE_CATEGORIES.map(c => (
                  <div key={c}>
                    <label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest block mb-1">{c}</label>
                    <input type="number" min="0" max="100" value={assessScores[c]} onChange={e => setAssessScores(prev => ({ ...prev, [c]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))} className="w-full bg-input-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                ))}
              </div>
              <textarea rows={3} value={assessNotes} onChange={e => setAssessNotes(e.target.value)} placeholder="Field observations..." className="w-full bg-input-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-mono text-muted-foreground">Overall: <span className={`font-bold ${overallScore >= 80 ? "text-green-400" : overallScore >= 65 ? "text-primary" : "text-red-400"}`}>{overallScore}%</span></span>
                <button onClick={handleSubmitScore} disabled={!assessParticipant} className={`flex items-center justify-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 ${justSubmitted ? "bg-green-500/90 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>{justSubmitted ? "Submitted" : "Submit"}</button>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-5 space-y-3">
              <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">Recent Submissions</h3>
              {submissions.map((s, i) => (
                <div key={i} className="p-2.5 rounded-md bg-secondary/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{s.name}</span>
                    <span className={`text-xs font-bold font-mono ${s.score >= 80 ? "text-green-400" : "text-primary"}`}>{s.score}</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{s.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-3 lg:col-span-1">
              <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">Assessor Ratings Overview</h3>
              <div className="space-y-2.5">
                {displayAssessors.map(name => {
                  const evals = app.getEvaluationsFor(name);
                  const avg = evals.length ? evals.reduce((s, e) => s + e.rating, 0) / evals.length : 0;
                  const active = selectedAssessor === name;
                  return (
                    <button key={name} onClick={() => setSelectedAssessor(name)} className={`w-full text-left p-2.5 rounded-md transition-colors border ${active ? "bg-primary/10 border-primary/20" : "bg-secondary/50 border-transparent hover:bg-secondary"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">{name}</span>
                        <span className="text-xs font-mono font-bold text-primary">{evals.length ? avg.toFixed(1) : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map(n => <Star key={n} size={11} className={Math.round(avg) >= n ? "text-primary fill-primary" : "text-muted-foreground"} />)}</div>
                        <span className="text-[12px] font-mono text-muted-foreground">{evals.length} rating{evals.length === 1 ? "" : "s"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">Rating History — {selectedAssessor}</h3>
                <span className="text-xs font-mono text-muted-foreground">Avg: <span className="text-primary font-bold">{selectedEvals.length ? avgSelected.toFixed(1) : "—"}</span> / 5</span>
              </div>
              {selectedEvals.length === 0 ? (
                <div className="text-xs text-muted-foreground py-10 text-center">No participant ratings submitted yet for {selectedAssessor}.</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={ratingChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <defs><linearGradient id="assessor-rating-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f0a500" stopOpacity={0.2} /><stop offset="95%" stopColor="#f0a500" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,246,252,0.06)" />
                      <XAxis dataKey="label" tick={{ fill: "#8b949e", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 5]} tick={{ fill: "#8b949e", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#1c2128", border: "1px solid rgba(240,246,252,0.1)", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono" }} />
                      <Area key="area-assessor-rating" type="monotone" dataKey="rating" name="Rating" stroke="#f0a500" fill="url(#assessor-rating-grad)" strokeWidth={2} dot={{ fill: "#f0a500", r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                    {selectedEvals.map(e => (
                      <div key={e.id} className="p-2.5 rounded-md bg-secondary/50">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-semibold text-foreground">{e.participantName}</span>
                          <div className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map(n => <Star key={n} size={11} className={e.rating >= n ? "text-primary fill-primary" : "text-muted-foreground"} />)}</div>
                        </div>
                        <div className="text-[12px] font-mono text-muted-foreground">{e.program} · {new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                        {e.comments && <p className="text-[12px] text-muted-foreground mt-1 italic">"{e.comments}"</p>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportModule() {
  const app = useApp();
  const [tab, setTab] = useState<ReportTab>("aar");
  const [showExportModal, setShowExportModal] = useState(false);
  const compliance = [
    { name: "Fire Safety", score: 94, target: 90, status: "Passed" }, { name: "Earthquake Protocol", score: 82, target: 85, status: "Failed" },
    { name: "Flood Evacuation", score: 91, target: 90, status: "Passed" }, { name: "Hazmat Response", score: 88, target: 85, status: "Passed" },
    { name: "Mass Casualty", score: 79, target: 80, status: "Failed" }, { name: "Communications", score: 96, target: 90, status: "Passed" },
  ];
  const aarStrengths = ["Rapid medical deployment — triage in 4:31 (target: 5 min)", "Communications protocols maintained throughout all phases", "Gas valve shutoff avg 1:52 across all teams"];
  const aarGaps = ["Evacuation signage inadequate in Sector C — avg time 6:12 vs 5:00 target", "Accountability check missed by 4 teams within 10-minute limit", "Equipment cache access delayed 3–5 min by procedural bottleneck"];
  const aarRecs = [{ p: "Critical", t: "Update Sector C maps and install additional signage" }, { p: "High", t: "Streamline cache retrieval — pre-position equipment" }, { p: "Medium", t: "ICS refresher for 4 newly assigned team leads" }];

  const aarRow = [{ reportId: "RPT-2026-018", title: "Earthquake Response — Advanced", date: "Jun 28, 2026", location: "District 4 EOC", participants: 42, status: "Completed", strengths: aarStrengths.join(" | "), gaps: aarGaps.join(" | "), recommendations: aarRecs.map(r => `[${r.p}] ${r.t}`).join(" | ") }];
  const complianceRows = compliance.map(c => ({ category: c.name, score: `${c.score}%`, target: `${c.target}%`, status: c.status, margin: `${(c.score - c.target).toFixed(0)}pts` }));
  const trendRows = trendHistory.map((t: any) => ({ drill: t.drill, avgScore: t.avgScore, passRate: t.passRate }));

  const exportConfig = tab === "aar"
    ? { title: "After-Action Report", desc: "Export the full after-action report including strengths, gaps, and recommendations.", color: "text-primary", rows: aarRow, coreFields: ["reportId", "title", "date", "location", "participants", "status"] }
    : tab === "compliance"
    ? { title: "Compliance Analytics", desc: "Export compliance scores against targets for every drill category.", color: "text-green-400", rows: complianceRows, coreFields: ["category", "score", "target", "status"] }
    : { title: "Trend Analysis", desc: "Export historical score and pass-rate trend data across drills.", color: "text-blue-400", rows: trendRows, coreFields: ["drill", "avgScore", "passRate"] };

  return (
    <div className="space-y-5">
      {showExportModal && (
        <ExportContextModal
          title={exportConfig.title}
          desc={exportConfig.desc}
          color={exportConfig.color}
          rows={exportConfig.rows}
          coreFields={exportConfig.coreFields}
          filename={`dptss-${tab}-report-${new Date().toISOString().slice(0, 10)}`}
          onExported={(format) => {
            app.addNotification({ type: "Export", subject: `Exported ${exportConfig.title} (${format.toUpperCase()})`, status: "Sent" });
            setShowExportModal(false);
          }}
          onCancel={() => setShowExportModal(false)}
        />
      )}
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">DISASTER DRILL REPORTING</h1><p className="text-muted-foreground text-sm mt-0.5">After-action reports · compliance · trend analysis</p></div>
        <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary/90"><Download size={16} />Export</button>
      </div>
      <TabBar tabs={[{ id: "aar", label: "After-Action Report", icon: FileCheck }, { id: "compliance", label: "Compliance Analytics", icon: Shield }, { id: "trends", label: "Trend Analysis", icon: Trend }]} active={tab} onChange={v => setTab(v as ReportTab)} />
      {tab === "aar" && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div><div className="flex items-center gap-2 mb-1"><span className="text-[12px] font-mono text-muted-foreground">RPT-2026-018</span><Badge status="Completed">Completed</Badge></div><h2 className="text-lg font-bold font-['Barlow_Condensed'] text-foreground">Earthquake Response — Advanced</h2><div className="flex gap-4 mt-1 text-xs font-mono text-muted-foreground"><span>Jun 28, 2026</span><span>·</span><span>District 4 EOC</span><span>·</span><span>42 participants</span></div></div>
          <div className="grid grid-cols-2 gap-4">
            <div><div className="text-[12px] font-mono text-green-400 uppercase tracking-widest mb-2">Strengths</div><div className="space-y-1.5">{["Rapid medical deployment — triage in 4:31 (target: 5 min)", "Communications protocols maintained throughout all phases", "Gas valve shutoff avg 1:52 across all teams"].map((s, i) => (<div key={i} className="flex items-start gap-2 p-2 rounded bg-green-500/5 border border-green-500/10"><span className="w-1 h-1 rounded-full bg-green-400 mt-1.5 flex-shrink-0" /><span className="text-xs text-muted-foreground">{s}</span></div>))}</div></div>
            <div><div className="text-[12px] font-mono text-red-400 uppercase tracking-widest mb-2">Gaps & Failures</div><div className="space-y-1.5">{["Evacuation signage inadequate in Sector C — avg time 6:12 vs 5:00 target", "Accountability check missed by 4 teams within 10-minute limit", "Equipment cache access delayed 3–5 min by procedural bottleneck"].map((g, i) => (<div key={i} className="flex items-start gap-2 p-2 rounded bg-red-500/5 border border-red-500/10"><span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" /><span className="text-xs text-muted-foreground">{g}</span></div>))}</div></div>
          </div>
          <div><div className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Recommendations</div><div className="space-y-1.5">{[{ p: "Critical", t: "Update Sector C maps and install additional signage" }, { p: "High", t: "Streamline cache retrieval — pre-position equipment" }, { p: "Medium", t: "ICS refresher for 4 newly assigned team leads" }].map((r, i) => (<div key={i} className="flex items-start gap-2 p-2 rounded bg-secondary/50"><Badge status={r.p}>{r.p}</Badge><span className="text-xs text-muted-foreground">{r.t}</span></div>))}</div></div>
        </div>
      )}
      {tab === "compliance" && (
        <div className="space-y-3">{compliance.map(c => (<div key={c.name} className="flex items-center gap-4 p-3 rounded-lg bg-card border border-border"><span className="text-xs text-foreground w-36">{c.name}</span><div className="flex-1 relative h-6 bg-secondary rounded"><div className={`h-full rounded ${c.score >= c.target ? "bg-green-500/30" : "bg-red-500/20"}`} style={{ width: `${c.score}%` }} /><div className="absolute top-0 bottom-0 border-l-2 border-dashed border-yellow-400/60" style={{ left: `${c.target}%` }} /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px] font-mono font-bold text-foreground">{c.score}%</span></div><span className="text-[12px] font-mono text-muted-foreground w-16">min {c.target}%</span><Badge status={c.status}>{c.status}</Badge></div>))}</div>
      )}
      {tab === "trends" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">{[{ label: "Score Improvement", value: "+21pts", color: "text-green-400" }, { label: "Pass Rate Growth", value: "+23%", color: "text-primary" }, { label: "Response Time Δ", value: "−3.0 min", color: "text-blue-400" }].map(s => (<div key={s.label} className="bg-card border border-border rounded-lg p-4"><div className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{s.label}</div><div className={`text-2xl font-bold font-['Barlow_Condensed'] ${s.color}`}>{s.value}</div></div>))}</div>
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-4">Score & Pass Rate Trends</h3>
            <ResponsiveContainer width="100%" height={200}><AreaChart data={trendHistory} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}><defs><linearGradient id="rpt-score-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f0a500" stopOpacity={0.2} /><stop offset="95%" stopColor="#f0a500" stopOpacity={0} /></linearGradient><linearGradient id="rpt-pass-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3fb950" stopOpacity={0.2} /><stop offset="95%" stopColor="#3fb950" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(240,246,252,0.06)" /><XAxis dataKey="drill" tick={{ fill: "#8b949e", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} /><YAxis domain={[50, 100]} tick={{ fill: "#8b949e", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#1c2128", border: "1px solid rgba(240,246,252,0.1)", borderRadius: 6, fontSize: 11 }} /><Area key="area-rpt-score" type="monotone" dataKey="avgScore" name="Avg Score" stroke="#f0a500" fill="url(#rpt-score-grad)" strokeWidth={2} dot={{ fill: "#f0a500", r: 3 }} /><Area key="area-rpt-pass" type="monotone" dataKey="passRate" name="Pass Rate" stroke="#3fb950" fill="url(#rpt-pass-grad)" strokeWidth={2} dot={{ fill: "#3fb950", r: 3 }} /></AreaChart></ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

type ManagedUser = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  dept: string;
  title: string;
  location: string;
  status: "Active" | "Suspended";
  joinDate: string;
  lastLogin: string;
  avatar: string;
  certifications: string[];
  notes: string;
};

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  superadmin: ["Full system access", "Manage users & roles", "System settings & config", "Data export (all modules)", "Audit log access"],
  admin: ["Manage training programs", "Manage participants", "Launch scenarios & drills", "View & export reports"],
  user: ["View assigned trainings", "Submit self-evaluations", "View own certificates & attendance"],
};

const initialUsers: ManagedUser[] = [
  { id: "USR-001", employeeId: "EMS-00114", name: "Director Reyes", email: "superadmin@ems.gov", phone: "+63 917 200 1141", role: "superadmin", dept: "Command HQ", title: "Executive Director", location: "Central Command, Quezon City", status: "Active", joinDate: "2019-03-11", lastLogin: "Jun 30, 09:01", avatar: "DR", certifications: ["ICS-400 Advanced Command", "Emergency Management Professional (CEM)", "HAZMAT Awareness"], notes: "Platform owner. Oversees all divisions and system configuration." },
  { id: "USR-002", employeeId: "EMS-00227", name: "Capt. Santos", email: "admin@ems.gov", phone: "+63 917 200 2278", role: "admin", dept: "Training Division", title: "Training Division Captain", location: "Field Station 2, Quezon City", status: "Active", joinDate: "2020-07-02", lastLogin: "Jun 30, 08:45", avatar: "CS", certifications: ["ICS-300 Intermediate Command", "Master Training Specialist", "CPR/AED Instructor"], notes: "Manages curriculum design and scenario builder content." },
  { id: "USR-003", employeeId: "EMS-00341", name: "Lt. Cruz", email: "lcruz@ems.gov", phone: "+63 917 200 3419", role: "admin", dept: "Operations", title: "Operations Lieutenant", location: "Central Command, Quezon City", status: "Active", joinDate: "2021-01-19", lastLogin: "Jun 29, 14:30", avatar: "LC", certifications: ["ICS-300 Intermediate Command", "Search & Rescue Team Leader"], notes: "Coordinates field deployments and drill reporting." },
  { id: "USR-004", employeeId: "EMS-01052", name: "Maria Santos", email: "m.santos@ems.gov", phone: "+63 917 200 5104", role: "user", dept: "Rescue Alpha", title: "Rescue Technician", location: "Field Station 1, Quezon City", status: "Active", joinDate: "2022-05-14", lastLogin: "Jun 30, 08:12", avatar: "MS", certifications: ["Earthquake Response", "Flood Evacuation Protocol", "Hazmat Level 1"], notes: "Top performer across recent earthquake and flood drills." },
  { id: "USR-005", employeeId: "EMS-01087", name: "Jose Reyes", email: "j.reyes@ems.gov", phone: "+63 917 200 5871", role: "user", dept: "Medical Bravo", title: "EMT-Paramedic", location: "Field Station 2, Quezon City", status: "Active", joinDate: "2022-09-30", lastLogin: "Jun 29, 16:02", avatar: "JR", certifications: ["Wildfire Response Drill", "CPR Recertification"], notes: "Due for CPR recertification renewal next quarter." },
  { id: "USR-006", employeeId: "EMS-01123", name: "Ana Cruz", email: "a.cruz@ems.gov", phone: "+63 917 200 1236", role: "user", dept: "Command HQ", title: "Logistics Coordinator", location: "Central Command, Quezon City", status: "Active", joinDate: "2023-02-08", lastLogin: "Jun 29, 11:55", avatar: "AC", certifications: ["ICS-200 Command Structure", "Earthquake Response"], notes: "Handles supply coordination during command-level exercises." },
  { id: "USR-007", employeeId: "EMS-00998", name: "Carlos Bautista", email: "c.bautista@ems.gov", phone: "+63 917 200 9982", role: "user", dept: "Supply Delta", title: "Logistics Officer", location: "Warehouse Depot, Quezon City", status: "Suspended", joinDate: "2021-11-22", lastLogin: "Jun 20, 09:00", avatar: "CB", certifications: ["Basic First Aid"], notes: "Suspended pending review — missed Basic First Aid drill without notice." },
  { id: "USR-008", employeeId: "EMS-01201", name: "Elena Villanueva", email: "e.villanueva@ems.gov", phone: "+63 917 200 2011", role: "user", dept: "Hazmat Echo", title: "Hazmat Specialist", location: "Field Station 3, Quezon City", status: "Active", joinDate: "2023-06-19", lastLogin: "Jun 30, 07:58", avatar: "EV", certifications: ["Hazmat Level 2", "SCBA Field Operations"], notes: "Currently completing Hazmat Level 2 certification track." },
];

function UserDetailModal({ user, onClose, onToggleStatus, onChangeRole }: { user: ManagedUser; onClose: () => void; onToggleStatus: (id: string) => void; onChangeRole: (id: string, role: Role) => void }) {
  const app = useApp();
  const roleColors: Record<Role, string> = {
    superadmin: "bg-primary/20 text-primary border-primary/30",
    admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    user: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  const roleLabels: Record<Role, string> = { superadmin: "Super Admin", admin: "Admin", user: "User" };
  const attendance = app.getAttendanceFor(user.name);

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
        <motion.div
          className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col"
          initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent flex-shrink-0" />

          <div className="p-6 flex items-start justify-between gap-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3.5">
              <AvatarCircle initials={user.avatar} color={user.role === "superadmin" ? "bg-primary/20" : user.role === "admin" ? "bg-purple-500/20" : "bg-blue-500/20"} />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">{user.name}</h2>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${roleColors[user.role]}`}>{roleLabels[user.role]}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{user.title} · {user.dept}</div>
                <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{user.id} · {user.employeeId}</div>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary flex-shrink-0"><X size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center gap-2">
              <Badge status={user.status}>{user.status}</Badge>
              <span className="text-[12px] font-mono text-muted-foreground">Last login: {user.lastLogin}</span>
            </div>

            <div>
              <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-2.5">Contact Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 bg-secondary/40 rounded-md p-2.5"><Mail size={14} className="text-muted-foreground flex-shrink-0" /><span className="text-xs font-mono text-foreground truncate">{user.email}</span></div>
                <div className="flex items-center gap-2.5 bg-secondary/40 rounded-md p-2.5"><Phone size={14} className="text-muted-foreground flex-shrink-0" /><span className="text-xs font-mono text-foreground">{user.phone}</span></div>
                <div className="flex items-center gap-2.5 bg-secondary/40 rounded-md p-2.5"><Briefcase size={14} className="text-muted-foreground flex-shrink-0" /><span className="text-xs text-foreground">{user.dept}</span></div>
                <div className="flex items-center gap-2.5 bg-secondary/40 rounded-md p-2.5"><MapPinned size={14} className="text-muted-foreground flex-shrink-0" /><span className="text-xs text-foreground truncate">{user.location}</span></div>
                <div className="flex items-center gap-2.5 bg-secondary/40 rounded-md p-2.5"><Calendar size={14} className="text-muted-foreground flex-shrink-0" /><span className="text-xs text-foreground">Joined {user.joinDate}</span></div>
                <div className="flex items-center gap-2.5 bg-secondary/40 rounded-md p-2.5"><Hash size={14} className="text-muted-foreground flex-shrink-0" /><span className="text-xs font-mono text-foreground">{user.employeeId}</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-2.5">Role & Permissions</h3>
              <div className="bg-secondary/40 rounded-md p-3 space-y-1.5">
                {ROLE_PERMISSIONS[user.role].map(p => (
                  <div key={p} className="flex items-center gap-2 text-xs text-foreground"><CheckCircle size={13} className="text-accent flex-shrink-0" />{p}</div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-2.5">Certifications</h3>
              <div className="flex flex-wrap gap-1.5">
                {user.certifications.length ? user.certifications.map(c => (
                  <span key={c} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"><Award size={12} />{c}</span>
                )) : <span className="text-xs text-muted-foreground">No certifications on record.</span>}
              </div>
            </div>

            <div>
              <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-2.5">Training Attendance History</h3>
              {attendance.length ? (
                <div className="bg-secondary/40 rounded-md overflow-hidden divide-y divide-border">
                  {attendance.map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{r.program}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">{r.date}{r.certificate ? ` · ${r.certificate}` : ""}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {typeof r.score === "number" && <span className="text-[11px] font-mono text-muted-foreground">{r.score}%</span>}
                        <Badge status={r.status}>{r.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground">No attendance records found for this user.</p>}
            </div>

            {user.notes && (
              <div>
                <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-2.5">Notes</h3>
                <p className="text-xs text-muted-foreground bg-secondary/40 rounded-md p-3 leading-relaxed">{user.notes}</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border flex items-center justify-end gap-2 flex-shrink-0 bg-card">
            <button onClick={() => onToggleStatus(user.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${user.status === "Active" ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-green-500/10 text-green-400 hover:bg-green-500/20"}`}>
              {user.status === "Active" ? <UserX size={14} /> : <UserCheck size={14} />}
              {user.status === "Active" ? "Suspend Account" : "Reactivate Account"}
            </button>
            <select value={user.role} onChange={e => onChangeRole(user.id, e.target.value as Role)}
              className="bg-input-background border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
            <button onClick={onClose} className="px-3 py-2 rounded-md text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Close</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function AddUserModal({ onClose, onCreate }: { onClose: () => void; onCreate: (u: ManagedUser) => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "user" as Role, dept: "", title: "", location: "" });
  const canSubmit = form.name.trim() && form.email.trim();

  const submit = () => {
    if (!canSubmit) return;
    const today = new Date().toISOString().slice(0, 10);
    const newUser: ManagedUser = {
      id: `USR-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      employeeId: `EMS-${Math.floor(1000 + Math.random() * 9000)}`,
      name: form.name, email: form.email, phone: form.phone || "—",
      role: form.role, dept: form.dept || "General", title: form.title || "—",
      location: form.location || "—", status: "Active", joinDate: today, lastLogin: "—",
      avatar: form.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase(),
      certifications: [], notes: "",
    };
    onCreate(newUser);
  };

  const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <div>
      <label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full mt-1 bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
        <motion.div
          className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">ADD NEW USER</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Field label="Full Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Maria Santos" /></div>
              <div className="col-span-2"><Field label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="name@ems.gov" /></div>
              <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="+63 917 000 0000" />
              <div>
                <label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
                  className="w-full mt-1 bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <Field label="Job Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. Rescue Technician" />
              <Field label="Department" value={form.dept} onChange={v => setForm(f => ({ ...f, dept: v }))} placeholder="e.g. Rescue Alpha" />
              <div className="col-span-2"><Field label="Duty Location" value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} placeholder="e.g. Field Station 1, Quezon City" /></div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={onClose} className="px-3 py-2 rounded-md text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
              <motion.button onClick={submit} disabled={!canSubmit} whileHover={canSubmit ? { scale: 1.03 } : {}} whileTap={canSubmit ? { scale: 0.97 } : {}}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-colors ${canSubmit ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-muted-foreground cursor-not-allowed"}`}>
                <UserPlus size={14} />Create User
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function UserManagement() {
  const app = useApp();
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | Role>("all");
  const [detailUser, setDetailUser] = useState<ManagedUser | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = users.filter(u =>
    (filter === "all" || u.role === filter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.dept.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" } : u));
    setDetailUser(prev => prev && prev.id === id ? { ...prev, status: prev.status === "Active" ? "Suspended" : "Active" } : prev);
  };

  const changeRole = (id: string, role: Role) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    setDetailUser(prev => prev && prev.id === id ? { ...prev, role } : prev);
  };

  const createUser = (u: ManagedUser) => {
    setUsers(prev => [u, ...prev]);
    app.addUser({ id: "", name: u.name, email: u.email, dept: u.dept, role: u.role, status: "Active" });
    app.addNotification({ type: "UserMgmt", subject: `User added: ${u.name}`, status: "Sent" });
    setShowAddModal(false);
  };

  const roleColors: Record<Role, string> = {
    superadmin: "bg-primary/20 text-primary border-primary/30",
    admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    user: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  const roleLabels: Record<Role, string> = { superadmin: "Super Admin", admin: "Admin", user: "User" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">USER MANAGEMENT</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage accounts, roles, and access permissions across the platform</p>
        </div>
        <motion.button onClick={() => setShowAddModal(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors"><UserPlus size={16} />Add User</motion.button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: users.length, icon: Users, color: "text-foreground" },
          { label: "Super Admins", value: users.filter(u => u.role === "superadmin").length, icon: ShieldCheck, color: "text-primary" },
          { label: "Admins", value: users.filter(u => u.role === "admin").length, icon: Shield, color: "text-purple-400" },
          { label: "Suspended", value: users.filter(u => u.status === "Suspended").length, icon: UserX, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">{s.label}</span>
              <s.icon size={15} className={s.color} />
            </div>
            <div className={`text-2xl font-bold font-['Barlow_Condensed'] ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, department..."
            className="w-full bg-input-background border border-border rounded-md pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex gap-1.5">
          {(["all", "superadmin", "admin", "user"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {f === "all" ? "All" : f === "superadmin" ? "Super Admin" : f === "admin" ? "Admin" : "Users"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              {["User", "Contact", "Role", "Department", "Status", "Last Login", "Actions"].map(h => (
                <th key={h} className="text-left text-[12px] font-mono font-medium text-muted-foreground uppercase tracking-widest px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <motion.tr key={u.id} custom={i} variants={fadeIn} initial="hidden" animate="show"
                onClick={() => setDetailUser(u)}
                className={`border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer ${i === filtered.length - 1 ? "border-b-0" : ""} ${u.status === "Suspended" ? "opacity-60" : ""}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <AvatarCircle initials={u.avatar} color={u.role === "superadmin" ? "bg-primary/20" : u.role === "admin" ? "bg-purple-500/20" : "bg-blue-500/20"} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">{u.name}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{u.id} · {u.title}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs font-mono text-muted-foreground">{u.email}</div>
                  <div className="text-[11px] font-mono text-muted-foreground">{u.phone}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[12px] font-mono font-bold px-2 py-0.5 rounded border ${roleColors[u.role]}`}>{roleLabels[u.role]}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{u.dept}</td>
                <td className="px-4 py-3"><Badge status={u.status}>{u.status}</Badge></td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{u.lastLogin}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setDetailUser(u)}
                      title="View Full Profile"
                      className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-secondary">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => toggleStatus(u.id)}
                      title={u.status === "Active" ? "Suspend" : "Reactivate"}
                      className={`transition-colors p-1 rounded hover:bg-secondary ${u.status === "Active" ? "text-muted-foreground hover:text-red-400" : "text-muted-foreground hover:text-green-400"}`}>
                      {u.status === "Active" ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                    <button onClick={() => app.addNotification({ type: "UserMgmt", subject: `Password reset sent to ${u.name}`, status: "Sent" })}
                      title="Reset Password" className="text-muted-foreground hover:text-yellow-400 transition-colors p-1 rounded hover:bg-secondary"><RefreshCw size={14} /></button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-xs text-muted-foreground">No users match your search or filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {detailUser && (
        <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} onToggleStatus={toggleStatus} onChangeRole={changeRole} />
      )}
      {showAddModal && (
        <AddUserModal onClose={() => setShowAddModal(false)} onCreate={createUser} />
      )}
    </div>
  );
}

function ConfirmActionModal({ title, description, confirmLabel, icon: Icon, color, onConfirm, onCancel }: { title: string; description: string; confirmLabel: string; icon: React.ElementType; color: { bg: string; border: string; text: string; button: string }; onConfirm: () => void; onCancel: () => void }) {
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onCancel} />
        <motion.div
          className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
          initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
          <div className="p-6">
            <motion.div className={`w-12 h-12 rounded-full ${color.bg} border ${color.border} flex items-center justify-center mx-auto mb-4`}
              initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}>
              <Icon size={22} className={color.text} />
            </motion.div>
            <h2 className="text-center text-lg font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">{title}</h2>
            <p className="text-center text-xs text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
            <div className="flex items-center gap-2 mt-5">
              <button onClick={onCancel} className="flex-1 px-3 py-2 rounded-md text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
              <button onClick={onConfirm} className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold text-white transition-colors ${color.button}`}>{confirmLabel}</button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function AnnouncementModal({ onClose, onSend }: { onClose: () => void; onSend: (subject: string, body: string) => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const canSend = subject.trim() && body.trim();

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
        <motion.div
          className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">SYSTEM ANNOUNCEMENT</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary"><X size={18} /></button>
            </div>
            <p className="text-xs text-muted-foreground">Broadcast a notification to every Admin and Super Admin account on the platform.</p>
            <div>
              <label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Scheduled maintenance tonight"
                className="w-full mt-1 bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">Message</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write the announcement details..." rows={4}
                className="w-full mt-1 bg-input-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button onClick={onClose} className="px-3 py-2 rounded-md text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
              <motion.button onClick={() => canSend && onSend(subject, body)} disabled={!canSend} whileHover={canSend ? { scale: 1.03 } : {}} whileTap={canSend ? { scale: 0.97 } : {}}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-colors ${canSend ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-muted-foreground cursor-not-allowed"}`}>
                <Send size={14} />Send Announcement
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SystemSettings() {
  const app = useApp();
  const [notifications, setNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [auditLog, setAuditLog] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(true);

  const [lastBackup, setLastBackup] = useState("Jun 30, 2026 · 02:00 AM");
  const [activeSessions, setActiveSessions] = useState(3);
  const [lastCacheClear, setLastCacheClear] = useState("Jun 28, 2026 · 06:15 PM");
  const [lastAuditExport, setLastAuditExport] = useState("—");
  const [lastAnnouncement, setLastAnnouncement] = useState("—");

  const [confirmAction, setConfirmAction] = useState<null | "backup" | "cache">(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  const nowStamp = () => new Date().toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", " ·");

  const runBackup = () => {
    setLastBackup(nowStamp());
    app.addNotification({ type: "System", subject: "Manual backup completed successfully", status: "Sent" });
    setConfirmAction(null);
  };
  const runCacheClear = () => {
    setActiveSessions(1);
    setLastCacheClear(nowStamp());
    app.addNotification({ type: "System", subject: "Session cache cleared — all other sessions signed out", status: "Sent" });
    setConfirmAction(null);
  };
  const exportAuditLog = () => {
    const csv = [
      "time,action,target,user",
      ...auditEntries.map(l => `"${l.time}","${l.action}","${l.target}","${l.user}"`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "audit-log.csv"; a.click();
    URL.revokeObjectURL(url);
    setLastAuditExport(nowStamp());
    app.addNotification({ type: "Export", subject: "Full audit log exported", status: "Sent" });
  };
  const sendAnnouncement = (subject: string, body: string) => {
    app.addNotification({ type: "System", subject: `Announcement: ${subject}`, body, status: "Sent" });
    setLastAnnouncement(nowStamp());
    setShowAnnouncement(false);
  };

  const Toggle = ({ on, onChange }: { on: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${on ? "bg-primary" : "bg-secondary border border-border"}`}>
      <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${on ? "left-5.5 translate-x-0.5" : "left-0.5"}`} style={{ left: on ? "calc(100% - 18px)" : 2 }} />
    </button>
  );

  const auditEntries = [
    { action: "Role changed", target: "Carlos Bautista → Suspended", user: "Director Reyes", time: "09:32" },
    { action: "Program created", target: "Typhoon Preparedness 101", user: "Capt. Santos", time: "08:55" },
    { action: "User logged in", target: "m.santos@ems.gov", user: "System", time: "08:12" },
    { action: "Report exported", target: "RPT-2026-018 (PDF)", user: "Lt. Cruz", time: "07:48" },
    { action: "Scenario launched", target: "Urban Earthquake M7.2", user: "Capt. Santos", time: "Jun 29 · 15:10" },
  ];

  const platformSettings = [
    { group: "Notifications", label: "Email Notifications", desc: "Send automated drill confirmations, reminders, and certificate updates via email", value: notifications, set: () => setNotifications(p => !p) },
    { group: "Notifications", label: "SMS Alerts", desc: "Send critical alerts (session changes, certification expiry) via SMS to enrolled phone numbers", value: smsAlerts, set: () => setSmsAlerts(p => !p) },
    { group: "Access", label: "Maintenance Mode", desc: "Restrict portal access to Super Admins only during scheduled maintenance windows", value: maintenanceMode, set: () => setMaintenanceMode(p => !p) },
    { group: "Access", label: "Auto-Approve Registrations", desc: "Automatically activate new participant accounts without manual admin review", value: autoApprove, set: () => setAutoApprove(p => !p) },
    { group: "Security", label: "Two-Factor Auth (Require)", desc: "Enforce 2FA for all Admin and Super Admin accounts at login", value: twoFactor, set: () => setTwoFactor(p => !p) },
    { group: "Security", label: "Password Complexity Policy", desc: "Require 12+ characters, mixed case, numbers, and symbols; expire passwords every 90 days", value: passwordPolicy, set: () => setPasswordPolicy(p => !p) },
    { group: "Security", label: "Auto-Lock Inactive Sessions", desc: "Automatically sign out any session idle for more than 30 minutes", value: sessionTimeout, set: () => setSessionTimeout(p => !p) },
    { group: "Compliance", label: "Audit Log", desc: "Track all admin actions, role changes, and user logins for compliance review", value: auditLog, set: () => setAuditLog(p => !p) },
  ];

  const adminActions = [
    { id: "backup", label: "Force Backup Now", desc: "Create a full snapshot of the database and file storage", icon: Download, color: "text-blue-400", last: lastBackup, onClick: () => setConfirmAction("backup") },
    { id: "cache", label: "Clear Session Cache", desc: "Sign out all active sessions except your own", icon: RefreshCw, color: "text-yellow-400", last: lastCacheClear, onClick: () => setConfirmAction("cache") },
    { id: "auditexport", label: "Export Full Audit Log", desc: "Download the complete admin action history as CSV", icon: FileText, color: "text-muted-foreground", last: lastAuditExport, onClick: exportAuditLog },
    { id: "announce", label: "Send System Announcement", desc: "Broadcast a message to all Admin and Super Admin accounts", icon: Bell, color: "text-muted-foreground", last: lastAnnouncement, onClick: () => setShowAnnouncement(true) },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-wide text-foreground">SYSTEM SETTINGS</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Platform configuration, security, and administrative controls</p>
      </div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">Platform Settings</h3>
            <span className="text-[11px] font-mono text-muted-foreground">{platformSettings.filter(s => s.value).length}/{platformSettings.length} enabled</span>
          </div>
          {["Notifications", "Access", "Security", "Compliance"].map(group => (
            <div key={group} className="space-y-3">
              <div className="text-[11px] font-mono text-primary/80 uppercase tracking-widest">{group}</div>
              {platformSettings.filter(s => s.group === group).map((s, i) => (
                <motion.div key={s.label} custom={i} variants={fadeUp} initial="hidden" animate="show" className="flex items-center justify-between gap-4 pb-3 border-b border-border last:border-b-0 last:pb-0">
                  <div>
                    <div className="text-sm font-medium text-foreground">{s.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</div>
                  </div>
                  <Toggle on={s.value} onChange={s.set} />
                </motion.div>
              ))}
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground font-mono pt-1">Settings apply instantly and are logged to the audit trail.</p>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">System Information</h3>
          {[
            { label: "Platform Version", value: "DPTSS v2.4.1" },
            { label: "Last Backup", value: lastBackup },
            { label: "Database Records", value: "12,847 entries" },
            { label: "Active Sessions", value: `${activeSessions} concurrent` },
            { label: "Uptime", value: "99.98% (30 days)" },
            { label: "Storage Used", value: "4.2 GB / 50 GB" },
          ].map((s, i) => (
            <motion.div key={s.label} custom={i} variants={fadeIn} initial="hidden" animate="show" className="flex justify-between items-center border-b border-border pb-2 last:border-b-0 last:pb-0">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="text-xs font-mono text-foreground font-semibold">{s.value}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">Recent Audit Log</h3>
          {auditEntries.map((l, i) => (
            <motion.div key={i} custom={i} variants={fadeIn} initial="hidden" animate="show" className="flex items-start gap-3 text-xs border-b border-border pb-2 last:border-b-0 last:pb-0">
              <span className="font-mono text-muted-foreground w-12 flex-shrink-0">{l.time}</span>
              <span className="text-primary font-medium">{l.action}</span>
              <span className="text-muted-foreground flex-1">{l.target}</span>
              <span className="text-muted-foreground font-mono flex-shrink-0">{l.user}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">Admin Actions</h3>
          {adminActions.map(a => (
            <motion.button key={a.id} onClick={a.onClick} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left">
              <a.icon size={16} className={`${a.color} flex-shrink-0`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-foreground">{a.label}</div>
                <div className="text-[11px] text-muted-foreground truncate">{a.desc}</div>
                <div className="text-[11px] font-mono text-muted-foreground mt-0.5">Last run: {a.last}</div>
              </div>
              <ChevronRight size={14} className="ml-auto text-muted-foreground flex-shrink-0" />
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {confirmAction === "backup" && (
        <ConfirmActionModal
          title="RUN FULL BACKUP?"
          description="This creates a full snapshot of the database and file storage (approx. 4.2 GB). The process may take a few minutes and will be logged to the audit trail."
          confirmLabel="Start Backup"
          icon={Download}
          color={{ bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", button: "bg-blue-500 hover:bg-blue-600" }}
          onConfirm={runBackup}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === "cache" && (
        <ConfirmActionModal
          title="CLEAR SESSION CACHE?"
          description="This will immediately sign out every active session across the platform except your own. Affected users will need to log in again."
          confirmLabel="Clear Sessions"
          icon={RefreshCw}
          color={{ bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400", button: "bg-yellow-500 hover:bg-yellow-600" }}
          onConfirm={runCacheClear}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {showAnnouncement && (
        <AnnouncementModal onClose={() => setShowAnnouncement(false)} onSend={sendAnnouncement} />
      )}
    </div>
  );
}

function AdminShell({ auth, onLogout }: { auth: AuthUser; onLogout: () => void }) {
  const [mod, setMod] = useState<AdminModule>("dashboard");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const ADMIN_NAV = [
    { id: "dashboard" as AdminModule, label: "Command Overview", icon: Activity },
    { id: "training" as AdminModule, label: "Training Programs", icon: BookOpen },
    { id: "simulation" as AdminModule, label: "Scenario Builder", icon: Cpu },
    { id: "participants" as AdminModule, label: "Participants", icon: Users },
    { id: "evaluation" as AdminModule, label: "Performance Eval", icon: BarChart3 },
    { id: "reporting" as AdminModule, label: "Drill Reports", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'DM Sans', 'Barlow', sans-serif" }}>
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col" style={{ minHeight: "100vh" }}>
        <div className="px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 bg-white flex-shrink-0"><img src={BARANGAY_LOGO_IMG} alt="Barangay Culiat Seal" className="w-full h-full object-cover" /></div>
            <div><div className="text-[13px] font-bold font-['Barlow_Condensed'] tracking-widest text-foreground uppercase leading-none">DPTSS</div><div className="text-[11px] font-mono text-muted-foreground mt-0.5 leading-none">Admin Console</div></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest px-2 mb-2">Modules</div>
          {ADMIN_NAV.map((item, i) => { const Icon = item.icon; const active = mod === item.id; return (<motion.button key={item.id} onClick={() => setMod(item.id)} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }} whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors text-xs font-medium ${active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"}`}><Icon size={15} className={active ? "text-primary" : "text-current"} /><span>{item.label}</span>{active && <ChevronRight size={12} className="ml-auto text-primary" />}</motion.button>); })}
        </nav>
        <div className="px-3 pb-3">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
            <div className="text-[11px] font-mono text-purple-400 uppercase tracking-widest mb-1">Access Level</div>
            <div className="text-xs font-semibold text-foreground">Administrator</div>
            <div className="text-[12px] text-muted-foreground">{auth.dept}</div>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-sidebar-border flex items-center gap-2.5">
          <AvatarCircle initials={auth.avatar} color="bg-purple-500/20" />
          <div className="flex-1 min-w-0"><div className="text-xs font-semibold text-foreground truncate">{auth.name}</div><div className="text-[12px] font-mono text-muted-foreground">Admin</div></div>
          <motion.button onClick={() => setShowLogoutModal(true)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} className="text-muted-foreground hover:text-red-400 transition-colors"><LogOut size={15} /></motion.button>
        </div>
      </aside>
      {showLogoutModal && (
        <LogoutConfirmModal auth={auth} onConfirm={onLogout} onCancel={() => setShowLogoutModal(false)} />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/60 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono"><span>DPTSS</span><ChevronRight size={12} /><span className="text-foreground">{ADMIN_NAV.find(n => n.id === mod)?.label}</span></div>
          <div className="flex items-center gap-3"><div className="flex items-center gap-1.5 text-xs font-mono text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />SYS OPERATIONAL</div><DarkModeToggle /><NotificationBell role={auth.role} /></div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <AnimatePresence mode="wait">
            <motion.div key={mod} variants={pageTransition} initial="hidden" animate="show" exit="exit">
              {mod === "dashboard" && <AdminDashboard />}
              {mod === "training" && <TrainingModule />}
              {mod === "simulation" && <SimModule />}
              {mod === "participants" && <ParticipantsModule />}
              {mod === "evaluation" && <EvalModule />}
              {mod === "reporting" && <ReportModule />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function SuperAdminShell({ auth, onLogout }: { auth: AuthUser; onLogout: () => void }) {
  const [mod, setMod] = useState<SuperAdminModule>("dashboard");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const SA_NAV = [
    { id: "dashboard" as SuperAdminModule, label: "Command Overview", icon: Activity, group: "Operations" },
    { id: "training" as SuperAdminModule, label: "Training Programs", icon: BookOpen, group: "Operations" },
    { id: "simulation" as SuperAdminModule, label: "Scenario Builder", icon: Cpu, group: "Operations" },
    { id: "participants" as SuperAdminModule, label: "Participants", icon: Users, group: "Operations" },
    { id: "evaluation" as SuperAdminModule, label: "Performance Eval", icon: BarChart3, group: "Operations" },
    { id: "reporting" as SuperAdminModule, label: "Drill Reports", icon: FileText, group: "Operations" },
    { id: "usermgmt" as SuperAdminModule, label: "User Management", icon: ShieldCheck, group: "System" },
    { id: "settings" as SuperAdminModule, label: "System Settings", icon: Settings, group: "System" },
  ];

  const groups = ["Operations", "System"];

  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'DM Sans', 'Barlow', sans-serif" }}>
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col" style={{ minHeight: "100vh" }}>
        <div className="px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 bg-white flex-shrink-0"><img src={BARANGAY_LOGO_IMG} alt="Barangay Culiat Seal" className="w-full h-full object-cover" /></div>
            <div><div className="text-[13px] font-bold font-['Barlow_Condensed'] tracking-widest text-foreground uppercase leading-none">DPTSS</div><div className="text-[11px] font-mono text-muted-foreground mt-0.5 leading-none">Super Admin</div></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {groups.map(g => (
            <div key={g}>
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest px-2 mb-1.5">{g}</div>
              <div className="space-y-0.5">
                {SA_NAV.filter(n => n.group === g).map((item, i) => { const Icon = item.icon; const active = mod === item.id; return (<motion.button key={item.id} onClick={() => setMod(item.id)} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }} whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors text-xs font-medium ${active ? `bg-sidebar-accent text-foreground` : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"}`}><Icon size={15} className={active ? "text-primary" : "text-current"} /><span>{item.label}</span>{active && <ChevronRight size={12} className="ml-auto text-primary" />}</motion.button>); })}
              </div>
            </div>
          ))}
        </nav>
        <div className="px-3 pb-3">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <div className="text-[11px] font-mono text-primary uppercase tracking-widest mb-1">Access Level</div>
            <div className="text-xs font-semibold text-foreground">Super Administrator</div>
            <div className="text-[12px] text-muted-foreground">Full system access</div>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-sidebar-border flex items-center gap-2.5">
          <AvatarCircle initials={auth.avatar} color="bg-primary/20" />
          <div className="flex-1 min-w-0"><div className="text-xs font-semibold text-foreground truncate">{auth.name}</div><div className="text-[12px] font-mono text-primary">Super Admin</div></div>
          <motion.button onClick={() => setShowLogoutModal(true)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} className="text-muted-foreground hover:text-red-400 transition-colors"><LogOut size={15} /></motion.button>
        </div>
        {showLogoutModal && (
          <LogoutConfirmModal auth={auth} onConfirm={onLogout} onCancel={() => setShowLogoutModal(false)} />
        )}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/60 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>DPTSS</span><ChevronRight size={12} />
            <span className={`${["usermgmt", "settings"].includes(mod) ? "text-primary" : "text-foreground"}`}>{SA_NAV.find(n => n.id === mod)?.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-primary border border-primary/20 bg-primary/10 px-2 py-0.5 rounded"><ShieldCheck size={12} />SUPER ADMIN</div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />SYS OPERATIONAL</div>
            <DarkModeToggle />
            <NotificationBell role={auth.role} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <AnimatePresence mode="wait">
            <motion.div key={mod} variants={pageTransition} initial="hidden" animate="show" exit="exit">
              {mod === "dashboard" && <AdminDashboard />}
              {mod === "training" && <TrainingModule />}
              {mod === "simulation" && <SimModule />}
              {mod === "participants" && <ParticipantsModule />}
              {mod === "evaluation" && <EvalModule />}
              {mod === "reporting" && <ReportModule />}
              {mod === "usermgmt" && <UserManagement />}
              {mod === "settings" && <SystemSettings />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState<AuthUser | null>(null);
  const [view, setView] = useState<"landing" | "login">("landing");

  useEffect(() => {
    document.title = "Barangay Culiat | Integrated Public Safety & Security";
    const existing = document.querySelectorAll("link[rel~='icon']");
    existing.forEach(el => el.parentNode?.removeChild(el));
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/jpeg";
    link.href = BARANGAY_LOGO_IMG;
    document.head.appendChild(link);
    async function loadData() {

  }
  loadData();

}, []); // <-- 4. Dito nagtatapos ang useEffect()


  if (!auth) {
    if (view === "landing") return <LandingPage onLogin={() => setView("login")} />;
    return <LoginScreen onLogin={setAuth} onBack={() => setView("landing")} />;
  }

  return (
    <AppProvider>
      {auth.role === "user" && <UserPortal auth={auth} onLogout={() => setAuth(null)} />}
      {auth.role === "admin" && <AdminShell auth={auth} onLogout={() => setAuth(null)} />}
      {auth.role === "superadmin" && <SuperAdminShell auth={auth} onLogout={() => setAuth(null)} />}
    </AppProvider>
  );
}

// Inside your main App or Page JSX return statement:
export function map() {
  return (
    <div className="p-6">
      
      {/* Renders your location map card */}
      <LocationMap />

    </div>
  );
}



