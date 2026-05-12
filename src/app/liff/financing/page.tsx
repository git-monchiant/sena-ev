import { Suspense } from "react";
import { FeaturePage } from "../_components/FeaturePage";
import { getActiveCarModels } from "@/lib/car-models";
import { getActivePromotions } from "@/lib/promotions";
import { FinancingCalculator } from "./FinancingCalculator";

export const dynamic = "force-dynamic";

export default async function FinancingPage() {
  const [models, promotions] = await Promise.all([
    getActiveCarModels(),
    getActivePromotions(),
  ]);
  return (
    <FeaturePage
      eyebrow="Loan Calculator"
      title="คำนวณสินเชื่อ"
      subtitle="ปรับเงินดาวน์ จำนวนงวด และดอกเบี้ยเพื่อดูค่างวดต่อเดือน"
    >
      <Suspense fallback={null}>
        <FinancingCalculator
          models={models.map((m) => ({
            slug: m.slug,
            name: m.name,
            priceBaht: m.priceBaht,
          }))}
          promotions={promotions.map((p) => ({
            slug: p.slug,
            title: p.title,
            bankName: p.bankName ?? null,
            description: p.description ?? null,
          }))}
        />
      </Suspense>
    </FeaturePage>
  );
}
