import {
  ChevronRight,
  FileText,
  Gift,
  Plug,
  ShieldCheck,
  ShoppingBag,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { FeaturePage } from "../_components/FeaturePage";

const ITEMS: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: ShieldCheck, title: "ประกันชั้น 1", desc: "ครอบคลุมทุกอย่าง" },
  { Icon: FileText, title: "ต่อภาษีออนไลน์", desc: "สะดวก ไม่ต้องไปขนส่ง" },
  { Icon: Plug, title: "Wall Charger", desc: "ที่บ้านชาร์จเร็วกว่า" },
  { Icon: Wrench, title: "Package เช็คระยะ", desc: "ราคาประหยัด" },
  { Icon: Gift, title: "Accessories", desc: "ของแต่งรถ ฟิล์ม" },
];

export default function ShopPage() {
  return (
    <FeaturePage
      title="ร้านค้า / ประกัน"
      subtitle="ประกันชั้น 1 ต่อภาษี อุปกรณ์เสริม"
      icon={<ShoppingBag className="size-7" />}
      accent="green"
    >
      <div className="grid gap-3">
        {ITEMS.map((it) => (
          <button
            key={it.title}
            type="button"
            className="flex items-center gap-3 border border-gray-200 bg-white p-4 text-left hover:border-emerald-300"
          >
            <div className="flex size-12 shrink-0 items-center justify-center bg-emerald-50 text-emerald-600">
              <it.Icon className="size-6" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{it.title}</div>
              <div className="text-base text-gray-500">{it.desc}</div>
            </div>
            <ChevronRight className="size-5 text-gray-300" />
          </button>
        ))}
      </div>
    </FeaturePage>
  );
}
