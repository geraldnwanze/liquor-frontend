"use client";

import { deleteBrandAction, removeBrandLogoAction, uploadBrandLogoAction } from "@/app/actions/admin-taxonomy";
import { BrandForm } from "@/components/admin/brand-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { EditToggle } from "@/components/admin/edit-toggle";
import { ImageUploadPanel } from "@/components/admin/image-upload-panel";
import type { AdminBrand } from "@/lib/api/types";

export function BrandEditor({ brand }: { brand: AdminBrand }) {
  const used = brand.products_count;
  const actions =
    used > 0 ? (
      <span className="flex items-center gap-3">
        <button type="button" disabled title="Reassign its products first" className="h-10 cursor-not-allowed rounded-lg border border-stone-200 px-4 text-sm font-medium text-stone-400">Delete</button>
        <span className="text-xs text-muted">{used} {used === 1 ? "product uses" : "products use"} it. Reassign them first.</span>
      </span>
    ) : (
      <ConfirmButton label="Delete" confirmLabel="Yes, delete" tone="danger" run={() => deleteBrandAction(brand.id)} />
    );
  return <EditToggle actions={actions}>{() => (
        <>
          <ImageUploadPanel label="Brand logo" imageUrl={brand.logo_url} maxMb={5} upload={uploadBrandLogoAction.bind(null, brand.id)} remove={removeBrandLogoAction.bind(null, brand.id)} />
          <BrandForm brand={brand} />
        </>
      )}</EditToggle>;
}
