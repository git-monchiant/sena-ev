import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveCarModels } from "@/lib/car-models";
import { getPromotionById } from "@/lib/promotions";
import { PromotionForm } from "../_PromotionForm";

export const dynamic = "force-dynamic";

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [promo, cars] = await Promise.all([
    getPromotionById(id),
    getActiveCarModels(),
  ]);
  if (!promo) notFound();

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/promotions"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          กลับไปรายการ
        </Link>

        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            แก้ไข {promo.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            slug: <span className="font-mono">{promo.slug}</span>
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <PromotionForm promo={promo} cars={cars} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
