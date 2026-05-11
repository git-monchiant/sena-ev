import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createRichMenuAction } from "../actions";

const EXAMPLE_JSON = `{
  "size": { "width": 2500, "height": 1686 },
  "selected": true,
  "name": "Sena EV Main Menu",
  "chatBarText": "เมนู",
  "areas": [
    {
      "bounds": { "x": 0, "y": 0, "width": 1250, "height": 843 },
      "action": {
        "type": "uri",
        "uri": "https://liff.line.me/2010044475-NMWXyRv3"
      }
    },
    {
      "bounds": { "x": 1250, "y": 0, "width": 1250, "height": 843 },
      "action": { "type": "message", "text": "ทดลองขับ" }
    },
    {
      "bounds": { "x": 0, "y": 843, "width": 1250, "height": 843 },
      "action": { "type": "message", "text": "เซอร์วิส" }
    },
    {
      "bounds": { "x": 1250, "y": 843, "width": 1250, "height": 843 },
      "action": { "type": "message", "text": "ติดต่อ" }
    }
  ]
}`;

export default function NewRichMenuPage() {
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl">
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/admin/richmenu">
            <ArrowLeft className="size-4" />
            กลับ
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>สร้าง Rich Menu</CardTitle>
            <CardDescription>
              วาง JSON config + อัปโหลดรูป (ขนาดต้องตรงกับ size ใน JSON)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createRichMenuAction} className="grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Rich Menu JSON</span>
                <Textarea
                  name="menu"
                  rows={20}
                  required
                  defaultValue={EXAMPLE_JSON}
                  className="font-mono text-xs"
                />
                <span className="text-xs text-muted-foreground">
                  ดูเอกสาร:{" "}
                  <a
                    href="https://developers.line.biz/en/reference/messaging-api/#rich-menu-object"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Rich Menu Object
                  </a>
                </span>
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium">รูปภาพ Rich Menu</span>
                <Input
                  type="file"
                  name="image"
                  accept="image/png,image/jpeg"
                  required
                />
                <span className="text-xs text-muted-foreground">
                  PNG/JPEG, ขนาดต้องตรงกับ size ใน JSON (เช่น 2500×1686)
                </span>
              </label>

              <div className="flex justify-end gap-2">
                <Button asChild variant="outline">
                  <Link href="/admin/richmenu">ยกเลิก</Link>
                </Button>
                <Button type="submit">สร้าง Rich Menu</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
