import type { SQLiteDatabase } from "expo-sqlite";

export type AccountType = "bank" | "cash" | "wallet";
export type TxType = "expense" | "income" | "transfer";

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  color: string;
  opening_balance: number;
}
export interface AccountWithBalance extends Account {
  balance: number;
}
export interface Category {
  id: number;
  name: string;
  color: string;
  kind: "expense" | "income";
  icon: string;
}
export interface TransactionRow {
  id: number;
  type: TxType;
  amount: number;
  date: string;
  note: string | null;
  account_id: number;
  account_name: string;
  account_color: string;
  to_account_id: number | null;
  to_account_name: string | null;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
}

// ---------- Cuentas ----------
export function getAccountsWithBalance(db: SQLiteDatabase) {
  return db.getAllAsync<AccountWithBalance>(`
    SELECT a.*,
      a.opening_balance + COALESCE(SUM(
        CASE
          WHEN t.type = 'income'   AND t.account_id = a.id THEN  t.amount
          WHEN t.type = 'expense'  AND t.account_id = a.id THEN -t.amount
          WHEN t.type = 'transfer' AND t.account_id = a.id THEN -t.amount
          WHEN t.type = 'transfer' AND t.to_account_id = a.id THEN t.amount
          ELSE 0
        END
      ), 0) AS balance
    FROM accounts a
    LEFT JOIN transactions t ON t.account_id = a.id OR t.to_account_id = a.id
    WHERE a.archived = 0
    GROUP BY a.id
    ORDER BY a.id
  `);
}

export async function createAccount(
  db: SQLiteDatabase,
  a: { name: string; type: AccountType; color: string; openingBalance: number },
) {
  const r = await db.runAsync(
    "INSERT INTO accounts (name, type, color, opening_balance) VALUES (?, ?, ?, ?)",
    [a.name.trim(), a.type, a.color, a.openingBalance],
  );
  return r.lastInsertRowId;
}

// ---------- Categorías ----------
export function getCategories(db: SQLiteDatabase, kind?: "expense" | "income") {
  return kind
    ? db.getAllAsync<Category>(
        "SELECT id, name, color, kind, icon FROM categories WHERE archived = 0 AND kind = ? ORDER BY id",
        [kind],
      )
    : db.getAllAsync<Category>(
        "SELECT id, name, color, kind, icon FROM categories WHERE archived = 0 ORDER BY id",
      );
}

export async function createCategory(
  db: SQLiteDatabase,
  c: { name: string; color: string; kind: "expense" | "income"; icon: string },
) {
  const r = await db.runAsync(
    "INSERT INTO categories (name, color, kind, icon) VALUES (?, ?, ?, ?)",
    [c.name.trim(), c.color, c.kind, c.icon],
  );
  return r.lastInsertRowId;
}

// ---------- Movimientos ----------
export async function addTransaction(
  db: SQLiteDatabase,
  t: {
    type: TxType;
    amount: number; // centavos, positivo
    accountId: number;
    toAccountId?: number | null;
    categoryId?: number | null;
    note?: string | null;
    date: string;
  },
) {
  const r = await db.runAsync(
    `INSERT INTO transactions (type, amount, account_id, to_account_id, category_id, note, date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      t.type,
      t.amount,
      t.accountId,
      t.toAccountId ?? null,
      t.categoryId ?? null,
      t.note ?? null,
      t.date,
    ],
  );
  return r.lastInsertRowId;
}

export function getTransactions(
  db: SQLiteDatabase,
  f: { accountId?: number; search?: string; limit?: number } = {},
) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (f.accountId) {
    where.push("(t.account_id = ? OR t.to_account_id = ?)");
    params.push(f.accountId, f.accountId);
  }
  if (f.search) {
    where.push("(t.note LIKE ? OR c.name LIKE ? OR a.name LIKE ?)");
    params.push(`%${f.search}%`, `%${f.search}%`, `%${f.search}%`);
  }
  const sql = `
    SELECT t.id, t.type, t.amount, t.date, t.note,
           t.account_id, a.name AS account_name, a.color AS account_color,
           t.to_account_id, ta.name AS to_account_name,
           t.category_id, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    LEFT JOIN accounts ta ON ta.id = t.to_account_id
    LEFT JOIN categories c ON c.id = t.category_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY t.date DESC, t.id DESC
    ${f.limit ? "LIMIT " + Math.floor(f.limit) : ""}`;
  return db.getAllAsync<TransactionRow>(sql, params);
}

export function deleteTransaction(db: SQLiteDatabase, id: number) {
  return db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
}

export interface CategoryTotal {
  id: number | null;
  name: string;
  color: string;
  icon: string;
  total: number; // centavos
}

// ym = "2026-11"
export function getExpensesByCategory(db: SQLiteDatabase, ym: string) {
  return db.getAllAsync<CategoryTotal>(
    `SELECT c.id AS id,
            COALESCE(c.name, 'Sin categoría') AS name,
            COALESCE(c.color, '#9CA3AF') AS color,
            COALESCE(c.icon, 'help-outline') AS icon,
            SUM(t.amount) AS total
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.type = 'expense' AND substr(t.date, 1, 7) = ?
     GROUP BY t.category_id
     ORDER BY total DESC`,
    [ym],
  );
}

// ---------- Edición ----------
export interface TransactionInput {
  type: TxType;
  amount: number; // centavos, positivo
  accountId: number;
  toAccountId?: number | null;
  categoryId?: number | null;
  note?: string | null;
  date: string;
}

export interface TransactionRaw {
  id: number;
  type: TxType;
  amount: number;
  account_id: number;
  to_account_id: number | null;
  category_id: number | null;
  note: string | null;
  date: string;
}

export function getTransaction(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<TransactionRaw>(
    `SELECT id, type, amount, account_id, to_account_id, category_id, note, date
     FROM transactions WHERE id = ?`,
    [id],
  );
}

export function updateTransaction(
  db: SQLiteDatabase,
  id: number,
  t: TransactionInput,
) {
  return db.runAsync(
    `UPDATE transactions
     SET type = ?, amount = ?, account_id = ?, to_account_id = ?, category_id = ?, note = ?, date = ?
     WHERE id = ?`,
    [
      t.type,
      t.amount,
      t.accountId,
      t.toAccountId ?? null,
      t.categoryId ?? null,
      t.note ?? null,
      t.date,
      id,
    ],
  );
}

export function getAccount(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Account>(
    "SELECT id, name, type, color, opening_balance FROM accounts WHERE id = ?",
    [id],
  );
}

export function updateAccount(
  db: SQLiteDatabase,
  id: number,
  a: { name: string; type: AccountType; color: string; openingBalance: number },
) {
  return db.runAsync(
    "UPDATE accounts SET name = ?, type = ?, color = ?, opening_balance = ? WHERE id = ?",
    [a.name.trim(), a.type, a.color, a.openingBalance, id],
  );
}

export function getCategory(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Category>(
    "SELECT id, name, color, kind, icon FROM categories WHERE id = ?",
    [id],
  );
}

export function updateCategory(
  db: SQLiteDatabase,
  id: number,
  c: { name: string; color: string; icon: string },
) {
  return db.runAsync(
    "UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ?",
    [c.name.trim(), c.color, c.icon, id],
  );
}
// ---------- Ajustes ----------
export async function getSetting(db: SQLiteDatabase, key: string) {
  const r = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [key],
  );
  return r?.value ?? null;
}

export function setSetting(db: SQLiteDatabase, key: string, value: string) {
  return db.runAsync(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value],
  );
}
