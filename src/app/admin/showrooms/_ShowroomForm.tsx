import Link from "next/link";
import type { Showroom } from "@/lib/showrooms";
import {
  createShowroomAction,
  deleteShowroomAction,
  updateShowroomAction,
} from "./actions";

const DAY_LABEL = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const SERVICE_OPTIONS = [
  { value: "test_drive", label: "ทดลองขับ" },
  { value: "sales", label: "ขาย" },
  { value: "service", label: "ซ่อม / เซอร์วิส" },
  { value: "delivery", label: "ส่งมอบรถ" },
];

export function ShowroomForm({ showroom }: { showroom: Showroom | null }) {
  const isNew = !showroom;
  const action = isNew ? createShowroomAction : updateShowroomAction;
  const daysOpen = new Set(showroom?.daysOpen ?? [1, 2, 3, 4, 5, 6, 0]);
  const services = new Set(showroom?.services ?? ["test_drive", "sales"]);

  return (
    <form action={action} className="grid gap-6">
      {showroom && <input type="hidden" name="id" value={showroom.id} />}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Slug *" hint="URL-friendly, ห้ามซ้ำ เช่น 'bangyai'">
          <input
            name="slug"
            required
            defaultValue={showroom?.slug ?? ""}
            placeholder="bangyai"
            className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm focus:border-zinc-900 focus:outline-none"
          />
        </Field>
        <Field label="Name *">
          <input
            name="name"
            required
            defaultValue={showroom?.name ?? ""}
            placeholder="Sena Green Auto — บางใหญ่"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Short name" hint="ใช้ในป้ายสั้น เช่น 'บางใหญ่'">
          <input
            name="short_name"
            defaultValue={showroom?.shortName ?? ""}
            placeholder="บางใหญ่"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
        </Field>
        <Field label="Phone">
          <input
            name="phone"
            defaultValue={showroom?.phone ?? ""}
            placeholder="02-xxx-xxxx"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
        </Field>
      </div>

      <Field label="Address *">
        <textarea
          name="address"
          required
          rows={2}
          defaultValue={showroom?.address ?? ""}
          placeholder="123 หมู่ 4 ถ.รัตนาธิเบศร์ ต.บางรักใหญ่ อ.บางบัวทอง"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="District">
          <input
            name="district"
            defaultValue={showroom?.district ?? ""}
            placeholder="บางบัวทอง"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
        </Field>
        <Field label="Province">
          <input
            name="province"
            defaultValue={showroom?.province ?? ""}
            placeholder="นนทบุรี"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Latitude">
          <input
            name="lat"
            type="number"
            step="any"
            defaultValue={showroom?.lat ?? ""}
            placeholder="13.8567"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-zinc-900 focus:outline-none"
          />
        </Field>
        <Field label="Longitude">
          <input
            name="lng"
            type="number"
            step="any"
            defaultValue={showroom?.lng ?? ""}
            placeholder="100.4012"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-zinc-900 focus:outline-none"
          />
        </Field>
        <Field label="Sort order">
          <input
            name="sort_order"
            type="number"
            defaultValue={showroom?.sortOrder ?? 999}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-zinc-900 focus:outline-none"
          />
        </Field>
      </div>

      <Field label="Google Maps URL">
        <input
          name="gmap_url"
          type="url"
          defaultValue={showroom?.gmapUrl ?? ""}
          placeholder="https://maps.app.goo.gl/..."
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="เปิดเวลา">
          <input
            name="opens_at"
            type="time"
            defaultValue={showroom?.opensAt?.slice(0, 5) ?? "09:00"}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-zinc-900 focus:outline-none"
          />
        </Field>
        <Field label="ปิดเวลา">
          <input
            name="closes_at"
            type="time"
            defaultValue={showroom?.closesAt?.slice(0, 5) ?? "18:00"}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-zinc-900 focus:outline-none"
          />
        </Field>
      </div>

      <Field label="วันเปิด" hint="เลือกได้หลายวัน">
        <div className="flex flex-wrap gap-2">
          {DAY_LABEL.map((label, idx) => (
            <label
              key={idx}
              className="flex cursor-pointer items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 text-sm has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-white"
            >
              <input
                type="checkbox"
                name="days_open"
                value={idx}
                defaultChecked={daysOpen.has(idx)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </Field>

      <Field label="บริการที่ให้">
        <div className="flex flex-wrap gap-2">
          {SERVICE_OPTIONS.map((s) => (
            <label
              key={s.value}
              className="flex cursor-pointer items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 text-sm has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-white"
            >
              <input
                type="checkbox"
                name="services"
                value={s.value}
                defaultChecked={services.has(s.value)}
                className="sr-only"
              />
              {s.label}
            </label>
          ))}
        </div>
      </Field>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={showroom?.isActive ?? true}
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
          href="/admin/showrooms"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ยกเลิก
        </Link>
        {showroom && (
          <button
            type="submit"
            formAction={deleteShowroomAction}
            className="ml-auto rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            ลบสาขานี้
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
