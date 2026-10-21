/**
 * Square PNG icons (favicon, app icon) made from the uploaded logo. The logo lives on Cloudinary, which can resize,
 * pad and convert on the fly, so no image library is needed here: we just ask for the right transformation.
 * Returns null when the logo isn't served from Cloudinary-style `/image/upload/` addresses (for example a local
 * development disk); the site then keeps its built-in icons.
 */
export const ICON_SIZES = [32, 180, 192, 512] as const;
export type IconSize = (typeof ICON_SIZES)[number];

const MARKER = "/image/upload/";

export function logoIconUrl(logoUrl: string | null | undefined, size: IconSize, maskable = false): string | null {
  if (!logoUrl || !logoUrl.startsWith("https://")) return null;
  const at = logoUrl.indexOf(MARKER);
  if (at < 0) return null;
  // Leave a margin so the logo never touches the edge (more for maskable icons, which the OS crops into a shape).
  const inner = Math.round(size * (maskable ? 0.6 : 0.84));
  const transform = `c_fit,w_${inner},h_${inner}/c_pad,w_${size},h_${size},b_rgb:0f0b0a,f_png`;
  const head = logoUrl.slice(0, at + MARKER.length);
  const rest = logoUrl.slice(at + MARKER.length);
  return `${head}${transform}/${rest}`;
}

export function isIconSize(value: number): value is IconSize {
  return (ICON_SIZES as readonly number[]).includes(value);
}
