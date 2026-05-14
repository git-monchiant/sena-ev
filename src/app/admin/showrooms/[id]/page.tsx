import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getShowroomById } from "@/lib/showrooms";
import { ShowroomForm } from "../_ShowroomForm";

export const dynamic = "force-dynamic";

export default async function EditShowroomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const showroom = await getShowroomById(id);
  if (!showroom) notFound();

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/showrooms"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          กลับไปรายการ
        </Link>

        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            แก้ไข {showroom.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            slug: <span className="font-mono">{showroom.slug}</span>
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <ShowroomForm showroom={showroom} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
