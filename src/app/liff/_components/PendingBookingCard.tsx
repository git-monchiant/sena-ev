"use client";

import { useState } from "react";
import { CalendarCheck, MapPin, X } from "lucide-react";
import { getProfile } from "@/lib/liff";

export type PendingBooking = {
  id: string;
  type: "service" | "test_drive" | string;
  subtype: string | null;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  location: string | null;
  status: "NEW" | "CONFIRMED" | "IN_PROGRESS" | string;
  notes: string | null;
  payload?: Record<string, unknown>;
};

const STATUS_LABEL: Record<string, string> = {
  NEW: "รออนุมัติ",
  CONFIRMED: "ยืนยันแล้ว",
  IN_PROGRESS: "กำลังดำเนินการ",
};

const STATUS_TONE: Record<string, string> = {
  NEW: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
};

export function PendingBookingCard({
  booking,
  onCancelled,
}: {
  booking: PendingBooking;
  onCancelled: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const d = new Date(booking.scheduledAt);
  const dateLine = d.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeLine = d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    try {
      const profile = await getProfile();
      const res = await fetch(`/api/liff/booking/${booking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineUserId: profile.userId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? `ยกเลิกไม่สำเร็จ (${res.status})`);
        return;
      }
      onCancelled();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setCancelling(false);
      setConfirming(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="border-l-4 border-brand bg-brand-soft p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-5 text-brand" strokeWidth={2.5} />
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
              รายการจองของคุณ
            </div>
          </div>
          <span
            className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              STATUS_TONE[booking.status] ?? "bg-zinc-100 text-zinc-700"
            }`}
          >
            {STATUS_LABEL[booking.status] ?? booking.status}
          </span>
        </div>

        <div className="mt-4 text-xl font-bold leading-tight">
          {booking.title}
        </div>

        <div className="mt-4 grid gap-1.5">
          <Row label="วันที่" value={dateLine} />
          <Row label="เวลา" value={`${timeLine} น.`} />
          {booking.location && (
            <Row label="สถานที่" value={booking.location} icon={MapPin} />
          )}
          {booking.notes && <Row label="บันทึก" value={booking.notes} />}
        </div>
      </div>

      <div className="px-1 text-xs font-medium text-zinc-500">
        จองได้ครั้งละ 1 รายการ — หากต้องการเปลี่ยนแปลง กรุณายกเลิกก่อน
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {confirming ? (
        <div className="grid gap-2">
          <div className="bg-red-50 p-3 text-sm font-bold text-red-700">
            ยืนยันการยกเลิก?
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={cancelling}
              className="border border-zinc-300 px-3 py-3 text-sm font-bold"
            >
              ไม่ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-red-600 px-3 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {cancelling ? "กำลังยกเลิก…" : "ยืนยันยกเลิก"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex items-center justify-center gap-2 border border-red-300 px-3 py-3 text-sm font-bold text-red-700"
        >
          <X className="size-4" strokeWidth={2.5} />
          ยกเลิกการจอง
        </button>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <div className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="flex flex-1 items-baseline gap-1.5 text-sm font-bold">
        {Icon && (
          <Icon className="size-4 shrink-0 text-zinc-500" strokeWidth={2} />
        )}
        <span>{value}</span>
      </div>
    </div>
  );
}
