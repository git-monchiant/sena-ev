"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

type Node = {
  id: string;
  kind: string;
  group: string;
  label: string;
  slug: string | null;
  isPublished?: boolean;
};

type Edge = { source: string; target: string; relation: string };
type Graph = { nodes: Node[]; edges: Edge[] };

type WikiDetail = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  bodyMd: string;
  tags: string[] | null;
  aliases: string[] | null;
  refTable: string | null;
  refId: string | null;
  isPublished: boolean;
  updatedAt: string;
};

const GROUP_COLOR: Record<string, string> = {
  category: "#a855f7", // purple — root hubs (รถ EV / โชว์รูม / โปร / brand)
  wiki: "#10b981",     // emerald — wiki pages
  car: "#3b82f6",      // blue — individual models
  showroom: "#f59e0b", // amber — branches
  promo: "#ec4899",    // pink
  subtopic: "#71717a", // zinc — small satellites
};

const GROUP_SIZE: Record<string, number> = {
  category: 9,
  wiki: 5,
  car: 5,
  showroom: 5,
  promo: 5,
  subtopic: 2.5,
};

const KIND_LABEL: Record<string, string> = {
  product: "ผลิตภัณฑ์",
  policy: "นโยบาย",
  faq: "FAQ",
  process: "กระบวนการ",
  brand: "แบรนด์",
  note: "บันทึก",
  car_model: "รถ",
  showroom: "ศูนย์",
  promotion: "โปร",
  category: "หมวด",
  section: "หัวข้อย่อย",
};

export function GraphView() {
  const router = useRouter();
  const [data, setData] = useState<Graph | null>(null);
  const [hover, setHover] = useState<Node | null>(null);
  const [selected, setSelected] = useState<Node | null>(null);
  const [detail, setDetail] = useState<WikiDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/admin/wiki/graph", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: Graph) => setData(d));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Lazy-load wiki detail when a wiki node is selected
  useEffect(() => {
    if (!selected || selected.group !== "wiki" || !selected.slug) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    fetch(`/api/admin/wiki/${encodeURIComponent(selected.slug)}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { page?: WikiDetail } | null) => setDetail(d?.page ?? null))
      .finally(() => setDetailLoading(false));
  }, [selected]);

  const stats = useMemo(() => {
    if (!data) return null;
    return { nodes: data.nodes.length, edges: data.edges.length };
  }, [data]);

  // Stable references — without these, every parent re-render (e.g. on
  // hover/select state change) creates a new `graphData` object literal,
  // which force-graph treats as fresh data and restarts the simulation
  // → visible jitter on every mouse move.
  const graphData = useMemo(
    () =>
      data
        ? { nodes: data.nodes, links: data.edges }
        : { nodes: [], links: [] },
    [data],
  );

  const handleNodeHover = useCallback((n: unknown) => {
    setHover((n as Node | null) ?? null);
  }, []);

  const handleNodeClick = useCallback((n: unknown) => {
    setSelected(n as Node);
  }, []);

  const nodeLabel = useCallback((o: object) => {
    const n = o as Node;
    return `${n.label}\n[${KIND_LABEL[n.kind] ?? n.kind}]`;
  }, []);

  const nodeColor = useCallback(
    (o: object) => GROUP_COLOR[(o as Node).group] ?? "#a1a1aa",
    [],
  );

  const nodeVal = useCallback(
    (o: object) => GROUP_SIZE[(o as Node).group] ?? 4,
    [],
  );

  const linkColor = useCallback(() => "rgba(255,255,255,0.18)", []);

  const nodeCanvasObject = useCallback(
    (
      node: unknown,
      ctx: CanvasRenderingContext2D,
      scale: number,
    ) => {
      const n = node as Node & { x: number; y: number };
      if (n.group === "subtopic" && scale < 1.5) return;

      const radius = Math.sqrt(GROUP_SIZE[n.group] ?? 4) * 3;
      const baseSize = n.group === "category" ? 13 : 11;
      const fontSize = Math.max(baseSize / scale, 4);
      const weight = n.group === "category" ? "700" : "500";

      ctx.font = `${weight} ${fontSize}px Prompt, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const maxChars = n.group === "subtopic" ? 24 : 40;
      const label =
        n.label.length > maxChars
          ? `${n.label.slice(0, maxChars - 1)}…`
          : n.label;

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillText(label, n.x + 0.4, n.y + radius + 3 + 0.4);
      ctx.fillStyle =
        n.group === "category"
          ? "rgba(255,255,255,1)"
          : n.group === "subtopic"
            ? "rgba(255,255,255,0.55)"
            : "rgba(255,255,255,0.85)";
      ctx.fillText(label, n.x, n.y + radius + 3);
    },
    [],
  );

  const nodeCanvasObjectMode = useCallback(() => "after" as const, []);

  const editHref =
    selected?.group === "wiki" && selected.slug
      ? `/admin/wiki/${encodeURIComponent(selected.slug)}`
      : selected?.group === "car"
        ? "/admin/cars"
        : null;

  // Connected nodes for the "เชื่อมกับ" section
  const connections = useMemo(() => {
    if (!data || !selected) return [];
    const byId = new Map(data.nodes.map((n) => [n.id, n]));
    const out: { node: Node; relation: string; direction: "out" | "in" }[] =
      [];
    for (const e of data.edges) {
      const sourceId =
        typeof e.source === "string"
          ? e.source
          : (e.source as { id: string }).id;
      const targetId =
        typeof e.target === "string"
          ? e.target
          : (e.target as { id: string }).id;
      if (sourceId === selected.id) {
        const other = byId.get(targetId);
        if (other) out.push({ node: other, relation: e.relation, direction: "out" });
      } else if (targetId === selected.id) {
        const other = byId.get(sourceId);
        if (other) out.push({ node: other, relation: e.relation, direction: "in" });
      }
    }
    return out;
  }, [data, selected]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b bg-card/40 px-5 py-2 text-xs">
        {stats && (
          <div className="text-muted-foreground">
            {stats.nodes} nodes · {stats.edges} edges
          </div>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1">
          {(
            [
              ["category", "หมวด"],
              ["wiki", "wiki"],
              ["car", "รถ"],
              ["showroom", "ศูนย์"],
              ["promo", "โปร"],
              ["subtopic", "หัวข้อย่อย"],
            ] as const
          ).map(([g, label]) => (
            <div key={g} className="flex items-center gap-1.5">
              <span
                className="inline-block size-3 rounded-full"
                style={{ background: GROUP_COLOR[g] }}
              />
              <span className="font-medium text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex flex-1 min-h-0">
        <div
          ref={containerRef}
          className="relative flex-1 overflow-hidden bg-zinc-950"
        >
          {!data && (
            <div className="absolute inset-0 grid place-items-center text-sm text-zinc-500">
              กำลังโหลด…
            </div>
          )}
          {data && (
            <ForceGraph2D
              graphData={graphData}
              width={size.w}
              height={size.h}
              backgroundColor="#09090b"
              nodeLabel={nodeLabel}
              nodeColor={nodeColor}
              nodeVal={nodeVal}
              nodeRelSize={3}
              linkColor={linkColor}
              linkWidth={1}
              linkDirectionalParticles={2}
              linkDirectionalParticleWidth={1.5}
              linkDirectionalParticleSpeed={0.004}
              onNodeHover={handleNodeHover}
              onNodeClick={handleNodeClick}
              warmupTicks={50}
              cooldownTicks={1500}
              d3VelocityDecay={0.25}
              nodeCanvasObjectMode={nodeCanvasObjectMode}
              nodeCanvasObject={nodeCanvasObject}
            />
          )}

          {hover && !selected && (
            <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-lg border border-zinc-800 bg-zinc-900/95 px-3 py-2 text-xs text-zinc-100 shadow-xl backdrop-blur">
              <div className="font-bold">{hover.label}</div>
              <div className="mt-0.5 text-[10px] text-zinc-400">
                {KIND_LABEL[hover.kind] ?? hover.kind}
                {hover.slug ? ` · ${hover.slug}` : ""}
                {hover.isPublished === false ? " · unpublished" : ""}
              </div>
            </div>
          )}
        </div>

        {selected && (
          <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card">
            <div className="flex items-start gap-2 border-b px-4 py-3">
              <span
                className="mt-1 inline-block size-3 shrink-0 rounded-full"
                style={{ background: GROUP_COLOR[selected.group] ?? "#888" }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">
                  {selected.label}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Badge variant="secondary" className="text-[9px]">
                    {KIND_LABEL[selected.kind] ?? selected.kind}
                  </Badge>
                  {selected.slug && (
                    <code className="font-mono">{selected.slug}</code>
                  )}
                  {selected.isPublished === false && (
                    <Badge variant="outline" className="text-[9px] text-amber-600">
                      unpublished
                    </Badge>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="ปิด"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 text-xs">
              {selected.group === "wiki" ? (
                detailLoading ? (
                  <div className="text-muted-foreground">กำลังโหลด…</div>
                ) : detail ? (
                  <div className="space-y-3">
                    {detail.tags && detail.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {detail.tags.map((t) => (
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
                    {detail.aliases && detail.aliases.length > 0 && (
                      <div>
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          aliases
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {detail.aliases.map((a) => (
                            <code
                              key={a}
                              className="rounded bg-muted px-1.5 py-0.5 text-[10px]"
                            >
                              {a}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}
                    {detail.refTable && detail.refId && (
                      <div className="text-[10px] text-muted-foreground">
                        ref: {detail.refTable}
                      </div>
                    )}
                    <div>
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        เนื้อหา
                      </div>
                      <pre className="whitespace-pre-wrap break-words font-sans text-[11px] leading-relaxed text-foreground/90">
                        {(detail.bodyMd ?? "").length > 800
                          ? `${(detail.bodyMd ?? "").slice(0, 800)}…`
                          : detail.bodyMd ?? ""}
                      </pre>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      อัพเดท:{" "}
                      {(detail.updatedAt ?? "").slice(0, 16).replace("T", " ")}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">โหลดไม่สำเร็จ</div>
                )
              ) : (
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    {selected.group === "car" && "รถรุ่นนี้ใช้ในระบบ — กดด้านล่างเพื่อจัดการ"}
                    {selected.group === "showroom" && "สาขาในระบบ"}
                    {selected.group === "promo" && "โปรโมชั่นในระบบ"}
                  </p>
                </div>
              )}

              {connections.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    เชื่อมกับ ({connections.length})
                  </div>
                  <ul className="space-y-1">
                    {connections.map(({ node, relation, direction }) => (
                      <li key={`${direction}-${node.id}-${relation}`}>
                        <button
                          type="button"
                          onClick={() => setSelected(node)}
                          className="flex w-full items-center gap-2 rounded border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border hover:bg-accent/40"
                        >
                          <span
                            className="inline-block size-2 shrink-0 rounded-full"
                            style={{
                              background:
                                GROUP_COLOR[node.group] ?? "#888",
                            }}
                          />
                          <span className="flex-1 truncate text-xs font-medium">
                            {node.label}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {direction === "out" ? "→" : "←"} {relation}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {editHref && (
              <div className="border-t p-3">
                <Link href={editHref}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(editHref)}
                  >
                    <ExternalLink className="size-3.5" />
                    เปิดหน้าจัดการ
                  </Button>
                </Link>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
