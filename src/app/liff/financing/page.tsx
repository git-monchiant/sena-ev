"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { FeaturePage } from "../_components/FeaturePage";

const MODELS: Record<string, { name: string; price: number }> = {
  "byd-atto-3": { name: "BYD Atto 3", price: 1199000 },
  "byd-dolphin": { name: "BYD Dolphin", price: 879000 },
  "mg-ep": { name: "MG EP", price: 988000 },
  "tesla-model-y": { name: "Tesla Model Y", price: 2099000 },
};

function FinancingContent() {
  const sp = useSearchParams();
  const modelSlug = sp.get("model") ?? "";
  const priceParam = sp.get("price");
  const presetModel = MODELS[modelSlug];
  const initialPrice = priceParam
    ? Number(priceParam)
    : (presetModel?.price ?? 1200000);

  const [price, setPrice] = useState<number>(initialPrice);
  const [downPercent, setDownPercent] = useState<number>(20);
  const [months, setMonths] = useState<number>(60);
  const [interest, setInterest] = useState<number>(3.5);

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
    <FeaturePage
      title="คำนวณสินเชื่อ"
      subtitle={
        presetModel
          ? `คำนวณค่างวด ${presetModel.name}`
          : "คำนวณค่างวด เปรียบเทียบสินเชื่อ"
      }
      icon={<Calculator className="size-7" />}
      accent="yellow"
    >
      <div className="grid gap-3">
        <div className=" border border-gray-200 p-4">
          <div className="mb-3 font-semibold">ข้อมูลคำนวณ</div>
          <div className="grid grid-cols-2 gap-3 text-lg">
            <label className="grid gap-1">
              <span className="text-base text-gray-500">ราคารถ (บาท)</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="rounded border border-gray-300 px-2 py-1.5"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-base text-gray-500">ดาวน์ (%)</span>
              <input
                type="number"
                value={downPercent}
                onChange={(e) => setDownPercent(Number(e.target.value))}
                className="rounded border border-gray-300 px-2 py-1.5"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-base text-gray-500">จำนวนงวด</span>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="rounded border border-gray-300 px-2 py-1.5"
              >
                <option value={36}>36 งวด</option>
                <option value={48}>48 งวด</option>
                <option value={60}>60 งวด</option>
                <option value={72}>72 งวด</option>
                <option value={84}>84 งวด</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-base text-gray-500">ดอกเบี้ย (%/ปี)</span>
              <input
                type="number"
                step="0.1"
                value={interest}
                onChange={(e) => setInterest(Number(e.target.value))}
                className="rounded border border-gray-300 px-2 py-1.5"
              />
            </label>
          </div>
        </div>

        <div className=" border border-yellow-300 bg-yellow-50 p-4">
          <div className="mb-2 text-base font-medium text-yellow-900">
            ผลการคำนวณ
          </div>
          <div className="text-center">
            <div className="text-base text-yellow-700">ค่างวด/เดือน</div>
            <div className="text-3xl font-bold text-yellow-900">
              {calc.monthly.toLocaleString()}{" "}
              <span className="text-lg">บาท</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div>
              <div className="text-yellow-700">เงินดาวน์</div>
              <div className="font-semibold">
                {calc.downAmount.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-yellow-700">ยอดจัดสินเชื่อ</div>
              <div className="font-semibold">
                {calc.loanAmount.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-yellow-700">รวมดอก</div>
              <div className="font-semibold">
                {calc.totalInterest.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <details className=" border border-gray-200 p-3">
          <summary className="cursor-pointer text-lg font-medium">
            ดูตารางผ่อน {months} งวด
          </summary>
          <div className="mt-3 max-h-60 overflow-y-auto rounded border border-gray-200">
            <table className="w-full text-base">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-2 py-1.5 text-left">งวด</th>
                  <th className="px-2 py-1.5 text-right">ค่างวด</th>
                  <th className="px-2 py-1.5 text-right">เงินต้น</th>
                  <th className="px-2 py-1.5 text-right">ดอกเบี้ย</th>
                  <th className="px-2 py-1.5 text-right">คงเหลือ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(() => {
                  const monthlyRate = interest / 100 / 12;
                  let balance = calc.loanAmount;
                  const rows = [];
                  for (let i = 1; i <= months; i++) {
                    const interestPart = Math.round(balance * monthlyRate);
                    const principal = calc.monthly - interestPart;
                    balance = Math.max(balance - principal, 0);
                    rows.push(
                      <tr key={i}>
                        <td className="px-2 py-1">{i}</td>
                        <td className="px-2 py-1 text-right">
                          {calc.monthly.toLocaleString()}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {principal.toLocaleString()}
                        </td>
                        <td className="px-2 py-1 text-right text-yellow-700">
                          {interestPart.toLocaleString()}
                        </td>
                        <td className="px-2 py-1 text-right text-gray-500">
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
        </details>

        <div className=" border border-gray-200 p-4">
          <div className="mb-2 font-semibold">โปรโมชั่นปัจจุบัน</div>
          <ul className="space-y-2 text-lg">
            <li className=" bg-yellow-50 p-2 text-yellow-900">
              ดอกเบี้ย 1.99% นาน 48 เดือน (ธ.กรุงเทพ)
            </li>
            <li className=" bg-yellow-50 p-2 text-yellow-900">
              ฟรีประกันชั้น 1 ปีแรก
            </li>
          </ul>
        </div>
      </div>
    </FeaturePage>
  );
}

export default function FinancingPage() {
  return (
    <Suspense fallback={null}>
      <FinancingContent />
    </Suspense>
  );
}
