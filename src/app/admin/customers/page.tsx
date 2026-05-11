import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { query } from "@/lib/db";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CustomerRow = {
  id: string;
  line_user_id: string;
  display_name: string | null;
  picture_url: string | null;
  state: "LEAD" | "OWNER";
  phone: string | null;
  followed_at: Date | null;
};

const STATE_BADGE: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-700 border-purple-200",
  LEAD: "bg-blue-100 text-blue-700 border-blue-200",
};

export default async function CustomersPage() {
  let rows: CustomerRow[] = [];
  let error: string | null = null;
  try {
    const result = await query<CustomerRow>(
      `SELECT id, line_user_id, display_name, picture_url, state, phone, followed_at
       FROM sena_ev.customers
       ORDER BY followed_at DESC NULLS LAST
       LIMIT 200`,
    );
    rows = result.rows;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
          <p className="text-sm text-muted-foreground">
            ลูกค้าที่ add OA ทั้งหมด ({rows.length})
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>เบอร์</TableHead>
                  <TableHead>Add OA เมื่อ</TableHead>
                  <TableHead>LINE userId</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-muted-foreground"
                    >
                      ยังไม่มีลูกค้า
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            {c.picture_url && <AvatarImage src={c.picture_url} />}
                            <AvatarFallback>
                              {(c.display_name ?? "?").charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{c.display_name ?? "ไม่ทราบชื่อ"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            STATE_BADGE[c.state] ?? "bg-muted",
                          )}
                        >
                          {c.state}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.phone ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.followed_at
                          ? new Date(c.followed_at).toLocaleString("th-TH")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <code className="text-[10px] text-muted-foreground">
                          {c.line_user_id}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
