import "server-only";
import { query, queryOne } from "./db";
import {
  getRichMenuAlias,
  linkRichMenuToUser,
  unlinkRichMenuFromUser,
} from "./line/richmenu";

export type CustomerState = "LEAD" | "OWNER";
export type RichMenuKind = "presale" | "owner";

const STATE_TO_MENU: Record<CustomerState, RichMenuKind> = {
  LEAD: "presale",
  OWNER: "owner",
};

const MENU_TO_ALIAS: Record<RichMenuKind, string> = {
  presale: "richmenu-presale",
  owner: "richmenu-owner",
};

export type CustomerRow = {
  id: string;
  line_user_id: string;
  state: CustomerState;
  display_name: string | null;
  picture_url: string | null;
  phone: string | null;
};

export function menuForState(state: CustomerState): RichMenuKind {
  return STATE_TO_MENU[state];
}

export async function getCustomerByLineUserId(
  lineUserId: string,
): Promise<CustomerRow | null> {
  return queryOne<CustomerRow>(
    `SELECT id, line_user_id, state, display_name, picture_url, phone
     FROM sena_ev.customers WHERE line_user_id = $1`,
    [lineUserId],
  );
}

export async function upsertCustomerOnFollow(profile: {
  lineUserId: string;
  displayName?: string;
  pictureUrl?: string;
}): Promise<CustomerRow> {
  const row = await queryOne<CustomerRow>(
    `INSERT INTO sena_ev.customers (line_user_id, display_name, picture_url, state, followed_at)
     VALUES ($1, $2, $3, 'LEAD', now())
     ON CONFLICT (line_user_id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       picture_url  = EXCLUDED.picture_url,
       followed_at  = now(),
       unfollowed_at = NULL
     RETURNING id, line_user_id, state, display_name, picture_url, phone`,
    [profile.lineUserId, profile.displayName ?? null, profile.pictureUrl ?? null],
  );
  if (!row) throw new Error("upsertCustomerOnFollow returned no row");
  return row;
}

export async function createFollowLead(
  customerId: string,
  displayName: string | null,
): Promise<{ id: string }> {
  const row = await queryOne<{ id: string }>(
    `INSERT INTO sena_ev.leads (customer_id, type, status, payload)
     VALUES ($1, 'follow', 'NEW', $2::jsonb)
     RETURNING id`,
    [
      customerId,
      JSON.stringify({
        source: "line_follow",
        display_name: displayName,
        captured_at: new Date().toISOString(),
      }),
    ],
  );
  if (!row) throw new Error("createFollowLead returned no row");
  return row;
}

export async function markUnfollowed(lineUserId: string): Promise<void> {
  await query(
    `UPDATE sena_ev.customers SET unfollowed_at = now() WHERE line_user_id = $1`,
    [lineUserId],
  );
}

export async function setCustomerState(
  lineUserId: string,
  state: CustomerState,
): Promise<void> {
  await query(
    `UPDATE sena_ev.customers
     SET state = $2, state_changed_at = now()
     WHERE line_user_id = $1`,
    [lineUserId, state],
  );
}

export async function syncMenuFromState(
  lineUserId: string,
  state: CustomerState,
): Promise<void> {
  const menu = menuForState(state);
  const aliasId = MENU_TO_ALIAS[menu];
  const alias = await getRichMenuAlias(aliasId);
  await linkRichMenuToUser(lineUserId, alias.richMenuId);
  await query(
    `INSERT INTO sena_ev.customer_richmenu_state (customer_id, current_menu, linked_at)
     SELECT id, $2, now() FROM sena_ev.customers WHERE line_user_id = $1
     ON CONFLICT (customer_id) DO UPDATE SET
       current_menu = EXCLUDED.current_menu,
       linked_at    = EXCLUDED.linked_at`,
    [lineUserId, menu],
  );
}

export async function clearCustomerMenu(lineUserId: string): Promise<void> {
  await unlinkRichMenuFromUser(lineUserId);
}
