"use client";

export type TimeSlot = {
  time: string;
  remaining: number;
};

export function TimeSlotPicker({
  date,
  slots,
  value,
  onChange,
  accent = "blue",
}: {
  date: Date | null;
  slots: TimeSlot[];
  value: string | null;
  onChange: (time: string) => void;
  accent?: "blue" | "green" | "orange";
}) {
  const accentClass: Record<string, string> = {
    blue: "border-blue-500 bg-blue-50 text-blue-700",
    green: "border-emerald-500 bg-emerald-50 text-emerald-700",
    orange: "border-orange-500 bg-orange-50 text-orange-700",
  };

  if (!date) {
    return (
      <div className=" border border-dashed border-gray-300 p-6 text-center text-base text-gray-500">
        เลือกวันที่ก่อน
      </div>
    );
  }
  if (slots.length === 0) {
    return (
      <div className=" border border-amber-200 bg-amber-50 p-4 text-center text-base text-amber-700">
        วันนี้เต็มแล้ว — เลือกวันอื่น
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((s) => {
        const active = value === s.time;
        const full = s.remaining === 0;
        return (
          <button
            key={s.time}
            type="button"
            disabled={full}
            onClick={() => onChange(s.time)}
            className={` border px-2 py-2 text-lg transition-colors ${
              full
                ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                : active
                  ? accentClass[accent]
                  : "border-gray-300 bg-white hover:bg-gray-50"
            }`}
          >
            <div className="font-medium">{s.time}</div>
            <div className="text-[10px] opacity-75">
              {full ? "เต็ม" : `เหลือ ${s.remaining} ที่`}
            </div>
          </button>
        );
      })}
    </div>
  );
}
