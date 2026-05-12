"use client";

import { type ReactNode } from "react";

export function FeaturePage({
  eyebrow,
  title,
  subtitle,
  tone = "default",
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  tone?: "default" | "danger";
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const isDanger = tone === "danger";

  return (
    <main className="flex min-h-screen w-full flex-col bg-white text-zinc-900">
      <header className="px-5 pt-6 pb-7">
        {eyebrow && (
          <div
            className={`mb-3 text-[11px] font-medium uppercase tracking-[0.22em] ${
              isDanger ? "text-red-600" : "text-brand"
            }`}
          >
            {eyebrow}
          </div>
        )}
        <h1 className="text-[2.25rem] font-bold leading-[1.05] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-md text-base font-medium leading-relaxed text-zinc-500">
            {subtitle}
          </p>
        )}
        <div
          className={`mt-6 h-px w-12 ${isDanger ? "bg-red-600" : "bg-brand"}`}
        />
      </header>

      <div className="flex-1 px-5 pb-10">{children}</div>

      {footer && <div className="px-5 pb-8">{footer}</div>}
    </main>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
      {children}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
      {children}
    </span>
  );
}
