/**
 * Builds a CSV file's text. Cells that a spreadsheet would treat as a formula (starting with = + - @ or a tab/CR)
 * get a leading apostrophe so opening the file can never run anything; quotes and line breaks are escaped. A leading
 * minus on a plain number is kept as-is.
 */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}
