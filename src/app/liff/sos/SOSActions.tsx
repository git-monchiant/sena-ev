"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

export function SOSActions() {
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
    <>
      <button
        type="button"
        onClick={shareLocation}
        className="mt-3 flex w-full items-center justify-center gap-2 border border-red-300 bg-red-50 px-4 py-4 text-red-700"
      >
        <MapPin className="size-5" strokeWidth={2.5} />
        <span className="text-base font-bold">แชร์ตำแหน่งให้ทีมช่วยเหลือ</span>
      </button>

      {location && (
        <div className="mt-3 border-l-2 border-red-600 bg-zinc-50 p-4">
          <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            ตำแหน่งปัจจุบัน
          </div>
          <div className="mt-1 text-sm font-bold tabular-nums">
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </div>
          <a
            href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-bold text-brand underline"
          >
            เปิดใน Google Maps
          </a>
        </div>
      )}
      {error && (
        <div className="mt-3 border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
    </>
  );
}
