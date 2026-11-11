import { TransactionRow } from "../db/queries";

// Efecto de un movimiento sobre el saldo de la cuenta `accountId`
function net(tx: TransactionRow, accountId: number): number {
  if (tx.type === "income") return tx.amount;
  if (tx.type === "expense") return -tx.amount;
  return tx.to_account_id === accountId ? tx.amount : -tx.amount; // transferencia
}

export interface MonthSummary {
  opening: number; // saldo al inicio del mes
  income: number;
  expense: number;
  transfers: number; // neto: entradas - salidas
  closing: number; // saldo al cierre del mes
  list: TransactionRow[]; // movimientos del mes
}

// ym = "2026-11". `txs` son todos los movimientos de la cuenta.
export function computeMonth(
  openingBalance: number,
  accountId: number,
  txs: TransactionRow[],
  ym: string,
): MonthSummary {
  const start = `${ym}-01`;
  let opening = openingBalance;
  let income = 0;
  let expense = 0;
  let transfers = 0;
  const list: TransactionRow[] = [];

  for (const tx of txs) {
    if (tx.date < start) {
      opening += net(tx, accountId);
    } else if (tx.date.slice(0, 7) === ym) {
      list.push(tx);
      if (tx.type === "income") income += tx.amount;
      else if (tx.type === "expense") expense += tx.amount;
      else transfers += net(tx, accountId);
    }
  }

  return {
    opening,
    income,
    expense,
    transfers,
    closing: opening + income - expense + transfers,
    list,
  };
}
