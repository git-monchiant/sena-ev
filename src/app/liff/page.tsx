import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  Calculator,
  Car,
  KeyRound,
  LifeBuoy,
  MapPin,
  Repeat,
  ShoppingBag,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { getBrand } from "@/lib/company-settings";
import { LiffHomeProfile } from "./LiffHomeProfile";

export const dynamic = "force-dynamic";

const PRIMARY: { href: string; title: string; sub: string; Icon: LucideIcon }[] =
  [
    {
      href: "/liff/catalog",
      title: "รุ่นรถ EV",
      sub: "เลือกรุ่นและรายละเอียด",
      Icon: Car,
    },
    {
      href: "/liff/test-drive",
      title: "จองทดลองขับ",
      sub: "นัดทดลองขับที่โชว์รูม",
      Icon: KeyRound,
    },
    {
      href: "/liff/my-car",
      title: "รถของฉัน",
      sub: "ข้อมูลรถและประกัน",
      Icon: Car,
    },
    {
      href: "/liff/service",
      title: "จองเซอร์วิส",
      sub: "นัดเช็คระยะและตรวจสภาพ",
      Icon: Wrench,
    },
  ];

const SECONDARY: {
  href: string;
  title: string;
  Icon: LucideIcon;
}[] = [
  { href: "/liff/financing", title: "คำนวณสินเชื่อ", Icon: Calculator },
  { href: "/liff/trade-in", title: "Trade-in รถเก่า", Icon: Repeat },
  { href: "/liff/shop", title: "ร้านค้า / ประกัน", Icon: ShoppingBag },
  { href: "/liff/dealers", title: "โชว์รูม", Icon: MapPin },
  { href: "/liff/inbox", title: "แจ้งเตือน", Icon: Bell },
  { href: "/liff/sos", title: "SOS", Icon: LifeBuoy },
];

export default async function LiffHome() {
  const brand = await getBrand();
  const eyebrow = brand?.nameEn ?? "Sena Green Auto";
  const tagline = brand?.tagline ?? "Drive the Future.";

  // Allow 1- or 2-line tagline by splitting on first space-after-word boundary
  const taglineLines = formatTagline(tagline);

  return (
    <main className="flex min-h-screen w-full flex-col bg-white text-zinc-900">
      <header className="px-5 pt-6 pb-2">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-brand">
          {eyebrow}
        </div>
        <h1 className="text-[2.5rem] font-bold leading-[1.02] tracking-tight">
          {taglineLines.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h1>
        <p className="mt-4 max-w-md text-base font-medium leading-relaxed text-zinc-500">
          มินิแอปลูกค้า Sena EV — จัดการรถ จองบริการ และดูโปรโมชั่นในที่เดียว
        </p>
      </header>

      <LiffHomeProfile />

      <section className="mt-8 px-5">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
          บริการหลัก
        </div>
        <div className="grid grid-cols-2 gap-3">
          {PRIMARY.map(({ href, title, sub, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex aspect-square flex-col justify-between border border-zinc-200 bg-white p-4 transition-colors hover:border-brand"
            >
              <Icon className="size-7 text-brand" strokeWidth={2} />
              <div>
                <div className="text-lg font-bold leading-tight">{title}</div>
                <div className="mt-1 text-xs font-medium leading-snug text-zinc-500">
                  {sub}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 px-5 pb-10">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
          เพิ่มเติม
        </div>
        <div className="border-t border-zinc-200">
          {SECONDARY.map(({ href, title, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 border-b border-zinc-200 py-4"
            >
              <Icon className="size-5 text-zinc-900" strokeWidth={2} />
              <div className="flex-1 text-base font-bold">{title}</div>
              <ArrowUpRight
                className="size-4 text-zinc-400"
                strokeWidth={2.5}
              />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function formatTagline(t: string): string[] {
  // Break on the first " the " or " ที่ " boundary, otherwise return whole
  const m = t.match(/^(\S+)\s+(.+)$/);
  if (m && t.length > 12) return [m[1]!, m[2]!];
  return [t];
}
