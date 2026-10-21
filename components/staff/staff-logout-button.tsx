"use client";

import { useState } from "react";
import { staffLogoutAction } from "@/app/actions/staff-auth";

export function StaffLogoutButton({ className }: { className?: string }) {
  const [pending, setPending] = useState(false);
  async function signOut() {
    setPending(true);
    try {
      await staffLogoutAction();
    } finally {
      // Full page load: nothing from the staff session survives in memory.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/staff/login");
    }
  }
  return (
    <button type="button" onClick={signOut} disabled={pending} className={className}>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
