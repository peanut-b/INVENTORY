import type { APIGatewayEvent, Context } from 'aws-lambda';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

function getPath(event: APIGatewayEvent): string {
  return event.path || event.rawUrl?.split('?')[0] || '/';
}

function getBody(event: APIGatewayEvent): any {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
}

function mapItem(row: any) {
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

function mapLog(row: any) {
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

export const handler = async (event: APIGatewayEvent, _context: Context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const path = getPath(event);
    const method = event.httpMethod;
    const body = getBody(event);

    if (path === '/.netlify/functions/api/items' || path.endsWith('/api/items')) {
      if (method === 'GET') {
        const rows = await sql`SELECT * FROM inventory_items ORDER BY created_at DESC`;
        return { statusCode: 200, headers, body: JSON.stringify(rows.map(mapItem)) };
      }
      if (method === 'POST') {
        await sql`
          INSERT INTO inventory_items (id, name, description, serial_number, quantity, min_stock_level, category, type, date_purchase, date_acquisition, price, created_at, status)
          VALUES (${body.id}, ${body.name}, ${body.description || ''}, ${body.serialNumber}, ${body.quantity}, ${body.minStockLevel}, ${body.category}, ${body.type}, ${body.datePurchase}, ${body.dateAcquisition}, ${body.price}, ${body.createdAt}, ${body.status})
        `;
        return { statusCode: 201, headers, body: JSON.stringify(body) };
      }
    }

    if ((path.match(/\/.netlify\/functions\/api\/items\/([^/]+)$/) || path.match(/\/api\/items\/([^/]+)$/)) && method === 'PUT') {
      const id = path.split('/').pop();
      await sql`
        UPDATE inventory_items SET
          name = ${body.name},
          description = ${body.description},
          serial_number = ${body.serialNumber},
          quantity = ${body.quantity},
          min_stock_level = ${body.minStockLevel},
          category = ${body.category},
          type = ${body.type},
          date_purchase = ${body.datePurchase},
          date_acquisition = ${body.dateAcquisition},
          price = ${body.price},
          status = ${body.status}
        WHERE id = ${id}
      `;
      return { statusCode: 200, headers, body: JSON.stringify(body) };
    }

    if ((path.match(/\/.netlify\/functions\/api\/items\/([^/]+)$/) || path.match(/\/api\/items\/([^/]+)$/)) && method === 'DELETE') {
      const id = path.split('/').pop();
      await sql`DELETE FROM inventory_items WHERE id = ${id}`;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    if (path === '/.netlify/functions/api/logs' || path.endsWith('/api/logs')) {
      if (method === 'GET') {
        const rows = await sql`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500`;
        return { statusCode: 200, headers, body: JSON.stringify(rows.map(mapLog)) };
      }
      if (method === 'POST') {
        await sql`
          INSERT INTO audit_logs (id, timestamp, user_id, user_full_name, action, item_id, item_name, details)
          VALUES (${body.id}, ${body.timestamp}, ${body.userId}, ${body.userFullName}, ${body.action}, ${body.itemId}, ${body.itemName}, ${body.details})
        `;
        return { statusCode: 201, headers, body: JSON.stringify(body) };
      }
    }

    if ((path === '/.netlify/functions/api/init' || path === '/api/init') && method === 'POST') {
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
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found', path }) };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};