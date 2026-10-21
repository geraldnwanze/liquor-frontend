"use client";

import { toCsv } from "@/lib/admin/csv";

/** Saves a table as a CSV file in the browser (nothing is sent anywhere). */
export function DownloadCsv({ filename, rows, label = "Download CSV" }: { filename: string; rows: (string | number | null)[][]; label?: string }) {
  function download() {
    const blob = new Blob(["﻿", toCsv(rows)], { type: "text/csv;charset=utf-8" }); // BOM so Excel reads ₦ correctly
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <button type="button" onClick={download} className="h-9 rounded-lg border border-stone-300 bg-white px-3 text-sm font-medium hover:bg-stone-50">
      {label}
    </button>
  );
}
