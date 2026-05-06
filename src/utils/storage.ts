import Papa from 'papaparse';
import { InventoryItem, User, AuditLog } from '../types';

const STORAGE_KEY = 'qtrack_inventory';
const USER_KEY = 'qtrack_user';
const AUDIT_KEY = 'qtrack_audit_log';

export const storage = {
  // --- Auth Storage ---
  setUser: (user: User | null) => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  },

  getUser: (): User | null => {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  // --- Audit Storage ---
  addLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const logs = storage.getLogs();
    const newLog: AuditLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(logs.slice(0, 500))); // Store last 500 logs
  },

  getLogs: (): AuditLog[] => {
    const data = localStorage.getItem(AUDIT_KEY);
    return data ? JSON.parse(data) : [];
  },

  // --- Inventory Storage ---
  calculateStatus: (quantity: number, minLevel: number): 'IN' | 'OUT' | 'LOW' => {
    if (quantity <= 0) return 'OUT';
    if (quantity <= minLevel) return 'LOW';
    return 'IN';
  },

  saveItems: (items: InventoryItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },

  getItems: (): InventoryItem[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  addItem: (item: InventoryItem) => {
    const items = storage.getItems();
    item.status = storage.calculateStatus(item.quantity, item.minStockLevel || 5);
    items.push(item);
    storage.saveItems(items);
  },

  updateItem: (updatedItem: InventoryItem) => {
    const items = storage.getItems();
    const index = items.findIndex((i) => i.id === updatedItem.id);
    if (index !== -1) {
      updatedItem.status = storage.calculateStatus(updatedItem.quantity, updatedItem.minStockLevel || 5);
      items[index] = updatedItem;
      storage.saveItems(items);
    }
  },

  deleteItem: (id: string) => {
    const items = storage.getItems();
    const filtered = items.filter((i) => i.id !== id);
    storage.saveItems(filtered);
  },

  exportToCSV: () => {
    const items = storage.getItems();
    const csv = Papa.unparse(items);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  importFromCSV: (file: File): Promise<InventoryItem[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const items = results.data as any[];
          const validatedItems = items.filter(i => i.name).map(i => {
            const qty = Number(i.quantity) || 0;
            const minLevel = Number(i.minStockLevel) || 5;
            return {
              ...i,
              id: i.id || crypto.randomUUID(),
              quantity: qty,
              minStockLevel: minLevel,
              category: i.category || 'NETWORK',
              type: i.type || 'CHURCH',
              price: Number(i.price) || 0,
              status: storage.calculateStatus(qty, minLevel),
              createdAt: i.createdAt || new Date().toISOString()
            } as InventoryItem;
          });
          resolve(validatedItems);
        },
        error: (error) => reject(error),
      });
    });
  }
};
