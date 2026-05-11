"use server";

import { revalidatePath } from "next/cache";
import type { messagingApi } from "@line/bot-sdk";
import {
  cancelDefaultRichMenu,
  createRichMenu,
  deleteRichMenu,
  setDefaultRichMenu,
  uploadRichMenuImage,
} from "@/lib/line/richmenu";

export async function createRichMenuAction(formData: FormData) {
  const menuJson = formData.get("menu") as string | null;
  const image = formData.get("image") as File | null;

  if (!menuJson) throw new Error("กรุณาวาง JSON ของ Rich Menu");
  if (!image || image.size === 0) throw new Error("กรุณาอัปโหลดรูป");

  let menu: messagingApi.RichMenuRequest;
  try {
    menu = JSON.parse(menuJson);
  } catch (err) {
    throw new Error(
      `JSON ไม่ถูกต้อง: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const richMenuId = await createRichMenu(menu);
  await uploadRichMenuImage(richMenuId, image);
  revalidatePath("/admin/richmenu");
}

export async function deleteRichMenuAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) throw new Error("missing rich menu id");
  await deleteRichMenu(id);
  revalidatePath("/admin/richmenu");
}

export async function setDefaultAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) throw new Error("missing rich menu id");
  await setDefaultRichMenu(id);
  revalidatePath("/admin/richmenu");
}

export async function clearDefaultAction() {
  await cancelDefaultRichMenu();
  revalidatePath("/admin/richmenu");
}
