/**
 * DPTSS Backend API Service Layer
 * Connects the frontend to the FastAPI backend (http://localhost:8000 / VITE_API_BASE_URL).
 * Provides typed methods for Programs, Sessions, Attendance, Notifications, Users, and Analytics.
 */

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `API Error ${res.status}: ${res.statusText}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.detail) errorMessage = parsed.detail;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export const api = {
  // System Health
  async health() {
    return request<{ status: string; supabase_connected: boolean; details: string }>('/health');
  },

  // Programs API
  programs: {
    list(params?: { search?: string; level?: string; disaster_type?: string; status?: string }) {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request<any[]>(`/api/programs/?${query}`);
    },
    get(id: string) {
      return request<any>(`/api/programs/${id}`);
    },
    create(data: any) {
      return request<any>('/api/programs/', { method: 'POST', body: JSON.stringify(data) });
    },
    update(id: string, updates: any) {
      return request<any>(`/api/programs/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    },
    delete(id: string) {
      return request<{ message: string; deleted: boolean }>(`/api/programs/${id}`, { method: 'DELETE' });
    },
  },

  // Sessions API
  sessions: {
    list(params?: { course?: string; trainer?: string; status?: string; date?: string }) {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request<any[]>(`/api/sessions/?${query}`);
    },
    get(id: string) {
      return request<any>(`/api/sessions/${id}`);
    },
    create(data: any) {
      return request<any>('/api/sessions/', { method: 'POST', body: JSON.stringify(data) });
    },
    update(id: string, updates: any) {
      return request<any>(`/api/sessions/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    },
    updateStatus(id: string, status: string) {
      return request<any>(`/api/sessions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    },
    delete(id: string) {
      return request<{ message: string; deleted: boolean }>(`/api/sessions/${id}`, { method: 'DELETE' });
    },
  },

  // Attendance & Drills API
  attendance: {
    list(params?: { participant_name?: string; program?: string; status?: string }) {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request<any[]>(`/api/attendance/?${query}`);
    },
    byParticipant(nameOrId: string) {
      return request<any[]>(`/api/attendance/participant/${encodeURIComponent(nameOrId)}`);
    },
    record(data: any) {
      return request<any>('/api/attendance/', { method: 'POST', body: JSON.stringify(data) });
    },
    update(id: string, updates: any) {
      return request<any>(`/api/attendance/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    },
    delete(id: string) {
      return request<{ message: string; deleted: boolean }>(`/api/attendance/${id}`, { method: 'DELETE' });
    },
  },

  // Notifications API
  notifications: {
    list(params?: { read?: boolean; notification_type?: string }) {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/api/notifications/?${query}`);
    },
    create(data: any) {
      return request<any>('/api/notifications/', { method: 'POST', body: JSON.stringify(data) });
    },
    markRead(id: string) {
      return request<any>(`/api/notifications/${id}/read`, { method: 'PATCH' });
    },
    markAllRead() {
      return request<{ message: string; updated: boolean }>('/api/notifications/mark-all-read', { method: 'PATCH' });
    },
    delete(id: string) {
      return request<{ message: string; deleted: boolean }>(`/api/notifications/${id}`, { method: 'DELETE' });
    },
    clearAll() {
      return request<{ message: string; deleted: boolean }>('/api/notifications/clear-all', { method: 'DELETE' });
    },
  },

  // Assessor Evaluations API
  evaluations: {
    list(params?: { assessor_name?: string; program?: string }) {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request<any[]>(`/api/evaluations/?${query}`);
    },
    byAssessor(assessorName: string) {
      return request<any[]>(`/api/evaluations/assessor/${encodeURIComponent(assessorName)}`);
    },
    submit(data: any) {
      return request<any>('/api/evaluations/', { method: 'POST', body: JSON.stringify(data) });
    },
  },

  // User Management API
  users: {
    list(params?: { role?: string; dept?: string; status?: string; search?: string }) {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request<any[]>(`/api/users/?${query}`);
    },
    get(id: string) {
      return request<any>(`/api/users/${id}`);
    },
    create(data: any) {
      return request<any>('/api/users/', { method: 'POST', body: JSON.stringify(data) });
    },
    update(id: string, updates: any) {
      return request<any>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    },
    updateStatus(id: string, status: string) {
      return request<any>(`/api/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    },
    delete(id: string) {
      return request<{ message: string; deleted: boolean }>(`/api/users/${id}`, { method: 'DELETE' });
    },
  },

  // Analytics API
  analytics: {
    summary() {
      return request<{
        total_programs: number;
        active_programs: number;
        total_sessions: number;
        scheduled_sessions: number;
        total_participants: number;
        completed_drills: number;
        average_score: number;
        total_evaluations: number;
        average_assessor_rating: number;
      }>('/api/analytics/summary');
    },
  },
};
