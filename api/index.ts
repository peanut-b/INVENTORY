import type { APIGatewayEvent, Context } from 'aws-lambda';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

function base64Encode(str: string): string {
  return Buffer.from(str).toString('base64');
}

function getPath(event: APIGatewayEvent): string {
  return event.path || '/';
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
  console.log('EVENT:', JSON.stringify(event));
  console.log('PATH:', event.path);
  console.log('METHOD:', event.httpMethod);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const path = getPath(event);
    const method = event.httpMethod;
    const body = getBody(event);

    console.log('Processing path:', path, 'method:', method);

    const lastPart = path.split('/').pop() || '';
    const secondLast = path.split('/').slice(-2)[0] || '';

    if (lastPart === 'login' && method === 'POST') {
      console.log('Handling login');
      const email = body.email || '';
      const password = body.password || '';

      if (!email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email and password required' }) };
      }

      const users = await sql`SELECT * FROM users WHERE email = ${email}`;
      const user = users[0];

      if (!user) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid credentials' }) };
      }

      const token = base64Encode(JSON.stringify({ userId: user.id, email: user.email, exp: Date.now() + 86400000 }));

      return { statusCode: 200, headers, body: JSON.stringify({
        token,
        user: { id: user.id, email: user.email, fullName: user.full_name }
      })};
    }

    if (lastPart === 'register' && method === 'POST') {
      console.log('Handling register');
      const email = body.email || '';
      const password = body.password || '';
      const fullName = body.fullName || '';

      console.log('Register data:', { email, password, fullName });

      if (!email || !password || !fullName) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'All fields required' }) };
      }

      const existing = await sql`SELECT * FROM users WHERE email = ${email}`;
      if (existing[0]) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'Email already exists' }) };
      }

      const id = crypto.randomUUID();
      await sql`INSERT INTO users (id, email, full_name, password_hash) VALUES (${id}, ${email}, ${fullName}, ${password})`;

      const user = { id, email, fullName };
      const token = base64Encode(JSON.stringify({ userId: id, email, exp: Date.now() + 86400000 }));

      return { statusCode: 201, headers, body: JSON.stringify({ token, user }) };
    }

    if (lastPart === 'items' && method === 'GET') {
      const rows = await sql`SELECT * FROM inventory_items ORDER BY created_at DESC`;
      return { statusCode: 200, headers, body: JSON.stringify(rows.map(mapItem)) };
    }

    if (lastPart === 'items' && method === 'POST') {
      await sql`
        INSERT INTO inventory_items (id, name, description, serial_number, quantity, min_stock_level, category, type, date_purchase, date_acquisition, price, created_at, status)
        VALUES (${body.id}, ${body.name}, ${body.description || ''}, ${body.serialNumber}, ${body.quantity}, ${body.minStockLevel}, ${body.category}, ${body.type}, ${body.datePurchase}, ${body.dateAcquisition}, ${body.price}, ${body.createdAt}, ${body.status})
      `;
      return { statusCode: 201, headers, body: JSON.stringify(body) };
    }

    if (secondLast === 'items' && method === 'PUT') {
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

    if (secondLast === 'items' && method === 'DELETE') {
      const id = path.split('/').pop();
      await sql`DELETE FROM inventory_items WHERE id = ${id}`;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    if (lastPart === 'logs' && method === 'GET') {
      const rows = await sql`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500`;
      return { statusCode: 200, headers, body: JSON.stringify(rows.map(mapLog)) };
    }

    if (lastPart === 'logs' && method === 'POST') {
      await sql`
        INSERT INTO audit_logs (id, timestamp, user_id, user_full_name, action, item_id, item_name, details)
        VALUES (${body.id}, ${body.timestamp}, ${body.userId}, ${body.userFullName}, ${body.action}, ${body.itemId}, ${body.itemName}, ${body.details})
      `;
      return { statusCode: 201, headers, body: JSON.stringify(body) };
    }

    if (lastPart === 'init' && method === 'POST') {
      await sql`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
      await sql`CREATE TABLE IF NOT EXISTS inventory_items (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '', serial_number TEXT UNIQUE NOT NULL, quantity INTEGER DEFAULT 1, min_stock_level INTEGER DEFAULT 5, category TEXT DEFAULT 'NETWORK', type TEXT DEFAULT 'CHURCH', date_purchase TEXT, date_acquisition TEXT, price REAL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, status TEXT DEFAULT 'IN')`;
      await sql`CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, user_id TEXT NOT NULL, user_full_name TEXT NOT NULL, action TEXT NOT NULL, item_id TEXT NOT NULL, item_name TEXT NOT NULL, details TEXT DEFAULT '')`;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found', path, lastPart }) };
  } catch (error: any) {
    console.error('ERROR:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || String(error) }) };
  }
};