"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/liff";

type Profile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

export function LiffHomeProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => {});
  }, []);

  if (!profile) return null;

  return (
    <section className="mx-5 mt-6 flex items-center gap-3 border-t border-zinc-200 pt-4">
      {profile.pictureUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.pictureUrl}
          alt={profile.displayName}
          className="size-11 rounded-full"
        />
      )}
      <div className="flex-1">
        <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
          สวัสดี
        </div>
        <div className="text-lg font-bold">{profile.displayName}</div>
      </div>
    </section>
  );
}
