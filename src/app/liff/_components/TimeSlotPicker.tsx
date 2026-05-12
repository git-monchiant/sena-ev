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
}: {
  date: Date | null;
  slots: TimeSlot[];
  value: string | null;
  onChange: (time: string) => void;
}) {
  if (!date) {
    return (
      <div className="border border-dashed border-zinc-300 p-6 text-center text-base font-medium text-zinc-500">
        เลือกวันที่ก่อน
      </div>
    );
  }
  if (slots.length === 0) {
    return (
      <div className="border border-amber-200 bg-amber-50 p-4 text-center text-base font-medium text-amber-800">
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
            className={`border px-2 py-3 text-base transition-colors ${
              full
                ? "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-300"
                : active
                  ? "border-brand bg-brand text-white"
                  : "border-zinc-300 bg-white hover:border-brand"
            }`}
          >
            <div className="font-bold">{s.time}</div>
            <div className="mt-0.5 text-[10px] font-medium opacity-75">
              {full ? "เต็ม" : `เหลือ ${s.remaining} ที่`}
            </div>
          </button>
        );
      })}
    </div>
  );
}
