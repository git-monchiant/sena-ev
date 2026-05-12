"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { DatePicker } from "../_components/DatePicker";
import { FieldLabel } from "../_components/FeaturePage";
import {
  PendingBookingCard,
  type PendingBooking,
} from "../_components/PendingBookingCard";
import { TimeSlotPicker } from "../_components/TimeSlotPicker";
import { useBookingAvailability } from "../_components/useBookingAvailability";
import { getProfile } from "@/lib/liff";

type Model = { slug: string; name: string };
type Showroom = { slug: string; name: string };

function dateKey(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function TestDriveForm({
  models,
  showrooms,
}: {
  models: Model[];
  showrooms: Showroom[];
}) {
  const sp = useSearchParams();
  const [modelSlug, setModelSlug] = useState<string>(
    sp.get("model") ?? models[0]?.slug ?? "",
  );
  const showroomFromQuery = sp.get("showroom");
  const [showroomSlug, setShowroomSlug] = useState<string>(
    (showroomFromQuery && showrooms.some((s) => s.slug === showroomFromQuery)
      ? showroomFromQuery
      : showrooms[0]?.slug) ?? "",
  );
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [pending, setPending] = useState<PendingBooking | null>(null);
  const [loadingPending, setLoadingPending] = useState(true);

  const { getAvailability, slots } = useBookingAvailability(
    showroomSlug || null,
    "test_drive",
    date,
  );

  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile();
        const res = await fetch(
          `/api/liff/me/booking?type=test_drive&lineUserId=${encodeURIComponent(profile.userId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { booking: PendingBooking | null };
        setPending(data.booking);
      } catch {
        /* ignore */
      } finally {
        setLoadingPending(false);
      }
    })();
  }, []);

  async function handleSubmit() {
    if (!date || !time || !showroomSlug) return;
    if (!/^0\d{8,9}$/.test(phone.replace(/[-\s]/g, ""))) {
      setError("กรุณากรอกเบอร์โทรให้ถูกต้อง");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const profile = await getProfile();
      const res = await fetch("/api/liff/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineUserId: profile.userId,
          type: "test_drive",
          showroomSlug,
          date: dateKey(date),
          time,
          modelSlug: modelSlug || undefined,
          phone: phone.replace(/[-\s]/g, ""),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        schedule?: PendingBooking;
      };
      if (!res.ok) {
        setError(data.error ?? `จองไม่สำเร็จ (${res.status})`);
        return;
      }
      setSuccess(true);
      if (data.schedule) {
        setPending({
          ...data.schedule,
          scheduledAt:
            (data.schedule as unknown as { scheduled_at?: string })
              .scheduled_at ?? data.schedule.scheduledAt,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingPending) {
    return (
      <div className="py-8 text-sm font-medium text-zinc-500">กำลังโหลด…</div>
    );
  }

  if (pending) {
    return (
      <div className="grid gap-5">
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
            <Check className="size-4" strokeWidth={3} />
            ทีมงานจะติดต่อกลับเพื่อยืนยันภายใน 1 ชั่วโมง
          </div>
        )}
        <PendingBookingCard
          booking={pending}
          onCancelled={() => {
            setPending(null);
            setSuccess(false);
            setDate(null);
            setTime(null);
          }}
        />
      </div>
    );
  }

  return (
    <form
      className="grid gap-7"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <label className="grid gap-2">
        <FieldLabel>รุ่นที่สนใจ</FieldLabel>
        <select
          value={modelSlug}
          onChange={(e) => setModelSlug(e.target.value)}
          className="border-0 border-b border-zinc-300 bg-transparent px-0 py-2.5 text-base font-medium focus:border-brand focus:outline-none"
        >
          {models.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <FieldLabel>โชว์รูม</FieldLabel>
        <select
          value={showroomSlug}
          onChange={(e) => {
            setShowroomSlug(e.target.value);
            setDate(null);
            setTime(null);
          }}
          className="border-0 border-b border-zinc-300 bg-transparent px-0 py-2.5 text-base font-medium focus:border-brand focus:outline-none"
        >
          {showrooms.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3">
        <FieldLabel>เลือกวันที่</FieldLabel>
        <DatePicker
          value={date}
          onChange={(d) => {
            setDate(d);
            setTime(null);
          }}
          getAvailability={getAvailability}
        />
      </div>

      <div className="grid gap-3">
        <FieldLabel>เลือกเวลา</FieldLabel>
        <TimeSlotPicker
          date={date}
          slots={slots}
          value={time}
          onChange={setTime}
        />
      </div>

      <label className="grid gap-2">
        <FieldLabel>เบอร์ติดต่อ</FieldLabel>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08x-xxx-xxxx"
          className="border-0 border-b border-zinc-300 bg-transparent px-0 py-2.5 text-base font-medium placeholder:font-medium placeholder:text-zinc-400 focus:border-brand focus:outline-none"
        />
      </label>

      {error && (
        <div className="border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!date || !time || submitting}
        className="mt-2 flex items-center justify-between bg-brand px-4 py-4 text-white disabled:opacity-40"
      >
        <span className="text-base font-bold">
          {submitting ? "กำลังจอง…" : "จองทดลองขับ"}
          {!submitting && date && time && (
            <span className="ml-1.5 font-medium opacity-70">
              · {date.toLocaleDateString("th-TH")} {time}
            </span>
          )}
        </span>
        <ArrowRight className="size-5" strokeWidth={2.5} />
      </button>
    </form>
  );
}
