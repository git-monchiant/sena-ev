import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "destructive" | "outline" | "ghost";

const VARIANTS: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive text-white",
  outline: "border border-border text-foreground",
  ghost: "",
};

const BASE =
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3";

function Badge({
  className,
  variant = "default",
  ...props
}: ComponentProps<"span"> & { variant?: Variant }) {
  return (
    <span
      data-variant={variant}
      className={cn(BASE, VARIANTS[variant], className)}
      {...props}
    />
  );
}

export { Badge };
