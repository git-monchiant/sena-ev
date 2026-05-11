"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type DropdownContext = {
  open: boolean;
  setOpen: (v: boolean) => void;
  align: "start" | "center" | "end";
};

const Ctx = createContext<DropdownContext | null>(null);

function useDropdown() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("DropdownMenu.* must be used inside DropdownMenu");
  return ctx;
}

function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <Ctx.Provider value={{ open, setOpen, align: "start" }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </Ctx.Provider>
  );
}

type TriggerProps = ComponentProps<"button"> & { asChild?: boolean };

function DropdownMenuTrigger({
  asChild,
  children,
  onClick,
  ...props
}: TriggerProps) {
  const ctx = useDropdown();
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    ctx.setOpen(!ctx.open);
    onClick?.(e);
  };
  if (asChild && isValidElement(children)) {
    const child = Children.only(children) as ReactElement<{
      onClick?: (e: React.MouseEvent) => void;
    }>;
    return cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        ctx.setOpen(!ctx.open);
        child.props.onClick?.(e);
      },
    });
  }
  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

type ContentProps = ComponentProps<"div"> & {
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

function DropdownMenuContent({
  className,
  align = "start",
  children,
  ...props
}: ContentProps) {
  const ctx = useDropdown();
  if (!ctx.open) return null;
  const alignClass =
    align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";
  return (
    <div
      role="menu"
      className={cn(
        "absolute top-full z-50 mt-1 min-w-[10rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        alignClass,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type ItemProps = ComponentProps<"button"> & {
  onSelect?: () => void;
  inset?: boolean;
};

function DropdownMenuItem({
  className,
  disabled,
  onClick,
  onSelect,
  children,
  ...props
}: ItemProps) {
  const ctx = useDropdown();
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        onSelect?.();
        if (!disabled) ctx.setOpen(false);
      }}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<"div"> & { inset?: boolean }) {
  return (
    <div
      className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
  );
}

function DropdownMenuGroup({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function DropdownMenuPortal({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function DropdownMenuShortcut({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem(props: ItemProps) {
  return <DropdownMenuItem {...props} />;
}

function DropdownMenuRadioGroup({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function DropdownMenuRadioItem(props: ItemProps) {
  return <DropdownMenuItem {...props} />;
}

function DropdownMenuSub({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function DropdownMenuSubTrigger(props: ItemProps) {
  return <DropdownMenuItem {...props} />;
}

function DropdownMenuSubContent(props: ContentProps) {
  return <DropdownMenuContent {...props} />;
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
