"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createPromotion,
  deletePromotion,
  updatePromotion,
  type PromotionInput,
} from "@/lib/promotions";
import { syncPromoWikiPage } from "@/lib/bot/wiki/sync";

async function syncWiki(id: string) {
  try {
    await syncPromoWikiPage(id);
  } catch (err) {
    console.error("[admin/promotions] wiki sync failed", err);
  }
}

function parseInput(formData: FormData): PromotionInput {
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  if (!slug || !title || !type) {
    throw new Error("slug, title, type จำเป็น");
  }
  const txt = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    return s || null;
  };

  // payload is a JSON text area — parse leniently
  const payloadRaw = String(formData.get("payload") ?? "").trim();
  let payload: Record<string, unknown> = {};
  if (payloadRaw) {
    try {
      payload = JSON.parse(payloadRaw) as Record<string, unknown>;
    } catch (err) {
      throw new Error(
        `payload ไม่ใช่ JSON ที่ถูกต้อง: ${err instanceof Error ? err.message : "parse error"}`,
      );
    }
  }

  const applicableModelIds = formData
    .getAll("applicable_model_ids")
    .map(String)
    .filter(Boolean);

  return {
    slug,
    title,
    description: txt(formData.get("description")),
    type,
    badge: txt(formData.get("badge")),
    payload,
    bankName: txt(formData.get("bank_name")),
    validFrom: txt(formData.get("valid_from")),
    validTo: txt(formData.get("valid_to")),
    applicableModelIds,
    sortOrder: Number(formData.get("sort_order") ?? 0) || 0,
    isActive: formData.get("is_active") === "on",
  };
}

export async function createPromotionAction(formData: FormData) {
  const input = parseInput(formData);
  const id = await createPromotion(input);
  await syncWiki(id);
  revalidatePath("/admin/promotions");
  revalidatePath("/admin/wiki");
  revalidatePath("/liff/financing");
  redirect("/admin/promotions");
}

export async function updatePromotionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("missing id");
  const input = parseInput(formData);
  await updatePromotion(id, input);
  await syncWiki(id);
  revalidatePath("/admin/promotions");
  revalidatePath(`/admin/promotions/${id}`);
  revalidatePath("/admin/wiki");
  revalidatePath("/liff/financing");
}

export async function deletePromotionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("missing id");
  await deletePromotion(id);
  await syncWiki(id);
  revalidatePath("/admin/promotions");
  revalidatePath("/admin/wiki");
  revalidatePath("/liff/financing");
  redirect("/admin/promotions");
}

export async function togglePromotionActiveAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const next = formData.get("next") === "true";
  if (!id) throw new Error("missing id");
  const { getPromotionById, updatePromotion } = await import("@/lib/promotions");
  const cur = await getPromotionById(id);
  if (!cur) throw new Error("not found");
  await updatePromotion(id, {
    slug: cur.slug,
    title: cur.title,
    description: cur.description,
    type: cur.type,
    badge: cur.badge,
    payload: cur.payload,
    bankName: cur.bankName,
    validFrom: cur.validFrom,
    validTo: cur.validTo,
    applicableModelIds: cur.applicableModelIds,
    sortOrder: cur.sortOrder,
    isActive: next,
  });
  await syncWiki(id);
  revalidatePath("/admin/promotions");
  revalidatePath("/admin/wiki");
  revalidatePath("/liff/financing");
}
