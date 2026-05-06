export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  serialNumber: string;
  quantity: number;
  minStockLevel: number;
  category: string;
  type: string;
  datePurchase: string;
  dateAcquisition: string;
  price: number;
  createdAt: string;
  status: 'IN' | 'OUT' | 'LOW';
}

export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userFullName: string;
  action: 'ADD' | 'UPDATE' | 'DELETE' | 'STOCK_IN' | 'STOCK_OUT';
  itemId: string;
  itemName: string;
  details: string;
}

export type ViewState = 'dashboard' | 'inventory' | 'register' | 'scanner' | 'details' | 'sticker' | 'login' | 'forgot-password' | 'settings' | 'audit_log' | 'register-form';
