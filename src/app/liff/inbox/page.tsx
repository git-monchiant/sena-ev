"use client";

import { useEffect, useState } from "react";
import {
  Gift,
  Info,
  Phone,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { FeaturePage } from "../_components/FeaturePage";
import { getProfile } from "@/lib/liff";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  sentAt: string | null;
  readAt: string | null;
};

const TYPE_ICON: Record<string, LucideIcon> = {
  service_reminder: Wrench,
  promo: Gift,
  lead_followup: Phone,
  system: Info,
};

export default function NotificationsInboxPage() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile();
        const res = await fetch(
          `/api/liff/me/notifications?lineUserId=${encodeURIComponent(profile.userId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          setError("โหลดข้อมูลไม่สำเร็จ");
          return;
        }
        const data = (await res.json()) as { notifications: Notification[] };
        setItems(data.notifications);
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      }
    })();
  }, []);

  return (
    <FeaturePage
      eyebrow="Inbox"
      title="แจ้งเตือน"
      subtitle="ข่าวสาร โปรโมชั่น และการแจ้งเตือนสำคัญ"
    >
      <div className="border-t border-zinc-200">
        {items === null && !error && (
          <div className="py-8 text-sm font-medium text-zinc-500">
            กำลังโหลด…
          </div>
        )}
        {error && (
          <div className="py-8 text-sm font-medium text-red-600">{error}</div>
        )}
        {items?.length === 0 && (
          <div className="py-8 text-sm font-medium text-zinc-500">
            ยังไม่มีแจ้งเตือน
          </div>
        )}
        {items?.map((n) => {
          const Icon = TYPE_ICON[n.type] ?? Info;
          const unread = n.readAt == null;
          return (
            <article
              key={n.id}
              className="flex gap-4 border-b border-zinc-200 py-5"
            >
              <Icon
                className={`mt-0.5 size-5 shrink-0 ${unread ? "text-brand" : "text-zinc-400"}`}
                strokeWidth={2}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold">{n.title}</h2>
                  {unread && <span className="size-1.5 rounded-full bg-brand" />}
                </div>
                {n.body && (
                  <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-600">
                    {n.body}
                  </p>
                )}
                {n.sentAt && (
                  <div className="mt-2 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                    {formatRelative(n.sentAt)}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </FeaturePage>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชม. ที่แล้ว`;
  const day = Math.floor(hr / 24);
  if (day < 7) return day === 1 ? "เมื่อวาน" : `${day} วันที่แล้ว`;
  return d.toLocaleDateString("th-TH");
}
