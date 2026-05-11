"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs.* must be used inside <Tabs>");
  return ctx;
}

type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
} & Omit<ComponentProps<"div">, "onChange">;

function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  const baseId = useId();
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = value ?? internal;
  const setValue = (v: string) => {
    if (value === undefined) setInternal(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value: current, setValue, baseId }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      role="tablist"
      className={cn("inline-flex items-center", className)}
      {...props}
    />
  );
}

type TabsTriggerProps = ComponentProps<"button"> & { value: string };

function TabsTrigger({ value, className, ...props }: TabsTriggerProps) {
  const ctx = useTabs();
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-state={active ? "active" : "inactive"}
      id={`${ctx.baseId}-trigger-${value}`}
      aria-controls={`${ctx.baseId}-content-${value}`}
      onClick={() => ctx.setValue(value)}
      className={className}
      {...props}
    />
  );
}

type TabsContentProps = ComponentProps<"div"> & { value: string };

function TabsContent({ value, className, ...props }: TabsContentProps) {
  const ctx = useTabs();
  if (ctx.value !== value) return null;
  return (
    <div
      role="tabpanel"
      data-state="active"
      id={`${ctx.baseId}-content-${value}`}
      aria-labelledby={`${ctx.baseId}-trigger-${value}`}
      className={className}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
