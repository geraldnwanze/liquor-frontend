import { detectPlatform, installMode, type InstallMode, type Platform } from "./install-policy";

/** `beforeinstallprompt` is Chromium-only and not in lib.dom. Safari and Firefox never fire it. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface InstallState {
  /** False on the server and during hydration, so UI renders nothing until the client has measured. */
  ready: boolean;
  standalone: boolean;
  installed: boolean;
  canPrompt: boolean;
  platform: Platform;
  mode: InstallMode;
}

const SERVER_STATE: InstallState = {
  ready: false,
  standalone: false,
  installed: false,
  canPrompt: false,
  platform: { os: "other", browser: "other", inApp: false },
  mode: "unsupported",
};

let state: InstallState = SERVER_STATE;
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let started = false;
const listeners = new Set<() => void>();

function measureStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function update(patch: Partial<InstallState>): void {
  const next = { ...state, ...patch };
  next.mode = installMode(next.platform, next.canPrompt);
  state = next;
  listeners.forEach((l) => l());
}

/** Registered at module load (not in an effect) so an early `beforeinstallprompt` is never missed. */
function start(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  const platform = detectPlatform(navigator.userAgent, navigator.maxTouchPoints);
  update({ ready: true, platform, standalone: measureStandalone() });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // we show our own, contextual prompt instead of the browser mini-infobar
    deferredPrompt = event as BeforeInstallPromptEvent;
    update({ canPrompt: true });
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    update({ installed: true, canPrompt: false });
  });
  window.matchMedia("(display-mode: standalone)").addEventListener("change", () => update({ standalone: measureStandalone() }));
}

start();

export function subscribe(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = (): InstallState => state;
export const getServerSnapshot = (): InstallState => SERVER_STATE;

/** Shows the browser's install dialog. Must be called from a user gesture. */
export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredPrompt) return "unavailable";
  const event = deferredPrompt;
  deferredPrompt = null; // a prompt event can only be used once
  update({ canPrompt: false });
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome;
}
