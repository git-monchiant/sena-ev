import { Suspense } from "react";
import { FeaturePage } from "../_components/FeaturePage";
import { getActiveCarModels } from "@/lib/car-models";
import { getActiveShowrooms } from "@/lib/showrooms";
import { TestDriveForm } from "./TestDriveForm";

export const dynamic = "force-dynamic";

export default async function TestDrivePage() {
  const [models, showrooms] = await Promise.all([
    getActiveCarModels(),
    getActiveShowrooms(),
  ]);
  return (
    <FeaturePage
      eyebrow="Test Drive"
      title="จองทดลองขับ"
      subtitle="เลือกรุ่น โชว์รูม วันเวลา — เราจะติดต่อยืนยันภายใน 1 ชั่วโมง"
    >
      <Suspense fallback={null}>
        <TestDriveForm
          models={models.map((m) => ({ slug: m.slug, name: m.name }))}
          showrooms={showrooms
            .filter((s) => s.services.includes("test_drive"))
            .map((s) => ({ slug: s.slug, name: s.name }))}
        />
      </Suspense>
    </FeaturePage>
  );
}
