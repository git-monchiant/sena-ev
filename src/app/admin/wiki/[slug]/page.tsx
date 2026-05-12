"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Page = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  bodyMd: string;
  tags: string[];
  aliases: string[];
  refTable: string | null;
  refId: string | null;
  isPublished: boolean;
};

type Backlink = { slug: string; title: string };
type Outgoing = { to_slug: string; to_title: string; relation: string };

export default function WikiPageView({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [outgoing, setOutgoing] = useState<Outgoing[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/admin/wiki/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          return;
        }
        setPage(d.page);
        setBacklinks(d.backlinks ?? []);
        setOutgoing(d.outgoing ?? []);
      });
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!page) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/wiki/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: page.title,
          kind: page.kind,
          bodyMd: page.bodyMd,
          tags: page.tags,
          aliases: page.aliases,
          isPublished: page.isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`ลบหน้า "${page?.title}" ?`)) return;
    await fetch(`/api/admin/wiki/${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
    router.push("/admin/wiki");
  }

  if (error) {
    return (
      <div className="p-5 text-sm font-medium text-red-600">{error}</div>
    );
  }
  if (!page) {
    return <div className="p-5 text-sm text-muted-foreground">กำลังโหลด…</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b bg-card/60 px-5 py-3">
        <Link href="/admin/wiki">
          <Button variant="ghost" size="icon" className="size-8">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <Input
            value={page.title}
            onChange={(e) => setPage({ ...page, title: e.target.value })}
            className="h-9 text-base font-bold"
          />
          <code className="text-[10px] text-muted-foreground">{page.slug}</code>
        </div>
        <select
          value={page.kind}
          onChange={(e) => setPage({ ...page, kind: e.target.value })}
          className="h-8 rounded-md border border-input bg-card px-2 text-sm"
        >
          <option value="product">product</option>
          <option value="policy">policy</option>
          <option value="faq">faq</option>
          <option value="process">process</option>
          <option value="brand">brand</option>
          <option value="note">note</option>
        </select>
        <Button size="sm" onClick={save} disabled={saving}>
          <Save className="size-4" />
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={remove}
        >
          <Trash2 className="size-4 text-red-600" />
        </Button>
      </header>

      <div className="grid flex-1 min-h-0 grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-h-0 flex-col p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            เนื้อหา (markdown) — รองรับ [[wikilink]]
          </div>
          <Textarea
            value={page.bodyMd}
            onChange={(e) => setPage({ ...page, bodyMd: e.target.value })}
            className="flex-1 resize-none font-mono text-sm"
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                tags (comma)
              </span>
              <Input
                value={page.tags.join(", ")}
                onChange={(e) =>
                  setPage({
                    ...page,
                    tags: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="h-8 text-xs"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                aliases (comma)
              </span>
              <Input
                value={page.aliases.join(", ")}
                onChange={(e) =>
                  setPage({
                    ...page,
                    aliases: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="h-8 text-xs"
              />
            </label>
          </div>
        </div>

        <aside className="border-l bg-card/40 p-4">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Backlinks ({backlinks.length})
          </div>
          {backlinks.length === 0 && (
            <div className="text-xs text-muted-foreground">
              ยังไม่มีหน้าใดลิงก์มา
            </div>
          )}
          <ul className="mb-6 space-y-1">
            {backlinks.map((b) => (
              <li key={b.slug}>
                <Link
                  href={`/admin/wiki/${encodeURIComponent(b.slug)}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {b.title}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Outgoing ({outgoing.length})
          </div>
          {outgoing.length === 0 && (
            <div className="text-xs text-muted-foreground">
              หน้านี้ยังไม่ได้ลิงก์ออกไปไหน — เพิ่ม [[slug-or-title]] ในเนื้อหา
            </div>
          )}
          <ul className="space-y-1">
            {outgoing.map((o, i) => (
              <li key={i} className="flex items-center gap-2">
                <Link
                  href={`/admin/wiki/${encodeURIComponent(o.to_slug)}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {o.to_title}
                </Link>
                <Badge variant="secondary" className="text-[9px]">
                  {o.relation}
                </Badge>
              </li>
            ))}
          </ul>

          {page.refTable && (
            <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-[11px] font-medium text-amber-800">
              <div className="font-bold uppercase tracking-wider">
                Linked to data
              </div>
              <div className="mt-1">
                {page.refTable} · {page.refId?.slice(0, 8)}…
              </div>
              <div className="mt-1 opacity-70">
                หน้านี้ถูกสร้างจาก seed อัตโนมัติ — แก้ผ่าน UI ได้ แต่จะถูก
                overwrite ตอนเรียก /api/admin/bot/seed อีก
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
