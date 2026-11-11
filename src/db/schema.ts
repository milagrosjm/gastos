import type { SQLiteDatabase } from "expo-sqlite";

const DB_VERSION = 3;

export async function migrateDb(db: SQLiteDatabase) {
  await db.execAsync("PRAGMA foreign_keys = ON;");
  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  let current = row?.user_version ?? 0;
  if (current >= DB_VERSION) return;

  if (current === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';

      CREATE TABLE accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'bank',        -- bank | cash | wallet
        color TEXT NOT NULL,
        opening_balance INTEGER NOT NULL DEFAULT 0, -- centavos
        archived INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'expense',      -- expense | income
        archived INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,                        -- expense | income | transfer
        amount INTEGER NOT NULL,                   -- centavos, siempre positivo
        account_id INTEGER NOT NULL REFERENCES accounts(id),
        to_account_id INTEGER REFERENCES accounts(id), -- solo transferencias
        category_id INTEGER REFERENCES categories(id),
        note TEXT,
        date TEXT NOT NULL,                        -- YYYY-MM-DD
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX idx_tx_date ON transactions(date);
      CREATE INDEX idx_tx_account ON transactions(account_id);

      CREATE TABLE budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL UNIQUE REFERENCES categories(id),
        monthly_limit INTEGER NOT NULL             -- centavos
      );
    `);

    const cats: [string, string, string][] = [
      ["Comida", "#F97316", "expense"],
      ["Transporte", "#3B82F6", "expense"],
      ["Hogar", "#8B5CF6", "expense"],
      ["Salud", "#EC4899", "expense"],
      ["Ocio", "#14B8A6", "expense"],
      ["Compras", "#EAB308", "expense"],
      ["Servicios", "#6366F1", "expense"],
      ["Otros", "#9CA3AF", "expense"],
      ["Sueldo", "#0E9F6E", "income"],
      ["Otros ingresos", "#9CA3AF", "income"],
    ];
    for (const [name, color, kind] of cats) {
      await db.runAsync(
        "INSERT INTO categories (name, color, kind) VALUES (?, ?, ?)",
        [name, color, kind],
      );
    }
    await db.runAsync(
      "INSERT INTO accounts (name, type, color, opening_balance) VALUES ('Efectivo', 'cash', '#0E9F6E', 0)",
    );
    current = 1;
  }

  if (current < 2) {
    await db.execAsync(`
      ALTER TABLE categories ADD COLUMN icon TEXT NOT NULL DEFAULT 'pricetag-outline';
      UPDATE categories SET icon = 'fast-food-outline' WHERE name = 'Comida';
      UPDATE categories SET icon = 'bus-outline' WHERE name = 'Transporte';
      UPDATE categories SET icon = 'home-outline' WHERE name = 'Hogar';
      UPDATE categories SET icon = 'medkit-outline' WHERE name = 'Salud';
      UPDATE categories SET icon = 'game-controller-outline' WHERE name = 'Ocio';
      UPDATE categories SET icon = 'bag-outline' WHERE name = 'Compras';
      UPDATE categories SET icon = 'flash-outline' WHERE name = 'Servicios';
      UPDATE categories SET icon = 'ellipsis-horizontal' WHERE name = 'Otros';
      UPDATE categories SET icon = 'wallet-outline' WHERE name = 'Sueldo';
      UPDATE categories SET icon = 'cash-outline' WHERE name = 'Otros ingresos';
    `);
    current = 2;
  }

  if (current < 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    current = 3;
  }

  await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
}
