import {
  Bell,
  Gift,
  Info,
  Phone,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { FeaturePage } from "../_components/FeaturePage";

const NOTIFICATIONS = [
  {
    type: "service_reminder",
    title: "นัดเซอร์วิสพรุ่งนี้",
    body: "เวลา 10:00 น. ที่ Sena Service Bangna อย่าลืมนำสมุดประกันมาด้วย",
    time: "เมื่อสักครู่",
    unread: true,
  },
  {
    type: "promo",
    title: "โปรโมชั่นใหม่",
    body: "ส่วนลด ประกันชั้น 1 30% ถึงสิ้นเดือนนี้",
    time: "2 ชม. ที่แล้ว",
    unread: true,
  },
  {
    type: "system",
    title: "ยินดีต้อนรับ",
    body: "ขอบคุณที่เป็นลูกค้า Sena EV — มีอะไรช่วยเหลือสอบถามได้ตลอด 24 ชม.",
    time: "เมื่อวาน",
    unread: false,
  },
];

const TYPE_ICON: Record<string, LucideIcon> = {
  service_reminder: Wrench,
  promo: Gift,
  lead_followup: Phone,
  system: Info,
};

const TYPE_COLOR: Record<string, string> = {
  service_reminder: "bg-orange-50 text-orange-600",
  promo: "bg-emerald-50 text-emerald-600",
  lead_followup: "bg-blue-50 text-blue-600",
  system: "bg-gray-100 text-gray-600",
};

export default function NotificationsInboxPage() {
  return (
    <FeaturePage
      title="แจ้งเตือน"
      subtitle="ข่าวสาร โปรโมชั่น และการแจ้งเตือนสำคัญ"
      icon={<Bell className="size-7" />}
      accent="purple"
    >
      <ul className="divide-y divide-gray-100 border border-gray-200 bg-white">
        {NOTIFICATIONS.map((n, i) => {
          const Icon = TYPE_ICON[n.type] ?? Info;
          return (
            <li key={i} className="flex gap-3 p-3">
              <div
                className={`flex size-10 shrink-0 items-center justify-center ${TYPE_COLOR[n.type] ?? "bg-gray-100 text-gray-600"}`}
              >
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">{n.title}</span>
                  {n.unread && (
                    <span className="size-2 rounded-full bg-purple-500" />
                  )}
                </div>
                <div className="mt-0.5 text-base text-gray-600">{n.body}</div>
                <div className="mt-1 text-[10px] text-gray-400">{n.time}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </FeaturePage>
  );
}
