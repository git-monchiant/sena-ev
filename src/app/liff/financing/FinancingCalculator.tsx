"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { FieldLabel } from "../_components/FeaturePage";

type Model = { slug: string; name: string; priceBaht: number | null };
type Promo = {
  slug: string;
  title: string;
  bankName: string | null;
  description: string | null;
};

export function FinancingCalculator({
  models,
  promotions,
}: {
  models: Model[];
  promotions: Promo[];
}) {
  const sp = useSearchParams();
  const modelSlug = sp.get("model") ?? "";
  const priceParam = sp.get("price");

  const presetModel = models.find((m) => m.slug === modelSlug) ?? null;
  const initialPrice = priceParam
    ? Number(priceParam)
    : (presetModel?.priceBaht ?? 1200000);

  const [selectedSlug, setSelectedSlug] = useState<string>(modelSlug);
  const [priceStr, setPriceStr] = useState<string>(String(initialPrice));
  const [downPercentStr, setDownPercentStr] = useState<string>("20");
  const [months, setMonths] = useState<number>(60);
  const [interestStr, setInterestStr] = useState<string>("3.5");

  const price = numOr(priceStr, 0);
  const downPercent = numOr(downPercentStr, 0);
  const interest = numOr(interestStr, 0);

  const calc = useMemo(() => {
    const downAmount = (price * downPercent) / 100;
    const loanAmount = price - downAmount;
    const monthlyRate = interest / 100 / 12;
    const monthly =
      monthlyRate === 0
        ? loanAmount / months
        : (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
    const totalInterest = monthly * months - loanAmount;
    return {
      downAmount: Math.round(downAmount),
      loanAmount: Math.round(loanAmount),
      monthly: Math.round(monthly),
      totalInterest: Math.round(totalInterest),
    };
  }, [price, downPercent, months, interest]);

  return (
    <>
      <section className="bg-brand p-6 text-white">
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] opacity-70">
          ค่างวด / เดือน
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-5xl font-bold tracking-tight tabular-nums">
            {calc.monthly.toLocaleString()}
          </span>
          <span className="text-base font-medium opacity-80">บาท</span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/20 pt-4">
          <ResultCell label="ดาวน์" value={calc.downAmount} />
          <ResultCell label="ยอดจัด" value={calc.loanAmount} />
          <ResultCell label="รวมดอก" value={calc.totalInterest} />
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
          ข้อมูลคำนวณ
        </div>

        {models.length > 0 && (
          <label className="mb-6 grid gap-2">
            <FieldLabel>รุ่น</FieldLabel>
            <select
              value={selectedSlug}
              onChange={(e) => {
                const slug = e.target.value;
                setSelectedSlug(slug);
                const m = models.find((x) => x.slug === slug);
                if (m?.priceBaht) setPriceStr(String(m.priceBaht));
              }}
              className="border-0 border-b border-zinc-300 bg-transparent px-0 py-2 text-base font-bold focus:border-brand focus:outline-none"
            >
              <option value="">— เลือกรุ่น —</option>
              {models.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="grid grid-cols-2 gap-x-5 gap-y-6">
          <label className="grid gap-2">
            <FieldLabel>ราคารถ (บาท)</FieldLabel>
            <input
              type="number"
              inputMode="numeric"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              className="border-0 border-b border-zinc-300 bg-transparent px-0 py-2 text-base font-bold tabular-nums focus:border-brand focus:outline-none"
            />
          </label>
          <label className="grid gap-2">
            <FieldLabel>ดาวน์ (%)</FieldLabel>
            <input
              type="number"
              inputMode="decimal"
              value={downPercentStr}
              onChange={(e) => setDownPercentStr(e.target.value)}
              className="border-0 border-b border-zinc-300 bg-transparent px-0 py-2 text-base font-bold tabular-nums focus:border-brand focus:outline-none"
            />
          </label>
          <label className="grid gap-2">
            <FieldLabel>จำนวนงวด</FieldLabel>
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="border-0 border-b border-zinc-300 bg-transparent px-0 py-2 text-base font-bold focus:border-brand focus:outline-none"
            >
              <option value={36}>36 งวด</option>
              <option value={48}>48 งวด</option>
              <option value={60}>60 งวด</option>
              <option value={72}>72 งวด</option>
              <option value={84}>84 งวด</option>
            </select>
          </label>
          <label className="grid gap-2">
            <FieldLabel>ดอกเบี้ย (%/ปี)</FieldLabel>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={interestStr}
              onChange={(e) => setInterestStr(e.target.value)}
              className="border-0 border-b border-zinc-300 bg-transparent px-0 py-2 text-base font-bold tabular-nums focus:border-brand focus:outline-none"
            />
          </label>
        </div>
      </section>

      {promotions.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
            โปรโมชั่นปัจจุบัน
          </div>
          <ul className="border-t border-zinc-200">
            {promotions.map((p) => (
              <li
                key={p.slug}
                className="flex items-start justify-between gap-4 border-b border-zinc-200 py-4"
              >
                <div className="text-base font-bold">{p.title}</div>
                <div className="text-xs font-medium text-zinc-500">
                  {p.bankName ?? "ทุกรุ่น"}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
          ตารางผ่อน {months} งวด
        </div>
        <div className="border border-zinc-200">
          <table className="w-full text-sm tabular-nums">
            <thead className="bg-zinc-50">
              <tr className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2 text-left">งวด</th>
                <th className="px-3 py-2 text-right">ค่างวด</th>
                <th className="px-3 py-2 text-right">เงินต้น</th>
                <th className="px-3 py-2 text-right">ดอกเบี้ย</th>
                <th className="px-3 py-2 text-right">คงเหลือ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(() => {
                const monthlyRate = interest / 100 / 12;
                let balance = calc.loanAmount;
                const rows = [];
                for (let i = 1; i <= months; i++) {
                  const interestPart = Math.round(balance * monthlyRate);
                  const principal = calc.monthly - interestPart;
                  balance = Math.max(balance - principal, 0);
                  rows.push(
                    <tr key={i} className="font-medium">
                      <td className="px-3 py-1.5">{i}</td>
                      <td className="px-3 py-1.5 text-right font-bold">
                        {calc.monthly.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        {principal.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 text-right text-brand">
                        {interestPart.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-500">
                        {balance.toLocaleString()}
                      </td>
                    </tr>,
                  );
                }
                return rows;
              })()}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function numOr(s: string, fallback: number): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

function ResultCell({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-70">
        {label}
      </div>
      <div className="mt-1 text-sm font-bold tabular-nums">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
