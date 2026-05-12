"use client";

import { useEffect, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ServiceType = "maintenance" | "repair" | "inspection";

const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: "maintenance", label: "เช็คระยะ / บำรุงรักษา" },
  { value: "repair", label: "ซ่อม" },
  { value: "inspection", label: "ตรวจสภาพ" },
];

export function AddToScheduleDialog({
  open,
  customerId,
  customerName,
  defaultNotes,
  onClose,
  onSaved,
}: {
  open: boolean;
  customerId: string;
  customerName: string | null;
  defaultNotes: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [serviceType, setServiceType] = useState<ServiceType>("maintenance");
  const [scheduledAt, setScheduledAt] = useState<string>(defaultScheduled());
  const [serviceCenter, setServiceCenter] = useState("");
  const [notes, setNotes] = useState(defaultNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setServiceType("maintenance");
    setScheduledAt(defaultScheduled());
    setServiceCenter("");
    setNotes(defaultNotes);
    setError(null);
  }, [open, defaultNotes]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const iso = new Date(scheduledAt).toISOString();
      const res = await fetch(
        `/api/admin/customers/${customerId}/appointments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceType,
            scheduledAt: iso,
            serviceCenter: serviceCenter.trim() || undefined,
            notes: notes.trim() || undefined,
          }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? `บันทึกไม่สำเร็จ (${res.status})`);
        return;
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-lg border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-blue-600" />
            <h2 className="text-sm font-semibold">เพิ่มในตารางงาน</h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-4 p-5">
          {customerName && (
            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs">
              <span className="text-muted-foreground">ลูกค้า:</span>{" "}
              <span className="font-medium">{customerName}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium">ประเภท</label>
            <div className="flex gap-1.5">
              {SERVICE_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setServiceType(opt.value)}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                    serviceType === opt.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="schedule-when">
              วัน-เวลานัด
            </label>
            <Input
              id="schedule-when"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="schedule-center">
              ศูนย์บริการ (ไม่บังคับ)
            </label>
            <Input
              id="schedule-center"
              type="text"
              placeholder="เช่น Sena EV Bangna"
              value={serviceCenter}
              onChange={(e) => setServiceCenter(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="schedule-notes">
              บันทึก
            </label>
            <Textarea
              id="schedule-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-5 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving || !scheduledAt}
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function defaultScheduled(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
