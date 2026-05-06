import type { APIGatewayEvent, Context } from 'aws-lambda';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

function base64Encode(str: string): string {
  return Buffer.from(str).toString('base64');
}

function getPath(event: APIGatewayEvent): string {
  let p = event.path || '/';
  if (p.startsWith('/.netlify/functions/api')) {
    p = p.replace('/.netlify/functions/api', '/api');
  }
  return p;
}

export const handler = async (event: APIGatewayEvent, _context: Context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = getPath(event);

  try {
    const body = event.body ? JSON.parse(event.body) : {};

    if (path === '/api/auth/login' && event.httpMethod === 'POST') {
      const { email, password } = body;
      if (!email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email and password required' }) };
      }
      const users = await sql`SELECT * FROM users WHERE email = ${email}`;
      const user = users[0];
      if (!user) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid credentials' }) };
      }
      const token = base64Encode(JSON.stringify({ userId: user.id, email: user.email, exp: Date.now() + 86400000 }));
      return { statusCode: 200, headers, body: JSON.stringify({ token, user: { id: user.id, email: user.email, fullName: user.full_name } }) };
    }

    if (path === '/api/auth/register' && event.httpMethod === 'POST') {
      const { email, password, fullName } = body;
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

    if (path === '/api/items' && event.httpMethod === 'GET') {
      const rows = await sql`SELECT * FROM inventory_items ORDER BY created_at DESC`;
      const items = rows.map((row: any) => ({
        id: row.id, name: row.name, description: row.description || '', serialNumber: row.serial_number,
        quantity: row.quantity, minStockLevel: row.min_stock_level, category: row.category, type: row.type,
        datePurchase: row.date_purchase, dateAcquisition: row.date_acquisition, price: row.price,
        createdAt: row.created_at, status: row.status
      }));
      return { statusCode: 200, headers, body: JSON.stringify(items) };
    }

    if (path === '/api/items' && event.httpMethod === 'POST') {
      await sql`INSERT INTO inventory_items (id, name, description, serial_number, quantity, min_stock_level, category, type, date_purchase, date_acquisition, price, created_at, status)
        VALUES (${body.id}, ${body.name}, ${body.description || ''}, ${body.serialNumber}, ${body.quantity}, ${body.minStockLevel}, ${body.category}, ${body.type}, ${body.datePurchase}, ${body.dateAcquisition}, ${body.price}, ${body.createdAt}, ${body.status})`;
      return { statusCode: 201, headers, body: JSON.stringify(body) };
    }

    const itemMatch = path.match(/^\/api\/items\/([^/]+)$/);
    if (itemMatch && event.httpMethod === 'PUT') {
      const id = itemMatch[1];
      await sql`UPDATE inventory_items SET name = ${body.name}, description = ${body.description}, serial_number = ${body.serialNumber},
        quantity = ${body.quantity}, min_stock_level = ${body.minStockLevel}, category = ${body.category}, type = ${body.type},
        date_purchase = ${body.datePurchase}, date_acquisition = ${body.dateAcquisition}, price = ${body.price}, status = ${body.status} WHERE id = ${id}`;
      return { statusCode: 200, headers, body: JSON.stringify(body) };
    }

    if (itemMatch && event.httpMethod === 'DELETE') {
      await sql`DELETE FROM inventory_items WHERE id = ${itemMatch[1]}`;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    if (path === '/api/logs' && event.httpMethod === 'GET') {
      const rows = await sql`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500`;
      const logs = rows.map((row: any) => ({
        id: row.id, timestamp: row.timestamp, userId: row.user_id, userFullName: row.user_full_name,
        action: row.action, itemId: row.item_id, itemName: row.item_name, details: row.details
      }));
      return { statusCode: 200, headers, body: JSON.stringify(logs) };
    }

    if (path === '/api/logs' && event.httpMethod === 'POST') {
      await sql`INSERT INTO audit_logs (id, timestamp, user_id, user_full_name, action, item_id, item_name, details)
        VALUES (${body.id}, ${body.timestamp}, ${body.userId}, ${body.userFullName}, ${body.action}, ${body.itemId}, ${body.itemName}, ${body.details})`;
      return { statusCode: 201, headers, body: JSON.stringify(body) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found', path }) };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};