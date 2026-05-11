"use client";

import { useEffect, useState, type ReactNode } from "react";
import { closeLiff, getProfile } from "@/lib/liff";

type Profile = {
  displayName: string;
  pictureUrl?: string;
};

export function FeaturePage({
  title,
  subtitle,
  icon,
  accent = "blue",
  children,
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  accent?: "blue" | "green" | "orange" | "red" | "purple" | "yellow";
  children?: ReactNode;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) =>
        setProfile({ displayName: p.displayName, pictureUrl: p.pictureUrl }),
      )
      .catch(() => {});
  }, []);

  const accentBg: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-yellow-50 text-yellow-700",
  };

  return (
    <main className="flex min-h-screen w-full flex-col p-5">
      <header className="mb-6">
        <div
          className={`mb-3 flex size-14 items-center justify-center ${accentBg[accent]}`}
        >
          {icon}
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-lg text-gray-500">{subtitle}</p>}
        {profile && (
          <p className="mt-2 text-base text-gray-400">
            สวัสดีคุณ {profile.displayName}
          </p>
        )}
      </header>

      <div className="flex-1">{children}</div>

      <footer className="mt-8 flex gap-2">
        <button
          type="button"
          onClick={() => closeLiff()}
          className="flex-1 border border-gray-300 px-4 py-3 text-lg"
        >
          ปิด
        </button>
      </footer>
    </main>
  );
}
