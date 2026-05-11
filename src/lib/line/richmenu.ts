import "server-only";
import type { messagingApi } from "@line/bot-sdk";
import { getMessagingBlobClient, getMessagingClient } from "./client";

export async function listRichMenus() {
  const client = getMessagingClient();
  const { richmenus } = await client.getRichMenuList();
  return richmenus;
}

export async function getRichMenu(richMenuId: string) {
  const client = getMessagingClient();
  return client.getRichMenu(richMenuId);
}

export async function createRichMenu(menu: messagingApi.RichMenuRequest) {
  const client = getMessagingClient();
  const result = await client.createRichMenu(menu);
  return result.richMenuId;
}

export async function uploadRichMenuImage(
  richMenuId: string,
  image: Blob,
): Promise<void> {
  const blobClient = getMessagingBlobClient();
  await blobClient.setRichMenuImage(richMenuId, image);
}

export async function deleteRichMenu(richMenuId: string) {
  const client = getMessagingClient();
  await client.deleteRichMenu(richMenuId);
}

export async function setDefaultRichMenu(richMenuId: string) {
  const client = getMessagingClient();
  await client.setDefaultRichMenu(richMenuId);
}

export async function cancelDefaultRichMenu() {
  const client = getMessagingClient();
  await client.cancelDefaultRichMenu();
}

export async function getDefaultRichMenuId(): Promise<string | null> {
  const client = getMessagingClient();
  try {
    const { richMenuId } = await client.getDefaultRichMenuId();
    return richMenuId;
  } catch {
    return null;
  }
}

export async function linkRichMenuToUser(userId: string, richMenuId: string) {
  const client = getMessagingClient();
  await client.linkRichMenuIdToUser(userId, richMenuId);
}

export async function unlinkRichMenuFromUser(userId: string) {
  const client = getMessagingClient();
  await client.unlinkRichMenuIdFromUser(userId);
}

export async function createRichMenuAlias(
  richMenuAliasId: string,
  richMenuId: string,
) {
  const client = getMessagingClient();
  await client.createRichMenuAlias({ richMenuAliasId, richMenuId });
}

export async function deleteRichMenuAlias(richMenuAliasId: string) {
  const client = getMessagingClient();
  await client.deleteRichMenuAlias(richMenuAliasId);
}

export async function getRichMenuAlias(richMenuAliasId: string) {
  const client = getMessagingClient();
  return client.getRichMenuAlias(richMenuAliasId);
}
