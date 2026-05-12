import { ArrowRight } from "lucide-react";
import { FeaturePage, FieldLabel } from "../_components/FeaturePage";

export default function TradeInPage() {
  return (
    <FeaturePage
      eyebrow="Trade-In"
      title="ประเมินรถเก่า"
      subtitle="ประเมินราคารถเก่าออนไลน์ ใช้เป็นเงินดาวน์ EV คันใหม่ได้ทันที"
    >
      <form className="grid gap-7">
        <div className="grid grid-cols-2 gap-5">
          <label className="grid gap-2">
            <FieldLabel>ยี่ห้อ</FieldLabel>
            <input
              type="text"
              placeholder="Toyota"
              className="border-0 border-b border-zinc-300 bg-transparent px-0 py-2.5 text-base font-medium placeholder:font-medium placeholder:text-zinc-400 focus:border-brand focus:outline-none"
            />
          </label>
          <label className="grid gap-2">
            <FieldLabel>รุ่น</FieldLabel>
            <input
              type="text"
              placeholder="Camry"
              className="border-0 border-b border-zinc-300 bg-transparent px-0 py-2.5 text-base font-medium placeholder:font-medium placeholder:text-zinc-400 focus:border-brand focus:outline-none"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <label className="grid gap-2">
            <FieldLabel>ปี</FieldLabel>
            <input
              type="number"
              placeholder="2020"
              className="border-0 border-b border-zinc-300 bg-transparent px-0 py-2.5 text-base font-medium placeholder:font-medium placeholder:text-zinc-400 focus:border-brand focus:outline-none"
            />
          </label>
          <label className="grid gap-2">
            <FieldLabel>เลขไมล์ (กม.)</FieldLabel>
            <input
              type="number"
              placeholder="50,000"
              className="border-0 border-b border-zinc-300 bg-transparent px-0 py-2.5 text-base font-medium placeholder:font-medium placeholder:text-zinc-400 focus:border-brand focus:outline-none"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <FieldLabel>สภาพรถ</FieldLabel>
          <select className="border-0 border-b border-zinc-300 bg-transparent px-0 py-2.5 text-base font-medium focus:border-brand focus:outline-none">
            <option>สภาพดีมาก (เหมือนใหม่)</option>
            <option>สภาพดี</option>
            <option>ปกติ</option>
            <option>ต้องซ่อม</option>
          </select>
        </label>

        <div className="border-l-2 border-brand bg-brand-soft p-4">
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-brand">
            Tip
          </div>
          <div className="mt-1.5 text-sm font-medium text-zinc-700">
            รถสภาพดี ปีหลัง 2018 มักได้ราคาประเมินใกล้เคียงตลาดมือสอง — ใช้เป็น
            เงินดาวน์ EV ลดค่างวดต่อเดือนได้
          </div>
        </div>

        <button
          type="button"
          className="mt-2 flex items-center justify-between bg-brand px-4 py-4 text-white"
        >
          <span className="text-base font-bold">ขอประเมินราคา</span>
          <ArrowRight className="size-5" strokeWidth={2.5} />
        </button>
      </form>
    </FeaturePage>
  );
}
