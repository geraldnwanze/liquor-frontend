/** localStorage helpers for install UX. Everything is wrapped: storage can be blocked or full. */
import { snoozeDays } from "./install-policy";

const DISMISS_KEY = "lq:install-dismissal";
const VIEWS_KEY = "lq:page-views";

interface Dismissal {
  count: number;
  until: number;
}

export function readDismissal(): Dismissal | null {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Dismissal>;
    return typeof parsed.count === "number" && typeof parsed.until === "number" ? { count: parsed.count, until: parsed.until } : null;
  } catch {
    return null;
  }
}

export function recordDismissal(now = Date.now()): void {
  try {
    const count = (readDismissal()?.count ?? 0) + 1;
    localStorage.setItem(DISMISS_KEY, JSON.stringify({ count, until: now + snoozeDays(count) * 86_400_000 }));
  } catch {
    /* storage unavailable: the banner may reappear next visit, which is acceptable */
  }
}

export function readPageViews(): number {
  try {
    return Number(localStorage.getItem(VIEWS_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function incrementPageViews(): number {
  try {
    const next = readPageViews() + 1;
    localStorage.setItem(VIEWS_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}
