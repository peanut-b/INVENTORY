import type { APIGatewayEvent, Context } from 'aws-lambda';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'qtrack-secret-key-change-in-production';

function base64Encode(str: string): string {
  return Buffer.from(str).toString('base64');
}

function base64Decode(str: string): string {
  return Buffer.from(str, 'base64').toString('utf-8');
}

export const handler = async (event: APIGatewayEvent, _context: Context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const path = event.path.replace('/api/auth', '') || '/';
    const method = event.httpMethod;

    if (path === '/login' && method === 'POST') {
      const { email, password } = JSON.parse(event.body || '{}');

      if (!email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email and password required' }) };
      }

      const user = await db.users.findByEmail(email);

      if (!user) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid credentials' }) };
      }

      const simpleHash = base64Encode(`${email}:${password}`);
      const token = base64Encode(JSON.stringify({ userId: user.id, email: user.email, exp: Date.now() + 86400000 }));

      return { statusCode: 200, headers, body: JSON.stringify({ token, user }) };
    }

    if (path === '/register' && method === 'POST') {
      const { email, password, fullName } = JSON.parse(event.body || '{}');

      if (!email || !password || !fullName) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'All fields required' }) };
      }

      const existing = await db.users.findByEmail(email);
      if (existing) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'Email already exists' }) };
      }

      const id = crypto.randomUUID();
      const simpleHash = base64Encode(`${email}:${password}`);
      await db.users.create({ id, email, fullName, passwordHash: simpleHash });

      const user = { id, email, fullName };
      const token = base64Encode(JSON.stringify({ userId: id, email, exp: Date.now() + 86400000 }));

      return { statusCode: 201, headers, body: JSON.stringify({ token, user }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};