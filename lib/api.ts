import type { Client, Meeting, MeetingWithClient, Todo, TodoWithClient, DashboardStats, DailyPlan, DailyTask } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response wasn't JSON, keep default message
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function qs(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') usp.set(key, value);
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export const clientsApi = {
  list: (params: { status?: string; search?: string } = {}) =>
    request<Client[]>(`/api/clients${qs(params)}`),
  get: (id: string) => request<Client>(`/api/clients/${id}`),
  create: (payload: Partial<Client>) =>
    request<Client>('/api/clients', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<Client>) =>
    request<Client>(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: string) => request<{ success: boolean }>(`/api/clients/${id}`, { method: 'DELETE' }),
};

export const meetingsApi = {
  list: (params: { clientId?: string; status?: string } = {}) =>
    request<MeetingWithClient[]>(`/api/meetings${qs(params)}`),
  create: (payload: Partial<Meeting>) =>
    request<MeetingWithClient>('/api/meetings', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<Meeting>) =>
    request<MeetingWithClient>(`/api/meetings/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: string) => request<{ success: boolean }>(`/api/meetings/${id}`, { method: 'DELETE' }),
};

export const todosApi = {
  list: (params: { priority?: string; category?: string; timing?: string; status?: string; clientId?: string } = {}) =>
    request<TodoWithClient[]>(`/api/todos${qs(params)}`),
  create: (payload: Partial<Todo>) =>
    request<TodoWithClient>('/api/todos', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<Todo>) =>
    request<TodoWithClient>(`/api/todos/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: string) => request<{ success: boolean }>(`/api/todos/${id}`, { method: 'DELETE' }),
};

export const statsApi = {
  get: () => request<DashboardStats>('/api/stats'),
};

export const dailyPlanApi = {
  get: (date: string) => request<DailyPlan>(`/api/daily-plan${qs({ date })}`),
  updateNotes: (date: string, notes: string) =>
    request<DailyPlan>(`/api/daily-plan${qs({ date })}`, { method: 'PUT', body: JSON.stringify({ notes }) }),
  addTask: (date: string, title: string) =>
    request<DailyTask>('/api/daily-plan/tasks', { method: 'POST', body: JSON.stringify({ date, title }) }),
  toggleTask: (date: string, id: string, completed: boolean) =>
    request<DailyTask>(`/api/daily-plan/tasks/${id}${qs({ date })}`, { method: 'PATCH', body: JSON.stringify({ completed }) }),
  removeTask: (date: string, id: string) =>
    request<{ success: boolean }>(`/api/daily-plan/tasks/${id}${qs({ date })}`, { method: 'DELETE' }),
};
