import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CarForm } from "../_CarForm";

export default function NewCarPage() {
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
          <h2 className="text-2xl font-bold tracking-tight">เพิ่มรุ่นใหม่</h2>
          <p className="text-sm text-muted-foreground">
            กรอกข้อมูลพื้นฐาน (slug, brand, name จำเป็น)
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <CarForm model={null} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
