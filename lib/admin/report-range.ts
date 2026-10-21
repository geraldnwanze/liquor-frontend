/** Date range handling for reports. Dates are whole days in Nigerian time (Africa/Lagos), written YYYY-MM-DD. */

export type Group = "day" | "week" | "month";

export interface ReportRange {
  from: string;
  to: string;
  group: Group;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 366;
const lagosDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" });

/** Today's date in Nigeria, whatever the server's own time zone is. */
export function lagosToday(now: Date = new Date()): string {
  return lagosDay.format(now);
}

const toUtcMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const isRealDate = (iso: string) => ISO.test(iso) && !Number.isNaN(toUtcMs(iso)) && new Date(toUtcMs(iso)).toISOString().startsWith(iso);

export function addDays(iso: string, days: number): string {
  return new Date(toUtcMs(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / 86_400_000);
}

/** Week and month charts stay readable on long ranges; staff can still override with the `group` setting. */
export function defaultGroup(from: string, to: string): Group {
  const span = daysBetween(from, to) + 1;
  return span <= 45 ? "day" : span <= 180 ? "week" : "month";
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? "") : (v ?? ""));

/** Reads the range from the URL. Anything unusable falls back to the last 30 days; nothing odd is forwarded to the API. */
export function parseReportRange(raw: Record<string, string | string[] | undefined>, today: string): ReportRange {
  let from = first(raw.from);
  let to = first(raw.to);
  const usable = isRealDate(from) && isRealDate(to) && daysBetween(from, to) >= 0 && daysBetween(from, to) < MAX_DAYS;
  if (!usable) {
    to = today;
    from = addDays(today, -29);
  }
  const g = first(raw.group);
  return { from, to, group: g === "day" || g === "week" || g === "month" ? g : defaultGroup(from, to) };
}

export interface Preset {
  label: string;
  from: string;
  to: string;
}

/** Quick ranges, computed from today's date in Nigeria. */
export function presets(today: string): Preset[] {
  const monthStart = `${today.slice(0, 7)}-01`;
  const lastMonthEnd = addDays(monthStart, -1);
  return [
    { label: "Last 7 days", from: addDays(today, -6), to: today },
    { label: "Last 30 days", from: addDays(today, -29), to: today },
    { label: "Last 90 days", from: addDays(today, -89), to: today },
    { label: "This month", from: monthStart, to: today },
    { label: "Last month", from: `${lastMonthEnd.slice(0, 7)}-01`, to: lastMonthEnd },
  ];
}

/** A chart label for a period key: "5 Mar" for a day, "Wk 2 Mar" for a week, "Mar 2026" for a month. */
export function periodLabel(period: string, group: Group): string {
  const d = new Date(toUtcMs(period));
  const day = d.getUTCDate();
  const month = d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  if (group === "month") return `${month} ${d.getUTCFullYear()}`;
  return group === "week" ? `Wk ${day} ${month}` : `${day} ${month}`;
}
