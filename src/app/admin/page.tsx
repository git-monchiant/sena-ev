import Link from "next/link";
import {
  FolderOpen,
  Inbox as InboxIcon,
  LayoutGrid,
  MessageSquareText,
  Tag as TagIcon,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type Stats = {
  total_customers: number;
  total_leads: number;
  follow_leads: number;
  active_today: number;
};

async function getStats(): Promise<Stats> {
  try {
    const result = await query<{
      total_customers: string;
      total_leads: string;
      follow_leads: string;
      active_today: string;
    }>(
      `SELECT
         (SELECT count(*) FROM sena_ev.customers)                                    AS total_customers,
         (SELECT count(*) FROM sena_ev.leads)                                        AS total_leads,
         (SELECT count(*) FROM sena_ev.leads WHERE type = 'follow')                  AS follow_leads,
         (SELECT count(*) FROM sena_ev.webhook_events
            WHERE received_at >= now() - interval '24 hours')                        AS active_today`,
    );
    const row = result.rows[0]!;
    return {
      total_customers: Number(row.total_customers),
      total_leads: Number(row.total_leads),
      follow_leads: Number(row.follow_leads),
      active_today: Number(row.active_today),
    };
  } catch {
    return { total_customers: 0, total_leads: 0, follow_leads: 0, active_today: 0 };
  }
}

const QUICK_LINKS = [
  {
    href: "/admin/inbox",
    title: "Inbox",
    description: "คุยกับลูกค้า + ดู event ใหม่ realtime",
    icon: InboxIcon,
  },
  {
    href: "/admin/customers",
    title: "Customers",
    description: "ดูลูกค้าทั้งหมดที่ add OA",
    icon: Users,
  },
  {
    href: "/admin/tags",
    title: "Tags",
    description: "จัดการ tag เพื่อจำแนกลูกค้า",
    icon: TagIcon,
  },
  {
    href: "/admin/richmenu",
    title: "Rich Menu",
    description: "Pre-sale / Owner menu + aliases",
    icon: LayoutGrid,
  },
  {
    href: "/admin/materials",
    title: "Materials",
    description: "คลังเอกสาร / รูป / brochure",
    icon: FolderOpen,
  },
  {
    href: "/admin/templates",
    title: "Templates",
    description: "Quick reply สำเร็จรูป",
    icon: MessageSquareText,
  },
];

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            ภาพรวม Sena EV OA + Mini App
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="ลูกค้าทั้งหมด" value={stats.total_customers} />
          <StatCard label="Leads ทั้งหมด" value={stats.total_leads} />
          <StatCard label="Follow leads" value={stats.follow_leads} />
          <StatCard label="Events 24 ชม." value={stats.active_today} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card className="h-full transition-colors hover:border-primary/40 hover:bg-accent/40">
                  <CardHeader>
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-base">{link.title}</CardTitle>
                    <CardDescription>{link.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}
