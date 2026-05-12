import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { listAllCarModels } from "@/lib/car-models";
import { toggleActiveAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCarsPage() {
  const models = await listAllCarModels();
  const active = models.filter((m) => m.isActive).length;

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">รุ่นรถ (Cars)</h2>
            <p className="text-sm text-muted-foreground">
              {models.length} รุ่นทั้งหมด · {active} active — ข้อมูลจะแสดงใน LIFF
              catalog/test-drive/financing
            </p>
          </div>
          <Link
            href="/admin/cars/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="size-4" />
            เพิ่มรุ่นใหม่
          </Link>
        </div>

        <Card>
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">รูป</th>
                <th className="px-4 py-3 font-medium">แบรนด์ / รุ่น</th>
                <th className="px-4 py-3 font-medium">Body</th>
                <th className="px-4 py-3 text-right font-medium">ราคา</th>
                <th className="px-4 py-3 text-right font-medium">Range</th>
                <th className="px-4 py-3 font-medium">Sort</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {models.map((m) => (
                <tr key={m.id} className={m.isActive ? "" : "opacity-50"}>
                  <td className="px-4 py-3">
                    {m.images[0] ? (
                      <div className="relative h-12 w-20 overflow-hidden rounded bg-gray-100">
                        <Image
                          src={m.images[0]}
                          alt={m.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-20 rounded bg-gray-100" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {m.brand}
                    </div>
                    <div className="font-semibold">{m.name}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {m.slug}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.bodyType ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {m.priceBaht ? m.priceBaht.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {m.rangeKm ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{m.sortOrder}</td>
                  <td className="px-4 py-3">
                    <form action={toggleActiveAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <input
                        type="hidden"
                        name="next"
                        value={String(!m.isActive)}
                      />
                      <button
                        type="submit"
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          m.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {m.isActive ? "active" : "hidden"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/cars/${m.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      แก้ไข
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
