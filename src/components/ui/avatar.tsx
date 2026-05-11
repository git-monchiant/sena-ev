"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
} from "react";
import { cn } from "@/lib/utils";

type ImageStatus = "idle" | "loading" | "loaded" | "error";
type AvatarContextValue = {
  status: ImageStatus;
  setStatus: (s: ImageStatus) => void;
};
const AvatarContext = createContext<AvatarContextValue | null>(null);

type AvatarProps = ComponentProps<"span"> & { size?: "default" | "sm" | "lg" };

function Avatar({ className, size = "default", ...props }: AvatarProps) {
  const [status, setStatus] = useState<ImageStatus>("idle");
  return (
    <AvatarContext.Provider value={{ status, setStatus }}>
      <span
        data-size={size}
        className={cn(
          "relative flex size-8 shrink-0 overflow-hidden rounded-full select-none",
          size === "sm" && "size-6",
          size === "lg" && "size-10",
          className,
        )}
        {...props}
      />
    </AvatarContext.Provider>
  );
}

function AvatarImage({
  className,
  src,
  onLoad,
  onError,
  ...props
}: ComponentProps<"img">) {
  const ctx = useContext(AvatarContext);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(false);
    ctx?.setStatus("loading");
  }, [src, ctx]);
  if (!src) return null;
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      alt=""
      src={src}
      onLoad={(e) => {
        setLoaded(true);
        ctx?.setStatus("loaded");
        onLoad?.(e);
      }}
      onError={(e) => {
        ctx?.setStatus("error");
        onError?.(e);
      }}
      className={cn(
        "aspect-square size-full object-cover",
        !loaded && "opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: ComponentProps<"span">) {
  const ctx = useContext(AvatarContext);
  const show = ctx?.status !== "loaded";
  if (!show) return null;
  return (
    <span
      className={cn(
        "absolute inset-0 flex items-center justify-center rounded-full bg-muted text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
