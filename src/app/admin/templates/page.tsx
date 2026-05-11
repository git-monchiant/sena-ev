import { Card, CardContent } from "@/components/ui/card";

export default function TemplatesPage() {
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Templates</h2>
          <p className="text-sm text-muted-foreground">
            Quick reply templates สำหรับคำถามฮิต
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            ยังไม่ได้ implement — Phase B1 deliverable #5
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
