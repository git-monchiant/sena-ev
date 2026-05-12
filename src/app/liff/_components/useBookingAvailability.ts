"use client";

import { useEffect, useState } from "react";
import type { DateAvailability } from "./DatePicker";
import type { TimeSlot } from "./TimeSlotPicker";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function useBookingAvailability(
  showroomSlug: string | null,
  type: "service" | "test_drive",
  selectedDate: Date | null,
) {
  const [availabilityMap, setAvailabilityMap] = useState<
    Record<string, DateAvailability>
  >({});
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  // Fetch 2-month availability when showroom changes
  useEffect(() => {
    if (!showroomSlug) return;
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setMonth(to.getMonth() + 2);
    to.setDate(0); // last day of month+1
    const params = new URLSearchParams({
      showroomSlug,
      type,
      from: dateKey(from),
      to: dateKey(to),
    });
    let cancelled = false;
    fetch(`/api/liff/booking/availability?${params.toString()}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d: { map: Record<string, DateAvailability> }) => {
        if (!cancelled) setAvailabilityMap(d.map ?? {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [showroomSlug, type]);

  // Fetch slots for selected date
  useEffect(() => {
    if (!showroomSlug || !selectedDate) {
      setSlots([]);
      return;
    }
    const params = new URLSearchParams({
      showroomSlug,
      type,
      date: dateKey(selectedDate),
    });
    let cancelled = false;
    fetch(`/api/liff/booking/availability?${params.toString()}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d: { slots: TimeSlot[] }) => {
        if (!cancelled) setSlots(d.slots ?? []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      });
    return () => {
      cancelled = true;
    };
  }, [showroomSlug, selectedDate, type]);

  const getAvailability = (d: Date): DateAvailability =>
    availabilityMap[dateKey(d)] ?? "available";

  return { getAvailability, slots };
}
