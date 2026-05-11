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
  accent = "blue",
}: {
  value: Date | null;
  onChange: (date: Date) => void;
  getAvailability?: (date: Date) => DateAvailability;
  hideFullDays?: boolean;
  accent?: "blue" | "green" | "orange";
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

  const accentClass: Record<string, string> = {
    blue: "bg-blue-600 text-white",
    green: "bg-emerald-600 text-white",
    orange: "bg-orange-600 text-white",
  };

  return (
    <div className="space-y-3">
      {months.map((monthStart) => (
        <MonthGrid
          key={monthStart.toISOString()}
          monthStart={monthStart}
          today={today}
          selected={value}
          onSelect={onChange}
          getAvailability={getAvailability}
          hideFullDays={hideFullDays}
          accentClass={accentClass[accent]!}
        />
      ))}
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
        <Legend dot="bg-blue-500" label="ว่าง" />
        <Legend dot="bg-amber-400" label="เหลือน้อย" />
        <Legend dot="bg-gray-300" label="เต็ม / ปิด" />
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
    accentClass,
  }: {
    monthStart: Date;
    today: Date;
    selected: Date | null;
    onSelect: (d: Date) => void;
    getAvailability?: (d: Date) => DateAvailability;
    hideFullDays: boolean;
    accentClass: string;
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
        <div className="mb-2 text-center text-lg font-semibold">
          {MONTHS_TH[month]} {year + 543}
        </div>
        <div className="grid grid-cols-7 text-center text-[10px] text-gray-500">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`py-1 ${i === 0 || i === 6 ? "text-red-500" : ""}`}
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
                className={`relative flex aspect-square flex-col items-center justify-center text-lg transition-colors ${
                  disabled
                    ? "cursor-not-allowed text-gray-300"
                    : isSelected
                      ? accentClass
                      : isToday
                        ? "bg-blue-50 font-semibold"
                        : "hover:bg-gray-100"
                }`}
              >
                <span>{date.getDate()}</span>
                {!disabled && !isSelected && (
                  <span
                    className={`absolute bottom-1 size-1 rounded-full ${
                      avail === "partial" ? "bg-amber-400" : "bg-blue-500"
                    }`}
                  />
                )}
                {disabled &&
                  !isPast &&
                  (avail === "full" || avail === "closed") && (
                    <span className="absolute bottom-0.5 text-[8px] text-gray-400">
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
