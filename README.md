# QTrack Pro - QR Inventory System

A professional inventory management system with QR code scanning, barcode support, and real-time tracking.

## Features

- QR Code and Barcode scanning (camera & USB)
- Full inventory management with categories
- Stock level monitoring with alerts
- Audit logging for all changes
- CSV import/export
- Label printing for assets
- User authentication

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Netlify Functions (Node.js)
- **Database**: Neon PostgreSQL

## Setup Instructions

### 1. Neon Database Setup

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project named `qtrack`
3. Copy your connection string from the dashboard
4. Run the schema in `api/schema.sql` in Neon SQL Editor

### 2. Deploy to Netlify

1. Fork or push this repo to GitHub
2. Connect your repo to Netlify
3. Add environment variables in Netlify:
   - `DATABASE_URL` = your Neon connection string
   - `JWT_SECRET` = a secure random string

### 3. Local Development

```bash
# Install dependencies
npm install

# Create .env with your Neon connection string
echo "DATABASE_URL=postgresql://..." > .env

# Run dev server
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT token generation |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/items` | Get all inventory items |
| POST | `/api/items` | Create new item |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |
| GET | `/api/logs` | Get audit logs |
| POST | `/api/logs` | Create log entry |