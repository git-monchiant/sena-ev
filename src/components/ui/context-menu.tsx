"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  x: number;
  y: number;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

function ContextMenu({ x, y, open, onClose, children, className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function dismiss(e: Event) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", dismiss);
    document.addEventListener("keydown", onKey);
    window.addEventListener("blur", onClose);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("mousedown", dismiss);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onClose);
      window.removeEventListener("resize", onClose);
    };
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 8;
    let nx = x;
    let ny = y;
    if (nx + rect.width + pad > vw) nx = Math.max(pad, vw - rect.width - pad);
    if (ny + rect.height + pad > vh) ny = Math.max(pad, vh - rect.height - pad);
    el.style.left = `${nx}px`;
    el.style.top = `${ny}px`;
  }, [open, x, y]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      role="menu"
      style={{ position: "fixed", left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "z-[100] min-w-[220px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}

type ItemProps = ComponentProps<"button"> & {
  inset?: boolean;
  destructive?: boolean;
  onSelect?: () => void;
};

function ContextMenuItem({
  className,
  onClick,
  onSelect,
  disabled,
  destructive,
  children,
  ...props
}: ItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        onSelect?.();
      }}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        destructive &&
          "text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function ContextMenuLabel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-xs font-semibold text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ContextMenuSeparator({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
  );
}

function ContextMenuShortcut({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "ml-auto pl-4 text-xs tracking-widest text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  ContextMenu,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
};