import Link from "next/link";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { listAllShowrooms } from "@/lib/showrooms";
import { toggleShowroomActiveAction } from "./actions";

export const dynamic = "force-dynamic";

const SERVICE_LABEL: Record<string, string> = {
  test_drive: "ทดลองขับ",
  sales: "ขาย",
  service: "เซอร์วิส",
  delivery: "ส่งมอบ",
};

export default async function AdminShowroomsPage() {
  const showrooms = await listAllShowrooms();
  const active = showrooms.filter((s) => s.isActive).length;

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              โชว์รูม (Showrooms)
            </h2>
            <p className="text-sm text-muted-foreground">
              {showrooms.length} สาขาทั้งหมด · {active} active — โชว์ใน LIFF
              dealers + bot + Flex card
            </p>
          </div>
          <Link
            href="/admin/showrooms/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="size-4" />
            เพิ่มสาขาใหม่
          </Link>
        </div>

        <Card>
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">สาขา</th>
                <th className="px-4 py-3 font-medium">ที่อยู่</th>
                <th className="px-4 py-3 font-medium">เวลา</th>
                <th className="px-4 py-3 font-medium">บริการ</th>
                <th className="px-4 py-3 font-medium">Sort</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {showrooms.map((s) => (
                <tr key={s.id} className={s.isActive ? "" : "opacity-50"}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{s.name}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {s.slug}
                    </div>
                    {s.phone && (
                      <div className="text-xs text-muted-foreground">
                        {s.phone}
                      </div>
                    )}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-xs text-muted-foreground">
                    <div className="line-clamp-2">{s.address}</div>
                    {s.district && s.province && (
                      <div className="mt-0.5 text-[11px]">
                        {s.district}, {s.province}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums">
                    {s.opensAt && s.closesAt ? (
                      <>
                        {s.opensAt.slice(0, 5)}–{s.closesAt.slice(0, 5)}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {s.services.map((sv) => (
                        <span
                          key={sv}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px]"
                        >
                          {SERVICE_LABEL[sv] ?? sv}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{s.sortOrder}</td>
                  <td className="px-4 py-3">
                    <form action={toggleShowroomActiveAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input
                        type="hidden"
                        name="next"
                        value={String(!s.isActive)}
                      />
                      <button
                        type="submit"
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          s.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {s.isActive ? "active" : "hidden"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/showrooms/${s.id}`}
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
