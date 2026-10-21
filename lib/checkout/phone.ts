/**
 * Mirrors the backend's Nigerian mobile normalisation (app/Support/NigerianPhone.php) so the form can give
 * instant feedback. The server remains the authority and validates again.
 */
export function normalizeNigerianPhone(input: string): string | null {
  let digits = input.replace(/\D+/g, "");
  if (digits.startsWith("234")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return /^[789]\d{9}$/.test(digits) ? `+234${digits}` : null;
}
