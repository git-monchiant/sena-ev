"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookText,
  Car,
  FileText,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  MessageSquareText,
  Sparkles,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inbox", label: "Inbox", icon: Inbox },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/cars", label: "Cars", icon: Car },
  { href: "/admin/showrooms", label: "Showrooms", icon: MapPin },
  { href: "/admin/promotions", label: "Promotions", icon: Sparkles },
  { href: "/admin/tags", label: "Tags", icon: Tag },
  { href: "/admin/richmenu", label: "Rich Menu", icon: LayoutGrid },
  { href: "/admin/materials", label: "Materials", icon: FileText },
  { href: "/admin/templates", label: "Templates", icon: MessageSquareText },
  { href: "/admin/wiki", label: "Wiki", icon: BookText },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [inboxBadge, setInboxBadge] = useState(0);
  const [connected, setConnected] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/admin/inbox/stream");
    es.addEventListener("ready", () => setConnected(true));
    es.addEventListener("new_message", () => {
      setInboxBadge((n) => n + 1);
      audioRef.current?.play().catch(() => {});
    });
    es.onerror = () => setConnected(false);
    return () => es.close();
  }, []);

  useEffect(() => {
    if (pathname === "/admin/inbox") setInboxBadge(0);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const currentLabel = NAV.find((n) => isActive(n.href))?.label ?? "Admin";

  return (
    <div className="flex h-svh w-full overflow-hidden bg-muted/40">
      <audio ref={audioRef} preload="auto">
        <source
          src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
          type="audio/wav"
        />
      </audio>

      <aside className="flex w-14 shrink-0 flex-col bg-sidebar/80 backdrop-blur">
        <div className="flex h-14 items-center justify-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-sm">
            S
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const showBadge =
                item.href === "/admin/inbox" && inboxBadge > 0;
              return (
                <li key={item.href} className="relative">
                  <HoverLabel label={item.label} badgeCount={showBadge ? inboxBadge : 0}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center rounded-lg px-2 py-2 transition-colors",
                        active
                          ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                    </Link>
                  </HoverLabel>
                  {showBadge && (
                    <span className="pointer-events-none absolute right-1.5 top-1.5 size-2 rounded-full bg-red-600" />
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-2 pt-1">
          <div className="flex items-center justify-center py-1">
            <span
              title={connected ? "Realtime connected" : "Connecting..."}
              className={cn(
                "inline-block size-1.5 shrink-0 rounded-full",
                connected ? "bg-green-500" : "bg-gray-400",
              )}
            />
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="relative z-[10000] flex h-14 shrink-0 items-center gap-2 bg-background/95 px-4 backdrop-blur">
          <h1 className="text-sm font-semibold">{currentLabel}</h1>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span>OA: @551moqzs (SENA-EV)</span>
            <div className="h-3 w-px bg-border/70" />
            <span>v0.1 dev</span>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 pt-0">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Renders the child element as the trigger and shows a tooltip-style label
 * to the right on hover. Uses a portal so parent overflow:hidden / transforms
 * don't clip it.
 */
function HoverLabel({
  label,
  badgeCount,
  children,
}: {
  label: string;
  badgeCount: number;
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    // Header bar is h-14 (56px). Keep tooltip centerline below that + tooltip
    // half-height (~16px) + breathing room so it never overlaps the top navbar.
    const NAVBAR_H = 56;
    const TOOLTIP_HALF = 18;
    const center = rect.top + rect.height / 2;
    const top = Math.max(center, NAVBAR_H + TOOLTIP_HALF + 4);
    setPos({ top, left: rect.right + 8 });
  }, [open]);

  return (
    <div
      ref={wrapRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {mounted && open && pos &&
        createPortal(
          <span
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              transform: "translateY(-50%)",
            }}
            className="pointer-events-none z-[9999] flex items-center gap-2 whitespace-nowrap rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg"
          >
            {label}
            {badgeCount > 0 && (
              <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold">
                {badgeCount}
              </span>
            )}
          </span>,
          document.body,
        )}
    </div>
  );
}
