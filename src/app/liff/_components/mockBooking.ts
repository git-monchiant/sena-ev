import type { DateAvailability } from "./DatePicker";
import type { TimeSlot } from "./TimeSlotPicker";

// Mock — replace with real DB query (booking capacity per date)
export function getMockAvailability(date: Date): DateAvailability {
  const dow = date.getDay();
  if (dow === 0) return "closed"; // ปิดวันอาทิตย์

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date.getTime() < today.getTime()) return "closed";

  // Deterministic pseudo-random based on date
  const seed =
    date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate();
  const bucket = seed % 10;
  if (bucket < 5) return "available";
  if (bucket < 8) return "partial";
  return "full";
}

export function getMockTimeSlots(date: Date): TimeSlot[] {
  const dow = date.getDay();
  if (dow === 0) return []; // ปิด

  const allSlots = [
    "10:00", "11:00", "13:00", "14:00", "15:00", "16:00",
  ];

  const seed =
    date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate();
  return allSlots.map((time, i) => ({
    time,
    remaining: Math.max(0, ((seed + i * 7) % 5) - 1), // 0-3
  }));
}
