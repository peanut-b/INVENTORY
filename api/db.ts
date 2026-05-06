import { neon } from '@neondatabase/serverless';
import type { InventoryItem, User, AuditLog } from '../src/types';

const sql = neon(process.env.DATABASE_URL!);

export { sql };

export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      serial_number TEXT UNIQUE NOT NULL,
      quantity INTEGER DEFAULT 1,
      min_stock_level INTEGER DEFAULT 5,
      category TEXT DEFAULT 'NETWORK',
      type TEXT DEFAULT 'CHURCH',
      date_purchase TEXT,
      date_acquisition TEXT,
      price REAL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'IN'
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT NOT NULL,
      user_full_name TEXT NOT NULL,
      action TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      details TEXT DEFAULT ''
    )
  `;
}

export const db = {
  users: {
    async findByEmail(email: string): Promise<User | null> {
      const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
      return rows[0] || null;
    },
    async create(user: { id: string; email: string; fullName: string; passwordHash: string }): Promise<void> {
      await sql`INSERT INTO users (id, email, full_name, password_hash) VALUES (${user.id}, ${user.email}, ${user.fullName}, ${user.passwordHash})`;
    }
  },
  items: {
    async findAll(): Promise<InventoryItem[]> {
      const rows = await sql`SELECT * FROM inventory_items ORDER BY created_at DESC`;
      return rows.map(mapRowToItem);
    },
    async findById(id: string): Promise<InventoryItem | null> {
      const rows = await sql`SELECT * FROM inventory_items WHERE id = ${id}`;
      return rows[0] ? mapRowToItem(rows[0]) : null;
    },
    async findBySerialNumber(sn: string): Promise<InventoryItem | null> {
      const rows = await sql`SELECT * FROM inventory_items WHERE serial_number = ${sn}`;
      return rows[0] ? mapRowToItem(rows[0]) : null;
    },
    async create(item: InventoryItem): Promise<void> {
      await sql`
        INSERT INTO inventory_items (id, name, description, serial_number, quantity, min_stock_level, category, type, date_purchase, date_acquisition, price, created_at, status)
        VALUES (${item.id}, ${item.name}, ${item.description}, ${item.serialNumber}, ${item.quantity}, ${item.minStockLevel}, ${item.category}, ${item.type}, ${item.datePurchase}, ${item.dateAcquisition}, ${item.price}, ${item.createdAt}, ${item.status})
      `;
    },
    async update(item: InventoryItem): Promise<void> {
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
    },
    async delete(id: string): Promise<void> {
      await sql`DELETE FROM inventory_items WHERE id = ${id}`;
    }
  },
  logs: {
    async findAll(limit = 500): Promise<AuditLog[]> {
      const rows = await sql`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ${limit}`;
      return rows.map(mapRowToLog);
    },
    async create(log: AuditLog): Promise<void> {
      await sql`
        INSERT INTO audit_logs (id, timestamp, user_id, user_full_name, action, item_id, item_name, details)
        VALUES (${log.id}, ${log.timestamp}, ${log.userId}, ${log.userFullName}, ${log.action}, ${log.itemId}, ${log.itemName}, ${log.details})
      `;
    }
  }
};

function mapRowToItem(row: any): InventoryItem {
  return {
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
  };
}

function mapRowToLog(row: any): AuditLog {
  return {
    id: row.id,
    timestamp: row.timestamp,
    userId: row.user_id,
    userFullName: row.user_full_name,
    action: row.action,
    itemId: row.item_id,
    itemName: row.item_name,
    details: row.details
  };
}