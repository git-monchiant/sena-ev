"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  MessageSquareText,
  PanelLeft,
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
  { href: "/admin/tags", label: "Tags", icon: Tag },
  { href: "/admin/richmenu", label: "Rich Menu", icon: LayoutGrid },
  { href: "/admin/materials", label: "Materials", icon: FileText },
  { href: "/admin/templates", label: "Templates", icon: MessageSquareText },
];

const STORAGE_KEY = "sena-admin-sidebar-collapsed";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [inboxBadge, setInboxBadge] = useState(0);
  const [connected, setConnected] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored !== null) setCollapsed(stored === "1");
  }, []);

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

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const currentLabel = NAV.find((n) => isActive(n.href))?.label ?? "Admin";

  return (
    <div className="flex h-svh w-full overflow-hidden bg-gray-50">
      <audio ref={audioRef} preload="auto">
        <source
          src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
          type="audio/wav"
        />
      </audio>

      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-200",
          collapsed ? "w-14" : "w-56",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
            S
          </div>
          {!collapsed && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Sena EV</span>
              <span className="truncate text-[10px] text-muted-foreground">
                Admin Console
              </span>
            </div>
          )}
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
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                      collapsed && "justify-center",
                      active
                        ? "bg-accent font-medium text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {showBadge && !collapsed && (
                      <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {inboxBadge}
                      </span>
                    )}
                  </Link>
                  {showBadge && collapsed && (
                    <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-600" />
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-200 p-2">
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground",
              collapsed && "justify-center",
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className="size-4" />
            {!collapsed && <span>ย่อ sidebar</span>}
          </button>
          <div
            className={cn(
              "mt-1 flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground",
              collapsed && "justify-center",
            )}
          >
            <span
              title={connected ? "Realtime connected" : "Connecting..."}
              className={cn(
                "inline-block size-1.5 shrink-0 rounded-full",
                connected ? "bg-green-500" : "bg-gray-400",
              )}
            />
            {!collapsed && (
              <span className="truncate">
                {connected ? "Realtime connected" : "Connecting..."}
              </span>
            )}
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            title="Toggle sidebar"
          >
            <PanelLeft className="size-4" />
          </button>
          <div className="mr-2 h-4 w-px bg-border" />
          <h1 className="text-sm font-semibold">{currentLabel}</h1>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span>OA: @551moqzs (SENA-EV)</span>
            <div className="h-3 w-px bg-border" />
            <span>v0.1 dev</span>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
