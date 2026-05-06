import type { APIGatewayEvent, Context } from 'aws-lambda';
import { initializeDatabase, db } from './db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
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
    await ensureDb();

    const path = event.path.replace('/api', '') || '/';
    const method = event.httpMethod;

    if (path === '/items' && method === 'GET') {
      const items = await db.items.findAll();
      return { statusCode: 200, headers, body: JSON.stringify(items) };
    }

    if (path === '/items' && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      await db.items.create(body);
      return { statusCode: 201, headers, body: JSON.stringify(body) };
    }

    if (path.match(/^\/items\/([^/]+)$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const body = JSON.parse(event.body || '{}');
      await db.items.update({ ...body, id });
      return { statusCode: 200, headers, body: JSON.stringify(body) };
    }

    if (path.match(/^\/items\/([^/]+)$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      await db.items.delete(id);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    if (path === '/logs' && method === 'GET') {
      const logs = await db.logs.findAll();
      return { statusCode: 200, headers, body: JSON.stringify(logs) };
    }

    if (path === '/logs' && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      await db.logs.create(body);
      return { statusCode: 201, headers, body: JSON.stringify(body) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};