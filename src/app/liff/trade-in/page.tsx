import { Repeat } from "lucide-react";
import { FeaturePage } from "../_components/FeaturePage";

export default function TradeInPage() {
  return (
    <FeaturePage
      title="Trade-in รถเก่า"
      subtitle="ประเมินราคารถเก่าออนไลน์ก่อนนำมาเป็นเงินดาวน์"
      icon={<Repeat className="size-7" />}
      accent="orange"
    >
      <form className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5">
            <span className="text-lg font-medium">ยี่ห้อ</span>
            <input
              type="text"
              placeholder="Toyota"
              className=" border border-gray-300 px-3 py-2.5 text-lg"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-lg font-medium">รุ่น</span>
            <input
              type="text"
              placeholder="Camry"
              className=" border border-gray-300 px-3 py-2.5 text-lg"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5">
            <span className="text-lg font-medium">ปี</span>
            <input
              type="number"
              placeholder="2020"
              className=" border border-gray-300 px-3 py-2.5 text-lg"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-lg font-medium">เลขไมล์ (กม.)</span>
            <input
              type="number"
              placeholder="50000"
              className=" border border-gray-300 px-3 py-2.5 text-lg"
            />
          </label>
        </div>
        <label className="grid gap-1.5">
          <span className="text-lg font-medium">สภาพรถ</span>
          <select className=" border border-gray-300 px-3 py-2.5 text-lg">
            <option>สภาพดีมาก (เหมือนใหม่)</option>
            <option>สภาพดี</option>
            <option>ปกติ</option>
            <option>ต้องซ่อม</option>
          </select>
        </label>
        <button
          type="button"
          className="mt-2 bg-orange-500 px-4 py-3 text-lg font-medium text-white"
        >
          ขอประเมินราคา
        </button>
      </form>
    </FeaturePage>
  );
}
