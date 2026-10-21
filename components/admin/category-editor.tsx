"use client";

import { deleteCategoryAction, removeCategoryImageAction, uploadCategoryImageAction } from "@/app/actions/admin-taxonomy";
import { CategoryForm } from "@/components/admin/category-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { EditToggle } from "@/components/admin/edit-toggle";
import { ImageUploadPanel } from "@/components/admin/image-upload-panel";
import type { AdminCategory } from "@/lib/api/types";

export function CategoryEditor({ category, all }: { category: AdminCategory; all: AdminCategory[] }) {
  const children = all.filter((c) => c.parent_id === category.id).length;
  const reason = [category.products_count > 0 && `${category.products_count} ${category.products_count === 1 ? "product" : "products"}`, children > 0 && `${children} sub-${children === 1 ? "category" : "categories"}`].filter(Boolean).join(" and ");
  const actions = reason ? (
    <span className="flex items-center gap-3">
      <button type="button" disabled title={`Move or remove its ${reason} first`} className="h-10 cursor-not-allowed rounded-lg border border-stone-200 px-4 text-sm font-medium text-stone-400">Delete</button>
      <span className="text-xs text-muted">Has {reason}. Move or remove them first.</span>
    </span>
  ) : (
    <ConfirmButton label="Delete" confirmLabel="Yes, delete" tone="danger" run={() => deleteCategoryAction(category.id)} />
  );
  return <EditToggle actions={actions}>{() => (
        <>
          <ImageUploadPanel label="Category image" imageUrl={category.image_url} maxMb={5} upload={uploadCategoryImageAction.bind(null, category.id)} remove={removeCategoryImageAction.bind(null, category.id)} />
          <CategoryForm category={category} all={all} />
        </>
      )}</EditToggle>;
}
