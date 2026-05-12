import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getCarModelById } from "@/lib/car-models";
import { CarForm } from "../_CarForm";

export const dynamic = "force-dynamic";

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const model = await getCarModelById(id);
  if (!model) notFound();

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/cars"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          กลับไปรายการ
        </Link>

        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            แก้ไข {model.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {model.brand} · slug: <span className="font-mono">{model.slug}</span>
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <CarForm model={model} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
