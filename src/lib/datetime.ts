export const WITA_OFFSET = "+08:00";

// SMA Negeri 1 Samarinda berada di Kalimantan Timur (WITA, GMT+8).
// Helper ini idempotent: string yang sudah punya offset dikembalikan apa adanya.
// Diperlukan karena <input type="datetime-local"> menghasilkan string tanpa
// offset, sehingga di server production (UTC) parsing-nya jadi geser 8 jam.
export function normalizeWitaDateString(value: string): string {
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) return value;
  const withSeconds = /T\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
  return `${withSeconds}${WITA_OFFSET}`;
}
