import { neon } from '@neondatabase/serverless';
import type { InventoryItem, AuditLog } from '../src/types';

const sql = neon(process.env.DATABASE_URL || 'postgresql://user:pass@host/db');

export async function getAllItems(): Promise<InventoryItem[]> {
  const rows = await sql`SELECT * FROM inventory_items ORDER BY created_at DESC`;
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description || '',
    serialNumber: row.serial_number,
    quantity: row.quantity,
    minStockLevel: row.min_stock_level,
    category: row.category,
    type: row.type,
    datePurchase: row.date_purchase,
    dateAcquisition: row.date_acquisition,
    price: row.price,
    createdAt: row.created_at,
    status: row.status
  }));
}

export async function createItem(item: InventoryItem): Promise<InventoryItem> {
  await sql`
    INSERT INTO inventory_items (id, name, description, serial_number, quantity, min_stock_level, category, type, date_purchase, date_acquisition, price, created_at, status)
    VALUES (
      ${item.id},
      ${item.name},
      ${item.description || ''},
      ${item.serialNumber},
      ${item.quantity},
      ${item.minStockLevel},
      ${item.category},
      ${item.type},
      ${item.datePurchase},
      ${item.dateAcquisition},
      ${item.price},
      ${item.createdAt},
      ${item.status}
    )
  `;
  return item;
}

export async function updateItem(item: InventoryItem): Promise<InventoryItem> {
  await sql`
    UPDATE inventory_items SET
      name = ${item.name},
      description = ${item.description},
      serial_number = ${item.serialNumber},
      quantity = ${item.quantity},
      min_stock_level = ${item.minStockLevel},
      category = ${item.category},
      type = ${item.type},
      date_purchase = ${item.datePurchase},
      date_acquisition = ${item.dateAcquisition},
      price = ${item.price},
      status = ${item.status}
    WHERE id = ${item.id}
  `;
  return item;
}

export async function deleteItem(id: string): Promise<void> {
  await sql`DELETE FROM inventory_items WHERE id = ${id}`;
}

export async function getAllLogs(limit = 500): Promise<AuditLog[]> {
  const rows = await sql`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ${limit}`;
  return rows.map(row => ({
    id: row.id,
    timestamp: row.timestamp,
    userId: row.user_id,
    userFullName: row.user_full_name,
    action: row.action,
    itemId: row.item_id,
    itemName: row.item_name,
    details: row.details
  }));
}

export async function createLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
  const newLog: AuditLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };
  await sql`
    INSERT INTO audit_logs (id, timestamp, user_id, user_full_name, action, item_id, item_name, details)
    VALUES (${newLog.id}, ${newLog.timestamp}, ${newLog.userId}, ${newLog.userFullName}, ${newLog.action}, ${newLog.itemId}, ${newLog.itemName}, ${newLog.details})
  `;
  return newLog;
}