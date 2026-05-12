import Image from "next/image";
import Link from "next/link";
import type { AdminCarModel } from "@/lib/car-models";
import {
  createCarModelAction,
  deleteCarModelAction,
  updateCarModelAction,
} from "./actions";

export function CarForm({ model }: { model: AdminCarModel | null }) {
  const isNew = !model;
  const action = isNew ? createCarModelAction : updateCarModelAction;

  return (
    <form action={action} className="grid gap-6">
      {model && <input type="hidden" name="id" value={model.id} />}

      <div className="grid grid-cols-3 gap-4">
        <Field label="Slug *" hint="URL-friendly, ห้ามซ้ำ">
          <input
            name="slug"
            required
            defaultValue={model?.slug ?? ""}
            placeholder="byd-atto-3"
            className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm focus:border-zinc-900 focus:outline-none"
          />
        </Field>
        <Field label="Brand *">
          <input
            name="brand"
            required
            defaultValue={model?.brand ?? ""}
            placeholder="OMODA"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
        </Field>
        <Field label="Name *">
          <input
            name="name"
            required
            defaultValue={model?.name ?? ""}
            placeholder="OMODA C5"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
        </Field>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Field label="Body type">
          <input
            name="body_type"
            defaultValue={model?.bodyType ?? ""}
            placeholder="SUV"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
        </Field>
        <Field label="Price (บาท)">
          <input
            name="price_baht"
            type="number"
            step="1000"
            defaultValue={model?.priceBaht ?? ""}
            placeholder="1199000"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-zinc-900 focus:outline-none"
          />
        </Field>
        <Field label="Range (km)">
          <input
            name="range_km"
            type="number"
            defaultValue={model?.rangeKm ?? ""}
            placeholder="480"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-zinc-900 focus:outline-none"
          />
        </Field>
        <Field label="Sort order">
          <input
            name="sort_order"
            type="number"
            defaultValue={model?.sortOrder ?? 999}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-zinc-900 focus:outline-none"
          />
        </Field>
      </div>

      <Field label="Brochure URL">
        <input
          name="brochure_url"
          type="url"
          defaultValue={model?.brochureUrl ?? ""}
          placeholder="https://senagreenauto.co.th/..."
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
        />
      </Field>

      <Field label="Colors (comma-separated)">
        <input
          name="colors"
          defaultValue={model?.colors.join(", ") ?? ""}
          placeholder="Stellar Blue, Lunar Gray, Comet White"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
        />
      </Field>

      <Field
        label="Images (one URL per line)"
        hint="รูปแรกเป็น hero ที่ใช้ใน catalog"
      >
        <textarea
          name="images"
          rows={4}
          defaultValue={model?.images.join("\n") ?? ""}
          placeholder="https://senagreenauto.co.th/wp-content/uploads/.../image1.webp"
          className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs focus:border-zinc-900 focus:outline-none"
        />
        {model && model.images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {model.images.map((url) => (
              <div
                key={url}
                className="relative h-16 w-24 overflow-hidden rounded bg-gray-100"
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}
      </Field>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={model?.isActive ?? true}
          className="size-4"
        />
        Active (แสดงใน LIFF)
      </label>

      <div className="flex items-center gap-3 border-t border-gray-200 pt-5">
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {isNew ? "สร้าง" : "บันทึก"}
        </button>
        <Link
          href="/admin/cars"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ยกเลิก
        </Link>

        {model && (
          <button
            type="submit"
            formAction={deleteCarModelAction}
            className="ml-auto rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            ลบรุ่นนี้
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
