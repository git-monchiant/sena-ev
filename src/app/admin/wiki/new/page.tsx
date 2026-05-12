"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function NewWikiPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("note");
  const [bodyMd, setBodyMd] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function syncSlug(v: string) {
    setTitle(v);
    if (!slug) {
      setSlug(
        v
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]+/g, "")
          .slice(0, 60),
      );
    }
  }

  async function create() {
    if (!slug || !title) {
      setError("slug + title required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          kind,
          bodyMd,
          tags: tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "สร้างไม่สำเร็จ");
        return;
      }
      router.push(`/admin/wiki/${encodeURIComponent(slug)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b bg-card/60 px-5 py-3">
        <Link href="/admin/wiki">
          <Button variant="ghost" size="icon" className="size-8">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="flex-1 text-sm font-bold">สร้าง wiki page ใหม่</h1>
        <Button size="sm" onClick={create} disabled={saving}>
          <Plus className="size-4" />
          {saving ? "กำลังสร้าง…" : "สร้าง"}
        </Button>
      </header>

      <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              title
            </span>
            <Input
              value={title}
              onChange={(e) => syncSlug(e.target.value)}
              placeholder="เช่น 'วิธี trade-in รถเก่า'"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              slug (URL-safe)
            </span>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="faq-trade-in"
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              kind
            </span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-2 text-sm"
            >
              <option value="product">product</option>
              <option value="policy">policy</option>
              <option value="faq">faq</option>
              <option value="process">process</option>
              <option value="brand">brand</option>
              <option value="note">note</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              tags (comma)
            </span>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="trade-in, faq"
            />
          </label>
        </div>

        <label className="grid flex-1 min-h-0 gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            เนื้อ (markdown) — ใช้ [[slug-or-title]] เพื่อลิงก์
          </span>
          <Textarea
            rows={20}
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            className="flex-1 resize-none font-mono text-sm"
            placeholder="เขียนเนื้อ markdown ที่นี่..."
          />
        </label>

        {error && (
          <div className="border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
