import type { DeliveryZone } from "@/lib/api/types";

export type Coverage = "unknown" | "covered" | "not_covered";

const norm = (v: string) => v.trim().toLowerCase();

export function statesFor(zones: DeliveryZone[]): string[] {
  return [...new Set(zones.map((z) => z.state))].sort((a, b) => a.localeCompare(b));
}

/** Cities with their own zone in this state (suggestions only; a state-wide zone covers any city). */
export function citiesFor(zones: DeliveryZone[], state: string): string[] {
  return zones.filter((z) => norm(z.state) === norm(state) && z.city).map((z) => z.city as string).sort((a, b) => a.localeCompare(b));
}

/** Mirrors the server's zone lookup: a city zone, else a state-wide zone. A convenience hint, not the authority. */
export function findZone(zones: DeliveryZone[], state: string, city: string): DeliveryZone | null {
  const inState = zones.filter((z) => norm(z.state) === norm(state));
  return inState.find((z) => z.city && norm(z.city) === norm(city)) ?? inState.find((z) => z.city === null) ?? null;
}

export function coverage(zones: DeliveryZone[], state: string, city: string): Coverage {
  if (!state.trim() || !city.trim()) return "unknown";
  return findZone(zones, state, city) ? "covered" : "not_covered";
}
