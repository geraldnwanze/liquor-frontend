import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ProductListItem } from "@/lib/api/types";
import { HeartButton } from "@/components/wishlist/heart-button";
import { Price } from "./price";
import { ProductImage } from "./product-image";
import { Stars } from "./stars";

export function ProductCard({ product, priority = false }: { product: ProductListItem; priority?: boolean }) {
  const onSale = product.compare_at_price !== null;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-gold/10 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_22px_50px_-18px_rgba(0,0,0,0.95)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="relative aspect-[4/5] overflow-hidden transition duration-500 group-hover:[&_img]:scale-105 [&_img]:transition [&_img]:duration-700 motion-reduce:[&_img]:transition-none">
        <ProductImage image={product.image} name={product.name} priority={priority} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1">
          {onSale && <Badge tone="sale">Sale</Badge>}
          {product.status === "discontinued" && <Badge tone="muted">Discontinued</Badge>}
          {!product.in_stock && product.status !== "discontinued" && <Badge tone="muted">Out of stock</Badge>}
          {product.is_demo && <Badge tone="demo">Demo</Badge>}
        </div>
        <HeartButton slug={product.slug} name={product.name} className="absolute right-3 top-3" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 border-t border-gold/10 p-4">
        {product.brand && <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gold">{product.brand.name}</p>}
        <h3 className="font-display text-lg font-semibold leading-snug">
          {/* Stretched link: the whole card is one tap target with one accessible name. */}
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 group-hover:text-accent">
            {product.name}
          </Link>
        </h3>
        {product.rating && <Stars rating={product.rating} />}
        {product.price_from && (
          <Price className="mt-auto pt-1 text-lg" current={product.price_from} regular={product.compare_at_price} prefix={product.variant_count > 1 ? "From" : undefined} />
        )}
        <span aria-hidden="true" className="mt-2 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.16em] text-gold opacity-80 transition group-hover:gap-2 group-hover:opacity-100">
          View <span>→</span>
        </span>
      </div>
    </article>
  );
}
