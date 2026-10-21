import { periodLabel } from "@/lib/admin/report-range";
import type { ReportSalesRow } from "@/lib/api/types";
import { formatNairaCompact } from "@/lib/money";

/** Bars use a "nice" top value so the scale reads as round numbers (1, 2, 5 times a power of ten). */
function niceMax(max: number): number {
  if (max <= 0) return 100_00; // ₦100 when there are no sales at all
  const power = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 5, 10].find((m) => m * power >= max) ?? 10;
  return step * power;
}

const W = 720;
const H = 240;
const PAD = { top: 12, right: 8, bottom: 28, left: 56 };

/**
 * Sales per period as a bar chart in plain SVG (no chart library). The chart is a picture of the table that follows
 * it, so screen-reader users get the same numbers from the table; each bar also has a hover/long-press title.
 */
export function SalesChart({ rows, group }: { rows: ReportSalesRow[]; group: "day" | "week" | "month" }) {
  const top = niceMax(Math.max(0, ...rows.map((r) => r.gross.kobo)));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(1, rows.length);
  const bar = Math.max(2, slot * 0.7);
  const labelEvery = Math.max(1, Math.ceil(rows.length / 8));
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const unit = group === "day" ? "day" : group;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Bar chart of sales per ${unit}. The same figures are in the table below.`} className="h-auto w-full">
        {ticks.map((t) => {
          const y = PAD.top + plotH * (1 - t);
          return (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.12" />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="fill-current text-[11px] opacity-60">{formatNairaCompact(top * t)}</text>
            </g>
          );
        })}
        {rows.map((r, i) => {
          const h = (r.gross.kobo / top) * plotH;
          const x = PAD.left + i * slot + (slot - bar) / 2;
          return (
            <g key={r.period}>
              <rect x={x} y={PAD.top + plotH - h} width={bar} height={Math.max(h, r.gross.kobo > 0 ? 1 : 0)} rx="2" className="fill-burgundy">
                <title>{`${periodLabel(r.period, group)}: ${r.gross.formatted} from ${r.orders} order${r.orders === 1 ? "" : "s"}`}</title>
              </rect>
              {i % labelEvery === 0 && (
                <text x={x + bar / 2} y={H - 8} textAnchor="middle" className="fill-current text-[11px] opacity-60">{periodLabel(r.period, group)}</text>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
