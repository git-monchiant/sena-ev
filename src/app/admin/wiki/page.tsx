"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FileText, Network, Plus, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraphView } from "./_GraphView";

type Page = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  tags: string[] | null;
  updated_at: string;
};

const KIND_LABEL: Record<string, string> = {
  product: "ผลิตภัณฑ์",
  policy: "นโยบาย",
  faq: "FAQ",
  process: "กระบวนการ",
  brand: "แบรนด์",
  note: "บันทึก",
};

type Tab = "list" | "graph";

export default function WikiListPage() {
  const [tab, setTab] = useState<Tab>("list");
  const [pages, setPages] = useState<Page[]>([]);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (kind) params.set("kind", kind);
    fetch(`/api/admin/wiki?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { pages: Page[] }) => setPages(d.pages))
      .finally(() => setLoading(false));
  }, [q, kind]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch("/api/admin/bot/seed", { method: "POST" });
      const data = (await res.json()) as {
        cars?: number;
        showrooms?: number;
        promos?: number;
        ok?: boolean;
      };
      if (!res.ok || !data.ok) {
        setSyncStatus("ซิงค์ไม่สำเร็จ");
      } else {
        setSyncStatus(
          `อัพเดท: รถ ${data.cars ?? 0} · ศูนย์ ${data.showrooms ?? 0} · โปร ${data.promos ?? 0}`,
        );
        load();
      }
    } catch {
      setSyncStatus("ซิงค์ไม่สำเร็จ");
    } finally {
      setSyncing(false);
    }
  }, [load]);

  const grouped = pages.reduce<Record<string, Page[]>>((acc, p) => {
    (acc[p.kind] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b bg-card/60 px-5 py-3">
        <div className="flex items-center gap-1 rounded-md bg-muted/60 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTab("list")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-bold transition-colors ${
              tab === "list"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="size-3.5" />
            รายการ
          </button>
          <button
            type="button"
            onClick={() => setTab("graph")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-bold transition-colors ${
              tab === "graph"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Network className="size-3.5" />
            Graph
          </button>
        </div>

        {tab === "list" && (
          <>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหา title / slug / เนื้อ…"
                className="pl-8"
              />
            </div>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="h-8 rounded-md border border-input bg-card px-2 text-sm"
            >
              <option value="">ทุกประเภท</option>
              {Object.entries(KIND_LABEL).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
            title="ซิงค์ wiki จากข้อมูลใน DB (รถ/ศูนย์/โปร)"
          >
            <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "กำลังซิงค์…" : "ซิงค์จาก DB"}
          </Button>
          <Link href="/admin/wiki/new">
            <Button size="sm">
              <Plus className="size-4" />
              สร้างหน้าใหม่
            </Button>
          </Link>
        </div>
      </header>
      {syncStatus && (
        <div className="border-b bg-emerald-50 px-5 py-2 text-xs font-medium text-emerald-700">
          {syncStatus}
        </div>
      )}

      {tab === "list" ? (
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="text-sm text-muted-foreground">กำลังโหลด…</div>
          )}
          {!loading && pages.length === 0 && (
            <div className="text-sm text-muted-foreground">ไม่พบเอกสาร</div>
          )}
          {Object.entries(grouped).map(([k, list]) => (
            <section key={k} className="mb-8">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {KIND_LABEL[k] ?? k} · {list.length}
              </div>
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/admin/wiki/${encodeURIComponent(p.slug)}`}
                      className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card p-4 transition-colors hover:bg-accent/40"
                    >
                      <div className="flex items-start gap-2">
                        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="text-sm font-bold">{p.title}</div>
                          <code className="text-[10px] text-muted-foreground">
                            {p.slug}
                          </code>
                        </div>
                      </div>
                      {p.tags && p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pl-6">
                          {p.tags.slice(0, 4).map((t) => (
                            <Badge
                              key={t}
                              variant="secondary"
                              className="text-[9px]"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <GraphView />
      )}
    </div>
  );
}
