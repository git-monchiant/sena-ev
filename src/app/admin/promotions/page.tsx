import Link from "next/link";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { listAllPromotions } from "@/lib/promotions";
import { togglePromotionActiveAction } from "./actions";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  financing: "ดอกเบี้ย/ผ่อน",
  "free-insurance": "ฟรีประกัน",
  "free-gift": "ของแถม",
  discount: "ส่วนลด",
  "trade-in-boost": "Trade-in",
};

function isExpired(validTo: string | null): boolean {
  if (!validTo) return false;
  return new Date(validTo) < new Date();
}

export default async function AdminPromotionsPage() {
  const promos = await listAllPromotions();
  const active = promos.filter((p) => p.isActive && !isExpired(p.validTo)).length;

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              โปรโมชั่น (Promotions)
            </h2>
            <p className="text-sm text-muted-foreground">
              {promos.length} โปรทั้งหมด · {active} active — โชว์ใน LIFF +
              Flex card + bot
            </p>
          </div>
          <Link
            href="/admin/promotions/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="size-4" />
            เพิ่มโปรใหม่
          </Link>
        </div>

        <Card>
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">ชื่อ</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Bank</th>
                <th className="px-4 py-3 font-medium">รุ่นที่ใช้</th>
                <th className="px-4 py-3 font-medium">หมดอายุ</th>
                <th className="px-4 py-3 font-medium">Sort</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promos.map((p) => {
                const expired = isExpired(p.validTo);
                return (
                  <tr
                    key={p.id}
                    className={p.isActive && !expired ? "" : "opacity-50"}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">{p.title}</div>
                        {p.badge && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {p.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {TYPE_LABEL[p.type] ?? p.type}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.bankName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.applicableModelIds.length === 0
                        ? "ทุกรุ่น"
                        : `${p.applicableModelIds.length} รุ่น`}
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums">
                      {p.validTo ? (
                        <span
                          className={
                            expired ? "text-red-600" : "text-muted-foreground"
                          }
                        >
                          {p.validTo.slice(0, 10)}
                          {expired && " (หมดแล้ว)"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{p.sortOrder}</td>
                    <td className="px-4 py-3">
                      <form action={togglePromotionActiveAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input
                          type="hidden"
                          name="next"
                          value={String(!p.isActive)}
                        />
                        <button
                          type="submit"
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            p.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {p.isActive ? "active" : "hidden"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/promotions/${p.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        แก้ไข
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
