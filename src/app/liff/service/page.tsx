import { FeaturePage } from "../_components/FeaturePage";
import { getActiveServiceTypes } from "@/lib/service-types";
import { getActiveShowrooms } from "@/lib/showrooms";
import { ServiceBookingForm } from "./ServiceBookingForm";

export const dynamic = "force-dynamic";

export default async function ServicePage() {
  const [serviceTypes, showrooms] = await Promise.all([
    getActiveServiceTypes(),
    getActiveShowrooms(),
  ]);

  return (
    <FeaturePage
      eyebrow="Service Booking"
      title="จองเซอร์วิส"
      subtitle="เลือกประเภทบริการ ศูนย์ วันที่ และเวลา"
    >
      <ServiceBookingForm
        serviceTypes={serviceTypes.map((t) => ({
          slug: t.slug,
          label: t.nameEn ? `${t.nameTh} (${t.nameEn})` : t.nameTh,
        }))}
        showrooms={showrooms
          .filter((s) => s.services.includes("service"))
          .map((s) => ({
            slug: s.slug,
            label: s.name.replace("Sena Green Auto", "Sena Service"),
          }))}
      />
    </FeaturePage>
  );
}
