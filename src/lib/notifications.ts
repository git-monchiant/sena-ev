import "server-only";
import { query } from "./db";

export type Notification = {
  id: string;
  customerId: string;
  type: string;
  title: string;
  body: string | null;
  ctaUrl: string | null;
  sentAt: string | null;
  readAt: string | null;
};

type Row = {
  id: string;
  customer_id: string;
  type: string;
  title: string;
  body: string | null;
  cta_url: string | null;
  sent_at: string | null;
  read_at: string | null;
};

export async function listByCustomer(
  customerId: string,
  limit = 50,
): Promise<Notification[]> {
  const r = await query<Row>(
    `SELECT id, customer_id, type, title, body, cta_url,
            sent_at::text, read_at::text
       FROM sena_ev.notifications
      WHERE customer_id = $1
      ORDER BY COALESCE(sent_at, '1970-01-01') DESC
      LIMIT $2`,
    [customerId, limit],
  );
  return r.rows.map((r) => ({
    id: r.id,
    customerId: r.customer_id,
    type: r.type,
    title: r.title,
    body: r.body,
    ctaUrl: r.cta_url,
    sentAt: r.sent_at,
    readAt: r.read_at,
  }));
}
