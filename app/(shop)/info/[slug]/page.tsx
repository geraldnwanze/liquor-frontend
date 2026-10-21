import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { RichText } from "@/components/content/rich-text";
import { getPage } from "@/lib/api/catalog";
import { formatDate } from "@/lib/format";

// Blocking route by design: the slug is validated before any HTML is sent, so unknown or unpublished pages get a real 404.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/info/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Page not found", robots: { index: false } };
  return { title: page.title, description: page.meta_description ?? undefined, alternates: { canonical: `/info/${page.slug}` } };
}

export default async function InfoPage({ params }: PageProps<"/info/[slug]">) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10">
      <Breadcrumbs trail={[{ name: "Home", href: "/" }, { name: page.title, href: `/info/${page.slug}` }]} />
      <h1 className="mt-4 text-4xl sm:text-5xl">{page.title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated {formatDate(page.updated_at)}</p>
      <RichText source={page.body} className="mt-8" />
    </article>
  );
}
