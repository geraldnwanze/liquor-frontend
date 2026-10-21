/** Pure install-UX logic: platform detection, what instructions to show, and when to nag. No browser APIs. */

export type OS = "ios" | "android" | "desktop" | "other";
export type BrowserName = "safari" | "chrome" | "edge" | "firefox" | "samsung" | "other";

export interface Platform {
  os: OS;
  browser: BrowserName;
  /** Facebook, Instagram, TikTok etc. embedded browsers and Android WebViews cannot install PWAs. */
  inApp: boolean;
}

export type InstallMode = "native" | "manual-ios" | "manual-menu" | "open-in-browser" | "unsupported";

export function detectPlatform(userAgent: string, maxTouchPoints = 0): Platform {
  const ua = userAgent;
  const inApp = /FBAN|FBAV|Instagram|TikTok|Snapchat|Twitter|; wv\)|Line\//.test(ua);

  // iPadOS 13+ reports a Mac user agent but has a touch screen.
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const os: OS = ios ? "ios" : android ? "android" : /Windows|Macintosh|Linux|CrOS/.test(ua) ? "desktop" : "other";

  let browser: BrowserName = "other";
  if (/EdgiOS|EdgA|Edg\//.test(ua)) browser = "edge";
  else if (/FxiOS|Firefox/.test(ua)) browser = "firefox";
  else if (/SamsungBrowser/.test(ua)) browser = "samsung";
  else if (/CriOS|Chrome\//.test(ua)) browser = "chrome";
  else if (/Safari\//.test(ua)) browser = "safari";

  return { os, browser, inApp };
}

export function installMode(platform: Platform, canPrompt: boolean): InstallMode {
  if (canPrompt) return "native";
  if (platform.inApp) return "open-in-browser";
  if (platform.os === "ios") return "manual-ios";
  if (platform.os === "desktop" && platform.browser === "firefox") return "unsupported";
  if (platform.os === "other") return "unsupported";
  return "manual-menu";
}

export interface Guide {
  title: string;
  steps: string[];
  note?: string;
}

export function installGuide(platform: Platform, mode: InstallMode): Guide {
  if (mode === "open-in-browser") {
    return {
      title: "Open in your browser to install",
      steps: [
        "Tap the menu (⋯ or ⋮) in this app's corner.",
        "Choose “Open in browser” (or “Open in Chrome / Safari”).",
        "Then use Install, or Add to Home Screen, from that browser.",
      ],
      note: "Apps like Facebook and Instagram open links in a built-in browser that can't install websites.",
    };
  }
  if (mode === "manual-ios") {
    return {
      title: "Add to your Home Screen",
      steps: [
        "Tap the Share button (the square with an arrow) in your browser's toolbar.",
        "Scroll down and tap “Add to Home Screen”.",
        "Tap “Add”. The app icon will appear on your Home Screen.",
      ],
      note:
        platform.browser === "safari"
          ? undefined
          : "If you don't see “Add to Home Screen”, open this page in Safari and try again. Requires iOS 16.4 or newer in some browsers.",
    };
  }
  if (mode === "unsupported") {
    return {
      title: "Installing isn't supported here",
      steps: ["This browser can't install websites as apps. You can keep shopping in the browser, or open the site in Chrome or Edge to install it."],
    };
  }
  if (platform.os === "desktop" && platform.browser === "safari") {
    return { title: "Add to Dock", steps: ["In the menu bar choose File → Add to Dock.", "Confirm the name and click Add."], note: "Requires Safari 17 on macOS Sonoma or newer." };
  }
  if (platform.os === "desktop") {
    return {
      title: "Install the app",
      steps: ["Click the install icon at the right end of the address bar, or open the browser menu (⋮) and choose “Install”.", "Confirm by clicking Install."],
      note: "If you don't see the option, the app may already be installed.",
    };
  }
  return {
    title: "Install the app",
    steps: ["Open your browser menu (⋮).", "Tap “Install app” or “Add to Home screen”.", "Confirm to add the icon to your Home screen."],
    note: "If you don't see the option, the app may already be installed.",
  };
}

/** Longer snoozes each time the customer says no. */
export function snoozeDays(dismissCount: number): number {
  if (dismissCount <= 1) return 14;
  if (dismissCount === 2) return 60;
  return 180;
}

export interface BannerInput {
  standalone: boolean;
  installed: boolean;
  mode: InstallMode;
  pageViews: number;
  dismissedUntil: number | null;
  now: number;
}

/** Only nag where there is something actionable, after real browsing, and never within a snooze. */
export function shouldShowBanner(i: BannerInput): boolean {
  if (i.standalone || i.installed) return false;
  if (i.mode !== "native" && i.mode !== "manual-ios") return false;
  if (i.pageViews < 2) return false;
  if (i.dismissedUntil !== null && i.now < i.dismissedUntil) return false;
  return true;
}
