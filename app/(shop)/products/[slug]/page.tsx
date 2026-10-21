import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs, breadcrumbJsonLd, type Crumb } from "@/components/catalog/breadcrumbs";
import { JsonLd } from "@/components/catalog/json-ld";
import { ProductImage } from "@/components/catalog/product-image";
import { Stars } from "@/components/catalog/stars";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { HeartButton } from "@/components/wishlist/heart-button";
import { VariantPicker } from "@/components/catalog/variant-picker";
import { getAllProductSlugs, getCategory, getProduct, getPublicSettings } from "@/lib/api/catalog";
import type { Product } from "@/lib/api/types";
import { absoluteUrl, koboToDecimal } from "@/lib/seo";

// Blocking route by design: the slug is validated before any HTML is sent, so unknown URLs get a real 404
// (this relies on partialPrefetching being off; see next.config.ts).
export const instant = false;

export async function generateStaticParams() {
  // The build needs the API reachable (see docs). Placeholder only keeps the route valid for Cache Components.
  const slugs = await getAllProductSlugs(12);
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found", robots: { index: false } };

  const path = `/products/${product.slug}`;
  const image = product.images[0]?.url;
  return {
    title: product.seo.title,
    description: product.seo.description ?? undefined,
    alternates: { canonical: path },
    openGraph: {
      title: product.seo.title,
      description: product.seo.description ?? undefined,
      url: path,
      type: "website",
      images: image ? [{ url: image, alt: product.images[0]?.alt ?? product.name }] : undefined,
    },
  };
}

async function trailFor(product: Product): Promise<Crumb[]> {
  const trail: Crumb[] = [{ name: "Home", href: "/" }];
  if (product.category) {
    const category = await getCategory(product.category.slug);
    if (category?.parent) trail.push({ name: category.parent.name, href: `/${category.parent.slug}` });
    trail.push({ name: product.category.name, href: category?.parent ? `/${category.parent.slug}/${category.slug}` : `/${product.category.slug}` });
  }
  trail.push({ name: product.name, href: `/products/${product.slug}` });
  return trail;
}

function productJsonLd(product: Product) {
  const url = absoluteUrl(`/products/${product.slug}`);
  const discontinued = product.status === "discontinued";
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url,
    description: product.short_description ?? product.description ?? undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    image: product.images.length ? product.images.map((i) => i.url) : undefined,
    // Only real data: a rating is emitted once at least one approved review exists.
    aggregateRating: product.rating ? { "@type": "AggregateRating", ratingValue: product.rating.average, reviewCount: product.rating.count } : undefined,
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      name: v.name,
      url,
      priceCurrency: "NGN",
      price: koboToDecimal((v.sale_price ?? v.price).kobo),
      availability: discontinued ? "https://schema.org/Discontinued" : v.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [trail, settings] = await Promise.all([trailFor(product), getPublicSettings()]);
  const discontinued = product.status === "discontinued";
  const details: [string, string | null][] = [
    ["Brand", product.brand?.name ?? null],
    ["Type", product.category?.name ?? null],
    ["Country of origin", product.country_of_origin],
    ["Alcohol by volume", product.abv ? `${product.abv}%` : null],
    ["Flavour profile", product.flavor_profile?.length ? product.flavor_profile.join(", ") : null],
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <JsonLd data={productJsonLd(product)} />
      <JsonLd data={breadcrumbJsonLd(trail, absoluteUrl)} />
      <Breadcrumbs trail={trail} />

      <div className="mt-6 grid gap-8 md:grid-cols-2 lg:gap-14">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-gold/15 bg-white">
            <ProductImage image={product.images[0] ?? null} name={product.name} priority sizes="(min-width: 768px) 50vw, 100vw" />
          </div>
          {product.images.length > 1 && (
            <ul className="mt-3 grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((image) => (
                <li key={image.url} className="relative aspect-square overflow-hidden rounded-lg border border-gold/15 bg-white">
                  <ProductImage image={image} name={product.name} sizes="12vw" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-6 md:sticky md:top-32 md:self-start">
          <header>
            <div className="mb-2 flex flex-wrap gap-2">
              {discontinued && <Badge tone="muted">Discontinued</Badge>}
              {product.is_demo && <Badge tone="demo">Demo product: details not verified</Badge>}
            </div>
            {product.brand && <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">{product.brand.name}</p>}
            <div className="mt-2 flex items-start justify-between gap-4">
              <h1 className="text-balance text-4xl leading-tight text-ivory sm:text-5xl">{product.name}</h1>
              <HeartButton slug={product.slug} name={product.name} className="mt-2 shrink-0 border border-gold/25" />
            </div>
            {product.rating && (
              <a href="#reviews-heading" className="mt-2 inline-block">
                <Stars rating={product.rating} />
              </a>
            )}
            {product.short_description && <p className="mt-4 text-pretty text-lg leading-relaxed text-ivory/70">{product.short_description}</p>}
          </header>

          <VariantPicker variants={product.variants} discontinued={discontinued} maxQuantity={settings.commerce.max_quantity_per_line} />

          {product.is_age_restricted && (
            <p className="rounded-xl border border-gold/15 border-l-4 border-l-gold bg-white p-4 text-sm leading-relaxed text-muted">
              This product contains alcohol and can only be sold to adults of legal drinking age. Please drink responsibly.
            </p>
          )}

          <dl className="divide-y divide-gold/10 border-y border-gold/10 text-sm">
            {details
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right font-medium text-ivory">{value}</dd>
                </div>
              ))}
          </dl>
        </div>
      </div>

      <div className="mt-16 grid max-w-3xl gap-10 border-t border-gold/10 pt-12">
        {product.description && <TextSection title="About this product" text={product.description} />}
        {product.tasting_notes && <TextSection title="Tasting notes" text={product.tasting_notes} />}
        {product.serving_suggestions && <TextSection title="Serving and pairing" text={product.serving_suggestions} />}
        {product.authenticity_note && <TextSection title="Authenticity and sourcing" text={product.authenticity_note} />}
      </div>

      <Suspense fallback={<div className="mt-16 h-40 max-w-3xl animate-pulse rounded-2xl bg-white/5" aria-hidden="true" />}>
        <ReviewsSection slug={product.slug} />
      </Suspense>
    </div>
  );
}

function TextSection({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h2 className="text-2xl text-accent">{title}</h2>
      {/* Plain text from the CMS (HTML is stripped server-side); React escapes it on output. */}
      <p className="mt-3 whitespace-pre-line leading-relaxed text-ivory/70">{text}</p>
    </section>
  );
}
