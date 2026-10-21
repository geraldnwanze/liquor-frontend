import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { accountGet, requireUser } from "@/lib/api/account";
import type { ProductListItem } from "@/lib/api/types";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  await requireUser("/account/wishlist");
  const { data } = await accountGet<{ data: ProductListItem[] }>("/me/wishlist");
  const products = data?.data ?? [];

  return (
    <>
      <h2 className="text-2xl text-accent">Your wishlist</h2>
      {products.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gold/30 p-10 text-center">
          <p className="font-medium">Nothing saved yet.</p>
          <p className="mt-1 text-sm text-muted">Tap the heart on any bottle to keep it here for later.</p>
          <Link href="/search" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e]">Browse the collection</Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {products.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
