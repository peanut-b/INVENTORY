-- Run this in Neon SQL Editor to set up QTrack Pro database

-- Drop existing tables (optional - for clean slate)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory items table
CREATE TABLE inventory_items (
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
);

-- Audit logs table
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT NOT NULL,
  user_full_name TEXT NOT NULL,
  action TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  details TEXT DEFAULT ''
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_inventory_serial ON inventory_items(serial_number);
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);