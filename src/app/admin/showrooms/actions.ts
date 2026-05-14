"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createShowroom,
  deleteShowroom,
  updateShowroom,
  type ShowroomInput,
} from "@/lib/showrooms";
import { syncShowroomWikiPage } from "@/lib/bot/wiki/sync";

async function syncWiki(id: string) {
  try {
    await syncShowroomWikiPage(id);
  } catch (err) {
    console.error("[admin/showrooms] wiki sync failed", err);
  }
}

function parseInput(formData: FormData): ShowroomInput {
  const slug = String(formData.get("slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!slug || !name || !address) {
    throw new Error("slug, name, address จำเป็น");
  }
  const num = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    return s ? Number(s) : null;
  };
  const txt = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    return s || null;
  };
  const csv = (v: FormDataEntryValue | null) =>
    String(v ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  const services = formData.getAll("services").map(String).filter(Boolean);
  const daysOpen = formData
    .getAll("days_open")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));

  // Allow comma-separated services as fallback
  const servicesFinal =
    services.length > 0 ? services : csv(formData.get("services_csv"));

  return {
    slug,
    name,
    shortName: txt(formData.get("short_name")),
    address,
    district: txt(formData.get("district")),
    province: txt(formData.get("province")),
    phone: txt(formData.get("phone")),
    lat: num(formData.get("lat")),
    lng: num(formData.get("lng")),
    gmapUrl: txt(formData.get("gmap_url")),
    opensAt: txt(formData.get("opens_at")),
    closesAt: txt(formData.get("closes_at")),
    daysOpen,
    services: servicesFinal,
    sortOrder: Number(formData.get("sort_order") ?? 0) || 0,
    isActive: formData.get("is_active") === "on",
  };
}

export async function createShowroomAction(formData: FormData) {
  const input = parseInput(formData);
  const id = await createShowroom(input);
  await syncWiki(id);
  revalidatePath("/admin/showrooms");
  revalidatePath("/admin/wiki");
  revalidatePath("/liff/dealers");
  redirect("/admin/showrooms");
}

export async function updateShowroomAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("missing id");
  const input = parseInput(formData);
  await updateShowroom(id, input);
  await syncWiki(id);
  revalidatePath("/admin/showrooms");
  revalidatePath(`/admin/showrooms/${id}`);
  revalidatePath("/admin/wiki");
  revalidatePath("/liff/dealers");
}

export async function deleteShowroomAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("missing id");
  await deleteShowroom(id);
  await syncWiki(id);
  revalidatePath("/admin/showrooms");
  revalidatePath("/admin/wiki");
  revalidatePath("/liff/dealers");
  redirect("/admin/showrooms");
}

export async function toggleShowroomActiveAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const next = formData.get("next") === "true";
  if (!id) throw new Error("missing id");
  const { getShowroomById, updateShowroom } = await import("@/lib/showrooms");
  const cur = await getShowroomById(id);
  if (!cur) throw new Error("not found");
  await updateShowroom(id, {
    slug: cur.slug,
    name: cur.name,
    shortName: cur.shortName,
    address: cur.address,
    district: cur.district,
    province: cur.province,
    phone: cur.phone,
    lat: cur.lat,
    lng: cur.lng,
    gmapUrl: cur.gmapUrl,
    opensAt: cur.opensAt,
    closesAt: cur.closesAt,
    daysOpen: cur.daysOpen,
    services: cur.services,
    sortOrder: cur.sortOrder,
    isActive: next,
  });
  await syncWiki(id);
  revalidatePath("/admin/showrooms");
  revalidatePath("/admin/wiki");
  revalidatePath("/liff/dealers");
}
