import {
  BatteryCharging,
  Phone,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { FeaturePage } from "../_components/FeaturePage";
import { getActiveEmergencyContacts } from "@/lib/emergency-contacts";
import { SOSActions } from "./SOSActions";

export const dynamic = "force-dynamic";

const SECONDARY_ICONS: Record<string, LucideIcon> = {
  breakdown: Wrench,
  charging: BatteryCharging,
};

export default async function SOSPage() {
  const contacts = await getActiveEmergencyContacts();
  const primary = contacts.find((c) => c.isPrimary) ?? contacts[0];
  const secondary = contacts.filter((c) => !c.isPrimary);

  return (
    <FeaturePage
      eyebrow="Emergency"
      title="SOS"
      subtitle="ติดต่อทีมช่วยเหลือ 24 ชั่วโมง — แชร์ตำแหน่งของคุณได้ทันที"
      tone="danger"
    >
      {primary && (
        <a
          href={`tel:${primary.phone}`}
          className="flex w-full flex-col bg-red-600 p-6 text-white"
        >
          <div className="text-[10px] font-medium uppercase tracking-[0.22em] opacity-80">
            {primary.labelTh}
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-5xl font-bold tracking-tight">
              {primary.phone}
            </span>
            <Phone className="size-6" strokeWidth={2.5} />
          </div>
          <div className="mt-2 text-sm font-medium opacity-90">
            แตะเพื่อโทรหาศูนย์ช่วยเหลือ Sena EV
          </div>
        </a>
      )}

      {secondary.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {secondary.slice(0, 2).map((c) => {
            const Icon = SECONDARY_ICONS[c.slug] ?? Wrench;
            return (
              <a
                key={c.slug}
                href={`tel:${c.phone}`}
                className="flex flex-col gap-2 border border-zinc-300 p-4"
              >
                <Icon className="size-6 text-red-600" strokeWidth={2} />
                <div className="text-base font-bold">{c.labelTh}</div>
              </a>
            );
          })}
        </div>
      )}

      <SOSActions />
    </FeaturePage>
  );
}
