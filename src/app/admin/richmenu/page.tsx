import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDefaultRichMenuId, listRichMenus } from "@/lib/line/richmenu";
import {
  clearDefaultAction,
  deleteRichMenuAction,
  setDefaultAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function RichMenuAdminPage() {
  let menus: Awaited<ReturnType<typeof listRichMenus>> = [];
  let defaultId: string | null = null;
  let error: string | null = null;

  try {
    [menus, defaultId] = await Promise.all([
      listRichMenus(),
      getDefaultRichMenuId(),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Rich Menu</h2>
            <p className="text-sm text-muted-foreground">
              จัดการ Rich Menu ของ OA Sena EV
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/richmenu/new">
              <Plus className="size-4" />
              สร้างเมนูใหม่
            </Link>
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {defaultId && (
          <Card className="mb-4 border-primary/30 bg-primary/5">
            <CardContent className="flex items-center justify-between py-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Default menu: </span>
                <code className="font-mono text-xs">{defaultId}</code>
              </div>
              <form action={clearDefaultAction}>
                <Button type="submit" variant="outline" size="sm">
                  ยกเลิก default
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {menus.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              ยังไม่มี Rich Menu — กด &quot;สร้างเมนูใหม่&quot; เพื่อเริ่ม
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {menus.map((m) => (
              <Card key={m.richMenuId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{m.name}</CardTitle>
                      <CardDescription>
                        chatBar: {m.chatBarText} · size: {m.size?.width}×
                        {m.size?.height} · areas: {m.areas?.length ?? 0}
                      </CardDescription>
                      <code className="mt-1 text-[10px] text-muted-foreground">
                        {m.richMenuId}
                      </code>
                    </div>
                    {m.richMenuId === defaultId && (
                      <Badge variant="default">DEFAULT</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {m.richMenuId !== defaultId && (
                      <form action={setDefaultAction}>
                        <input type="hidden" name="id" value={m.richMenuId} />
                        <Button type="submit" variant="outline" size="sm">
                          ตั้งเป็น default
                        </Button>
                      </form>
                    )}
                    <form action={deleteRichMenuAction}>
                      <input type="hidden" name="id" value={m.richMenuId} />
                      <Button
                        type="submit"
                        variant="destructive"
                        size="sm"
                      >
                        ลบ
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
