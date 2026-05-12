"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BatteryCharging,
  Car as CarIcon,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { FeaturePage } from "../_components/FeaturePage";
import { getProfile } from "@/lib/liff";

type Vehicle = {
  id: string;
  modelName: string | null;
  modelBrand: string | null;
  color: string | null;
  licensePlate: string | null;
  vin: string | null;
  deliveredAt: string | null;
  warrantyUntil: string | null;
  batteryPct: number | null;
  batteryUpdatedAt: string | null;
  nextServiceDueAt: string | null;
  primaryShowroomName: string | null;
};

type Insurance = {
  provider: string;
  class: string;
  validTo: string | null;
};

export default function MyCarPage() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [insurance, setInsurance] = useState<Insurance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile();
        const res = await fetch(
          `/api/liff/me/vehicle?lineUserId=${encodeURIComponent(profile.userId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          setError("โหลดข้อมูลไม่สำเร็จ");
          return;
        }
        const data = (await res.json()) as {
          vehicle: Vehicle | null;
          insurance: Insurance | null;
        };
        setVehicle(data.vehicle);
        setInsurance(data.insurance);
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <FeaturePage
        eyebrow="My Vehicle"
        title="รถของฉัน"
        subtitle="ข้อมูลรถ ทะเบียน ประกัน และนัดเซอร์วิสครั้งต่อไป"
      >
        <div className="py-8 text-sm font-medium text-zinc-500">
          กำลังโหลด…
        </div>
      </FeaturePage>
    );
  }

  if (error) {
    return (
      <FeaturePage
        eyebrow="My Vehicle"
        title="รถของฉัน"
        subtitle="ข้อมูลรถ ทะเบียน ประกัน และนัดเซอร์วิสครั้งต่อไป"
      >
        <div className="py-8 text-sm font-medium text-red-600">{error}</div>
      </FeaturePage>
    );
  }

  if (!vehicle) {
    return (
      <FeaturePage
        eyebrow="My Vehicle"
        title="รถของฉัน"
        subtitle="คุณยังไม่ได้ลงทะเบียนรถกับ Sena EV"
      >
        <div className="border-t border-zinc-200 py-8 text-center">
          <CarIcon
            className="mx-auto size-10 text-zinc-300"
            strokeWidth={1.5}
          />
          <p className="mt-4 text-sm font-medium text-zinc-500">
            ยังไม่พบรถในระบบ — หากคุณเพิ่งซื้อรถ
            <br />
            ติดต่อทีมงานเพื่อยืนยันความเป็นเจ้าของ
          </p>
        </div>
      </FeaturePage>
    );
  }

  const modelLabel = [vehicle.modelBrand, vehicle.modelName]
    .filter(Boolean)
    .join(" ");
  const deliveredLabel = vehicle.deliveredAt
    ? new Date(vehicle.deliveredAt).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      })
    : "—";
  const warrantyLabel = vehicle.warrantyUntil
    ? `ถึง ${new Date(vehicle.warrantyUntil).getFullYear() + 543}`
    : "—";
  const serviceLabel = vehicle.nextServiceDueAt
    ? `${new Date(vehicle.nextServiceDueAt).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      })} · ${new Date(vehicle.nextServiceDueAt).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "ยังไม่ได้นัด";
  const insuranceDaysLeft = insurance?.validTo
    ? Math.max(
        0,
        Math.ceil(
          (new Date(insurance.validTo).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;
  const batteryAge = vehicle.batteryUpdatedAt
    ? formatBatteryAge(vehicle.batteryUpdatedAt)
    : null;

  return (
    <FeaturePage
      eyebrow="My Vehicle"
      title="รถของฉัน"
      subtitle="ข้อมูลรถ ทะเบียน ประกัน และนัดเซอร์วิสครั้งต่อไป"
    >
      <section className="bg-brand p-6 text-white">
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] opacity-70">
          Your EV
        </div>
        <div className="mt-2 text-3xl font-bold tracking-tight">
          {modelLabel || "EV ของคุณ"}
        </div>
        <div className="mt-1 text-sm font-medium opacity-80">
          {[vehicle.color, vehicle.deliveredAt
            ? `ปี ${new Date(vehicle.deliveredAt).getFullYear() + 543}`
            : null]
            .filter(Boolean)
            .join(" · ")}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
          <Spec label="ทะเบียน" value={vehicle.licensePlate ?? "—"} />
          <Spec
            label="VIN"
            value={vehicle.vin ? `${vehicle.vin.slice(0, 8)}…` : "—"}
            mono
          />
          <Spec label="วันส่งมอบ" value={deliveredLabel} />
          <Spec label="รับประกัน" value={warrantyLabel} />
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
          สถานะปัจจุบัน
        </div>
        <div className="border-t border-zinc-200">
          <Row
            Icon={Wrench}
            label="เซอร์วิสครั้งต่อไป"
            value={serviceLabel}
            sub={vehicle.primaryShowroomName ?? ""}
          />
          {insurance && (
            <Row
              Icon={ShieldCheck}
              label="ประกันรถยนต์"
              value={`ชั้น ${insurance.class}`}
              sub={
                insuranceDaysLeft != null
                  ? `เหลือ ${insuranceDaysLeft} วัน · ${insurance.provider}`
                  : insurance.provider
              }
            />
          )}
          {vehicle.batteryPct != null && (
            <Row
              Icon={BatteryCharging}
              label="แบตเตอรี่"
              value={`${vehicle.batteryPct}%`}
              sub={batteryAge ?? ""}
            />
          )}
        </div>
      </section>

      <Link
        href="/liff/service"
        className="mt-6 flex items-center justify-between bg-brand px-4 py-4 text-white"
      >
        <span className="text-base font-bold">จองเซอร์วิสครั้งต่อไป</span>
        <ArrowRight className="size-5" strokeWidth={2.5} />
      </Link>
    </FeaturePage>
  );
}

function Spec({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-70">
        {label}
      </div>
      <div className={`mt-1 text-base font-bold ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function Row({
  Icon,
  label,
  value,
  sub,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-zinc-200 py-4">
      <Icon className="mt-0.5 size-5 text-brand" strokeWidth={2} />
      <div className="flex-1">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
          {label}
        </div>
        <div className="mt-0.5 text-base font-bold">{value}</div>
        {sub && <div className="text-sm font-medium text-zinc-500">{sub}</div>}
      </div>
    </div>
  );
}

function formatBatteryAge(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hr = Math.floor(diffMs / (1000 * 60 * 60));
  if (hr < 1) return "ชาร์จล่าสุดเมื่อสักครู่";
  if (hr < 24) return `ชาร์จล่าสุดเมื่อ ${hr} ชม. ที่แล้ว`;
  return `ชาร์จล่าสุดเมื่อ ${Math.floor(hr / 24)} วันที่แล้ว`;
}
