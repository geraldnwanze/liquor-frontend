"use server";

import { revalidatePath, updateTag } from "next/cache";
import { adminWrite } from "@/lib/api/admin";
import { toError } from "@/lib/api/result";
import type { FormState } from "@/lib/auth/form-state";
import { isUuid } from "@/lib/ids";

const TYPE = /^[a-z]{3,12}$/;

/** Brings a deleted record back. The API refuses (409) while its parent, such as the product of a variant, is still deleted. */
export async function restoreTrashAction(type: string, id: string): Promise<FormState> {
  if (!TYPE.test(type) || !isUuid(id)) return { status: "error", message: "That request wasn't valid." };
  const res = await adminWrite("POST", `/trash/${type}/${id}/restore`);
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended. Sign in again if this continues." };
  if (res.status === 403 || res.status === 404) return { status: "error", message: "That record can't be restored by your role, or is already back." };
  if (res.status !== 200) return { status: "error", message: toError(res).message };
  revalidatePath("/admin/trash");
  // The shop caches catalogue and page content; expire it so a restored record shows again straight away.
  for (const tag of ["products", "categories", "pages", "settings"]) updateTag(tag);
  return { status: "success", message: "Restored." };
}
