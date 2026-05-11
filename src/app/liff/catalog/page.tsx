import Link from "next/link";
import { Calculator, Car, KeyRound } from "lucide-react";
import { FeaturePage } from "../_components/FeaturePage";

const MODELS = [
  {
    slug: "byd-atto-3",
    name: "BYD Atto 3",
    price: "1,199,000",
    range: "480 km",
  },
  {
    slug: "byd-dolphin",
    name: "BYD Dolphin",
    price: "879,000",
    range: "405 km",
  },
  {
    slug: "mg-ep",
    name: "MG EP",
    price: "988,000",
    range: "380 km",
  },
  {
    slug: "tesla-model-y",
    name: "Tesla Model Y",
    price: "2,099,000",
    range: "533 km",
  },
];

export default function CatalogPage() {
  return (
    <FeaturePage
      title="รุ่นรถ EV"
      subtitle="เลือกรุ่นที่สนใจเพื่อดูรายละเอียดหรือจองทดลองขับ"
      icon={<Car className="size-7" />}
      accent="blue"
    >
      <div className="grid gap-3">
        {MODELS.map((m) => (
          <div key={m.slug} className=" border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center bg-blue-50 text-blue-600">
                <Car className="size-6" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{m.name}</div>
                <div className="text-base text-gray-500">
                  เริ่มต้น {m.price} บาท · ระยะทาง {m.range}
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href={`/liff/test-drive?model=${m.slug}`}
                className="flex items-center justify-center gap-1.5 bg-blue-600 px-3 py-2 text-center text-base font-medium text-white"
              >
                <KeyRound className="size-4" />
                จองทดลองขับ
              </Link>
              <Link
                href={`/liff/financing?model=${m.slug}&price=${m.price.replace(/,/g, "")}`}
                className="flex items-center justify-center gap-1.5 border border-yellow-500 bg-yellow-50 px-3 py-2 text-center text-base font-medium text-yellow-800"
              >
                <Calculator className="size-4" />
                คำนวณสินเชื่อ
              </Link>
            </div>
          </div>
        ))}
      </div>
    </FeaturePage>
  );
}
