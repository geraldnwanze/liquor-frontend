import Image from "next/image";

/**
 * The logo when the business has uploaded one, otherwise a gold monogram of the name. The business name stays in the
 * accessible name either way, so a logo-only link still reads properly.
 */
export function BrandMark({ name, logoUrl, className = "h-9" }: { name: string; logoUrl: string | null; className?: string }) {
  if (logoUrl) {
    return <Image src={logoUrl} alt="" width={200} height={80} className={`${className} w-auto max-w-[9rem] object-contain`} priority />;
  }
  return (
    <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full border border-gold/50 font-display text-lg text-gold transition group-hover:border-gold group-hover:bg-gold/10">
      {name.charAt(0)}
    </span>
  );
}
