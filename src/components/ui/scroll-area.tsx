"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Simple wrapper — native browser scrollbar
function ScrollArea({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("overflow-y-auto", className)} {...props}>
      {children}
    </div>
  );
}

function ScrollBar({ className, ...props }: ComponentProps<"div">) {
  return <div className={className} {...props} />;
}

export { ScrollArea, ScrollBar };
