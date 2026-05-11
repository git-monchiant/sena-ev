"use client";

// Stub — uses native browser tooltips via title attr instead of Radix.
// Kept for backward-compat with previous shadcn imports.

import type { ReactNode } from "react";

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function TooltipContent({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
