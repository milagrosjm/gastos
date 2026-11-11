import { TransactionRow } from "../db/queries";
import { dayTitle } from "./format";

export function groupByDay(txs: TransactionRow[]) {
  const out: { title: string; data: TransactionRow[] }[] = [];
  for (const tx of txs) {
    const title = dayTitle(tx.date);
    const last = out[out.length - 1];
    if (last && last.title === title) last.data.push(tx);
    else out.push({ title, data: [tx] });
  }
  return out;
}
