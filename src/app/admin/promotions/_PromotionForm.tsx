import Link from "next/link";
import type { CarModel } from "@/lib/car-models";
import type { AdminPromotion } from "@/lib/promotions";
import {
  createPromotionAction,
  deletePromotionAction,
  updatePromotionAction,
} from "./actions";

const TYPE_OPTIONS = [
  { value: "financing", label: "ดอกเบี้ย / ผ่อน" },
  { value: "free-insurance", label: "ฟรีประกัน" },
  { value: "free-gift", label: "ของแถม" },
  { value: "discount", label: "ส่วนลด" },
  { value: "trade-in-boost", label: "Trade-in โบนัส" },
  { value: "other", label: "อื่นๆ" },
];

const PAYLOAD_HINTS: Record<string, string> = {
  financing: '{"rate": 1.99, "months": 48, "down_percent": 20}',
  "free-insurance": '{"max_value_baht": 25000, "tier": 1}',
  "free-gift": '{"item": "Home Charger", "value_baht": 35000}',
  discount: '{"amount_baht": 50000}',
  "trade-in-boost": '{"bonus_baht": 30000}',
};

export function PromotionForm({
  promo,
  cars,
}: {
  promo: AdminPromotion | null;
  cars: CarModel[];
}) {
  const isNew = !promo;
  const action = isNew ? createPromotionAction : updatePromotionAction;
  const selected = new Set(promo?.applicableModelIds ?? []);
  const payloadPretty = JSON.stringify(promo?.payload ?? {}, null, 2);

  return (
    <form action={action} className="grid gap-6">
      {promo && <input type="hidden" name="id" value={promo.id} />}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Slug *" hint="URL-friendly, ห้ามซ้ำ">
          <input
            name="slug"
            required
            defaultValue={promo?.slug ?? ""}
            placeholder="rate-199-48m"
            className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm focus:border-zinc-900 focus:outline-none"
          />
        </Field>
        <Field label="Type *">
          <select
            name="type"
            required
            defaultValue={promo?.type ?? "financing"}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Title *">
        <input
          name="title"
          required
          defaultValue={promo?.title ?? ""}
          placeholder="ดอกเบี้ย 1.99% นาน 48 เดือน"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
        />
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          rows={2}
          defaultValue={promo?.description ?? ""}
          placeholder="อัตราดอกเบี้ยพิเศษสำหรับรถ EV ทุกรุ่น"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
        />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Badge" hint="ตัวอักษรสั้นๆ บน Flex card เช่น 'HOT'">
          <input
            name="badge"
            defaultValue={promo?.badge ?? ""}
            placeholder="HOT"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
        </Field>
        <Field label="Bank">
          <input
            name="bank_name"
            defaultValue={promo?.bankName ?? ""}
            placeholder="KKP / SCB / KTC"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
        </Field>
        <Field label="Sort order">
          <input
            name="sort_order"
            type="number"
            defaultValue={promo?.sortOrder ?? 999}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-zinc-900 focus:outline-none"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Valid from" hint="ว่างไว้ = ใช้ได้ตั้งแต่วันนี้">
          <input
            name="valid_from"
            type="date"
            defaultValue={promo?.validFrom?.slice(0, 10) ?? ""}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-zinc-900 focus:outline-none"
          />
        </Field>
        <Field label="Valid to" hint="ว่างไว้ = ไม่มีวันหมดอายุ">
          <input
            name="valid_to"
            type="date"
            defaultValue={promo?.validTo?.slice(0, 10) ?? ""}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-zinc-900 focus:outline-none"
          />
        </Field>
      </div>

      <Field
        label="Applicable models"
        hint="เลือกรุ่นที่ใช้โปรนี้ได้ — ไม่เลือก = ใช้ได้ทุกรุ่น"
      >
        <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
          {cars.map((c) => {
            const branded = c.name.toUpperCase().startsWith(c.brand.toUpperCase())
              ? c.name
              : `${c.brand} ${c.name}`;
            return (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 px-2.5 py-1.5 text-xs has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50"
              >
                <input
                  type="checkbox"
                  name="applicable_model_ids"
                  value={c.id}
                  defaultChecked={selected.has(c.id)}
                  className="size-3.5"
                />
                <span className="truncate">{branded}</span>
              </label>
            );
          })}
        </div>
      </Field>

      <Field
        label="Payload (JSON)"
        hint={`ข้อมูลเฉพาะตาม type — เช่น financing: ${PAYLOAD_HINTS.financing}`}
      >
        <textarea
          name="payload"
          rows={6}
          defaultValue={payloadPretty === "{}" ? "" : payloadPretty}
          placeholder='{"rate": 1.99, "months": 48}'
          className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs focus:border-zinc-900 focus:outline-none"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={promo?.isActive ?? true}
          className="size-4"
        />
        Active (แสดงใน LIFF + bot)
      </label>

      <div className="flex items-center gap-3 border-t border-gray-200 pt-5">
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {isNew ? "สร้าง" : "บันทึก"}
        </button>
        <Link
          href="/admin/promotions"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ยกเลิก
        </Link>
        {promo && (
          <button
            type="submit"
            formAction={deletePromotionAction}
            className="ml-auto rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            ลบโปรนี้
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
