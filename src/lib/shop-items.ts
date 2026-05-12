import "server-only";
import { query } from "./db";

export type ShopItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  iconName: string | null;
  imageUrl: string | null;
  priceBaht: number | null;
  priceLabel: string | null;
  badge: string | null;
  linkUrl: string | null;
  sortOrder: number;
};

type Row = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  icon_name: string | null;
  image_url: string | null;
  price_baht: string | null;
  price_label: string | null;
  badge: string | null;
  link_url: string | null;
  sort_order: number;
};

function toShopItem(r: Row): ShopItem {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    category: r.category,
    iconName: r.icon_name,
    imageUrl: r.image_url,
    priceBaht: r.price_baht == null ? null : Number(r.price_baht),
    priceLabel: r.price_label,
    badge: r.badge,
    linkUrl: r.link_url,
    sortOrder: r.sort_order,
  };
}

export async function getActiveShopItems(): Promise<ShopItem[]> {
  const r = await query<Row>(
    `SELECT id, slug, title, description, category, icon_name, image_url,
            price_baht, price_label, badge, link_url, sort_order
       FROM sena_ev.shop_items
      WHERE is_active = true
      ORDER BY sort_order ASC, title ASC`,
  );
  return r.rows.map(toShopItem);
}
