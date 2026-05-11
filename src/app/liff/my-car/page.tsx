import { Car } from "lucide-react";
import { FeaturePage } from "../_components/FeaturePage";

export default function MyCarPage() {
  return (
    <FeaturePage
      title="รถของฉัน"
      subtitle="ข้อมูลรถ ทะเบียน ประกัน วันรับประกัน"
      icon={<Car className="size-7" />}
      accent="blue"
    >
      <div className=" border border-gray-200 bg-gradient-to-br from-blue-500 to-blue-700 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base opacity-80">รถของคุณ</div>
            <div className="mt-1 text-xl font-bold">BYD Atto 3</div>
            <div className="text-base opacity-80">สีน้ำเงิน · 2026</div>
          </div>
          <Car className="size-12 opacity-90" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-lg">
          <div>
            <div className="text-[10px] opacity-70">ทะเบียน</div>
            <div className="font-medium">กก 1234 กทม</div>
          </div>
          <div>
            <div className="text-[10px] opacity-70">VIN</div>
            <div className="font-mono text-[10px]">LGXC79CD...</div>
          </div>
          <div>
            <div className="text-[10px] opacity-70">วันส่งมอบ</div>
            <div className="font-medium">15 ม.ค. 2569</div>
          </div>
          <div>
            <div className="text-[10px] opacity-70">ระยะประกัน</div>
            <div className="font-medium">2030</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className=" border border-gray-200 p-4">
          <div className="mb-1 text-lg font-semibold">เซอร์วิสครั้งต่อไป</div>
          <div className="text-base text-gray-500">
            15 มิ.ย. 2569 · 10:00 น.
          </div>
          <div className="text-base text-gray-500">Sena Service — Bangna</div>
        </div>
        <div className=" border border-gray-200 p-4">
          <div className="mb-1 text-lg font-semibold">ประกันรถยนต์</div>
          <div className="text-base text-gray-500">ชั้น 1 · เหลือ 245 วัน</div>
        </div>
      </div>
    </FeaturePage>
  );
}
