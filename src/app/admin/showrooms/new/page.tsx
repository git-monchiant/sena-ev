import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ShowroomForm } from "../_ShowroomForm";

export default function NewShowroomPage() {
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
          <h2 className="text-2xl font-bold tracking-tight">เพิ่มสาขาใหม่</h2>
          <p className="text-sm text-muted-foreground">
            slug, name, address จำเป็น
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <ShowroomForm showroom={null} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
