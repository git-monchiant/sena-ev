"use client";

import { useState } from "react";
import {
  BatteryCharging,
  LifeBuoy,
  MapPin,
  Phone,
  Wrench,
} from "lucide-react";
import { FeaturePage } from "../_components/FeaturePage";

export default function SOSPage() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  function shareLocation() {
    if (!("geolocation" in navigator)) {
      setError("เบราว์เซอร์ไม่รองรับ");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <FeaturePage
      title="SOS / ช่วยเหลือ"
      icon={<LifeBuoy className="size-7" />}
      accent="red"
    >
      <div className="space-y-3">
        <a
          href="tel:1666"
          className="flex w-full items-center justify-center gap-2 bg-red-600 px-4 py-5 text-center text-lg font-semibold text-white shadow-lg"
        >
          <Phone className="size-5" />
          โทรหา 1666 — ฉุกเฉิน 24 ชม.
        </a>

        <div className="grid grid-cols-2 gap-3">
          <a
            href="tel:02-xxx-xxxx"
            className="flex flex-col items-center gap-2 border border-gray-200 bg-white p-4 text-center"
          >
            <Wrench className="size-7 text-red-600" />
            <div className="text-base font-medium">รถเสีย / ลากรถ</div>
          </a>
          <a
            href="tel:02-xxx-xxxx"
            className="flex flex-col items-center gap-2 border border-gray-200 bg-white p-4 text-center"
          >
            <BatteryCharging className="size-7 text-red-600" />
            <div className="text-base font-medium">แบตหมด / ชาร์จ</div>
          </a>
        </div>

        <button
          type="button"
          onClick={shareLocation}
          className="flex w-full items-center justify-center gap-2 border border-red-200 bg-red-50 px-4 py-3 text-lg text-red-700"
        >
          <MapPin className="size-5" />
          แชร์ตำแหน่งให้ทีมช่วยเหลือ
        </button>
        {location && (
          <div className=" bg-gray-100 p-3 text-base">
            <div>
              <span className="text-gray-500">ตำแหน่ง:</span>{" "}
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </div>
            <a
              href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-blue-600 underline"
            >
              เปิดใน Google Maps
            </a>
          </div>
        )}
        {error && (
          <div className=" bg-red-50 p-3 text-base text-red-700">{error}</div>
        )}
      </div>
    </FeaturePage>
  );
}
