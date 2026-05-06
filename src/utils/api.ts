import type { InventoryItem, User, AuditLog } from '../types';

const BASE = '/.netlify/functions/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('qtrack_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...headers, ...options?.headers } });
  const text = await res.text();

  if (!res.ok) throw new Error(text || 'Request failed');
  return text ? JSON.parse(text) : ({} as T);
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }).then(r => { localStorage.setItem('qtrack_token', r.token); return r; }),

    register: (email: string, password: string, fullName: string) =>
      request<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName }),
      }).then(r => { localStorage.setItem('qtrack_token', r.token); return r; }),

    logout: () => localStorage.removeItem('qtrack_token'),
    getToken: () => localStorage.getItem('qtrack_token'),
  },

  items: {
    getAll: () => request<InventoryItem[]>('/items'),
    create: (item: InventoryItem) => request<InventoryItem>('/items', { method: 'POST', body: JSON.stringify(item) }),
    update: (item: InventoryItem) => request<InventoryItem>(`/items/${item.id}`, { method: 'PUT', body: JSON.stringify(item) }),
    delete: (id: string) => request(`/items/${id}`, { method: 'DELETE' }),
  },

  logs: {
    getAll: () => request<AuditLog[]>('/logs'),
    create: (log: Omit<AuditLog, 'id' | 'timestamp'>) => request<AuditLog>('/logs', { method: 'POST', body: JSON.stringify(log) }),
  },
};