// lib/db.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Tentukan jalur file database
const isVercel = process.env.VERCEL === '1';
const dbPath = isVercel
  ? path.join('/tmp', 'laundry.db')
  : path.join(process.cwd(), 'laundry.db');

// Jika berjalan di Vercel dan file belum disalin ke /tmp, salin dari direktori project
if (isVercel && !fs.existsSync(dbPath)) {
  const localDbPath = path.join(process.cwd(), 'laundry.db');
  if (fs.existsSync(localDbPath)) {
    fs.copyFileSync(localDbPath, dbPath);
  }
}

const db = new Database(dbPath);

// Inisialisasi tabel jika belum ada
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cashier'
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    price_per_unit REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    deposit_balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_code TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    total_amount REAL NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    order_status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transaction_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    qty REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
  );
`);

export default db;