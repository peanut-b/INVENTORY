import type { InventoryItem, User, AuditLog } from '../types';

const API_BASE = '/.netlify/functions/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('qtrack_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  const text = await response.text();

  if (!response.ok) {
    try {
      const error = JSON.parse(text);
      throw new Error(error.error || error.message || 'Request failed');
    } catch {
      throw new Error(text || 'Request failed');
    }
  }

  if (!text) return {} as T;
  return JSON.parse(text);
}

export const api = {
  auth: {
     async login(email: string, password: string): Promise<{ token: string; user: User }> {
       const result = await fetchApi<{ token: string; user: User }>('/auth/login', {
         method: 'POST',
         body: JSON.stringify({ email, password }),
       });
       localStorage.setItem('qtrack_token', result.token);
       return result;
     },

     async register(email: string, password: string, fullName: string): Promise<{ token: string; user: User }> {
       const result = await fetchApi<{ token: string; user: User }>('/auth/register', {
         method: 'POST',
         body: JSON.stringify({ email, password, fullName }),
       });
       localStorage.setItem('qtrack_token', result.token);
       return result;
     },

     logout() {
       localStorage.removeItem('qtrack_token');
     },

     getToken(): string | null {
       return localStorage.getItem('qtrack_token');
     }
   },

  items: {
    async getAll(): Promise<InventoryItem[]> {
      return fetchApi<InventoryItem[]>('/items');
    },

    async create(item: InventoryItem): Promise<InventoryItem> {
      return fetchApi<InventoryItem>('/items', {
        method: 'POST',
        body: JSON.stringify(item),
      });
    },

    async update(item: InventoryItem): Promise<InventoryItem> {
      return fetchApi<InventoryItem>(`/items/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify(item),
      });
    },

    async delete(id: string): Promise<void> {
      await fetchApi(`/items/${id}`, { method: 'DELETE' });
    },
  },

  logs: {
    async getAll(): Promise<AuditLog[]> {
      return fetchApi<AuditLog[]>('/logs');
    },

    async create(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
      return fetchApi<AuditLog>('/logs', {
        method: 'POST',
        body: JSON.stringify(log),
      });
    },
  },

  initializeDatabase: async (): Promise<void> => {
    await fetchApi('/init', { method: 'POST' });
  }
};