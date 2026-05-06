import type { APIGatewayEvent, Context } from 'aws-lambda';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

function base64Encode(str: string): string {
  return Buffer.from(str).toString('base64');
}

function jsonResponse(body: any, statusCode = 200) {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
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
    return jsonResponse('', 200);
  }

  try {
    const path = event.path || '/';
    const method = event.httpMethod;

    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    const secondLastSegment = segments.length > 1 ? segments[segments.length - 2] : '';

    if (segments[0] === 'api') {
      if (lastSegment === 'login' && method === 'POST') {
        const body = event.body ? JSON.parse(event.body) : {};
        const { email, password } = body;

        if (!email || !password) {
          return jsonResponse({ error: 'Email and password required' }, 400);
        }

        const users = await sql`SELECT * FROM users WHERE email = ${email}`;
        const user = users[0];

        if (!user) {
          return jsonResponse({ error: 'Invalid credentials' }, 401);
        }

        const token = base64Encode(JSON.stringify({ userId: user.id, email: user.email, exp: Date.now() + 86400000 }));
        return jsonResponse({ token, user: { id: user.id, email: user.email, fullName: user.full_name } });
      }

      if (lastSegment === 'register' && method === 'POST') {
        const body = event.body ? JSON.parse(event.body) : {};
        const { email, password, fullName } = body;

        if (!email || !password || !fullName) {
          return jsonResponse({ error: 'All fields required' }, 400);
        }

        const existing = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (existing[0]) {
          return jsonResponse({ error: 'Email already exists' }, 409);
        }

        const id = crypto.randomUUID();
        await sql`INSERT INTO users (id, email, full_name, password_hash) VALUES (${id}, ${email}, ${fullName}, ${password})`;

        const user = { id, email, fullName };
        const token = base64Encode(JSON.stringify({ userId: id, email, exp: Date.now() + 86400000 }));
        return jsonResponse({ token, user }, 201);
      }

      if (lastSegment === 'items' && method === 'GET') {
        const rows = await sql`SELECT * FROM inventory_items ORDER BY created_at DESC`;
        return jsonResponse(rows.map(mapItem));
      }

      if (lastSegment === 'items' && method === 'POST') {
        const body = event.body ? JSON.parse(event.body) : {};
        await sql`
          INSERT INTO inventory_items (id, name, description, serial_number, quantity, min_stock_level, category, type, date_purchase, date_acquisition, price, created_at, status)
          VALUES (${body.id}, ${body.name}, ${body.description || ''}, ${body.serialNumber}, ${body.quantity}, ${body.minStockLevel}, ${body.category}, ${body.type}, ${body.datePurchase}, ${body.dateAcquisition}, ${body.price}, ${body.createdAt}, ${body.status})
        `;
        return jsonResponse(body, 201);
      }

      if (secondLastSegment === 'items' && method === 'PUT') {
        const id = lastSegment;
        const body = event.body ? JSON.parse(event.body) : {};
        await sql`
          UPDATE inventory_items SET
            name = ${body.name}, description = ${body.description}, serial_number = ${body.serialNumber},
            quantity = ${body.quantity}, min_stock_level = ${body.minStockLevel}, category = ${body.category},
            type = ${body.type}, date_purchase = ${body.datePurchase}, date_acquisition = ${body.dateAcquisition},
            price = ${body.price}, status = ${body.status}
          WHERE id = ${id}
        `;
        return jsonResponse(body);
      }

      if (secondLastSegment === 'items' && method === 'DELETE') {
        const id = lastSegment;
        await sql`DELETE FROM inventory_items WHERE id = ${id}`;
        return jsonResponse({ success: true });
      }

      if (lastSegment === 'logs' && method === 'GET') {
        const rows = await sql`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500`;
        return jsonResponse(rows.map(mapLog));
      }

      if (lastSegment === 'logs' && method === 'POST') {
        const body = event.body ? JSON.parse(event.body) : {};
        await sql`
          INSERT INTO audit_logs (id, timestamp, user_id, user_full_name, action, item_id, item_name, details)
          VALUES (${body.id}, ${body.timestamp}, ${body.userId}, ${body.userFullName}, ${body.action}, ${body.itemId}, ${body.itemName}, ${body.details})
        `;
        return jsonResponse(body, 201);
      }

      if (lastSegment === 'init' && method === 'POST') {
        await sql`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
        await sql`CREATE TABLE IF NOT EXISTS inventory_items (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '', serial_number TEXT UNIQUE NOT NULL, quantity INTEGER DEFAULT 1, min_stock_level INTEGER DEFAULT 5, category TEXT DEFAULT 'NETWORK', type TEXT DEFAULT 'CHURCH', date_purchase TEXT, date_acquisition TEXT, price REAL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, status TEXT DEFAULT 'IN')`;
        await sql`CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, user_id TEXT NOT NULL, user_full_name TEXT NOT NULL, action TEXT NOT NULL, item_id TEXT NOT NULL, item_name TEXT NOT NULL, details TEXT DEFAULT '')`;
        return jsonResponse({ success: true });
      }
    }

    return jsonResponse({ error: 'Not found', path }, 404);
  } catch (error: any) {
    console.error('Error:', error);
    return jsonResponse({ error: error.message || String(error) }, 500);
  }
};