import {
  ArrowUpRight,
  FileText,
  Gift,
  Plug,
  ShieldCheck,
  ShoppingBag,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { FeaturePage } from "../_components/FeaturePage";
import { getActiveShopItems } from "@/lib/shop-items";

export const dynamic = "force-dynamic";

const ICON_MAP: Record<string, LucideIcon> = {
  ShieldCheck,
  FileText,
  Plug,
  Wrench,
  Gift,
  ShoppingBag,
};

export default async function ShopPage() {
  const items = await getActiveShopItems();

  return (
    <FeaturePage
      eyebrow="Shop & Insurance"
      title="ร้านค้า / ประกัน"
      subtitle="ประกันชั้น 1 ต่อภาษี อุปกรณ์เสริม และแพ็คเกจดูแลรถ"
    >
      <div className="border-t border-zinc-200">
        {items.map((it) => {
          const Icon: LucideIcon =
            (it.iconName ? ICON_MAP[it.iconName] : null) ?? ShoppingBag;
          return (
            <a
              key={it.slug}
              href={it.linkUrl ?? "#"}
              className="flex w-full items-center gap-4 border-b border-zinc-200 py-5 text-left"
            >
              <Icon className="size-6 text-brand" strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold">{it.title}</span>
                  {it.badge && (
                    <span className="bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand">
                      {it.badge}
                    </span>
                  )}
                </div>
                {it.description && (
                  <div className="mt-0.5 text-sm font-medium text-zinc-500">
                    {it.description}
                  </div>
                )}
              </div>
              <ArrowUpRight className="size-4 text-zinc-400" strokeWidth={2.5} />
            </a>
          );
        })}
      </div>
    </FeaturePage>
  );
}
