"use client";

import { useEffect, useState } from "react";
import { MapPin, MessageSquare, QrCode, X } from "lucide-react";
import {
  closeLiff,
  getLiffContext,
  getProfile,
  scanQRCode,
  sendTextMessage,
} from "@/lib/liff";

type Profile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

type Context = Awaited<ReturnType<typeof getLiffContext>>;

export default function LiffHome() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ctx, setCtx] = useState<Context | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    (async () => {
      const [p, c] = await Promise.all([getProfile(), getLiffContext()]);
      setProfile(p);
      setCtx(c);
    })().catch((err) =>
      setMessage(`โหลด profile ไม่ได้: ${err.message ?? err}`),
    );
  }, []);

  async function handleSendMessage() {
    setBusy(true);
    try {
      await sendTextMessage("ทดสอบส่งข้อความจาก Sena EV Mini App");
      setMessage("ส่งข้อความเรียบร้อย — ปิด app เพื่อดูใน chat");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleScan() {
    setBusy(true);
    try {
      const value = await scanQRCode();
      setMessage(`สแกนได้: ${value ?? "(ไม่มีค่า)"}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleLocation() {
    setBusy(true);
    setMessage("");
    if (!("geolocation" in navigator)) {
      setMessage("เบราว์เซอร์ไม่รองรับ geolocation");
      setBusy(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMessage(
          `ตำแหน่ง: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        );
        setBusy(false);
      },
      (err) => {
        setMessage(`ดึงตำแหน่งไม่ได้: ${err.message}`);
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <main className="w-full p-5">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Sena EV</h1>
        <p className="text-lg text-gray-500">Mini App</p>
      </header>

      {profile && (
        <section className="mb-6 flex items-center gap-3 border border-gray-200 p-4">
          {profile.pictureUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.pictureUrl}
              alt={profile.displayName}
              className="h-12 w-12 rounded-full"
            />
          )}
          <div>
            <div className="font-semibold">{profile.displayName}</div>
            {profile.statusMessage && (
              <div className="text-base text-gray-500">
                {profile.statusMessage}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="mb-6 grid gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={handleSendMessage}
          className="flex items-center justify-center gap-2 bg-green-600 px-4 py-3 text-white disabled:opacity-50"
        >
          <MessageSquare className="size-5" />
          ส่งข้อความเข้า chat
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleScan}
          className="flex items-center justify-center gap-2 bg-blue-600 px-4 py-3 text-white disabled:opacity-50"
        >
          <QrCode className="size-5" />
          สแกน QR Code
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleLocation}
          className="flex items-center justify-center gap-2 bg-purple-600 px-4 py-3 text-white disabled:opacity-50"
        >
          <MapPin className="size-5" />
          ดึงตำแหน่งปัจจุบัน
        </button>
        <button
          type="button"
          onClick={() => closeLiff()}
          className="flex items-center justify-center gap-2 border border-gray-300 px-4 py-3"
        >
          <X className="size-5" />
          ปิด Mini App
        </button>
      </section>

      {message && (
        <section className=" bg-gray-100 p-3 text-lg">{message}</section>
      )}

      {ctx && (
        <details className="mt-6 text-base text-gray-400">
          <summary>LIFF context</summary>
          <pre className="mt-2 whitespace-pre-wrap">
            {JSON.stringify(ctx, null, 2)}
          </pre>
        </details>
      )}
    </main>
  );
}
