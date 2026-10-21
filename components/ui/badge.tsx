const tones = {
  sale: "bg-burgundy text-ivory",
  muted: "bg-midnight/80 text-ivory",
  demo: "bg-gold/25 text-ink",
} as const;

export function Badge({ tone, children }: { tone: keyof typeof tones; children: React.ReactNode }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
