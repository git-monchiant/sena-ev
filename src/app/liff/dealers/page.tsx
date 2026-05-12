import { Navigation, Phone } from "lucide-react";
import { FeaturePage } from "../_components/FeaturePage";
import { getActiveShowrooms } from "@/lib/showrooms";

export const dynamic = "force-dynamic";

export default async function DealersPage() {
  const showrooms = await getActiveShowrooms();

  return (
    <FeaturePage
      eyebrow="Showrooms"
      title="โชว์รูม / ศูนย์บริการ"
      subtitle="ค้นหาสาขาที่ใกล้คุณ — โทรหรือนำทางได้ทันที"
    >
      <div className="border-t border-zinc-200">
        {showrooms.map((d) => {
          const hours =
            d.opensAt && d.closesAt
              ? `${d.opensAt.slice(0, 5)}–${d.closesAt.slice(0, 5)}`
              : null;
          const navUrl =
            d.gmapUrl ??
            (d.lat && d.lng
              ? `https://www.google.com/maps?q=${d.lat},${d.lng}`
              : `https://www.google.com/maps?q=${encodeURIComponent(d.address)}`);
          return (
            <div key={d.id} className="border-b border-zinc-200 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-lg font-bold leading-tight">
                    {d.name}
                  </div>
                  <div className="mt-1.5 text-sm font-medium text-zinc-500">
                    {d.address}
                  </div>
                  {hours && (
                    <div className="mt-0.5 text-sm font-medium text-zinc-500">
                      เปิด {hours}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {d.phone && (
                  <a
                    href={`tel:${d.phone}`}
                    className="flex flex-1 items-center justify-center gap-1.5 bg-brand px-3 py-3 text-sm font-bold text-white"
                  >
                    <Phone className="size-4" strokeWidth={2.5} />
                    โทร
                  </a>
                )}
                <a
                  href={navUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 border border-zinc-300 px-3 py-3 text-sm font-bold"
                >
                  <Navigation className="size-4" strokeWidth={2.5} />
                  นำทาง
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </FeaturePage>
  );
}
