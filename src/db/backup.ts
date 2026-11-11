import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { SQLiteDatabase } from "expo-sqlite";
import { today } from "../utils/format";
import { setSetting } from "./queries";

const APP_ID = "gastos-app";
const FORMAT_VERSION = 1;

interface AccountRow {
  id: number;
  name: string;
  type: string;
  color: string;
  opening_balance: number;
  archived: number;
}
interface CategoryRow {
  id: number;
  name: string;
  color: string;
  kind: string;
  archived: number;
  icon: string;
}
interface TxRow {
  id: number;
  type: string;
  amount: number;
  account_id: number;
  to_account_id: number | null;
  category_id: number | null;
  note: string | null;
  date: string;
  created_at: string | null;
}
interface BudgetRow {
  id: number;
  category_id: number;
  monthly_limit: number;
}

export interface BackupData {
  app: string;
  formatVersion: number;
  exportedAt: string;
  accounts: AccountRow[];
  categories: CategoryRow[];
  transactions: TxRow[];
  budgets: BudgetRow[];
}

export class BackupError extends Error {}
const fail = (msg: string): never => {
  throw new BackupError(msg);
};

// ---------- Exportar ----------
export async function buildBackup(db: SQLiteDatabase): Promise<BackupData> {
  const accounts = await db.getAllAsync<AccountRow>(
    "SELECT id, name, type, color, opening_balance, archived FROM accounts ORDER BY id",
  );
  const categories = await db.getAllAsync<CategoryRow>(
    "SELECT id, name, color, kind, archived, icon FROM categories ORDER BY id",
  );
  const transactions = await db.getAllAsync<TxRow>(
    `SELECT id, type, amount, account_id, to_account_id, category_id, note, date, created_at
     FROM transactions ORDER BY id`,
  );
  const budgets = await db.getAllAsync<BudgetRow>(
    "SELECT id, category_id, monthly_limit FROM budgets ORDER BY id",
  );
  return {
    app: APP_ID,
    formatVersion: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    accounts,
    categories,
    transactions,
    budgets,
  };
}

export async function exportBackup(db: SQLiteDatabase) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new BackupError("Este dispositivo no permite compartir archivos.");
  }
  const data = await buildBackup(db);

  const file = new File(Paths.cache, `gastos-backup-${today()}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(data));

  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    dialogTitle: "Guardar backup de Gastos",
    UTI: "public.json",
  });
  await setSetting(db, "last_backup", new Date().toISOString());
}

// ---------- Validar ----------
const isInt = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isDate = (v: unknown) => isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);

const ACCOUNT_TYPES = ["bank", "cash", "wallet"];
const KINDS = ["expense", "income"];
const TX_TYPES = ["expense", "income", "transfer"];

export function parseBackup(text: string): BackupData {
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail("El archivo no es un backup válido.");
  }
  if (!raw || raw.app !== APP_ID)
    return fail("Este archivo no es un backup de Gastos.");
  if (!isInt(raw.formatVersion) || raw.formatVersion > FORMAT_VERSION) {
    return fail(
      "Este backup es de una versión más nueva de la app. Actualizá la app e intentá de nuevo.",
    );
  }
  for (const k of ["accounts", "categories", "transactions", "budgets"]) {
    if (!Array.isArray(raw[k]))
      return fail("El backup está incompleto o dañado.");
  }

  const accIds = new Set<number>();
  const accounts: AccountRow[] = raw.accounts.map((a: any) => {
    if (
      !isInt(a?.id) ||
      accIds.has(a.id) ||
      !isStr(a.name) ||
      !a.name.trim() ||
      !ACCOUNT_TYPES.includes(a.type) ||
      !isStr(a.color) ||
      !isInt(a.opening_balance)
    ) {
      return fail("El backup tiene una cuenta con datos inválidos.");
    }
    accIds.add(a.id);
    return {
      id: a.id,
      name: a.name,
      type: a.type,
      color: a.color,
      opening_balance: a.opening_balance,
      archived: a.archived ? 1 : 0,
    };
  });

  const catIds = new Set<number>();
  const categories: CategoryRow[] = raw.categories.map((c: any) => {
    if (
      !isInt(c?.id) ||
      catIds.has(c.id) ||
      !isStr(c.name) ||
      !c.name.trim() ||
      !isStr(c.color) ||
      !KINDS.includes(c.kind)
    ) {
      return fail("El backup tiene una categoría con datos inválidos.");
    }
    catIds.add(c.id);
    return {
      id: c.id,
      name: c.name,
      color: c.color,
      kind: c.kind,
      archived: c.archived ? 1 : 0,
      icon: isStr(c.icon) ? c.icon : "pricetag-outline",
    };
  });

  const txIds = new Set<number>();
  const transactions: TxRow[] = raw.transactions.map((t: any) => {
    if (
      !isInt(t?.id) ||
      txIds.has(t.id) ||
      !TX_TYPES.includes(t.type) ||
      !isInt(t.amount) ||
      t.amount <= 0 ||
      !accIds.has(t.account_id) ||
      !isDate(t.date)
    ) {
      return fail("El backup tiene un movimiento con datos inválidos.");
    }
    const to = t.to_account_id ?? null;
    if (t.type === "transfer") {
      if (!accIds.has(to) || to === t.account_id)
        return fail("El backup tiene una transferencia inválida.");
    } else if (to !== null) {
      return fail("El backup tiene un movimiento con datos inválidos.");
    }
    const cat = t.type === "transfer" ? null : (t.category_id ?? null);
    if (cat !== null && !catIds.has(cat))
      return fail(
        "El backup tiene un movimiento con una categoría inexistente.",
      );
    txIds.add(t.id);
    return {
      id: t.id,
      type: t.type,
      amount: t.amount,
      account_id: t.account_id,
      to_account_id: to,
      category_id: cat,
      note: isStr(t.note) ? t.note : null,
      date: t.date,
      created_at: isStr(t.created_at) ? t.created_at : null,
    };
  });

  const budgetCats = new Set<number>();
  const budgets: BudgetRow[] = raw.budgets.map((b: any) => {
    if (
      !isInt(b?.id) ||
      !catIds.has(b.category_id) ||
      budgetCats.has(b.category_id) ||
      !isInt(b.monthly_limit) ||
      b.monthly_limit < 0
    ) {
      return fail("El backup tiene un presupuesto con datos inválidos.");
    }
    budgetCats.add(b.category_id);
    return {
      id: b.id,
      category_id: b.category_id,
      monthly_limit: b.monthly_limit,
    };
  });

  return {
    app: APP_ID,
    formatVersion: raw.formatVersion,
    exportedAt: isStr(raw.exportedAt) ? raw.exportedAt : "",
    accounts,
    categories,
    transactions,
    budgets,
  };
}

// ---------- Restaurar ----------
// Reemplaza TODOS los datos. Si algo falla, se deshace y no se modifica nada.
export async function restoreBackup(db: SQLiteDatabase, data: BackupData) {
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM transactions");
    await db.runAsync("DELETE FROM budgets");
    await db.runAsync("DELETE FROM categories");
    await db.runAsync("DELETE FROM accounts");

    for (const a of data.accounts) {
      await db.runAsync(
        "INSERT INTO accounts (id, name, type, color, opening_balance, archived) VALUES (?, ?, ?, ?, ?, ?)",
        [a.id, a.name, a.type, a.color, a.opening_balance, a.archived],
      );
    }
    for (const c of data.categories) {
      await db.runAsync(
        "INSERT INTO categories (id, name, color, kind, archived, icon) VALUES (?, ?, ?, ?, ?, ?)",
        [c.id, c.name, c.color, c.kind, c.archived, c.icon],
      );
    }
    for (const t of data.transactions) {
      await db.runAsync(
        `INSERT INTO transactions (id, type, amount, account_id, to_account_id, category_id, note, date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')))`,
        [
          t.id,
          t.type,
          t.amount,
          t.account_id,
          t.to_account_id,
          t.category_id,
          t.note,
          t.date,
          t.created_at,
        ],
      );
    }
    for (const b of data.budgets) {
      await db.runAsync(
        "INSERT INTO budgets (id, category_id, monthly_limit) VALUES (?, ?, ?)",
        [b.id, b.category_id, b.monthly_limit],
      );
    }
  });
}
