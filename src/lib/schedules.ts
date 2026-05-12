import "server-only";
import { query, queryOne } from "./db";

export type ScheduleType =
  | "service"
  | "test_drive"
  | "follow_up"
  | "callback"
  | "document_delivery"
  | "internal_task"
  | "reminder"
  | "other";

export type ScheduleStatus =
  | "NEW"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED"
  | "NO_SHOW";

export const SCHEDULE_TYPES: ScheduleType[] = [
  "service",
  "test_drive",
  "follow_up",
  "callback",
  "document_delivery",
  "internal_task",
  "reminder",
  "other",
];

export const SCHEDULE_STATUSES: ScheduleStatus[] = [
  "NEW",
  "CONFIRMED",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
  "NO_SHOW",
];

export type ScheduleRow = {
  id: string;
  type: ScheduleType;
  subtype: string | null;
  title: string;
  scheduled_at: Date;
  duration_minutes: number;
  all_day: boolean;
  showroom_id: string | null;
  location: string | null;
  customer_id: string | null;
  vehicle_id: string | null;
  lead_id: string | null;
  conversation_id: string | null;
  source_message_id: string | null;
  status: ScheduleStatus;
  priority: number;
  payload: Record<string, unknown>;
  notes: string | null;
  tags: string[];
  assigned_agent_id: string | null;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
  cancelled_at: Date | null;
  cancel_reason: string | null;
};

const SELECT_COLS = `id, type, subtype, title, scheduled_at, duration_minutes,
  all_day, showroom_id, location,
  customer_id, vehicle_id, lead_id, conversation_id, source_message_id,
  status, priority, payload, notes, tags,
  assigned_agent_id, created_at, updated_at,
  completed_at, cancelled_at, cancel_reason`;

export type CreateScheduleParams = {
  type: ScheduleType;
  subtype?: string | null;
  title: string;
  scheduledAt: Date;
  durationMinutes?: number;
  allDay?: boolean;
  showroomId?: string | null;
  location?: string | null;
  customerId?: string | null;
  vehicleId?: string | null;
  leadId?: string | null;
  conversationId?: string | null;
  sourceMessageId?: string | null;
  status?: ScheduleStatus;
  priority?: number;
  payload?: Record<string, unknown>;
  notes?: string | null;
  tags?: string[];
  assignedAgentId?: string | null;
  createdByAgentId?: string | null;
};

export async function create(p: CreateScheduleParams): Promise<ScheduleRow> {
  const row = await queryOne<ScheduleRow>(
    `INSERT INTO sena_ev.schedules
       (type, subtype, title, scheduled_at, duration_minutes, all_day,
        showroom_id, location, customer_id, vehicle_id, lead_id,
        conversation_id, source_message_id, status, priority, payload,
        notes, tags, assigned_agent_id, created_by_agent_id)
     VALUES
       ($1,$2,$3,$4,COALESCE($5,60),COALESCE($6,false),
        $7,$8,$9,$10,$11,$12,$13,COALESCE($14,'NEW'),COALESCE($15,2),COALESCE($16::jsonb,'{}'::jsonb),
        $17,COALESCE($18,'{}'::text[]),$19,$20)
     RETURNING ${SELECT_COLS}`,
    [
      p.type,
      p.subtype ?? null,
      p.title,
      p.scheduledAt.toISOString(),
      p.durationMinutes ?? null,
      p.allDay ?? null,
      p.showroomId ?? null,
      p.location ?? null,
      p.customerId ?? null,
      p.vehicleId ?? null,
      p.leadId ?? null,
      p.conversationId ?? null,
      p.sourceMessageId ?? null,
      p.status ?? null,
      p.priority ?? null,
      p.payload ? JSON.stringify(p.payload) : null,
      p.notes ?? null,
      p.tags ?? null,
      p.assignedAgentId ?? null,
      p.createdByAgentId ?? null,
    ],
  );
  if (!row) throw new Error("create schedule failed");
  return row;
}

export async function getById(id: string): Promise<ScheduleRow | null> {
  return queryOne<ScheduleRow>(
    `SELECT ${SELECT_COLS} FROM sena_ev.schedules WHERE id = $1`,
    [id],
  );
}

export async function listByCustomer(
  customerId: string,
): Promise<ScheduleRow[]> {
  const r = await query<ScheduleRow>(
    `SELECT ${SELECT_COLS}
       FROM sena_ev.schedules
      WHERE customer_id = $1
      ORDER BY scheduled_at DESC`,
    [customerId],
  );
  return r.rows;
}

export type ScheduleListFilter = {
  customerId?: string;
  showroomId?: string;
  type?: ScheduleType;
  status?: ScheduleStatus;
  from?: Date;
  to?: Date;
};

export async function listByFilter(
  f: ScheduleListFilter,
): Promise<ScheduleRow[]> {
  const where: string[] = [];
  const args: unknown[] = [];
  if (f.customerId) {
    args.push(f.customerId);
    where.push(`customer_id = $${args.length}`);
  }
  if (f.showroomId) {
    args.push(f.showroomId);
    where.push(`showroom_id = $${args.length}`);
  }
  if (f.type) {
    args.push(f.type);
    where.push(`type = $${args.length}`);
  }
  if (f.status) {
    args.push(f.status);
    where.push(`status = $${args.length}`);
  }
  if (f.from) {
    args.push(f.from.toISOString());
    where.push(`scheduled_at >= $${args.length}`);
  }
  if (f.to) {
    args.push(f.to.toISOString());
    where.push(`scheduled_at < $${args.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const r = await query<ScheduleRow>(
    `SELECT ${SELECT_COLS}
       FROM sena_ev.schedules
       ${whereSql}
      ORDER BY scheduled_at ASC`,
    args,
  );
  return r.rows;
}

export type UpdateSchedulePatch = {
  type?: ScheduleType;
  subtype?: string | null;
  title?: string;
  scheduledAt?: Date;
  durationMinutes?: number;
  allDay?: boolean;
  showroomId?: string | null;
  location?: string | null;
  status?: ScheduleStatus;
  priority?: number;
  payload?: Record<string, unknown>;
  notes?: string | null;
  tags?: string[];
  assignedAgentId?: string | null;
  cancelReason?: string | null;
};

export async function update(
  id: string,
  patch: UpdateSchedulePatch,
): Promise<ScheduleRow | null> {
  const sets: string[] = [];
  const args: unknown[] = [id];
  function push(col: string, val: unknown) {
    args.push(val);
    sets.push(`${col} = $${args.length}`);
  }
  if (patch.type !== undefined) push("type", patch.type);
  if (patch.subtype !== undefined) push("subtype", patch.subtype);
  if (patch.title !== undefined) push("title", patch.title);
  if (patch.scheduledAt !== undefined)
    push("scheduled_at", patch.scheduledAt.toISOString());
  if (patch.durationMinutes !== undefined)
    push("duration_minutes", patch.durationMinutes);
  if (patch.allDay !== undefined) push("all_day", patch.allDay);
  if (patch.showroomId !== undefined) push("showroom_id", patch.showroomId);
  if (patch.location !== undefined) push("location", patch.location);
  if (patch.status !== undefined) {
    push("status", patch.status);
    if (patch.status === "DONE") sets.push("completed_at = now()");
    if (patch.status === "CANCELLED") sets.push("cancelled_at = now()");
  }
  if (patch.priority !== undefined) push("priority", patch.priority);
  if (patch.payload !== undefined)
    sets.push(
      `payload = $${args.push(JSON.stringify(patch.payload))}::jsonb`,
    );
  if (patch.notes !== undefined) push("notes", patch.notes);
  if (patch.tags !== undefined) push("tags", patch.tags);
  if (patch.assignedAgentId !== undefined)
    push("assigned_agent_id", patch.assignedAgentId);
  if (patch.cancelReason !== undefined)
    push("cancel_reason", patch.cancelReason);

  if (sets.length === 0) return getById(id);

  return queryOne<ScheduleRow>(
    `UPDATE sena_ev.schedules SET ${sets.join(", ")}
      WHERE id = $1
      RETURNING ${SELECT_COLS}`,
    args,
  );
}

export async function remove(id: string): Promise<void> {
  await query(`DELETE FROM sena_ev.schedules WHERE id = $1`, [id]);
}

/**
 * Count active schedules in a given showroom + time window.
 * Used for availability / capacity checks.
 */
export async function countBookedAt(params: {
  showroomId: string;
  from: Date;
  to: Date;
  type?: ScheduleType;
}): Promise<number> {
  const args: unknown[] = [
    params.showroomId,
    params.from.toISOString(),
    params.to.toISOString(),
  ];
  let typeSql = "";
  if (params.type) {
    args.push(params.type);
    typeSql = ` AND type = $${args.length}`;
  }
  const r = await queryOne<{ n: number }>(
    `SELECT COUNT(*)::int AS n
       FROM sena_ev.schedules
      WHERE showroom_id = $1
        AND scheduled_at >= $2
        AND scheduled_at < $3
        AND status NOT IN ('CANCELLED','NO_SHOW')
        ${typeSql}`,
    args,
  );
  return r?.n ?? 0;
}
