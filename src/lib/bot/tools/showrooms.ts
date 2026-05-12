import "server-only";
import {
  getActiveShowrooms,
  getShowroomBySlug,
  type Showroom,
} from "../../showrooms";

function summary(s: Showroom) {
  const hours =
    s.opensAt && s.closesAt
      ? `${s.opensAt.slice(0, 5)}–${s.closesAt.slice(0, 5)}`
      : null;
  const mapUrl =
    s.gmapUrl ??
    (s.lat != null && s.lng != null
      ? `https://www.google.com/maps?q=${s.lat},${s.lng}`
      : null);
  return {
    slug: s.slug,
    name: s.name,
    short_name: s.shortName,
    address: s.address,
    district: s.district,
    province: s.province,
    phone: s.phone,
    hours,
    services: s.services,
    map_url: mapUrl,
  };
}

export async function lookupShowroom(slug: string): Promise<unknown> {
  const s = await getShowroomBySlug(slug);
  if (!s) return { error: `ไม่พบโชว์รูม slug="${slug}"` };
  return summary(s);
}

export async function listShowrooms(): Promise<unknown> {
  const all = await getActiveShowrooms();
  return all.map(summary);
}
