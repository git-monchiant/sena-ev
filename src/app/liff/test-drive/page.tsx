"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { KeyRound } from "lucide-react";
import { DatePicker } from "../_components/DatePicker";
import { FeaturePage } from "../_components/FeaturePage";
import {
  getMockAvailability,
  getMockTimeSlots,
} from "../_components/mockBooking";
import { TimeSlotPicker } from "../_components/TimeSlotPicker";

const MODELS = [
  { slug: "byd-atto-3", name: "BYD Atto 3" },
  { slug: "byd-dolphin", name: "BYD Dolphin" },
  { slug: "mg-ep", name: "MG EP" },
  { slug: "tesla-model-y", name: "Tesla Model Y" },
];

function TestDriveContent() {
  const sp = useSearchParams();
  const preselectedModel = sp.get("model") ?? MODELS[0]!.slug;
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const slots = useMemo(() => (date ? getMockTimeSlots(date) : []), [date]);

  return (
    <FeaturePage
      title="จองทดลองขับ"
      subtitle="เลือกวันที่ → เวลา → ยืนยัน"
      icon={<KeyRound className="size-7" />}
      accent="green"
    >
      <form className="grid gap-4">
        <label className="grid gap-1.5">
          <span className="text-lg font-medium">รุ่นที่สนใจ</span>
          <select
            defaultValue={preselectedModel}
            className=" border border-gray-300 px-3 py-2.5 text-lg"
          >
            {MODELS.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-lg font-medium">โชว์รูม</span>
          <select className=" border border-gray-300 px-3 py-2.5 text-lg">
            <option>Sena EV — Bangna</option>
            <option>Sena EV — รัชโยธิน</option>
            <option>Sena EV — บางใหญ่</option>
          </select>
        </label>

        <div className="grid gap-1.5">
          <span className="text-lg font-medium">เลือกวันที่</span>
          <div className=" border border-gray-200 bg-white p-3">
            <DatePicker
              value={date}
              onChange={(d) => {
                setDate(d);
                setTime(null);
              }}
              getAvailability={getMockAvailability}
              accent="green"
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <span className="text-lg font-medium">เลือกเวลา</span>
          <TimeSlotPicker
            date={date}
            slots={slots}
            value={time}
            onChange={setTime}
            accent="green"
          />
        </div>

        <label className="grid gap-1.5">
          <span className="text-lg font-medium">เบอร์ติดต่อ</span>
          <input
            type="tel"
            placeholder="08x-xxx-xxxx"
            className=" border border-gray-300 px-3 py-2.5 text-lg"
          />
        </label>

        <button
          type="button"
          disabled={!date || !time}
          className="mt-2 bg-emerald-600 px-4 py-3 text-lg font-medium text-white disabled:opacity-50"
        >
          จองทดลองขับ
          {date && time && (
            <span className="ml-1 opacity-80">
              · {date.toLocaleDateString("th-TH")} {time}
            </span>
          )}
        </button>
      </form>
    </FeaturePage>
  );
}

export default function TestDrivePage() {
  return (
    <Suspense fallback={null}>
      <TestDriveContent />
    </Suspense>
  );
}
