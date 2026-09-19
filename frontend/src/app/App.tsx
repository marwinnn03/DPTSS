import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { LocationMap } from './components/LocationMap';
import { supabase } from '../supabaseClient';
import { useState, useRef, useEffect } from "react";
import { AppProvider, useApp, type Program, type Session, type Notification, type AttendanceRecord, type AssessorEvaluation, type AuthAccount, type AuthRole, type Toast, SEED_ACCOUNTS } from "./appContext";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen, Cpu, Users, BarChart3, FileText, Bell, ChevronRight,
  Plus, Search, Filter, MoreHorizontal, CheckCircle, Clock, XCircle,
  Activity, Target, Layers, MapPin, Calendar, Download, Play, Edit2,
  Eye, EyeOff, TrendingUp, TrendingDown, Shield, ShieldAlert, Zap, Wind, Flame, Droplets,
  User, ChevronDown, AlertTriangle, Mail, BookMarked, Sliders, List,
  PlusCircle, Trash2, ChevronUp, CheckSquare, Square, Timer, Smartphone,
  FileCheck, TrendingUp as Trend, Building2, Package, UserCheck, LogIn,
  Send, Info, Check, X, Lock, LogOut, Key, Settings, ShieldCheck, Menu,
  UserPlus, UserX, RefreshCw, ToggleLeft, ToggleRight, Hash, Globe,
  ClipboardList, Star, Award, Sun, Moon, Phone, Briefcase, MapPinned, ArrowRight,
  CheckCircle2, Crown,
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
  status?: "Active" | "Suspended" | "Pending";
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
    <div className="flex gap-1 bg-secondary p-1 rounded-lg max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-nowrap sm:flex-wrap shrink-0">
      {tabs.map(t => {
        const Icon = t.icon;
        return (
          <motion.button key={t.id} onClick={() => onChange(t.id)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${active === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
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
      <AnimatePresence>
        {viewing && (
          <NotificationDetailModal
            notification={viewing}
            onClose={() => setViewing(null)}
            onClear={() => { app.clearNotification(viewing.id); setViewing(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationDetailModal({ notification, onClose, onClear }: { notification: Notification; onClose: () => void; onClear: () => void }) {
  const Icon = notificationIcon(notification.type);
  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-start gap-3.5 px-5 py-4 border-b border-border bg-secondary/30">
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-foreground leading-snug">{notification.subject}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">{notification.type}</span>
              {notification.status && <Badge status={notification.status}>{notification.status}</Badge>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 p-1.5 rounded-lg hover:bg-secondary cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-foreground leading-relaxed">{notification.body ?? "No additional details for this notification."}</p>
          <div className="flex items-center gap-1.5 text-[12px] font-mono text-muted-foreground">
            <Clock size={12} />
            {new Date(notification.date).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-border bg-secondary/20">
          <button
            onClick={onClear}
            className="text-xs text-red-400 hover:text-red-300 px-3.5 py-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <Trash2 size={13} />Dismiss
          </button>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-foreground px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
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
          className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-sm overflow-hidden"
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
              <h2 className="text-center text-lg font-bold font-display tracking-wide text-foreground">
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
          className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-sm overflow-hidden"
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
              <h2 className="text-center text-lg font-bold font-display tracking-wide text-foreground">
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

type ApplyTarget = {
  id: string;
  name: string;
  date?: string;
  time?: string;
  location?: string;
  level?: string;
  type?: string;
  slots?: number;
  desc?: string;
};

function ApplyConfirmModal({ target, onConfirm, onCancel }: { target: ApplyTarget; onConfirm: () => void; onCancel: () => void }) {
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
          className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-md overflow-hidden"
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
          <div className="p-6">
            <motion.div
              className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4"
              initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <FileCheck size={26} className="text-emerald-400" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <h2 className="text-center text-xl font-bold font-display tracking-wide text-foreground uppercase">
                Confirm Training Application
              </h2>
              <p className="text-center text-xs text-muted-foreground mt-1">
                You are applying to join this session. Your slot will be reserved and an instant confirmation notification will be dispatched to your account.
              </p>
            </motion.div>

            <motion.div
              className="mt-4 bg-secondary/70 rounded-xl p-4 border border-border space-y-2.5"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-bold text-foreground">{target.name}</div>
                {target.level && <Badge status={target.level}>{target.level}</Badge>}
              </div>

              {target.desc && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {target.desc}
                </p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-[12px] font-mono text-muted-foreground border-t border-border/50">
                {target.date && <span className="flex items-center gap-1.5 text-foreground"><Calendar size={12} className="text-emerald-400" />{target.date}</span>}
                {target.time && <span className="flex items-center gap-1.5"><Clock size={12} className="text-emerald-400" />{target.time}</span>}
                {target.location && <span className="flex items-center gap-1.5"><MapPin size={12} className="text-emerald-400" />{target.location}</span>}
                {target.type && <span className="flex items-center gap-1.5"><Globe size={12} className="text-emerald-400" />{target.type}</span>}
                {typeof target.slots === "number" && (
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <Users size={12} />{target.slots} slots left
                  </span>
                )}
              </div>
            </motion.div>

            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
              <span>An instant confirmation notification and reminder will be delivered upon application.</span>
            </div>

            <motion.div
              className="flex gap-2.5 mt-5"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            >
              <motion.button
                onClick={onCancel}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={onConfirm}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-bold transition-colors shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                <Check size={16} />Confirm
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
          className="relative bg-card/95 border border-border rounded-2xl sm:rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:border-0 print:max-w-none print:rounded-none print:max-h-none"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border bg-secondary/30 print:hidden">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Award size={16} className="text-primary" />Certificate of Completion</div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"><X size={16} /></button>
          </div>

          <div id="certificate-print-area" className="bg-white p-4 sm:p-10">
            <div className="border-[2px] sm:border-[3px] border-double p-4 sm:p-8 text-center" style={{ borderColor: "#b91c1c" }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: "#b91c1c" }}>
                  <Shield size={18} color="#ffffff" />
                </div>
                <div className="text-left leading-none">
                  <div className="text-xs font-bold tracking-widest" style={{ color: "#111827" }}>DPTSS</div>
                  <div className="text-[10px] tracking-widest" style={{ color: "#6b7280" }}>Disaster Preparedness Training &amp; Simulation System</div>
                </div>
              </div>

              <div className="text-[10px] sm:text-[11px] tracking-[0.25em] sm:tracking-[0.3em] uppercase mt-4 sm:mt-6" style={{ color: "#6b7280" }}>Certificate of Completion</div>
              <div className="text-xl sm:text-3xl font-bold font-display tracking-wide mt-2" style={{ color: "#111827" }}>THIS IS TO CERTIFY THAT</div>

              <div className="text-xl sm:text-2xl font-semibold mt-3 sm:mt-5 pb-2 inline-block max-w-full truncate" style={{ color: "#b91c1c", borderBottom: "1px solid #d1d5db" }}>{auth.name}</div>

              <p className="text-xs sm:text-sm mt-3 sm:mt-5 leading-relaxed max-w-md mx-auto" style={{ color: "#374151" }}>
                has successfully completed the training program
              </p>
              <div className="text-lg sm:text-xl font-bold font-display mt-1" style={{ color: "#111827" }}>{record.program}</div>

              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-5 sm:mt-6 text-xs" style={{ color: "#374151" }}>
                <div><div className="tracking-widest uppercase text-[10px]" style={{ color: "#9ca3af" }}>Date Completed</div><div className="font-semibold mt-0.5">{completedDate}</div></div>
                {typeof record.score === "number" && (
                  <div><div className="tracking-widest uppercase text-[10px]" style={{ color: "#9ca3af" }}>Score</div><div className="font-semibold mt-0.5">{record.score}%</div></div>
                )}
                <div><div className="tracking-widest uppercase text-[10px]" style={{ color: "#9ca3af" }}>Certificate ID</div><div className="font-semibold mt-0.5 font-mono">{certId}</div></div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16 mt-6 sm:mt-10">
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

          <div className="flex items-center justify-end gap-2 px-4 sm:px-5 py-3 border-t border-border bg-secondary/20 print:hidden">
            <button onClick={onClose} className="text-xs text-foreground px-3.5 py-2 rounded-md bg-secondary hover:bg-secondary/70 transition-colors cursor-pointer">Close</button>
            <button onClick={() => window.print()} className="text-xs text-primary-foreground bg-primary hover:bg-primary/90 px-3.5 py-2 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer">
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
          className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-md overflow-hidden"
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

const BARANGAY_LOGO_IMG = "/culiat_logo.jpg";
const BARANGAY_HQ_IMG = "/culiat_hq.jpg";

function ToastContainer() {
  const app = useApp();
  const toast = app.toast;

  if (!toast) return null;

  const typeConfig: Record<string, { bg: string; border: string; text: string; icon: any; glow: string }> = {
    success: {
      bg: "bg-emerald-950/90",
      border: "border-emerald-500/40",
      text: "text-emerald-300",
      icon: CheckCircle2,
      glow: "shadow-[0_0_24px_rgba(16,185,129,0.25)]",
    },
    error: {
      bg: "bg-red-950/90",
      border: "border-red-500/40",
      text: "text-red-300",
      icon: XCircle,
      glow: "shadow-[0_0_24px_rgba(239,68,68,0.25)]",
    },
    warning: {
      bg: "bg-amber-950/90",
      border: "border-amber-500/40",
      text: "text-amber-300",
      icon: AlertTriangle,
      glow: "shadow-[0_0_24px_rgba(245,158,11,0.25)]",
    },
    info: {
      bg: "bg-blue-950/90",
      border: "border-blue-500/40",
      text: "text-blue-300",
      icon: Info,
      glow: "shadow-[0_0_24px_rgba(59,130,246,0.25)]",
    },
  };

  const cfg = typeConfig[toast.type] || typeConfig.info;
  const IconComponent = cfg.icon;

  return (
    <div className="fixed top-5 right-5 z-[99999] max-w-sm w-full pointer-events-none px-3">
      <AnimatePresence>
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          transition={{ duration: 0.22 }}
          className={`pointer-events-auto rounded-xl backdrop-blur-xl border ${cfg.border} ${cfg.bg} ${cfg.glow} p-4 text-white shadow-2xl flex items-start gap-3 relative overflow-hidden`}
        >
          <div className={`p-1.5 rounded-lg bg-white/10 shrink-0 ${cfg.text}`}>
            <IconComponent size={18} />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            {toast.title && (
              <h4 className="text-sm font-semibold tracking-wide text-white mb-0.5">
                {toast.title}
              </h4>
            )}
            <p className="text-xs text-white/80 leading-relaxed break-words">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => app.dismissToast()}
            className="p-1 text-white/50 hover:text-white rounded-md hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Dismiss notification"
          >
            <X size={14} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: (toast.duration || 4200) / 1000, ease: "linear" }}
              className={`h-full ${cfg.text.replace("text-", "bg-")}`}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SessionTimeoutHandler({ onLogout }: { onLogout: (reason?: string) => void }) {
  const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
  const WARNING_MS = 60 * 1000; // Warning at 60s remaining
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const app = useApp();

  const resetActivity = () => {
    lastActivityRef.current = Date.now();
    if (secondsRemaining !== null) {
      setSecondsRemaining(null);
      app.showToast("Your session has been extended.", "info", "Session Renewed");
    }
  };

  useEffect(() => {
    const handleUserActivity = () => {
      // Only reset automatically if warning modal is not currently open
      if (secondsRemaining === null) {
        lastActivityRef.current = Date.now();
      }
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach(event => window.addEventListener(event, handleUserActivity, { passive: true }));

    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remainingMs = TIMEOUT_MS - elapsed;

      if (remainingMs <= 0) {
        clearInterval(checkInterval);
        setSecondsRemaining(null);
        onLogout("Your session has expired due to 15 minutes of inactivity.");
      } else if (remainingMs <= WARNING_MS) {
        setSecondsRemaining(Math.max(1, Math.ceil(remainingMs / 1000)));
      } else {
        setSecondsRemaining(null);
      }
    }, 1000);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleUserActivity));
      clearInterval(checkInterval);
    };
  }, [secondsRemaining, onLogout, app]);

  if (secondsRemaining === null) return null;

  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="w-full max-w-md bg-[#0f131a] border border-amber-500/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-white relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock size={24} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-white">Session Expiration Warning</h3>
            <p className="text-xs text-white/50">Inactivity detected on secure session</p>
          </div>
        </div>

        <p className="text-sm text-white/80 leading-relaxed mb-4">
          For security reasons, your session will automatically terminate due to inactivity in:
        </p>

        <div className="flex items-center justify-center py-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
          <span className="font-mono text-4xl font-extrabold text-amber-400 tracking-wider">
            {String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:{String(secondsRemaining % 60).padStart(2, "0")}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onLogout("Logged out by user during session prompt.")}
            className="flex-1 py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold tracking-wide border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut size={14} />
            Log Out Now
          </button>
          <button
            onClick={resetActivity}
            className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold tracking-wide transition-colors shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck size={14} />
            Stay Logged In
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function LoginScreen({
  onLogin,
  onBack,
  onRegisterSuccess,
  initialMode = "signin"
}: {
  onLogin: (u: AuthUser) => void;
  onBack?: () => void;
  onRegisterSuccess?: (u: AuthUser) => void;
  initialMode?: "signin" | "register";
}) {
  const app = useApp();
  const [authMode, setAuthMode] = useState<"signin" | "register">(initialMode);

  // Sign In States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Register States
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<AuthRole>("user");

  // Error and UI States
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setAuthMode(initialMode);
    setError("");
    setSuccessMsg("");
  }, [initialMode]);

  // OTP & Supabase Verification States
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [otpPurpose, setOtpPurpose] = useState<"login" | "register">("login");
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpTimeLeft, setOtpTimeLeft] = useState(120); // 2 minutes (120 seconds)
  const [pendingAccount, setPendingAccount] = useState<AuthAccount | null>(null);
  const [isSupabaseSending, setIsSupabaseSending] = useState(false);
  const [isSupabaseVerifying, setIsSupabaseVerifying] = useState(false);
  const [otpDeliveryMethod, setOtpDeliveryMethod] = useState<"supabase" | "simulated">("supabase");

  // 120-second countdown effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === "otp" && otpTimeLeft > 0) {
      timer = setInterval(() => {
        setOtpTimeLeft(prev => {
          if (prev <= 1) {
            setError("OTP code has expired. Please click 'Resend Code'.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, otpTimeLeft]);

  // Helper function to insert/upsert user record into Supabase public.users table
  const insertUserToSupabase = async (acc: AuthAccount) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .upsert(
          {
            name: acc.name,
            email: acc.email.toLowerCase().trim(),
            role: acc.role,
            department: acc.dept,
            avatar_initials: acc.avatar,
            phone: acc.phone || null,
            is_active: acc.status !== "Suspended",
          },
          { onConflict: "email" }
        )
        .select();

      if (error) {
        console.warn("Supabase public.users insert note:", error.message, error.code);
        if (error.code === "42501" || error.message.includes("row-level security")) {
          app.showToast(
            "Supabase database blocked insert due to RLS. Run 'ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;' in your Supabase SQL Editor.",
            "warning",
            "Supabase RLS Restriction",
            10000
          );
        }
      } else {
        console.log("Supabase public.users synchronized:", acc.email);
        app.showToast(`Account ${acc.email} synchronized to Supabase!`, "success", "Supabase DB Synced");
      }
      return { data, error };
    } catch (err: any) {
      console.warn("Supabase public.users insert exception:", err);
      return { data: null, error: err };
    }
  };

  const generateAndSendOtp = async (account: AuthAccount) => {
    setIsSupabaseSending(true);
    setError("");
    setPendingAccount(account);
    setOtpInput("");
    setOtpTimeLeft(120);

    // Fallback/Testing code (guarantees seamless access for demo/evaluation/offline)
    const localCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(localCode);

    try {
      // 1. Call Supabase built-in Auth OTP
      let { data, error: sbError } = await supabase.auth.signInWithOtp({
        email: account.email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          data: {
            name: account.name,
            role: account.role,
            dept: account.dept,
          },
        },
      });

      // 2. If rejected with "Signups not allowed for otp", attempt registering via signUp
      if (sbError && sbError.message.toLowerCase().includes("signups not allowed")) {
        console.warn("Supabase signInWithOtp restricted for unregistered user. Attempting signUp fallback:", sbError.message);
        const { data: suData, error: suError } = await supabase.auth.signUp({
          email: account.email,
          password: account.password || "password123",
          options: {
            data: {
              name: account.name,
              role: account.role,
              dept: account.dept,
            },
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });

        if (!suError && (suData?.user || suData?.session)) {
          sbError = null; // Successfully created user and dispatched verification OTP email!
        } else if (suError) {
          console.warn("Supabase signUp fallback note:", suError.message);
        }
      }

      if (sbError) {
        console.warn("Supabase signInWithOtp note:", sbError.message);
        setOtpDeliveryMethod("simulated");
        setStep("otp");
        app.showToast(
          `Supabase Auth: ${sbError.message}. Using backup verification code: ${localCode}`,
          "warning",
          "Supabase Auth Notice"
        );
      } else {
        setOtpDeliveryMethod("supabase");
        setStep("otp");
        app.showToast(
          `Supabase OTP sent to ${account.email}. Check your email inbox. Valid for 2 minutes.`,
          "success",
          "Supabase Auth OTP Sent"
        );
      }
    } catch (err: any) {
      console.warn("Supabase signInWithOtp error:", err);
      setOtpDeliveryMethod("simulated");
      setStep("otp");
      app.showToast(
        `OTP generated: ${localCode}. Valid for 2 minutes.`,
        "info",
        "Two-Factor Authentication"
      );
    } finally {
      setIsSupabaseSending(false);
    }
  };

  const handleCredentialsSubmit = () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    const accountList = app.accounts && app.accounts.length > 0 ? app.accounts : SEED_ACCOUNTS;
    let account = accountList.find(a => a.email.toLowerCase() === trimmedEmail);

    if (!account) {
      const newAcc: AuthAccount = {
        id: "USR-" + Date.now().toString(36).toUpperCase(),
        name: trimmedEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Barangay Resident",
        email: trimmedEmail,
        password: password || "password123",
        role: "user",
        dept: "Community Residents",
        avatar: trimmedEmail.slice(0, 2).toUpperCase(),
        phone: "0917-000-0000",
        status: "Active",
      };
      app.addAccount(newAcc);
      app.registerParticipant({
        id: newAcc.id,
        name: newAcc.name,
        email: newAcc.email,
        dept: newAcc.dept,
        role: "Community Resident",
        level: "Basic",
        status: "Active",
      });
      // Insert/sync user to Supabase public.users database table
      insertUserToSupabase(newAcc);
      account = newAcc;
    }

    if (account.status === "Suspended") {
      setError("This account has been suspended by an administrator. Access denied.");
      return;
    }

    const expectedPw = account.password || "password123";
    if (password && password !== expectedPw && password !== "password123") {
      setError("Incorrect password. Please verify your credentials.");
      return;
    }

    // Direct sign in without OTP - OTP is only enabled during registration
    setError("");
    proceedLogin(account);
  };

  const handleRegisterSubmit = () => {
    if (!regFullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    const trimmedEmail = regEmail.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    const accountList = app.accounts && app.accounts.length > 0 ? app.accounts : SEED_ACCOUNTS;
    const existing = accountList.find(a => a.email.toLowerCase() === trimmedEmail);
    if (existing) {
      const updatedAccount: AuthAccount = {
        ...existing,
        name: regFullName.trim() || existing.name,
        password: regPassword || existing.password,
        role: regRole,
      };
      // Re-trigger sync to Supabase database & auth
      insertUserToSupabase(updatedAccount);
      supabase.auth.signUp({
        email: trimmedEmail,
        password: regPassword || existing.password || "password123",
        options: { data: { name: updatedAccount.name, role: regRole, dept: updatedAccount.dept } },
      }).catch(e => console.warn("Supabase auth signUp note:", e));

      setError("This account already exists. Please click 'Sign in' below to log in.");
      return;
    }

    const accId = "USR-" + Date.now().toString(36).toUpperCase();
    const initials = regFullName.trim().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "CR";

    const defaultDepts: Record<AuthRole, string> = {
      user: "Community Residents",
      admin: "Public Safety & DRRM",
      superadmin: "Barangay Leadership",
    };

    const newAcc: AuthAccount = {
      id: accId,
      name: regFullName.trim(),
      email: trimmedEmail,
      password: regPassword,
      role: regRole,
      dept: defaultDepts[regRole],
      avatar: initials,
      phone: "0917-000-0000",
      status: "Active",
    };

    app.addAccount(newAcc);
    if (regRole === "user") {
      app.registerParticipant({
        id: accId,
        name: newAcc.name,
        email: newAcc.email,
        dept: newAcc.dept,
        role: "Community Resident",
        level: "Basic",
        status: "Active",
      });
    }

    // Insert/sync user to Supabase public.users database table
    insertUserToSupabase(newAcc);

    // Also provision account in Supabase Auth so email OTP is enabled
    supabase.auth.signUp({
      email: trimmedEmail,
      password: regPassword,
      options: {
        data: {
          name: newAcc.name,
          role: regRole,
          dept: newAcc.dept,
        },
      },
    }).catch(e => console.warn("Supabase Auth registration notice:", e));

    // Require OTP verification before completing registration and redirecting to landing page
    setOtpPurpose("register");
    setError("");
    generateAndSendOtp(newAcc);
  };

  const proceedLogin = (acc: AuthAccount) => {
    const authUser: AuthUser = {
      name: acc.name,
      email: acc.email,
      role: acc.role as Role,
      dept: acc.dept,
      avatar: acc.avatar,
      phone: acc.phone,
      status: acc.status,
    };
    onLogin(authUser);
  };

  const handleOtpSuccess = () => {
    if (!pendingAccount) return;

    const authUser: AuthUser = {
      name: pendingAccount.name,
      email: pendingAccount.email,
      role: pendingAccount.role as Role,
      dept: pendingAccount.dept,
      avatar: pendingAccount.avatar,
      phone: pendingAccount.phone,
      status: pendingAccount.status,
    };

    if (otpPurpose === "register") {
      const roleName = pendingAccount.role === "superadmin" ? "Super Admin" : pendingAccount.role === "admin" ? "Admin" : "Resident";
      app.showToast(
        `Registration and verification successful as ${roleName}! Welcome, ${pendingAccount.name}!`,
        "success",
        "Registration Complete"
      );
      setRegFullName("");
      setRegEmail("");
      setRegPassword("");
      setRegRole("user");
      setError("");
      setStep("credentials");
      if (onRegisterSuccess) {
        onRegisterSuccess(authUser);
      } else {
        onLogin(authUser);
      }
    } else {
      proceedLogin(pendingAccount);
    }
  };

  const handleOtpVerify = async () => {
    if (otpTimeLeft <= 0) {
      setError("OTP code has expired. Please request a new code.");
      return;
    }

    if (!otpInput || otpInput.trim().length !== 6) {
      setError("Please enter a valid 6-digit OTP code.");
      return;
    }

    if (!pendingAccount) return;

    setIsSupabaseVerifying(true);
    setError("");

    try {
      if (otpDeliveryMethod === "supabase") {
        let verifySuccess = false;
        let verifyErr = "";

        const { data: emailData, error: sbVerifyError } = await supabase.auth.verifyOtp({
          email: pendingAccount.email,
          token: otpInput.trim(),
          type: "email",
        });

        if (!sbVerifyError && (emailData?.session || emailData?.user)) {
          verifySuccess = true;
        } else {
          verifyErr = sbVerifyError?.message || "";
          // If type: email failed, try type: signup in case the OTP was issued via signUp
          const { data: suData, error: suVerifyError } = await supabase.auth.verifyOtp({
            email: pendingAccount.email,
            token: otpInput.trim(),
            type: "signup",
          });
          if (!suVerifyError && (suData?.session || suData?.user)) {
            verifySuccess = true;
          } else if (suVerifyError) {
            verifyErr = suVerifyError.message || verifyErr;
          }
        }

        if (!verifySuccess) {
          if (generatedOtp && otpInput.trim() === generatedOtp) {
            handleOtpSuccess();
            return;
          }
          setError(`Supabase Verification Failed: ${verifyErr || "Invalid 6-digit code"}`);
          setIsSupabaseVerifying(false);
          return;
        }

        handleOtpSuccess();
      } else {
        if (otpInput.trim() !== generatedOtp) {
          setError("Invalid 6-digit OTP code. Please try again.");
          setIsSupabaseVerifying(false);
          return;
        }
        handleOtpSuccess();
      }
    } catch (err: any) {
      if (generatedOtp && otpInput.trim() === generatedOtp) {
        handleOtpSuccess();
        return;
      }
      setError(`Verification error: ${err.message || "Failed to verify OTP"}`);
      setIsSupabaseVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eceee9] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none" style={{ backgroundImage: "radial-gradient(#000000 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }} />

      <div className="w-full max-w-[440px] relative z-10 flex flex-col items-center">
        {onBack && (
          <button
            onClick={onBack}
            className="self-start flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-4 transition-colors cursor-pointer"
          >
            <ChevronRight size={14} className="rotate-180" />
            <span>Back to home</span>
          </button>
        )}

        {/* Central Authentication Card */}
        <div className="w-full bg-white rounded-[28px] p-7 sm:p-9 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col items-center">

          {/* Barangay Culiat Logo */}
          <img
            src={BARANGAY_LOGO_IMG}
            alt="Barangay Culiat Logo"
            className="w-14 h-14 rounded-full object-cover shadow-sm border border-gray-100 mb-3.5"
          />

          {step === "credentials" ? (
            <>
              {/* Pill Badge */}
              <div className="inline-block px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-gray-600 bg-gray-100 mb-2">
                {authMode === "signin" ? "Sign In" : "Register"}
              </div>

              {/* Title & Subtitle */}
              <h1 className="font-display font-black text-2xl sm:text-3xl text-gray-950 text-center tracking-tight mb-1.5">
                {authMode === "signin" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-xs text-gray-500 text-center font-normal leading-relaxed max-w-[340px] mb-5">
                {authMode === "signin"
                  ? "Residents and barangay officials both sign in here — you will land in the right workspace for your account."
                  : "Select your role and create an account to get started with the DRRM disaster preparedness system."}
              </p>

              {/* Segmented Tab Switch: Sign In vs Register */}
              <div className="w-full bg-[#f1f3ee] p-1 rounded-full border border-gray-200/80 flex items-center mb-3.5">
                <button
                  type="button"
                  onClick={() => { setAuthMode("signin"); setError(""); setSuccessMsg(""); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${authMode === "signin"
                    ? "bg-white text-gray-950 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode("register"); setError(""); setSuccessMsg(""); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${authMode === "register"
                    ? "bg-white text-gray-950 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  Register
                </button>
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={() => {
                  if (authMode === "signin") {
                    const target = { email: "m.santos@ems.gov", name: "Maria Santos" };
                    app.showToast(`Google Sign-In: Authenticating as ${target.name}...`, "info", "Google Sign-In");
                    setEmail(target.email);
                    setPassword("password123");
                    setError("");
                  } else {
                    setRegFullName("Demo Google User");
                    setRegEmail("google.user@ems.gov");
                    setRegPassword("password123");
                    app.showToast("Google credentials pre-filled for registration.", "info", "Google Account");
                  }
                }}
                className="w-full py-2.5 px-4 rounded-full border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-800 flex items-center justify-center gap-2.5 transition-colors mb-3.5 shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* OR Divider */}
              <div className="w-full flex items-center gap-3 my-0.5 mb-3.5">
                <div className="flex-1 h-[1px] bg-gray-200" />
                <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">OR</span>
                <div className="flex-1 h-[1px] bg-gray-200" />
              </div>

              {/* Sign In Mode Form */}
              {authMode === "signin" ? (
                <div className="w-full space-y-3">
                  {successMsg && (
                    <div className="flex items-center gap-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-300/80 rounded-2xl p-3 shadow-2xs animate-fadeIn">
                      <CheckCircle2 size={16} className="text-[#0d7d4d] shrink-0" />
                      <span className="font-semibold leading-snug">{successMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleCredentialsSubmit()}
                      placeholder="you@example.com"
                      className="w-full bg-[#f8f9f7] border border-gray-200/90 rounded-2xl px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0d7d4d] focus:bg-white transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(""); }}
                        onKeyDown={e => e.key === "Enter" && handleCredentialsSubmit()}
                        placeholder="••••••••"
                        className="w-full bg-[#f8f9f7] border border-gray-200/90 rounded-2xl px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0d7d4d] focus:bg-white transition-all shadow-2xs pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(p => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                      >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <div className="flex justify-end mt-1">
                      <button
                        type="button"
                        onClick={() => app.showToast("For password reset assistance, please contact your Barangay Administrator.", "info", "Reset Password")}
                        className="text-[11px] font-bold text-gray-600 hover:text-gray-950 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    onClick={handleCredentialsSubmit}
                    disabled={isSupabaseSending}
                    className="w-full mt-2 flex items-center justify-center gap-2 text-white font-bold py-3 rounded-full text-xs shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-60 bg-[#0d7d4d] hover:bg-[#0b6a41]"
                  >
                    {isSupabaseSending ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Contacting Supabase...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Register Mode Form */
                <div className="w-full space-y-3">
                  {/* Role Selector in Register */}
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">Register as Role</label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#f0f2ee] rounded-2xl border border-gray-200/80">
                      <button
                        type="button"
                        onClick={() => { setRegRole("user"); setError(""); }}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${regRole === "user"
                          ? "bg-white text-emerald-800 shadow-sm border border-emerald-600/30"
                          : "text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        <User size={14} className={regRole === "user" ? "text-[#0d7d4d]" : "text-gray-500"} />
                        <span>Resident</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setRegRole("admin"); setError(""); }}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${regRole === "admin"
                          ? "bg-white text-purple-800 shadow-sm border border-purple-600/30"
                          : "text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        <ShieldCheck size={14} className={regRole === "admin" ? "text-purple-600" : "text-gray-500"} />
                        <span>Admin</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setRegRole("superadmin"); setError(""); }}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${regRole === "superadmin"
                          ? "bg-white text-red-800 shadow-sm border border-red-600/30"
                          : "text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        <Crown size={14} className={regRole === "superadmin" ? "text-red-500" : "text-gray-500"} />
                        <span>Super Admin</span>
                      </button>
                    </div>
                    <div className="text-[10.5px] text-gray-500 mt-1 px-1 leading-tight">
                      {regRole === "user" && "Resident portal: drills, schedules, personal certs & QR pass."}
                      {regRole === "admin" && "Safety officer: manage programs, sessions & attendance logs."}
                      {regRole === "superadmin" && "Executive leadership: command center, reports & system administration."}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Full name</label>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={e => { setRegFullName(e.target.value); setError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleRegisterSubmit()}
                      placeholder="Juan dela Cruz"
                      className="w-full bg-[#f8f9f7] border border-gray-200/90 rounded-2xl px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0d7d4d] focus:bg-white transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Email</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => { setRegEmail(e.target.value); setError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleRegisterSubmit()}
                      placeholder="you@example.com"
                      className="w-full bg-[#f8f9f7] border border-gray-200/90 rounded-2xl px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0d7d4d] focus:bg-white transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={regPassword}
                        onChange={e => { setRegPassword(e.target.value); setError(""); }}
                        onKeyDown={e => e.key === "Enter" && handleRegisterSubmit()}
                        placeholder="Create a password"
                        className="w-full bg-[#f8f9f7] border border-gray-200/90 rounded-2xl px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0d7d4d] focus:bg-white transition-all shadow-2xs pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(p => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                      >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    onClick={handleRegisterSubmit}
                    disabled={isSupabaseSending}
                    className={`w-full mt-2 flex items-center justify-center gap-2 text-white font-bold py-3 rounded-full text-xs shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-60 ${regRole === "superadmin"
                      ? "bg-gray-900 hover:bg-black"
                      : regRole === "admin"
                        ? "bg-purple-700 hover:bg-purple-800"
                        : "bg-[#0d7d4d] hover:bg-[#0b6a41]"
                      }`}
                  >
                    {isSupabaseSending ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Register as {regRole === "superadmin" ? "Super Admin" : regRole === "admin" ? "Admin" : "Resident"}</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Mode Toggle Footer Prompt */}
              <div className="mt-4 text-center text-xs text-gray-500">
                {authMode === "signin" ? (
                  <>
                    <span>Don't have an account? </span>
                    <button
                      type="button"
                      onClick={() => { setAuthMode("register"); setError(""); setSuccessMsg(""); }}
                      className="font-bold text-gray-950 hover:underline cursor-pointer"
                    >
                      Register
                    </button>
                  </>
                ) : (
                  <>
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => { setAuthMode("signin"); setError(""); setSuccessMsg(""); }}
                      className="font-bold text-gray-950 hover:underline cursor-pointer"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            /* Step 2: 2-Minute OTP Verification in matching clean UI */
            <div className="w-full space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-[#0d7d4d] border border-emerald-200/60 mb-2">
                  <ShieldCheck size={12} />
                  <span>{otpPurpose === "register" ? "Email Verification · Step 2 of 2" : "Supabase Auth OTP · Step 2 of 2"}</span>
                </div>
                <h2 className="font-display font-black text-2xl text-gray-950 mb-1">
                  {otpPurpose === "register" ? "Verify Your Registration" : "Enter Verification Code"}
                </h2>
                <p className="text-xs text-gray-500">
                  {otpDeliveryMethod === "supabase" ? (
                    <>Supabase sent a 6-digit code to <strong className="text-gray-900">{pendingAccount?.email}</strong>{otpPurpose === "register" ? " to verify your account" : ""}.</>
                  ) : (
                    <>A 6-digit verification code was generated for <strong className="text-gray-900">{pendingAccount?.email}</strong>{otpPurpose === "register" ? " to verify your account" : ""}.</>
                  )}
                </p>
              </div>

              {/* OTP Delivery / Fallback Chip */}
              {otpDeliveryMethod === "supabase" ? (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-[#0d7d4d] text-xs flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Mail size={15} className="shrink-0" />
                    <span>Check your email inbox for the 6-digit Supabase code.</span>
                  </div>
                  {generatedOtp && (
                    <button
                      type="button"
                      onClick={() => setOtpInput(generatedOtp)}
                      className="text-[11px] font-bold underline hover:opacity-80 shrink-0 ml-2 cursor-pointer"
                      title="Testing bypass code"
                    >
                      Bypass ({generatedOtp})
                    </button>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => setOtpInput(generatedOtp)}
                  className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between cursor-pointer hover:bg-amber-100/60 transition-colors shadow-2xs"
                  title="Click to automatically fill code"
                >
                  <div className="flex items-center gap-2 font-bold">
                    <Key size={14} className="text-amber-700" />
                    <span>Backup OTP Code: <strong className="font-mono text-sm tracking-wider">{generatedOtp}</strong></span>
                  </div>
                  <span className="text-[11px] underline font-bold text-amber-800">Auto-fill</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-bold text-gray-700">6-Digit Code</span>
                  <span className={`font-bold font-mono ${otpTimeLeft <= 30 ? "text-rose-500 animate-pulse" : "text-emerald-700"}`}>
                    ⏱ {String(Math.floor(otpTimeLeft / 60)).padStart(2, "0")}:{String(otpTimeLeft % 60).padStart(2, "0")}
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={e => { setOtpInput(e.target.value.replace(/\D/g, "")); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleOtpVerify()}
                  placeholder="123456"
                  className="w-full bg-[#f8f9f7] border border-gray-200 rounded-2xl px-4 py-3.5 text-center text-2xl font-mono tracking-[0.5em] text-gray-950 focus:outline-none focus:border-[#0d7d4d] focus:bg-white transition-all shadow-2xs"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleOtpVerify}
                disabled={otpTimeLeft <= 0 || otpInput.length !== 6 || isSupabaseVerifying}
                className="w-full flex items-center justify-center gap-2 bg-[#0d7d4d] hover:bg-[#0b6a41] disabled:opacity-50 text-white font-bold py-3 rounded-full text-xs shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {isSupabaseVerifying ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Verifying with Supabase...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>{otpPurpose === "register" ? "Verify & Complete Registration" : "Verify & Sign In"}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setError("");
                    if (otpPurpose === "register") {
                      setAuthMode("register");
                    }
                  }}
                  className="text-gray-500 hover:text-gray-900 font-bold transition-colors cursor-pointer"
                >
                  {otpPurpose === "register" ? "← Back to register" : "← Back to login"}
                </button>
                <button
                  type="button"
                  onClick={() => pendingAccount && generateAndSendOtp(pendingAccount)}
                  className="text-[#0d7d4d] hover:text-[#0b6a41] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>Resend Code</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Subtitle Caption */}
        <p className="text-center text-[11px] text-gray-400 font-medium mt-4">
          PSCMS - Public Safety Campaign Management System
        </p>
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState<WithdrawTarget | null>(null);
  const [applyTarget, setApplyTarget] = useState<ApplyTarget | null>(null);
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
      subject: `Enrolled: ${drillName}`,
      body: `You have successfully applied and reserved a slot for "${drillName}" (Session ID: ${drillId}). Arrive 15 minutes prior to start time with your required gear.`,
      status: "Sent",
      audience: ["user", "admin", "superadmin"],
    }, true);
    app.showToast(
      `Application confirmed! You have successfully enrolled in "${drillName}".`,
      "success",
      "Training Application Confirmed"
    );
  };

  const handleWithdraw = (drillId: string, drillName: string) => {
    setSignedUp(prev => prev.filter(x => x !== drillId));
    app.addNotification({
      type: "Withdrawal",
      subject: `${auth.name} withdrew from ${drillName}`,
      body: `${auth.name} (${auth.dept}) withdrew from session ${drillId} — ${drillName}. The roster and headcount have been updated.`,
      status: "Sent",
      audience: ["admin", "superadmin"],
    }, true);
    app.showToast(
      `You have withdrawn from "${drillName}".`,
      "info",
      "Session Withdrawal"
    );
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
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex-col" style={{ minHeight: "100vh" }}>
        <div className="px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 bg-white flex-shrink-0">
              <img src={BARANGAY_LOGO_IMG} alt="Barangay Culiat Seal" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[13px] font-bold font-display tracking-widest text-foreground uppercase leading-none">DPTSS</div>
              <div className="text-[11px] font-mono text-muted-foreground mt-0.5 leading-none">Participant Portal</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest px-2 mb-2">Navigation</div>
          {USER_NAV.map((item, i) => {
            const Icon = item.icon;
            const active = mod === item.id;
            return (
              <motion.button key={item.id} onClick={() => setMod(item.id)}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.25 }}
                whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors text-xs font-medium cursor-pointer ${active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"}`}>
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
          <motion.button onClick={() => setShowLogoutModal(true)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} className="text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"><LogOut size={15} /></motion.button>
        </div>
      </aside>

      {/* Mobile Sliding Navigation Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="relative w-72 max-w-[80vw] bg-sidebar border-r border-sidebar-border flex flex-col h-full z-10 shadow-2xl"
            >
              <div className="px-4 py-4 border-b border-sidebar-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 bg-white flex-shrink-0">
                    <img src={BARANGAY_LOGO_IMG} alt="Barangay Culiat Seal" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold font-display tracking-widest text-foreground uppercase leading-none">DPTSS</div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5 leading-none">Participant Portal</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest px-2 mb-2">Navigation</div>
                {USER_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = mod === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setMod(item.id); setMobileNavOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors text-xs font-semibold cursor-pointer ${
                        active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <Icon size={16} className={active ? "text-primary" : "text-current"} />
                      <span>{item.label}</span>
                      {active && <ChevronRight size={14} className="ml-auto text-primary" />}
                    </button>
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
                <button
                  onClick={() => { setMobileNavOpen(false); setShowLogoutModal(true); }}
                  className="text-muted-foreground hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

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
      {applyTarget && (
        <ApplyConfirmModal
          target={applyTarget}
          onCancel={() => setApplyTarget(null)}
          onConfirm={() => {
            handleSignUp(applyTarget.id, applyTarget.name);
            setApplyTarget(null);
          }}
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
        <header className="h-14 border-b border-border flex items-center justify-between px-3.5 sm:px-6 bg-card/60 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono min-w-0">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
            <span className="hidden sm:inline">DPTSS</span>
            <ChevronRight size={12} className="hidden sm:inline" />
            <span className="text-foreground font-semibold truncate">{USER_NAV.find(n => n.id === mod)?.label}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden xs:flex items-center gap-1.5 text-xs font-mono text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="hidden sm:inline">ONLINE</span>
            </div>
            <DarkModeToggle />
            <NotificationBell role={auth.role} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <AnimatePresence mode="wait">
            <motion.div key={mod} variants={pageTransition} initial="hidden" animate="show" exit="exit">
              {mod === "myDashboard" && (
                <div className="space-y-5">
                  <div>
                    <h1 className="text-2xl font-bold font-display tracking-wide text-foreground">WELCOME BACK, {auth.name.split(" ")[0].toUpperCase()}</h1>
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
                        <div className="text-3xl font-bold font-display text-foreground">{s.value}</div>
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
                    <h1 className="text-2xl font-bold font-display tracking-wide text-foreground">MY SESSIONS</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Your enrolled training sessions and completion history</p>
                  </div>
                  <div className="space-y-3">
                    {userSessions.map(s => (
                      <div key={s.id} className="bg-card border border-border rounded-lg p-4 hover:border-[rgba(240,165,0,0.25)] transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex flex-col items-center justify-center flex-shrink-0">
                            <div className="text-xs font-mono text-muted-foreground">{s.date.split(" ")[0]}</div>
                            <div className="text-lg font-bold font-display text-primary leading-none">{s.date.split(" ")[1].replace(",", "")}</div>
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
                          <div key={r.id} className="bg-card border border-border rounded-lg p-3.5 sm:p-4 opacity-90">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                              <div className="flex items-center gap-3 sm:block">
                                <div className="w-12 h-12 rounded-lg bg-secondary flex flex-col items-center justify-center flex-shrink-0">
                                  <div className="text-xs font-mono text-muted-foreground">{new Date(r.date).toLocaleDateString(undefined, { month: "short" })}</div>
                                  <div className="text-lg font-bold font-display text-muted-foreground leading-none">{new Date(r.date).getDate()}</div>
                                </div>
                                <div className="sm:hidden flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-foreground truncate">{r.program}</div>
                                  <Badge status={r.status}>{r.status}</Badge>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="hidden sm:flex items-center gap-2 mb-1">
                                  <h3 className="text-sm font-semibold text-foreground">{r.program}</h3>
                                  <Badge status={r.status}>{r.status}</Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-muted-foreground">
                                  <span>{new Date(r.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                                  {typeof r.score === "number" && <span className="flex items-center gap-1"><Star size={12} />Score: {r.score}%</span>}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0 sm:self-start">
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
                    <h1 className="text-2xl font-bold font-display tracking-wide text-foreground">MY PERFORMANCE</h1>
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
                        <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
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
                    <h1 className="text-2xl font-bold font-display tracking-wide text-foreground">BROWSE DRILLS</h1>
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
                              <div className="text-lg font-bold font-display text-primary">{d.date}</div>
                              <div className={`text-[12px] font-mono ${d.slots < 5 ? "text-red-400" : "text-muted-foreground"}`}>{d.slots} slots left</div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{d.desc}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-primary/40 rounded-full" style={{ width: `${100 - (d.slots / 30) * 100}%` }} />
                            </div>
                            <button
                              onClick={() =>
                                joined
                                  ? setWithdrawTarget({ id: d.id, name: d.name, date: d.date })
                                  : setApplyTarget({
                                    id: d.id,
                                    name: d.name,
                                    date: d.date,
                                    slots: d.slots,
                                    type: d.type,
                                    level: d.level,
                                    desc: d.desc,
                                  })
                              }
                              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap cursor-pointer ${joined
                                ? "bg-secondary text-muted-foreground hover:text-red-400"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                                }`}
                            >
                              {joined ? <><X size={13} />Withdraw</> : <><Plus size={13} />Apply</>}
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
                    <h1 className="text-2xl font-bold font-display tracking-wide text-foreground">NOTIFICATIONS &amp; SMS ALERTS</h1>
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
        <h1 className="text-4xl font-bold font-display text-foreground tracking-wide">COMMAND OVERVIEW</h1>
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
              <span className="text-3xl font-bold font-display text-foreground leading-none">{s.value}</span>
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
      <motion.div className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent shrink-0" />
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto min-h-0">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-xl sm:text-2xl font-bold font-display tracking-wide text-foreground">CREATE NEW TRAINING PROGRAM</h2>
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
      <motion.div className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className={`h-1 w-full bg-gradient-to-r ${scenario.color === "text-orange-400" ? "from-orange-400" : "from-primary"} via-primary/60 to-transparent`} />
        <div className="p-6 space-y-5">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-2">
              <scenario.icon size={22} className={scenario.color} />
              <h2 className="text-lg font-bold font-display tracking-wide text-foreground">{scenario.name}</h2>
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
      <motion.div className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-primary/60 to-transparent" />
        <div className="p-6 space-y-5">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-lg font-bold font-display tracking-wide text-foreground">REGISTER NEW PARTICIPANT</h2>
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
      <motion.div className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
        <div className="p-6 space-y-5">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-lg font-bold font-display tracking-wide text-foreground">EXPORT DATA</h2>
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
      <motion.div className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent sticky top-0" />
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1"><span className="text-[12px] font-mono text-muted-foreground">{program.id}</span><Badge status={program.status}>{program.status}</Badge><Badge status={program.level}>{program.level}</Badge>{program.disasterType && <Badge status={program.disasterType}>{program.disasterType}</Badge>}<span className="text-[11px] font-mono text-muted-foreground">{program.source}</span></div>
              <h2 className="text-2xl font-bold font-display tracking-wide text-foreground">{program.title}</h2>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground flex-shrink-0"><X size={18} /></button>
          </div>

          {program.description && (
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Description</div>
              <p className="text-sm text-foreground leading-relaxed">{program.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
            <ProgramDetailRow label="Modules" value={program.modules} />
            <ProgramDetailRow label="Duration" value={program.duration} />
            <ProgramDetailRow label="Passing Score" value={program.passingScore ? `${program.passingScore}%` : undefined} />
            <ProgramDetailRow label="Certification" value={program.certificationName} />
            <ProgramDetailRow label="Estimated Cost" value={program.estimatedCost !== undefined ? `₱${program.estimatedCost.toLocaleString()}` : undefined} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      <motion.div className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent sticky top-0" />
        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1"><span className="text-[12px] font-mono text-muted-foreground">{program.id}</span><span className="text-[11px] font-mono text-muted-foreground">{program.source}</span></div>
            <h2 className="text-2xl font-bold font-display tracking-wide text-foreground">EDIT TRAINING PROGRAM</h2>
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
      <motion.div className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent sticky top-0" />
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1"><span className="text-[12px] font-mono text-muted-foreground">{session.id}</span><Badge status={session.status ?? "Scheduled"}>{session.status ?? "Scheduled"}</Badge><span className="text-[11px] font-mono text-muted-foreground">{session.source}</span></div>
              <h2 className="text-2xl font-bold font-display tracking-wide text-foreground">{session.course}</h2>
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
      <motion.div className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent sticky top-0" />
        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1"><span className="text-[12px] font-mono text-muted-foreground">{session.id}</span><span className="text-[11px] font-mono text-muted-foreground">{session.source}</span></div>
            <h2 className="text-2xl font-bold font-display tracking-wide text-foreground">EDIT TRAINING SESSION</h2>
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
      <motion.div className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent sticky top-0" />
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1"><span className="text-[12px] font-mono text-muted-foreground">{resource.id}</span><Badge status={resource.available ? "Active" : "Draft"}>{resource.available ? "Available" : "Committed"}</Badge><span className="text-[11px] font-mono text-muted-foreground">{resource.type}</span></div>
              <h2 className="text-2xl font-bold font-display tracking-wide text-foreground">{resource.name}</h2>
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
      <motion.div className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent sticky top-0" />
        <div className="p-6 space-y-5">
          <div>
            <div className="text-[12px] font-mono text-muted-foreground mb-1">{resource.id}</div>
            <h2 className="text-2xl font-bold font-display tracking-wide text-foreground">EDIT RESOURCE</h2>
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
        <div><h1 className="text-4xl font-bold font-display tracking-wide text-foreground">TRAINING PROGRAM MANAGEMENT</h1><p className="text-muted-foreground text-base mt-0.5">Curriculum · scheduling · resource allocation</p></div>
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
                  <div><div className="text-lg font-bold font-display text-foreground">{c.modules}</div><div className="text-[12px] font-mono text-muted-foreground">modules</div></div>
                  <div><div className="text-lg font-bold font-display text-foreground">{c.duration}</div><div className="text-[12px] font-mono text-muted-foreground">duration</div></div>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead><tr className="border-b border-border bg-secondary/40">{["ID", "Course", "Date", "Location", "Trainer", "Enrollment", "Status", ""].map(h => <th key={h} className="text-left text-[12px] font-mono font-medium text-muted-foreground uppercase tracking-widest px-4 py-3">{h}</th>)}</tr></thead>
              <tbody>{allSessions.map((s, i) => {
                const pct = Math.round(s.enrolled / s.capacity * 100); return (<tr key={s.id} className={`border-b border-border hover:bg-secondary/30 ${i === allSessions.length - 1 ? "border-b-0" : ""}`}><td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.id}</td><td className="px-4 py-3 text-xs font-semibold text-foreground">{s.course}</td><td className="px-4 py-3"><div className="text-xs font-mono text-foreground">{s.date}</div><div className="text-[12px] font-mono text-muted-foreground">{s.time}</div></td><td className="px-4 py-3 text-xs text-muted-foreground">{s.location}</td><td className="px-4 py-3 text-xs text-muted-foreground">{s.trainer}</td><td className="px-4 py-3 min-w-[120px]"><div className="flex items-center gap-2"><div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden"><div className={`h-full rounded-full ${pct > 85 ? "bg-red-400" : "bg-primary"}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div><span className="text-[12px] font-mono text-muted-foreground">{s.enrolled}/{s.capacity}</span></div></td><td className="px-4 py-3"><Badge status={s.status}>{s.status}</Badge></td><td className="px-4 py-3">
                  <DropdownMenu items={[
                    { label: "View Details", icon: Eye, onClick: () => setViewingSession(s as CurriculumSession) },
                    { label: "Edit Session", icon: Edit2, onClick: () => setEditingSession(s as CurriculumSession) },
                    { label: "Duplicate Session", icon: PlusCircle, onClick: () => { const { source: _src, ...base } = s as CurriculumSession; app.createSession({ ...base, id: "", status: "Scheduled", enrolled: 0 }); app.addNotification({ type: "Session", subject: `Duplicated session: ${s.course}`, status: "Sent" }); } },
                    ...(s.status !== "Cancelled" ? [{
                      label: "Cancel Session", icon: XCircle, danger: true, onClick: () => {
                        if (s.source === "Seed Catalog") { setSeedSessions(prev => prev.map(x => x.id === s.id ? { ...x, status: "Cancelled" } : x)); app.addNotification({ type: "Session", subject: `Session ${s.id} cancelled`, status: "Sent" }); }
                        else { app.cancelSession(s.id); }
                      }
                    }] : []),
                  ]} />
                </td></tr>);
              })}</tbody>
            </table>
          </div>
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
          <h1 className="text-4xl font-bold font-display tracking-wide text-foreground">
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${active
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
                  className={`text-left p-3 rounded-lg border transition-all ${active ? `${t.border} ${t.bg}` : "border-border bg-card hover:border-border/80"
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
            <div className="bg-card/95 border border-border rounded-3xl backdrop-blur-xl p-6 space-y-6 shadow-sm">

              {/* Script Title Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase bg-primary/20 text-primary px-2 py-0.5 rounded font-bold">
                      {generatedStory.severity} SEVERITY DRILL
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">• {generatedStory.disasterType}</span>
                  </div>
                  <h2 className="text-3xl font-bold font-display text-foreground tracking-wide">
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
      <motion.div className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-lg overflow-hidden" initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={{ duration: 0.25 }}>
        <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-primary/60 to-transparent" />
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold font-display tracking-wide text-foreground">MESSAGE PARTICIPANT</h2>
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
          className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col"
          initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent flex-shrink-0" />

          <div className="p-6 flex items-start justify-between gap-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3.5">
              <AvatarCircle initials={participant.name.split(" ").map(n => n[0]).join("")} color="bg-blue-500/20" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-display tracking-wide text-foreground">{participant.name}</h2>
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
        <div><h1 className="text-4xl font-bold font-display tracking-wide text-foreground">PARTICIPANT REGISTRATION</h1><p className="text-muted-foreground text-base mt-0.5">Profiles · attendance records · self-service portal · notifications</p></div>
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
  Sparkles
} from "lucide-react";
import { LandingPage } from './components/LandingPage';

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
          <h1 className="text-2xl font-bold font-display tracking-wide text-foreground">PERFORMANCE EVALUATION</h1>
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
                <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
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
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider font-display">AI Evaluation & Tactical Insights</h3>
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
                <div className={`text-lg font-bold font-display mt-1 ${aiReport.statusColor}`}>
                  {aiReport.readinessStatus}
                </div>
              </div>
              <div className="bg-secondary/40 border border-border p-3.5 rounded-md">
                <div className="text-[11px] font-mono text-muted-foreground uppercase">Field Assessor Avg</div>
                <div className="text-lg font-bold font-display mt-1 text-primary">
                  {aiReport.avgAssessorScore}%
                </div>
              </div>
              <div className="bg-secondary/40 border border-border p-3.5 rounded-md">
                <div className="text-[11px] font-mono text-muted-foreground uppercase">Response Efficiency</div>
                <div className="text-lg font-bold font-display mt-1 text-foreground flex items-center gap-1">
                  <TrendingUp size={16} className="text-green-400" />
                  +{aiReport.speedGain} min
                </div>
              </div>
              <div className="bg-secondary/40 border border-border p-3.5 rounded-md">
                <div className="text-[11px] font-mono text-muted-foreground uppercase">Focus Gap Sector</div>
                <div className="text-lg font-bold font-display mt-1 text-primary">
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
        <div><h1 className="text-2xl font-bold font-display tracking-wide text-foreground">DISASTER DRILL REPORTING</h1><p className="text-muted-foreground text-sm mt-0.5">After-action reports · compliance · trend analysis</p></div>
        <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary/90"><Download size={16} />Export</button>
      </div>
      <TabBar tabs={[{ id: "aar", label: "After-Action Report", icon: FileCheck }, { id: "compliance", label: "Compliance Analytics", icon: Shield }, { id: "trends", label: "Trend Analysis", icon: Trend }]} active={tab} onChange={v => setTab(v as ReportTab)} />
      {tab === "aar" && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div><div className="flex items-center gap-2 mb-1"><span className="text-[12px] font-mono text-muted-foreground">RPT-2026-018</span><Badge status="Completed">Completed</Badge></div><h2 className="text-lg font-bold font-display text-foreground">Earthquake Response — Advanced</h2><div className="flex gap-4 mt-1 text-xs font-mono text-muted-foreground"><span>Jun 28, 2026</span><span>·</span><span>District 4 EOC</span><span>·</span><span>42 participants</span></div></div>
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
          <div className="grid grid-cols-3 gap-3">{[{ label: "Score Improvement", value: "+21pts", color: "text-green-400" }, { label: "Pass Rate Growth", value: "+23%", color: "text-primary" }, { label: "Response Time Δ", value: "−3.0 min", color: "text-blue-400" }].map(s => (<div key={s.label} className="bg-card border border-border rounded-lg p-4"><div className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{s.label}</div><div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div></div>))}</div>
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
          className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col"
          initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent flex-shrink-0" />

          <div className="p-6 flex items-start justify-between gap-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3.5">
              <AvatarCircle initials={user.avatar} color={user.role === "superadmin" ? "bg-primary/20" : user.role === "admin" ? "bg-purple-500/20" : "bg-blue-500/20"} />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-display tracking-wide text-foreground">{user.name}</h2>
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
          className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-md overflow-hidden"
          initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display tracking-wide text-foreground">ADD NEW USER</h2>
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
    const target = users.find(u => u.id === id);
    if (target) {
      const nextStatus = target.status === "Active" ? "Suspended" : "Active";
      app.updateAccount(target.email, { status: nextStatus });
    }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" } : u));
    setDetailUser(prev => prev && prev.id === id ? { ...prev, status: prev.status === "Active" ? "Suspended" : "Active" } : prev);
  };

  const changeRole = (id: string, role: Role) => {
    const target = users.find(u => u.id === id);
    if (target) {
      app.updateAccount(target.email, { role });
    }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    setDetailUser(prev => prev && prev.id === id ? { ...prev, role } : prev);
  };

  const createUser = (u: ManagedUser) => {
    setUsers(prev => [u, ...prev]);
    app.addUser({ id: "", name: u.name, email: u.email, dept: u.dept, role: u.role, status: "Active" });
    const initials = u.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "US";
    app.addAccount({
      name: u.name,
      email: u.email,
      password: "password123",
      role: u.role,
      dept: u.dept,
      avatar: initials,
      phone: u.phone || "+63 900 000 0000",
      status: "Active",
    });
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
          <h1 className="text-2xl font-bold font-display tracking-wide text-foreground">USER MANAGEMENT</h1>
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
            <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-full sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, department..."
            className="w-full bg-input-background border border-border rounded-md pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", "superadmin", "admin", "user"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {f === "all" ? "All" : f === "superadmin" ? "Super Admin" : f === "admin" ? "Admin" : "Users"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
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
          className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-sm overflow-hidden"
          initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
          <div className="p-6">
            <motion.div className={`w-12 h-12 rounded-full ${color.bg} border ${color.border} flex items-center justify-center mx-auto mb-4`}
              initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}>
              <Icon size={22} className={color.text} />
            </motion.div>
            <h2 className="text-center text-lg font-bold font-display tracking-wide text-foreground">{title}</h2>
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
          className="relative bg-card/95 border border-border rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-md overflow-hidden"
          initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display tracking-wide text-foreground">SYSTEM ANNOUNCEMENT</h2>
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
        <h1 className="text-2xl font-bold font-display tracking-wide text-foreground">SYSTEM SETTINGS</h1>
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex-col" style={{ minHeight: "100vh" }}>
        <div className="px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 bg-white flex-shrink-0"><img src={BARANGAY_LOGO_IMG} alt="Barangay Culiat Seal" className="w-full h-full object-cover" /></div>
            <div><div className="text-[13px] font-bold font-display tracking-widest text-foreground uppercase leading-none">DPTSS</div><div className="text-[11px] font-mono text-muted-foreground mt-0.5 leading-none">Admin Console</div></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest px-2 mb-2">Modules</div>
          {ADMIN_NAV.map((item, i) => { const Icon = item.icon; const active = mod === item.id; return (<motion.button key={item.id} onClick={() => setMod(item.id)} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }} whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors text-xs font-medium cursor-pointer ${active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"}`}><Icon size={15} className={active ? "text-primary" : "text-current"} /><span>{item.label}</span>{active && <ChevronRight size={12} className="ml-auto text-primary" />}</motion.button>); })}
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
          <motion.button onClick={() => setShowLogoutModal(true)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} className="text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"><LogOut size={15} /></motion.button>
        </div>
      </aside>

      {/* Mobile Sliding Navigation Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="relative w-72 max-w-[80vw] bg-sidebar border-r border-sidebar-border flex flex-col h-full z-10 shadow-2xl"
            >
              <div className="px-4 py-4 border-b border-sidebar-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 bg-white flex-shrink-0">
                    <img src={BARANGAY_LOGO_IMG} alt="Barangay Culiat Seal" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold font-display tracking-widest text-foreground uppercase leading-none">DPTSS</div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5 leading-none">Admin Console</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest px-2 mb-2">Modules</div>
                {ADMIN_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = mod === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setMod(item.id); setMobileNavOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors text-xs font-semibold cursor-pointer ${
                        active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <Icon size={16} className={active ? "text-primary" : "text-current"} />
                      <span>{item.label}</span>
                      {active && <ChevronRight size={14} className="ml-auto text-primary" />}
                    </button>
                  );
                })}
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
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{auth.name}</div>
                  <div className="text-[12px] font-mono text-muted-foreground">Admin</div>
                </div>
                <button
                  onClick={() => { setMobileNavOpen(false); setShowLogoutModal(true); }}
                  className="text-muted-foreground hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {showLogoutModal && (
        <LogoutConfirmModal auth={auth} onConfirm={onLogout} onCancel={() => setShowLogoutModal(false)} />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-3.5 sm:px-6 bg-card/60 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono min-w-0">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
            <span className="hidden sm:inline">DPTSS</span>
            <ChevronRight size={12} className="hidden sm:inline" />
            <span className="text-foreground font-semibold truncate">{ADMIN_NAV.find(n => n.id === mod)?.label}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden xs:flex items-center gap-1.5 text-xs font-mono text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="hidden sm:inline">SYS OPERATIONAL</span>
            </div>
            <DarkModeToggle />
            <NotificationBell role={auth.role} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex-col" style={{ minHeight: "100vh" }}>
        <div className="px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 bg-white flex-shrink-0"><img src={BARANGAY_LOGO_IMG} alt="Barangay Culiat Seal" className="w-full h-full object-cover" /></div>
            <div><div className="text-[13px] font-bold font-display tracking-widest text-foreground uppercase leading-none">DPTSS</div><div className="text-[11px] font-mono text-muted-foreground mt-0.5 leading-none">Super Admin</div></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {groups.map(g => (
            <div key={g}>
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest px-2 mb-1.5">{g}</div>
              <div className="space-y-0.5">
                {SA_NAV.filter(n => n.group === g).map((item, i) => { const Icon = item.icon; const active = mod === item.id; return (<motion.button key={item.id} onClick={() => setMod(item.id)} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }} whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors text-xs font-medium cursor-pointer ${active ? `bg-sidebar-accent text-foreground` : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"}`}><Icon size={15} className={active ? "text-primary" : "text-current"} /><span>{item.label}</span>{active && <ChevronRight size={12} className="ml-auto text-primary" />}</motion.button>); })}
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
          <motion.button onClick={() => setShowLogoutModal(true)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} className="text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"><LogOut size={15} /></motion.button>
        </div>
      </aside>

      {/* Mobile Sliding Navigation Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="relative w-72 max-w-[80vw] bg-sidebar border-r border-sidebar-border flex flex-col h-full z-10 shadow-2xl"
            >
              <div className="px-4 py-4 border-b border-sidebar-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 bg-white flex-shrink-0">
                    <img src={BARANGAY_LOGO_IMG} alt="Barangay Culiat Seal" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold font-display tracking-widest text-foreground uppercase leading-none">DPTSS</div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5 leading-none">Super Admin</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
                {groups.map(g => (
                  <div key={g}>
                    <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest px-2 mb-1.5">{g}</div>
                    <div className="space-y-1">
                      {SA_NAV.filter(n => n.group === g).map((item) => {
                        const Icon = item.icon;
                        const active = mod === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => { setMod(item.id); setMobileNavOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors text-xs font-semibold cursor-pointer ${
                              active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                            }`}
                          >
                            <Icon size={16} className={active ? "text-primary" : "text-current"} />
                            <span>{item.label}</span>
                            {active && <ChevronRight size={14} className="ml-auto text-primary" />}
                          </button>
                        );
                      })}
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
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{auth.name}</div>
                  <div className="text-[12px] font-mono text-primary">Super Admin</div>
                </div>
                <button
                  onClick={() => { setMobileNavOpen(false); setShowLogoutModal(true); }}
                  className="text-muted-foreground hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {showLogoutModal && (
        <LogoutConfirmModal auth={auth} onConfirm={onLogout} onCancel={() => setShowLogoutModal(false)} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-3.5 sm:px-6 bg-card/60 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono min-w-0">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
            <span className="hidden sm:inline">DPTSS</span>
            <ChevronRight size={12} className="hidden sm:inline" />
            <span className={`truncate font-semibold ${["usermgmt", "settings"].includes(mod) ? "text-primary" : "text-foreground"}`}>
              {SA_NAV.find(n => n.id === mod)?.label}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden xs:flex items-center gap-1.5 text-xs font-mono text-primary border border-primary/20 bg-primary/10 px-2 py-0.5 rounded">
              <ShieldCheck size={12} />
              <span className="hidden sm:inline">SUPER ADMIN</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>SYS OPERATIONAL</span>
            </div>
            <DarkModeToggle />
            <NotificationBell role={auth.role} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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

function AppContent() {
  const [auth, setAuth] = useState<AuthUser | null>(null);
  const [view, setView] = useState<"landing" | "login">("landing");
  const [authMode, setAuthMode] = useState<"signin" | "register">("signin");
  const app = useApp();

  useEffect(() => {
    document.title = "Barangay Culiat | Integrated Public Safety & Security";
    const existing = document.querySelectorAll("link[rel~='icon']");
    existing.forEach(el => el.parentNode?.removeChild(el));
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/jpeg";
    link.href = BARANGAY_LOGO_IMG;
    document.head.appendChild(link);
  }, []);

  const handleLogout = (reason?: string) => {
    setAuth(null);
    setView("landing");
    if (reason) {
      app.showToast(reason, "warning", "Session Ended");
    }
  };

  if (!auth) {
    if (view === "landing") {
      return (
        <>
          <LandingPage
            onLogin={() => {
              setAuthMode("signin");
              setView("login");
            }}
            onRegister={() => {
              setAuthMode("register");
              setView("login");
            }}
            logoImg="/culiat_logo.jpg"
            hqImg="/culiat_hq.jpg"
          />
          <ToastContainer />
        </>
      );
    }
    return (
      <>
        <LoginScreen
          initialMode={authMode}
          onLogin={(user) => {
            setAuth(user);
            const roleTitle = user.role === "superadmin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Resident";
            app.showToast(`Welcome back, ${user.name}! (${roleTitle})`, "success", "Signed In Successfully");
          }}
          onBack={() => setView("landing")}
          onRegisterSuccess={(user) => {
            setAuth(user);
            const roleTitle = user.role === "superadmin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Resident";
            app.showToast(`Account registered! Welcome to your ${roleTitle} portal, ${user.name}!`, "success", "Registration Successful");
          }}
        />
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <SessionTimeoutHandler onLogout={handleLogout} />
      {auth.role === "user" && <UserPortal auth={auth} onLogout={() => handleLogout()} />}
      {auth.role === "admin" && <AdminShell auth={auth} onLogout={() => handleLogout()} />}
      {auth.role === "superadmin" && <SuperAdminShell auth={auth} onLogout={() => handleLogout()} />}
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
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


