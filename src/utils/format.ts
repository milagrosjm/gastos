// 1020050 -> "10.200,50"
export function formatNumber(cents: number): string {
  const abs = Math.abs(cents);
  const int = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const dec = (abs % 100).toString().padStart(2, "0");
  return `${int},${dec}`;
}

// 1020050 -> "$ 10.200,50"   |   -500 -> "-$ 5,00"
export function formatMoney(cents: number): string {
  return `${cents < 0 ? "-" : ""}$ ${formatNumber(cents)}`;
}

// "10.200,50" o "10200.50" -> 1020050
export function parseAmount(text: string): number {
  let t = text.trim().replace(/[^\d.,-]/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (!/^-?\d+\.\d{1,2}$/.test(t)) t = t.replace(/\./g, "");
  const n = parseFloat(t);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

// Texto crudo del teclado ("10200,5") -> "10.200,5"
export function formatTyped(raw: string): string {
  if (raw === "") return "0";
  const [int, dec] = raw.split(",");
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return raw.includes(",") ? `${intFmt},${dec ?? ""}` : intFmt;
}

// Aplica una tecla del teclado numérico al texto actual
export function applyKey(raw: string, key: string): string {
  if (key === "back") return raw.slice(0, -1);
  if (key === ",") {
    if (raw.includes(",")) return raw;
    return raw === "" ? "0," : raw + ",";
  }
  if (raw.includes(",")) {
    const dec = raw.split(",")[1] ?? "";
    return dec.length >= 2 ? raw : raw + key;
  }
  if (raw.length >= 10) return raw;
  return raw === "0" ? key : raw + key;
}

// ---------- Fechas (siempre locales, formato YYYY-MM-DD) ----------
export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
export const today = () => toISODate(new Date());

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];
export function formatDateLabel(s: string): string {
  const d = fromISODate(s);
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return s === today() ? `Hoy, ${base}` : base;
}

// "Hoy", "Ayer", "7 nov" (con año si es de otro año)
export function dayTitle(s: string): string {
  if (s === today()) return "Hoy";
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (s === toISODate(y)) return "Ayer";
  const d = fromISODate(s);
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === new Date().getFullYear()
    ? base
    : `${base} ${d.getFullYear()}`;
}

// 1020050 -> "10200,5"  |  1020000 -> "10200"  |  1020005 -> "10200,05"
export function centsToRaw(cents: number): string {
  const neg = cents < 0;
  const abs = Math.abs(cents);
  const int = Math.floor(abs / 100);
  const dec = abs % 100;
  const decText =
    dec === 0 ? "" : "," + String(dec).padStart(2, "0").replace(/0$/, "");
  return `${neg ? "-" : ""}${int}${decText}`;
}
