import { Children, cloneElement, isValidElement, type ComponentProps, type ReactElement } from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";
type Size = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";

const VARIANTS: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-white hover:bg-destructive/90",
  outline: "border bg-background hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
};

const SIZES: Record<Size, string> = {
  default: "h-9 px-4 py-2 has-[>svg]:px-3",
  xs: "h-6 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
  sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
  lg: "h-10 px-6 has-[>svg]:px-4",
  icon: "size-9",
  "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
  "icon-sm": "size-8",
  "icon-lg": "size-10",
};

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
};

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const cls = cn(BASE, VARIANTS[variant], SIZES[size], className);
  if (asChild && isValidElement(children)) {
    const child = Children.only(children) as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      className: cn(cls, child.props.className),
      ...props,
    });
  }
  return (
    <button data-variant={variant} data-size={size} className={cls} {...props}>
      {children}
    </button>
  );
}

export { Button };
