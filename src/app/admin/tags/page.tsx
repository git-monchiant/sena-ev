import { X } from "lucide-react";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createTag, deactivateTag, listAllTags, type TagCategory } from "@/lib/tags";

export const dynamic = "force-dynamic";

async function createTagAction(formData: FormData) {
  "use server";
  const name = (formData.get("name") as string | null)?.trim();
  const category = formData.get("category") as TagCategory | null;
  const color = formData.get("color") as string | null;
  if (!name || !category) throw new Error("name + category required");
  await createTag({ name, category, color: color ?? undefined });
  revalidatePath("/admin/tags");
}

async function deactivateTagAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (!id) throw new Error("id required");
  await deactivateTag(id);
  revalidatePath("/admin/tags");
}

const CATEGORY_LABEL: Record<TagCategory, string> = {
  intent: "ความสนใจ",
  model: "รุ่นรถ",
  service: "บริการ",
  other: "อื่น ๆ",
};

export default async function TagsAdminPage() {
  const tags = await listAllTags();
  const grouped: Record<TagCategory, typeof tags> = {
    intent: [],
    model: [],
    service: [],
    other: [],
  };
  for (const t of tags) grouped[t.category].push(t);

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Tags</h2>
          <p className="text-sm text-muted-foreground">
            จัดการ tag ที่ใช้ label ลูกค้า ({tags.length} active)
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">สร้าง tag ใหม่</CardTitle>
            <CardDescription>
              เลือกหมวด + ระบุชื่อ + สี ตามต้องการ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={createTagAction}
              className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_120px_auto]"
            >
              <Input
                name="name"
                type="text"
                placeholder="ชื่อ tag เช่น 'สนใจ BYD Sealion'"
                required
              />
              <select
                name="category"
                required
                defaultValue="intent"
                className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs"
              >
                <option value="intent">ความสนใจ</option>
                <option value="model">รุ่นรถ</option>
                <option value="service">บริการ</option>
                <option value="other">อื่น ๆ</option>
              </select>
              <Input
                name="color"
                type="color"
                defaultValue="#3b82f6"
                className="h-9 p-1"
              />
              <Button type="submit">สร้าง</Button>
            </form>
          </CardContent>
        </Card>

        {(["intent", "model", "service", "other"] as const).map((cat) => (
          <section key={cat} className="mb-6">
            <h3 className="mb-2 text-sm font-semibold">
              {CATEGORY_LABEL[cat]}{" "}
              <span className="text-muted-foreground">
                ({grouped[cat].length})
              </span>
            </h3>
            {grouped[cat].length === 0 ? (
              <Card>
                <CardContent className="py-4 text-center text-xs text-muted-foreground">
                  ยังไม่มี tag
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-wrap gap-2">
                {grouped[cat].map((t) => (
                  <div
                    key={t.id}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
                    style={{
                      borderColor: `${t.color}60`,
                      backgroundColor: `${t.color}1f`,
                      color: t.color,
                    }}
                  >
                    <span className="text-xs font-medium">{t.name}</span>
                    <form action={deactivateTagAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <button
                        type="submit"
                        className="opacity-60 hover:opacity-100"
                        title="ลบ"
                      >
                        <X className="size-3" />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
