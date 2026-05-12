"use client";

import { useMemo } from "react";

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const MONTHS_TH = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export type DateAvailability = "available" | "partial" | "full" | "closed";

export function DatePicker({
  value,
  onChange,
  getAvailability,
  hideFullDays = false,
}: {
  value: Date | null;
  onChange: (date: Date) => void;
  getAvailability?: (date: Date) => DateAvailability;
  hideFullDays?: boolean;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const months = useMemo(() => {
    return [0, 1].map((offset) => {
      const start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      return start;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      {months.map((monthStart) => (
        <MonthGrid
          key={monthStart.toISOString()}
          monthStart={monthStart}
          today={today}
          selected={value}
          onSelect={onChange}
          getAvailability={getAvailability}
          hideFullDays={hideFullDays}
        />
      ))}
      <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-wider text-zinc-600">
        <Legend dot="bg-brand" label="ว่าง" />
        <Legend dot="bg-amber-500" label="เหลือน้อย" />
        <Legend dot="bg-zinc-300" label="เต็ม / ปิด" />
      </div>
    </div>
  );

  function MonthGrid({
    monthStart,
    today,
    selected,
    onSelect,
    getAvailability,
    hideFullDays,
  }: {
    monthStart: Date;
    today: Date;
    selected: Date | null;
    onSelect: (d: Date) => void;
    getAvailability?: (d: Date) => DateAvailability;
    hideFullDays: boolean;
  }) {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = today.toDateString();
    const selectedKey = selected?.toDateString() ?? null;

    const cells: Array<{ date: Date | null; key: string }> = [];
    for (let i = 0; i < firstDay; i++) cells.push({ date: null, key: `e${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), key: `d${d}` });
    }
    while (cells.length % 7 !== 0)
      cells.push({ date: null, key: `t${cells.length}` });

    return (
      <div>
        <div className="mb-3 text-base font-bold uppercase tracking-[0.2em] text-zinc-900">
          {MONTHS_TH[month]} {year + 543}
        </div>
        <div className="grid grid-cols-7 text-center text-xs font-bold uppercase tracking-wider text-zinc-600">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`py-2 ${i === 0 || i === 6 ? "text-red-500" : ""}`}
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map(({ date, key }) => {
            if (!date) return <div key={key} />;
            const dateKey = date.toDateString();
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedKey;
            const isPast = date.getTime() < today.getTime();
            const avail = getAvailability?.(date) ?? "available";
            const disabled = isPast || avail === "full" || avail === "closed";
            if (hideFullDays && (avail === "full" || avail === "closed"))
              return <div key={key} />;
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(date)}
                className={`relative flex aspect-square flex-col items-center justify-center text-lg font-bold transition-colors ${
                  disabled
                    ? "cursor-not-allowed text-zinc-300"
                    : isSelected
                      ? "bg-brand text-white"
                      : isToday
                        ? "text-brand ring-1 ring-inset ring-brand"
                        : "text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                <span>{date.getDate()}</span>
                {!disabled && !isSelected && (
                  <span
                    className={`absolute bottom-1 size-1 rounded-full ${
                      avail === "partial" ? "bg-amber-500" : "bg-brand"
                    }`}
                  />
                )}
                {disabled &&
                  !isPast &&
                  (avail === "full" || avail === "closed") && (
                    <span className="absolute bottom-0.5 text-[9px] font-bold text-zinc-400">
                      {avail === "full" ? "เต็ม" : "ปิด"}
                    </span>
                  )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`size-1.5 rounded-full ${dot}`} />
      <span>{label}</span>
    </div>
  );
}
