"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCarModel,
  deleteCarModel,
  updateCarModel,
  type CarModelInput,
} from "@/lib/car-models";

function parseInput(formData: FormData): CarModelInput {
  const slug = String(formData.get("slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  if (!slug || !name || !brand) {
    throw new Error("slug, name, brand จำเป็น");
  }
  const bodyType = String(formData.get("body_type") ?? "").trim() || null;
  const priceRaw = String(formData.get("price_baht") ?? "").trim();
  const rangeRaw = String(formData.get("range_km") ?? "").trim();
  const brochureUrl =
    String(formData.get("brochure_url") ?? "").trim() || null;
  const colors = String(formData.get("colors") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const images = String(formData.get("images") ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const sortOrder = Number(formData.get("sort_order") ?? 0) || 0;
  const isActive = formData.get("is_active") === "on";

  return {
    slug,
    name,
    brand,
    bodyType,
    priceBaht: priceRaw ? Number(priceRaw) : null,
    rangeKm: rangeRaw ? Number(rangeRaw) : null,
    brochureUrl,
    colors,
    images,
    sortOrder,
    isActive,
  };
}

export async function createCarModelAction(formData: FormData) {
  const input = parseInput(formData);
  await createCarModel(input);
  revalidatePath("/admin/cars");
  revalidatePath("/liff/catalog");
  redirect("/admin/cars");
}

export async function updateCarModelAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("missing id");
  const input = parseInput(formData);
  await updateCarModel(id, input);
  revalidatePath("/admin/cars");
  revalidatePath(`/admin/cars/${id}`);
  revalidatePath("/liff/catalog");
}

export async function deleteCarModelAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("missing id");
  await deleteCarModel(id);
  revalidatePath("/admin/cars");
  revalidatePath("/liff/catalog");
  redirect("/admin/cars");
}

export async function toggleActiveAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const next = formData.get("next") === "true";
  if (!id) throw new Error("missing id");
  // Minimal update: fetch current, just toggle is_active
  const { getCarModelById, updateCarModel } = await import("@/lib/car-models");
  const cur = await getCarModelById(id);
  if (!cur) throw new Error("not found");
  await updateCarModel(id, {
    slug: cur.slug,
    name: cur.name,
    brand: cur.brand,
    bodyType: cur.bodyType,
    priceBaht: cur.priceBaht,
    rangeKm: cur.rangeKm,
    brochureUrl: cur.brochureUrl,
    colors: cur.colors,
    images: cur.images,
    sortOrder: cur.sortOrder,
    isActive: next,
  });
  revalidatePath("/admin/cars");
  revalidatePath("/liff/catalog");
}
