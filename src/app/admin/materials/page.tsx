import { Card, CardContent } from "@/components/ui/card";

export default function MaterialsPage() {
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Materials</h2>
          <p className="text-sm text-muted-foreground">
            คลังเอกสาร / รูป / brochure ที่ agent ใช้ส่งให้ลูกค้าผ่าน Flex Message
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            ยังไม่ได้ implement — Phase B1 deliverable #4
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
