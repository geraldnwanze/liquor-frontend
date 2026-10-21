"use client";

/** Opens the browser's print dialog: on phones and desktops that includes "Save as PDF". No PDF library needed. */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="min-h-12 rounded-full bg-gold px-6 font-semibold text-midnight print:hidden transition hover:bg-[#dcb86e]">
      Print or save as PDF
    </button>
  );
}
