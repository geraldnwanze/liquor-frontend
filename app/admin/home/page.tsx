import type { Metadata } from "next";
import Link from "next/link";
import { removeHeroImageAction, uploadHeroImageAction } from "@/app/actions/admin-homepage";
import { HomepageForm } from "@/components/admin/homepage-form";
import { ImageUploadPanel } from "@/components/admin/image-upload-panel";
import { PageHeader, panel } from "@/components/admin/page-header";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { HomepageContent } from "@/lib/api/types";

export const metadata: Metadata = { title: "Home page" };

export default async function AdminHomePage() {
  await requireStaff("/admin/home", "content.manage");
  const { data } = await adminGet<{ data: HomepageContent }>("/homepage");
  if (!data) return <p role="alert">The home page settings could not be loaded.</p>;

  return (
    <>
      <PageHeader title="Home page" subtitle="The announcement strip and the top of the shop's front page. Changes show on the shop straight away.">
        <Link href="/" target="_blank" rel="noopener" className="inline-flex h-9 items-center rounded-lg border border-stone-300 bg-white px-3 text-sm font-medium hover:bg-stone-50">View the shop<span className="sr-only"> (opens in a new tab)</span></Link>
      </PageHeader>
      <section className={`${panel} mb-6 p-5`} aria-labelledby="hero-picture-h">
        <h2 id="hero-picture-h" className="mb-3 text-lg font-semibold">Background picture</h2>
        <p className="mb-3 -mt-1 text-sm text-muted">Optional. Shown softly behind the headline. Wide pictures work best (at least 800 × 400 pixels).</p>
        <ImageUploadPanel label="Background picture" imageUrl={data.data.hero_image_url} maxMb={5} upload={uploadHeroImageAction} remove={removeHeroImageAction} />
      </section>
      <section className={`${panel} p-5`}>
        <HomepageForm content={data.data} />
      </section>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
