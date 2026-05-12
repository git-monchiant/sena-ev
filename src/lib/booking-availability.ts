import "server-only";
import { countBookedAt, type ScheduleType } from "./schedules";
import { getShowroomBySlug, type Showroom } from "./showrooms";

export type Availability = "available" | "partial" | "full" | "closed";

export type Slot = {
  time: string; // "HH:mm"
  remaining: number; // 0 = full
};

export type DayBooking = {
  availability: Availability;
  slots: Slot[];
};

function parseHM(s: string | null): number | null {
  if (!s) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(s);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function fmtHM(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

function isOpenOnDate(showroom: Showroom, date: Date): boolean {
  if (!showroom.daysOpen.length) return true;
  return showroom.daysOpen.includes(date.getDay());
}

export async function getAvailabilityForDate(params: {
  showroomSlug: string;
  date: Date;
  type?: ScheduleType;
}): Promise<DayBooking> {
  const showroom = await getShowroomBySlug(params.showroomSlug);
  if (!showroom || !showroom.isActive) {
    return { availability: "closed", slots: [] };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const queryDate = new Date(params.date);
  queryDate.setHours(0, 0, 0, 0);
  if (queryDate.getTime() < today.getTime()) {
    return { availability: "closed", slots: [] };
  }
  if (!isOpenOnDate(showroom, queryDate)) {
    return { availability: "closed", slots: [] };
  }

  const opens = parseHM(showroom.opensAt) ?? 10 * 60;
  const closes = parseHM(showroom.closesAt) ?? 19 * 60;
  const slotMinutes = 60;
  const capacityPerSlot = 3; // showrooms.default_slots_per_hour seeded but kept simple

  const slotTimes: number[] = [];
  for (let m = opens; m + slotMinutes <= closes; m += slotMinutes) {
    // Skip the lunch hour 12:00 (common SOP)
    if (m === 12 * 60) continue;
    slotTimes.push(m);
  }

  const slots: Slot[] = [];
  for (const m of slotTimes) {
    const from = new Date(queryDate);
    from.setHours(0, 0, 0, 0);
    from.setMinutes(m);
    const to = new Date(from.getTime() + slotMinutes * 60 * 1000);
    const booked = await countBookedAt({
      showroomId: showroom.id,
      from,
      to,
      type: params.type,
    });
    slots.push({
      time: fmtHM(m),
      remaining: Math.max(0, capacityPerSlot - booked),
    });
  }

  const totalRem = slots.reduce((a, b) => a + b.remaining, 0);
  const totalCap = slots.length * capacityPerSlot;
  let availability: Availability;
  if (totalRem === 0) availability = "full";
  else if (totalRem < totalCap * 0.5) availability = "partial";
  else availability = "available";

  return { availability, slots };
}

export async function getAvailabilityForMonth(params: {
  showroomSlug: string;
  from: Date;
  to: Date;
  type?: ScheduleType;
}): Promise<Record<string, Availability>> {
  const result: Record<string, Availability> = {};
  const cur = new Date(params.from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(params.to);
  end.setHours(0, 0, 0, 0);
  while (cur.getTime() <= end.getTime()) {
    const key = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;
    const r = await getAvailabilityForDate({
      showroomSlug: params.showroomSlug,
      date: new Date(cur),
      type: params.type,
    });
    result[key] = r.availability;
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}
