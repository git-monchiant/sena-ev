"use client";

import { useMemo, useState } from "react";
import { Wrench } from "lucide-react";
import { DatePicker } from "../_components/DatePicker";
import { FeaturePage } from "../_components/FeaturePage";
import {
  getMockAvailability,
  getMockTimeSlots,
} from "../_components/mockBooking";
import { TimeSlotPicker } from "../_components/TimeSlotPicker";

export default function ServicePage() {
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const slots = useMemo(() => (date ? getMockTimeSlots(date) : []), [date]);

  return (
    <FeaturePage
      title="จองเซอร์วิส"
      subtitle="เลือกวันที่ → เวลา → ยืนยัน"
      icon={<Wrench className="size-7" />}
      accent="orange"
    >
      <form className="grid gap-4">
        <label className="grid gap-1.5">
          <span className="text-lg font-medium">ประเภทบริการ</span>
          <select className=" border border-gray-300 px-3 py-2.5 text-lg">
            <option>เช็คระยะ (Maintenance)</option>
            <option>ตรวจสภาพ (Inspection)</option>
            <option>ซ่อม (Repair)</option>
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-lg font-medium">ศูนย์บริการ</span>
          <select className=" border border-gray-300 px-3 py-2.5 text-lg">
            <option>Sena Service — Bangna</option>
            <option>Sena Service — รัชโยธิน</option>
            <option>Sena Service — บางใหญ่</option>
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
              accent="orange"
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
            accent="orange"
          />
        </div>

        <label className="grid gap-1.5">
          <span className="text-lg font-medium">หมายเหตุ</span>
          <textarea
            rows={3}
            placeholder="เช่น เสียงเครื่องผิดปกติ..."
            className=" border border-gray-300 px-3 py-2.5 text-lg"
          />
        </label>

        <button
          type="button"
          disabled={!date || !time}
          className="mt-2 bg-orange-500 px-4 py-3 text-lg font-medium text-white disabled:opacity-50"
        >
          จองเซอร์วิส
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
