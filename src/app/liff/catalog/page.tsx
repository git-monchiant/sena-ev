import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calculator, FileText, KeyRound } from "lucide-react";
import { FeaturePage } from "../_components/FeaturePage";
import { getActiveCarModels } from "@/lib/car-models";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const models = await getActiveCarModels();

  const byBrand = models.reduce<Record<string, typeof models>>((acc, m) => {
    (acc[m.brand] ??= []).push(m);
    return acc;
  }, {});

  return (
    <FeaturePage
      eyebrow="Electric Vehicles"
      title="รุ่นรถ EV"
      subtitle={`${models.length} รุ่นจาก ${Object.keys(byBrand).length} แบรนด์ — จองทดลองขับหรือคำนวณค่างวดได้ทันที`}
    >
      {Object.entries(byBrand).map(([brand, list]) => (
        <section key={brand} className="mb-8">
          <div className="mb-3 flex items-baseline justify-between border-b border-zinc-200 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-900">
              {brand}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {list.length} รุ่น
            </span>
          </div>

          {list.map((m) => (
            <article key={m.slug} className="border-b border-zinc-200 py-5">
              {m.images[0] && (
                <div className="relative mb-4 aspect-[16/9] w-full overflow-hidden bg-zinc-50">
                  <Image
                    src={m.images[0]}
                    alt={m.name}
                    fill
                    sizes="(max-width:640px) 100vw, 600px"
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {m.bodyType && (
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
                      {m.bodyType}
                    </div>
                  )}
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-xl font-bold leading-tight">
                      {m.name}
                    </h3>
                    <div className="shrink-0 text-right text-sm font-medium text-zinc-500">
                      {m.priceBaht != null ? (
                        <>
                          <span className="text-[10px]">เริ่มต้น </span>
                          <span className="font-bold text-zinc-900 tabular-nums">
                            {m.priceBaht.toLocaleString()}
                          </span>{" "}
                          <span className="text-[10px]">บาท</span>
                        </>
                      ) : (
                        <span className="font-bold text-zinc-900">
                          สอบถามราคา
                        </span>
                      )}
                    </div>
                  </div>

                  {(m.rangeKm != null ||
                    m.batteryKwh != null ||
                    m.motorHp != null ||
                    m.zeroToHundredS != null) && (
                    <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-zinc-700 tabular-nums">
                      {m.rangeKm != null && (
                        <SpecChip label="ระยะ" value={`${m.rangeKm} km`} />
                      )}
                      {m.batteryKwh != null && (
                        <SpecChip
                          label="แบต"
                          value={`${m.batteryKwh} kWh`}
                        />
                      )}
                      {m.motorHp != null && (
                        <SpecChip label="แรงม้า" value={`${m.motorHp} hp`} />
                      )}
                      {m.zeroToHundredS != null && (
                        <SpecChip
                          label="0–100"
                          value={`${m.zeroToHundredS}s`}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href={`/liff/test-drive?model=${m.slug}`}
                  className="flex items-center justify-center gap-1.5 bg-brand px-3 py-3 text-sm font-bold text-white"
                >
                  <KeyRound className="size-4" strokeWidth={2.5} />
                  ทดลองขับ
                </Link>
                <Link
                  href={`/liff/financing?model=${m.slug}${m.priceBaht ? `&price=${m.priceBaht}` : ""}`}
                  className="flex items-center justify-center gap-1.5 border border-zinc-300 px-3 py-3 text-sm font-bold"
                >
                  <Calculator className="size-4" strokeWidth={2.5} />
                  สินเชื่อ
                </Link>
              </div>

              {m.brochureUrl && (
                <a
                  href={m.brochureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-1.5 py-2 text-sm font-bold text-brand"
                >
                  <FileText className="size-4" strokeWidth={2.5} />
                  ดาวน์โหลด Brochure
                </a>
              )}
            </article>
          ))}
        </section>
      ))}

      <Link
        href="/liff/dealers"
        className="mt-2 flex items-center justify-between bg-brand px-4 py-4 text-white"
      >
        <span className="text-base font-bold">ดูทุกรุ่นที่โชว์รูม</span>
        <ArrowRight className="size-5" strokeWidth={2.5} />
      </Link>
    </FeaturePage>
  );
}

function SpecChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-medium text-zinc-400">{label}</span>
      <span>{value}</span>
    </span>
  );
}
