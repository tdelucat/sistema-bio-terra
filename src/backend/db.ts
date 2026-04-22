import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function getDb() {
  if (db) return db;

  db = await open({
    filename: path.join(process.cwd(), 'bioterra.db'),
    driver: sqlite3.Database
  });

  await initDb(db);
  return db;
}

async function initDb(database: Database) {
  // Users Table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('ADMIN', 'CHEMIST', 'SELLER', 'REPRESENTATIVE')) NOT NULL,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products Table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Suppliers Table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      active INTEGER DEFAULT 1
    )
  `);

  // Packaging Configs
  await database.exec(`
    CREATE TABLE IF NOT EXISTS packagings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  // Initial Packagings
  const packagings = await database.all('SELECT * FROM packagings');
  if (packagings.length === 0) {
    await database.run("INSERT INTO packagings (name) VALUES ('Granel'), ('Big Bag'), ('Sacaria')");
  }

  // Price Offers
  await database.exec(`
    CREATE TABLE IF NOT EXISTS price_offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      supplier_id INTEGER NOT NULL,
      packaging_id INTEGER NOT NULL,
      price_usd REAL NOT NULL,
      valid_until DATETIME NOT NULL,
      coa_ref TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    )
  `);

  // Commercial Settings
  await database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT
    )
  `);

  // Default Settings
  await database.run("INSERT OR IGNORE INTO settings (key, value, description) VALUES ('default_margin', '0.03', 'Margem padrão global (3%)')");
  await database.run("INSERT OR IGNORE INTO settings (key, value, description) VALUES ('price_policy', 'MAX', 'Política de exibição (MAX, MIN, ALL)')");

  // State Adjustments
  await database.exec(`
    CREATE TABLE IF NOT EXISTS state_adjustments (
      state_code TEXT PRIMARY KEY,
      adjustment_percent REAL NOT NULL
    )
  `);

  // Initial State Adjustments
  const states = await database.all('SELECT * FROM state_adjustments');
  if (states.length === 0) {
    for (const [state, adj] of Object.entries({'MT': 0.04, 'SP': 0.04, 'PR': 0.04, 'SC': 0.04})) {
      await database.run("INSERT INTO state_adjustments (state_code, adjustment_percent) VALUES (?, ?)", state, adj);
    }
  }

  // Quotes (Orcamentos)
  await database.exec(`
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      customer_name TEXT,
      product_id INTEGER NOT NULL,
      packaging_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      state_code TEXT NOT NULL,
      is_fob INTEGER NOT NULL, -- 1 for FOB, 0 for CIF
      ptax REAL NOT NULL,
      freight_brl_ton REAL,
      unit_cost_usd REAL, -- Added for DRE
      total_usd REAL NOT NULL,
      total_brl REAL NOT NULL,
      status TEXT DEFAULT 'OPEN', -- OPEN, CLOSED, PENDING_LOGISTICS
      external_token TEXT, -- Added for client acceptance
      accepted_at DATETIME, -- Added for client acceptance
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `);

  // Migrate existing table if columns missing
  const columns = await database.all("PRAGMA table_info(quotes)");
  const hasUnitCost = columns.some(c => c.name === 'unit_cost_usd');
  if (!hasUnitCost) {
    await database.exec("ALTER TABLE quotes ADD COLUMN unit_cost_usd REAL");
    await database.exec("ALTER TABLE quotes ADD COLUMN external_token TEXT");
    await database.exec("ALTER TABLE quotes ADD COLUMN accepted_at DATETIME");
  }

  // Audit Log
  await database.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Admin User if not exists
  const admin = await database.get('SELECT * FROM users WHERE role = "ADMIN"');
  if (!admin) {
    // Password will be 'admin123'
    // I'll use a pre-hashed version for speed or just leave it to be set by a first-run script.
    // Actually I'll use bcrypt here but since this is init, I'll just hash it manually or use a helper.
    // For now, let's just use a placeholder and I'll create a setup script.
  }
}
