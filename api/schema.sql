-- QTrack Pro Database Schema for Neon
-- Run this SQL in Neon SQL Editor to set up the database

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory items table
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
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT NOT NULL,
  user_full_name TEXT NOT NULL,
  action TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  details TEXT DEFAULT ''
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_serial ON inventory_items(serial_number);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);