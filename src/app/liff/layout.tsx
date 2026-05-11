"use client";

import { useEffect, useState } from "react";
import { initLiff } from "@/lib/liff";

export default function LiffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      const liff = await initLiff();
      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }
      setStatus("ready");
    })().catch((err) => {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    });
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-500">กำลังโหลด LIFF...</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="mb-2 text-lg font-semibold text-red-600">
            เปิด Mini App ไม่ได้
          </div>
          <div className="text-lg text-gray-600">{error}</div>
          <div className="mt-4 text-base text-gray-400">
            กรุณาเปิดผ่าน LINE app จาก Rich Menu ของ Sena EV
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
