import type { InventoryItem, User, AuditLog } from '../types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('qtrack_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers: { ...headers, ...options?.headers } });
  const text = await res.text();

  if (!res.ok) {
    let msg = text;
    try {
      const json = JSON.parse(text);
      msg = json.error || json.message || msg;
    } catch {}
    throw new Error(msg.length > 200 ? msg.substring(0, 200) + '...' : msg);
  }
  return text ? JSON.parse(text) : ({} as T);
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>('/.netlify/functions/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }).then(r => { localStorage.setItem('qtrack_token', r.token); return r; }),

    register: (email: string, password: string, fullName: string) =>
      request<{ token: string; user: User }>('/.netlify/functions/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName }),
      }).then(r => { localStorage.setItem('qtrack_token', r.token); return r; }),

    logout: () => localStorage.removeItem('qtrack_token'),
    getToken: () => localStorage.getItem('qtrack_token'),
  },

  items: {
    getAll: () => request<InventoryItem[]>('/.netlify/functions/api/items'),
    create: (item: InventoryItem) => request<InventoryItem>('/.netlify/functions/api/items', { method: 'POST', body: JSON.stringify(item) }),
    update: (item: InventoryItem) => request<InventoryItem>(`/.netlify/functions/api/items/${item.id}`, { method: 'PUT', body: JSON.stringify(item) }),
    delete: (id: string) => request(`/.netlify/functions/api/items/${id}`, { method: 'DELETE' }),
  },

  logs: {
    getAll: () => request<AuditLog[]>('/.netlify/functions/api/logs'),
    create: (log: Omit<AuditLog, 'id' | 'timestamp'>) => request<AuditLog>('/.netlify/functions/api/logs', { method: 'POST', body: JSON.stringify(log) }),
  },
};