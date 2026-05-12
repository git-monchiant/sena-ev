"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Car,
  Clock,
  Copy,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  MapPin,
  MessageSquare,
  MoreVertical,
  Plus,
  Reply,
  Search,
  Send,
  Sparkles,
  User,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AddToScheduleDialog } from "./_components/AddToScheduleDialog";

type ConversationListItem = {
  id: string;
  customer_id: string;
  status: "open" | "pending" | "closed";
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_type: string | null;
  unread_count: number;
  customer_line_user_id: string;
  customer_display_name: string | null;
  customer_picture_url: string | null;
  customer_state: "LEAD" | "OWNER";
};

type Message = {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound" | "system";
  agent_id: string | null;
  message_type: string;
  content: Record<string, unknown>;
  is_internal_note: boolean;
  is_unsent: boolean;
  unsent_at: string | null;
  quoted_message_id: string | null;
  quoted_preview: string | null;
  quoted_direction: "inbound" | "outbound" | "system" | null;
  quoted_message_type: string | null;
  quoted_content: Record<string, unknown> | null;
  sent_at: string;
};

type QuotedDraft = {
  id: string;
  preview: string;
  direction: "inbound" | "outbound" | "system";
};

type Lead = {
  id: string;
  type: string;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type Tag = {
  id: string;
  name: string;
  category: "intent" | "model" | "service" | "other";
  color: string;
  sort_order: number;
};

type CustomerTag = Tag & {
  tagged_at: string;
  note: string | null;
};

type ServiceBooking = {
  id: string;
  service_type: "maintenance" | "repair" | "inspection";
  scheduled_at: string;
  service_center: string | null;
  status: "NEW" | "CONFIRMED" | "DONE" | "CANCELLED";
  notes: string | null;
  created_at: string;
};

type ConversationDetail = {
  conversation: ConversationListItem;
  messages: Message[];
  customer: {
    phone: string | null;
    email: string | null;
    state: string;
    followed_at: string | null;
  } | null;
  leads: Lead[];
  tags: CustomerTag[];
  serviceBookings: ServiceBooking[];
};

export default function InboxPage() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [text, setText] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [quoted, setQuoted] = useState<QuotedDraft | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/tags", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { tags: Tag[] }) => setAllTags(d.tags));
  }, []);

  const fetchList = useCallback(async () => {
    const res = await fetch("/api/admin/inbox/conversations", { cache: "no-store" });
    const data = (await res.json()) as { conversations: ConversationListItem[] };
    setConversations(data.conversations);
  }, []);

  const fetchDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/inbox/conversations/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as ConversationDetail;
    setDetail(data);
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId);
      setQuoted(null);
    } else {
      setDetail(null);
    }
  }, [selectedId, fetchDetail]);

  useEffect(() => {
    const es = new EventSource("/api/admin/inbox/stream");
    es.addEventListener("new_message", (e: MessageEvent<string>) => {
      const data = JSON.parse(e.data) as { conversationId: string };
      fetchList();
      if (data.conversationId === selectedId) fetchDetail(data.conversationId);
    });
    es.addEventListener("status_change", () => fetchList());
    return () => es.close();
  }, [selectedId, fetchList, fetchDetail]);

  async function handleSendText() {
    if (!selectedId || !text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/admin/inbox/conversations/${selectedId}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            internalNote,
            quotedMessageId: quoted?.id ?? null,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`ส่งไม่สำเร็จ: ${JSON.stringify(err)}`);
        return;
      }
      setText("");
      setQuoted(null);
      await fetchDetail(selectedId);
      await fetchList();
    } finally {
      setSending(false);
    }
  }

  async function handleSendImage(file: File) {
    if (!selectedId) return;
    setSending(true);
    try {
      const form = new FormData();
      form.set("file", file);
      if (quoted?.id) form.set("quotedMessageId", quoted.id);
      const res = await fetch(
        `/api/admin/inbox/conversations/${selectedId}/send-image`,
        { method: "POST", body: form },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`ส่งรูปไม่สำเร็จ: ${JSON.stringify(err)}`);
        return;
      }
      setQuoted(null);
      await fetchDetail(selectedId);
      await fetchList();
    } finally {
      setSending(false);
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.customer_display_name?.toLowerCase().includes(q) ||
        c.customer_line_user_id.toLowerCase().includes(q) ||
        c.last_message_preview?.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const [scheduleDraft, setScheduleDraft] = useState<{
    customerId: string;
    customerName: string | null;
    notes: string;
  } | null>(null);

  return (
    <div className="grid h-full min-h-0 grid-cols-[300px_minmax(0,1fr)_500px] grid-rows-[minmax(0,1fr)]">
      <ThreadList
        conversations={filtered}
        selectedId={selectedId}
        onSelect={setSelectedId}
        search={search}
        onSearch={setSearch}
      />
      <ConversationPane
        detail={detail}
        text={text}
        onTextChange={setText}
        internalNote={internalNote}
        onToggleNote={setInternalNote}
        sending={sending}
        onSendText={handleSendText}
        onSendImage={handleSendImage}
        quoted={quoted}
        onQuote={setQuoted}
        onClearQuote={() => setQuoted(null)}
        allTags={allTags}
        onTagsChange={() => selectedId && fetchDetail(selectedId)}
        onAddToSchedule={(message) => {
          if (!detail) return;
          setScheduleDraft({
            customerId: detail.conversation.customer_id,
            customerName: detail.conversation.customer_display_name,
            notes: messagePreviewText(message),
          });
        }}
      />
      <CustomerPanel
        detail={detail}
        allTags={allTags}
        onTagsChange={() => selectedId && fetchDetail(selectedId)}
        onMessageSent={async () => {
          if (!selectedId) return;
          await fetchDetail(selectedId);
          await fetchList();
        }}
      />

      {scheduleDraft && (
        <AddToScheduleDialog
          open
          customerId={scheduleDraft.customerId}
          customerName={scheduleDraft.customerName}
          defaultNotes={scheduleDraft.notes}
          onClose={() => setScheduleDraft(null)}
          onSaved={() => {
            setScheduleDraft(null);
            if (selectedId) fetchDetail(selectedId);
          }}
        />
      )}
    </div>
  );
}

function messagePreviewText(m: Message): string {
  if (m.message_type === "text") {
    return (m.content.text as string) ?? "";
  }
  return `[${m.message_type}]`;
}

/* ─────────────────────── Thread List ─────────────────────── */

function ThreadList({
  conversations,
  selectedId,
  onSelect,
  search,
  onSearch,
}: {
  conversations: ConversationListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearch: (v: string) => void;
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r bg-card">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="ค้นหา..."
            className="pl-8"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            ยังไม่มี conversation
          </div>
        ) : (
          <ul className="divide-y">
            {conversations.map((c) => {
              const active = c.id === selectedId;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      "flex w-full items-start gap-3 p-3 text-left transition-colors",
                      active ? "bg-accent" : "hover:bg-accent/50",
                    )}
                  >
                    <Avatar>
                      {c.customer_picture_url && (
                        <AvatarImage src={c.customer_picture_url} alt="" />
                      )}
                      <AvatarFallback>
                        {(c.customer_display_name ?? "?").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">
                          {c.customer_display_name ?? c.customer_line_user_id}
                        </span>
                        <StateBadge state={c.customer_state} />
                        {c.unread_count > 0 && (
                          <Badge
                            variant="destructive"
                            className="ml-auto h-4 min-w-4 px-1 text-[10px]"
                          >
                            {c.unread_count}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {c.last_message_preview ?? "(ยังไม่มีข้อความ)"}
                      </div>
                      {c.last_message_at && (
                        <div className="mt-0.5 text-[10px] text-muted-foreground/70">
                          {formatRelative(c.last_message_at)}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </aside>
  );
}

function BotToggle({ conversationId }: { conversationId: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(null);
    fetch(`/api/admin/inbox/conversations/${conversationId}/bot`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d: { botEnabled?: boolean }) => setEnabled(!!d.botEnabled))
      .catch(() => setEnabled(false));
  }, [conversationId]);

  async function toggle() {
    if (enabled === null) return;
    const next = !enabled;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/inbox/conversations/${conversationId}/bot`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ botEnabled: next }),
        },
      );
      if (res.ok) setEnabled(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
        enabled
          ? "border-emerald-300 bg-emerald-100 text-emerald-700"
          : "border-zinc-200 bg-zinc-100 text-zinc-500",
        saving && "opacity-60",
      )}
      title={
        enabled
          ? "Bot กำลังช่วยตอบ — คลิกเพื่อปิด"
          : "Bot ปิดอยู่ — คลิกเพื่อเปิดให้ตอบ"
      }
    >
      <input
        type="checkbox"
        className="size-3 accent-emerald-500"
        checked={enabled ?? false}
        onChange={toggle}
        disabled={enabled === null || saving}
      />
      Bot
    </label>
  );
}

function StateBadge({ state }: { state: string }) {
  const variant: Record<string, string> = {
    OWNER: "bg-purple-100 text-purple-700 border-purple-200",
    LEAD: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        "px-1.5 py-0 text-[10px] font-medium leading-none",
        variant[state] ?? "bg-muted text-muted-foreground",
      )}
    >
      {state}
    </Badge>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ชม. ที่แล้ว`;
  return d.toLocaleDateString("th-TH");
}

function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function formatDateSep(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "วันนี้";
  if (d.toDateString() === yesterday.toDateString()) return "เมื่อวาน";
  return d.toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="my-2 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="rounded-full bg-muted px-3 py-0.5 text-[10px] font-medium text-muted-foreground">
        {formatDateSep(date)}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

/* ─────────────────────── Conversation Pane ─────────────────────── */


// Tailwind UI standard: underline tabs
const TAB_LIST_VSCODE = "flex w-full border-b border-border";
const TAB_TRIGGER_VSCODE =
  "inline-flex items-center gap-2 border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground data-[state=active]:border-blue-500 data-[state=active]:text-foreground";

function ConversationPane({
  detail,
  text,
  onTextChange,
  internalNote,
  onToggleNote,
  sending,
  onSendText,
  onSendImage,
  quoted,
  onQuote,
  onClearQuote,
  allTags,
  onTagsChange,
  onAddToSchedule,
}: {
  detail: ConversationDetail | null;
  text: string;
  onTextChange: (t: string) => void;
  internalNote: boolean;
  onToggleNote: (v: boolean) => void;
  sending: boolean;
  onSendText: () => void;
  onSendImage: (file: File) => void;
  quoted: QuotedDraft | null;
  onQuote: (q: QuotedDraft) => void;
  onClearQuote: () => void;
  allTags: Tag[];
  onTagsChange: () => void;
  onAddToSchedule: (message: Message) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [msgMenu, setMsgMenu] = useState<{
    x: number;
    y: number;
    message: Message;
  } | null>(null);

  const closeMenu = useCallback(() => setMsgMenu(null), []);

  const openMenuFor = useCallback((message: Message, x: number, y: number) => {
    setMsgMenu({ x, y, message });
  }, []);

  function quotePreviewFor(m: Message): string {
    if (m.message_type === "text") {
      return (m.content.text as string)?.slice(0, 100) ?? "[ข้อความ]";
    }
    return `[${m.message_type}]`;
  }

  async function copyMessage(m: Message) {
    if (m.message_type !== "text") return;
    const t = (m.content.text as string) ?? "";
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollDown = () => {
      el.scrollTop = el.scrollHeight;
    };
    scrollDown();
    const imgs = Array.from(el.querySelectorAll<HTMLImageElement>("img"));
    const pending = imgs.filter((img) => !img.complete);
    pending.forEach((img) => img.addEventListener("load", scrollDown));
    pending.forEach((img) => img.addEventListener("error", scrollDown));
    return () => {
      pending.forEach((img) => img.removeEventListener("load", scrollDown));
      pending.forEach((img) => img.removeEventListener("error", scrollDown));
    };
  }, [detail?.conversation.id, detail?.messages.length]);

  if (!detail) {
    return (
      <section className="flex h-full items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        เลือก conversation จากด้านซ้าย
      </section>
    );
  }

  const { conversation, messages } = detail;

  return (
    <section className="flex h-full min-h-0 flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar>
              {conversation.customer_picture_url && (
                <AvatarImage src={conversation.customer_picture_url} />
              )}
              <AvatarFallback>
                {(conversation.customer_display_name ?? "?").charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {conversation.customer_display_name ??
                  conversation.customer_line_user_id}
              </div>
              <code className="block truncate text-[10px] text-muted-foreground">
                {conversation.customer_line_user_id}
              </code>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <BotToggle conversationId={conversation.id} />
            <StateBadge state={conversation.customer_state} />
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] leading-none">
              {conversation.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>Assign (เร็ว ๆ นี้)</DropdownMenuItem>
                <DropdownMenuItem disabled>Close conversation</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <HeaderTagsRow
          customerId={conversation.customer_id}
          tags={detail.tags}
          allTags={allTags}
          onChange={onTagsChange}
        />
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            ยังไม่มีข้อความใน conversation
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = i > 0 ? messages[i - 1]! : null;
            const next = i < messages.length - 1 ? messages[i + 1]! : null;
            const showDateSep = !prev || !sameDay(prev.sent_at, m.sent_at);
            const isFirstInGroup =
              showDateSep || !prev || prev.direction !== m.direction;
            const isLastInGroup =
              !next ||
              next.direction !== m.direction ||
              !sameDay(next.sent_at, m.sent_at);
            return (
              <div key={m.id}>
                {showDateSep && <DateSeparator date={m.sent_at} />}
                <div className={isFirstInGroup ? "mt-3" : "mt-0.5"}>
                  <MessageBubble
                    message={m}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                    customerName={conversation.customer_display_name}
                    customerPicture={conversation.customer_picture_url}
                    onQuote={(preview) =>
                      onQuote({
                        id: m.id,
                        preview,
                        direction: m.direction,
                      })
                    }
                    onOpenMenu={openMenuFor}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t bg-background">
        {quoted && (
          <div className="mx-4 mt-3 flex items-start gap-2 rounded-md border-l-2 border-primary bg-accent px-3 py-2 text-xs">
            <div className="min-w-0 flex-1">
              <div className="font-medium">
                ตอบกลับ {quoted.direction === "inbound" ? "ลูกค้า" : "เรา"}
              </div>
              <div className="truncate text-muted-foreground">
                {quoted.preview}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-5"
              onClick={onClearQuote}
            >
              <X className="size-3" />
            </Button>
          </div>
        )}

        <UnifiedComposer
          text={text}
          onTextChange={onTextChange}
          internalNote={internalNote}
          onToggleNote={onToggleNote}
          sending={sending}
          onSendText={onSendText}
          onSendImage={onSendImage}
        />
      </div>

      {msgMenu && (
        <ContextMenu
          x={msgMenu.x}
          y={msgMenu.y}
          open
          onClose={closeMenu}
        >
          <ContextMenuLabel>
            {msgMenu.message.direction === "inbound"
              ? "ข้อความจากลูกค้า"
              : msgMenu.message.direction === "outbound"
                ? "ข้อความจากเรา"
                : "ข้อความระบบ"}
          </ContextMenuLabel>
          <ContextMenuItem
            onSelect={() => {
              onQuote({
                id: msgMenu.message.id,
                preview: quotePreviewFor(msgMenu.message),
                direction: msgMenu.message.direction,
              });
              closeMenu();
            }}
          >
            <Reply className="size-4" />
            ตอบกลับ
          </ContextMenuItem>
          <ContextMenuItem
            disabled={msgMenu.message.message_type !== "text"}
            onSelect={() => {
              void copyMessage(msgMenu.message);
              closeMenu();
            }}
          >
            <Copy className="size-4" />
            คัดลอกข้อความ
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onSelect={() => {
              onAddToSchedule(msgMenu.message);
              closeMenu();
            }}
          >
            <CalendarDays className="size-4" />
            เพิ่มในตารางงาน
          </ContextMenuItem>
        </ContextMenu>
      )}
    </section>
  );
}

/* ─────────────────────── Composer ─────────────────────── */

type Attachment = { file: File; url: string };

function UnifiedComposer({
  text,
  onTextChange,
  internalNote,
  onToggleNote,
  sending,
  onSendText,
  onSendImage,
}: {
  text: string;
  onTextChange: (t: string) => void;
  internalNote: boolean;
  onToggleNote: (v: boolean) => void;
  sending: boolean;
  onSendText: () => void;
  onSendImage: (file: File) => void;
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(incoming: File[]) {
    const images = incoming.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    setAttachments((prev) => [
      ...prev,
      ...images.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    ]);
  }

  function removeAt(idx: number) {
    setAttachments((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function clearAll() {
    attachments.forEach((a) => URL.revokeObjectURL(a.url));
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSend() {
    if (sending) return;
    const files = attachments.map((a) => a.file);
    const hasText = text.trim().length > 0;
    if (files.length === 0 && !hasText) return;

    files.forEach((f) => onSendImage(f));
    if (hasText) onSendText();
    clearAll();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imgs: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.type.startsWith("image/")) {
        const f = item.getAsFile();
        if (f) imgs.push(f);
      }
    }
    if (imgs.length > 0) {
      e.preventDefault();
      addFiles(imgs);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer?.files ?? []);
    addFiles(dropped);
  }

  const hasFiles = attachments.length > 0;
  const canSend = !sending && (text.trim().length > 0 || hasFiles);
  const sendLabel = sending
    ? "กำลังส่ง..."
    : hasFiles
      ? text.trim()
        ? `ส่ง (${attachments.length} รูป + ข้อความ)`
        : `ส่งรูป (${attachments.length})`
      : internalNote
        ? "บันทึก"
        : "ส่ง";

  return (
    <div
      className={cn(
        "relative space-y-2 p-3 transition-colors",
        dragOver && "bg-accent/30 ring-2 ring-inset ring-primary",
      )}
      onDragEnter={(e) => {
        if (e.dataTransfer?.types.includes("Files")) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragOver={(e) => {
        if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
      }}
      onDragLeave={(e) => {
        if (e.target === e.currentTarget) setDragOver(false);
      }}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/80 text-sm font-medium text-primary">
          วางรูปที่นี่เพื่อแนบ
        </div>
      )}

      {hasFiles && (
        <div className="flex flex-wrap gap-2 rounded-md border bg-muted/30 p-2">
          {attachments.map((a, idx) => (
            <div key={a.url} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.url}
                alt={a.file.name}
                title={a.file.name}
                className="size-14 rounded border object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-foreground"
                aria-label="ลบรูปนี้"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onPaste={handlePaste}
          placeholder={
            internalNote
              ? "บันทึกภายใน (ไม่ส่งหา user)..."
              : hasFiles
                ? "เพิ่มคำบรรยาย (ไม่บังคับ)…"
                : "พิมพ์ข้อความตอบลูกค้า..."
          }
          rows={2}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            "self-end",
            internalNote && !hasFiles && "bg-amber-600 hover:bg-amber-700",
          )}
        >
          <Send className="size-4" />
          {sendLabel}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <ImageIcon className="size-3.5" />
            แนบรูป
          </button>
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={internalNote}
              onChange={(e) => onToggleNote(e.target.checked)}
              className="size-3"
            />
            Internal note
          </label>
        </div>
        <span>วาง/ลากรูปลงได้ · ⌘/Ctrl+Enter เพื่อส่ง</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => {
            const list = Array.from(e.target.files ?? []);
            addFiles(list);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          className="hidden"
        />
      </div>
    </div>
  );
}

/* ─────────────────────── Message bubble ─────────────────────── */

function MessageBubble({
  message,
  isFirstInGroup,
  isLastInGroup,
  customerName,
  customerPicture,
  onQuote,
  onOpenMenu,
}: {
  message: Message;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  customerName: string | null;
  customerPicture: string | null;
  onQuote: (preview: string) => void;
  onOpenMenu: (message: Message, x: number, y: number) => void;
}) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleContextMenu(e: React.MouseEvent) {
    if (message.is_internal_note) return;
    e.preventDefault();
    onOpenMenu(message, e.clientX, e.clientY);
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (message.is_internal_note) return;
    const t = e.touches[0];
    if (!t) return;
    const { clientX, clientY } = t;
    longPressTimer.current = setTimeout(() => {
      onOpenMenu(message, clientX, clientY);
    }, 450);
  }

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  if (message.is_internal_note) {
    return (
      <div className="mx-auto max-w-xl rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <span className="font-semibold">Note · </span>
        {(message.content.text as string) ?? ""}
        <span className="ml-2 text-[10px] text-amber-600">
          {new Date(message.sent_at).toLocaleString("th-TH")}
        </span>
      </div>
    );
  }
  const isOutbound = message.direction === "outbound";
  const isMedia =
    message.message_type === "image" || message.message_type === "video";

  function quotePreview(): string {
    if (message.message_type === "text") {
      return (message.content.text as string)?.slice(0, 100) ?? "[ข้อความ]";
    }
    return `[${message.message_type}]`;
  }

  const time = new Date(message.sent_at).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const fullTime = new Date(message.sent_at).toLocaleString("th-TH");

  // LINE-style speech bubble: 3 corners highly rounded + 1 small "tail" corner on sender side
  const cornerClass = isOutbound
    ? "rounded-3xl rounded-br-md"
    : "rounded-3xl rounded-bl-md";

  return (
    <div
      className={cn(
        "group flex items-end gap-2",
        isOutbound ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar slot — only show on last-in-group for inbound */}
      {!isOutbound && (
        <div className="w-7 shrink-0 self-end">
          {isLastInGroup && (
            <Avatar className="size-7">
              {customerPicture && <AvatarImage src={customerPicture} />}
              <AvatarFallback className="text-[10px]">
                {(customerName ?? "?").charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[75%] flex-col",
          isOutbound ? "items-end" : "items-start",
        )}
      >
        {isFirstInGroup && !isOutbound && customerName && (
          <span className="mb-0.5 ml-1 text-[10px] text-muted-foreground">
            {customerName}
          </span>
        )}
        <div
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchEnd={clearLongPress}
          onTouchMove={clearLongPress}
          onTouchCancel={clearLongPress}
          className={cn(
            "relative w-fit max-w-full cursor-context-menu overflow-hidden shadow-sm",
            isMedia
              ? "max-w-[200px] p-4"
              : "px-5 py-3 text-sm leading-relaxed",
            cornerClass,
            message.is_unsent
              ? "bg-muted text-muted-foreground italic line-through"
              : isOutbound
                ? "bg-blue-500 text-white"
                : "bg-emerald-500 text-white",
          )}
        >
          {message.quoted_preview && !message.is_unsent && (
            <div className="mb-1.5 rounded border-l-2 border-white/40 bg-white/10 px-2 py-1 text-[11px]">
              <div className="font-medium opacity-75">
                {message.quoted_direction === "inbound" ? "ลูกค้า" : "เรา"}
              </div>
              <QuotedContent
                type={message.quoted_message_type}
                content={message.quoted_content}
                messageId={message.quoted_message_id}
                fallback={message.quoted_preview}
              />
            </div>
          )}
          {message.is_unsent ? (
            <span>ลูกค้าลบข้อความนี้</span>
          ) : (
            <MessageContent message={message} />
          )}
        </div>
        {isLastInGroup && (
          <div
            title={fullTime}
            className="mt-0.5 px-1 text-[10px] text-muted-foreground"
          >
            {time}
          </div>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onQuote(quotePreview())}
        className="invisible size-7 self-end rounded-full opacity-0 transition-opacity group-hover:visible group-hover:opacity-100"
        title="ตอบกลับ"
      >
        <Reply className="size-3.5" />
      </Button>
    </div>
  );
}

function HeaderTagsRow({
  customerId,
  tags,
  allTags,
  onChange,
}: {
  customerId: string;
  tags: CustomerTag[];
  allTags: Tag[];
  onChange: () => void;
}) {
  const taggedIds = new Set(tags.map((t) => t.id));
  const available = allTags.filter((t) => !taggedIds.has(t.id));

  const grouped = useMemo(() => {
    const map: Record<string, Tag[]> = {
      intent: [],
      model: [],
      service: [],
      other: [],
    };
    for (const t of available) map[t.category]?.push(t);
    return map;
  }, [available]);

  const categoryLabel: Record<string, string> = {
    intent: "ความสนใจ",
    model: "รุ่นรถ",
    service: "บริการ",
    other: "อื่น ๆ",
  };

  async function addTag(tagId: string) {
    await fetch(`/api/admin/customers/${customerId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    });
    onChange();
  }

  async function removeTag(tagId: string) {
    await fetch(`/api/admin/customers/${customerId}/tags/${tagId}`, {
      method: "DELETE",
    });
    onChange();
  }

  return (
    <div className="flex flex-wrap items-center gap-1 px-5 pb-2.5">
      {tags.map((t) => (
        <span
          key={t.id}
          className="group inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight"
          style={{
            backgroundColor: `${t.color}1f`,
            color: t.color,
            border: `1px solid ${t.color}40`,
          }}
        >
          {t.name}
          <button
            type="button"
            onClick={() => removeTag(t.id)}
            className="opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100"
            title="ลบ tag"
          >
            <X className="size-2.5" />
          </button>
        </span>
      ))}
      {available.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-[22px] rounded-full px-1.5 text-[10px]"
            >
              <Plus className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
            {(["intent", "model", "service", "other"] as const).map(
              (cat, ci) => {
                const items = grouped[cat] ?? [];
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    {ci > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="text-[10px] uppercase">
                      {categoryLabel[cat]}
                    </DropdownMenuLabel>
                    {items.map((t) => (
                      <DropdownMenuItem
                        key={t.id}
                        onSelect={() => addTag(t.id)}
                      >
                        <span
                          className="inline-block size-2 rounded-full"
                          style={{ backgroundColor: t.color }}
                        />
                        <span>{t.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                );
              },
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function QuotedContent({
  type,
  content,
  messageId,
  fallback,
}: {
  type: string | null;
  content: Record<string, unknown> | null;
  messageId: string | null;
  fallback: string;
}) {
  if (!type || !content) {
    return <div className="line-clamp-2">{fallback}</div>;
  }
  switch (type) {
    case "image":
      return (
        <div className="flex items-center gap-1.5">
          {messageId && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/admin/inbox/messages/${messageId}/content`}
              alt=""
              className="size-8 shrink-0 rounded object-cover"
              loading="lazy"
            />
          )}
          <span>รูปภาพ</span>
        </div>
      );
    case "video":
      return (
        <div className="flex items-center gap-1.5">
          <span className="text-base">🎬</span>
          <span>วิดีโอ</span>
        </div>
      );
    case "audio":
      return (
        <div className="flex items-center gap-1.5">
          <span className="text-base">🔊</span>
          <span>เสียง</span>
        </div>
      );
    case "sticker": {
      const stickerId = content.stickerId as string | undefined;
      return (
        <div className="flex items-center gap-1.5">
          {stickerId && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/iPhone/sticker.png`}
              alt=""
              className="size-8 shrink-0 object-contain"
              loading="lazy"
            />
          )}
          <span>สติกเกอร์</span>
        </div>
      );
    }
    case "location": {
      const title = (content.title as string) ?? "ตำแหน่ง";
      return (
        <div className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{title}</span>
        </div>
      );
    }
    case "file": {
      const fileName = (content.fileName as string) ?? "ไฟล์";
      return (
        <div className="flex items-center gap-1.5">
          <FileText className="size-3.5 shrink-0" />
          <span className="truncate">{fileName}</span>
        </div>
      );
    }
    default:
      return <div className="line-clamp-2">{fallback}</div>;
  }
}

function MessageContent({ message }: { message: Message }) {
  const isInbound = message.direction === "inbound";
  const contentSrc = `/api/admin/inbox/messages/${message.id}/content`;

  switch (message.message_type) {
    case "text":
      return (
        <span className="whitespace-pre-wrap">
          {(message.content.text as string) ?? ""}
        </span>
      );

    case "image": {
      const src = isInbound
        ? contentSrc
        : (message.content.imageUrl as string | undefined) ?? "";
      return (
        <a href={src} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="image"
            className="block h-auto max-h-40 w-auto max-w-[160px] rounded-lg object-contain"
            loading="lazy"
          />
        </a>
      );
    }

    case "video": {
      const src = isInbound
        ? contentSrc
        : (message.content.videoUrl as string | undefined) ?? "";
      return (
        <video
          src={src}
          controls
          className="block h-auto max-h-40 w-auto max-w-[160px] rounded-lg"
          preload="metadata"
        />
      );
    }

    case "audio": {
      const src = isInbound
        ? contentSrc
        : (message.content.audioUrl as string | undefined) ?? "";
      return <audio src={src} controls preload="metadata" className="max-w-xs" />;
    }

    case "file": {
      const fileName = (message.content.fileName as string) ?? "ไฟล์";
      const fileSize = message.content.fileSize as number | undefined;
      return (
        <a
          href={contentSrc}
          download={fileName}
          className="flex max-w-[240px] items-center gap-2.5"
        >
          <FileText className="size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{fileName}</div>
            <div className="text-[10px] opacity-75">
              {fileSize ? `${Math.round(fileSize / 1024)} KB · ` : ""}
              กดเพื่อดาวน์โหลด
            </div>
          </div>
        </a>
      );
    }

    case "location": {
      const lat = message.content.latitude as number | undefined;
      const lng = message.content.longitude as number | undefined;
      const title = (message.content.title as string) ?? "ตำแหน่ง";
      const address = message.content.address as string | undefined;
      const href =
        lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : undefined;
      const inner = (
        <div className="flex max-w-[240px] items-start gap-2.5">
          <MapPin className="size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{title}</div>
            {address && (
              <div className="line-clamp-2 text-[10px] opacity-75">
                {address}
              </div>
            )}
            {href && (
              <div className="mt-0.5 text-[10px] underline opacity-90">
                เปิดใน Google Maps
              </div>
            )}
          </div>
        </div>
      );
      return href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block">
          {inner}
        </a>
      ) : (
        inner
      );
    }

    case "sticker": {
      const stickerId = message.content.stickerId as string | undefined;
      if (!stickerId) return <span className="italic opacity-75">[สติกเกอร์]</span>;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/iPhone/sticker.png`}
          alt="sticker"
          className="size-24 object-contain"
          loading="lazy"
        />
      );
    }

    case "flex": {
      type FlexCardData = {
        title?: string;
        bodyText?: string | null;
        imageUrl?: string | null;
        ctaLabel?: string | null;
        ctaUrl?: string | null;
        details?: { label: string; value: string }[];
        category?: string | null;
        kind?: string | null;
      };
      const content = message.content as
        | { type?: "carousel"; items: FlexCardData[] }
        | FlexCardData;

      const items =
        "items" in content && Array.isArray(content.items)
          ? content.items
          : "title" in content && content.title
            ? [content]
            : [];

      const renderPin = (
        c: {
          title?: string;
          bodyText?: string | null;
          ctaLabel?: string | null;
          ctaUrl?: string | null;
        },
        key: number | string,
      ) => (
        <a
          key={key}
          href={c.ctaUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-64 shrink-0 items-start gap-2.5 rounded-lg border bg-white p-2.5 text-zinc-900"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50">
            <MapPin
              className="size-4 text-emerald-600"
              strokeWidth={2.5}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold leading-tight">
              {c.title}
            </div>
            {c.bodyText && (
              <div className="mt-0.5 truncate text-[11px] text-zinc-500">
                {c.bodyText}
              </div>
            )}
            {c.ctaUrl && (
              <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700">
                {c.ctaLabel || "เปิดแผนที่"} →
              </div>
            )}
          </div>
        </a>
      );

      const renderBubble = (
        c: {
          title?: string;
          bodyText?: string | null;
          imageUrl?: string | null;
          ctaLabel?: string | null;
          ctaUrl?: string | null;
          details?: { label: string; value: string }[];
          category?: string | null;
          kind?: string | null;
        },
        key: number | string,
        compact = false,
      ) => {
        if (c.category === "pin") return renderPin(c, key);
        return COMPACT_OR_FULL(c, key, compact);
      };

      const COMPACT_OR_FULL = (
        c: {
          title?: string;
          bodyText?: string | null;
          imageUrl?: string | null;
          ctaLabel?: string | null;
          ctaUrl?: string | null;
          details?: { label: string; value: string }[];
          kind?: string | null;
        },
        key: number | string,
        compact: boolean,
      ) =>
        compact ? (
          <div
            key={key}
            className="w-28 shrink-0 overflow-hidden rounded border bg-white text-zinc-900"
          >
            {c.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.imageUrl}
                alt={c.title ?? ""}
                className="aspect-[5/3] w-full bg-white object-contain"
              />
            ) : (
              <div className="aspect-[5/3] w-full bg-zinc-100" />
            )}
            <div className="px-1.5 py-1">
              <div className="truncate text-[10px] font-bold leading-tight">
                {c.title}
              </div>
              {Array.isArray(c.details) &&
                c.details.slice(0, 2).map((d) => (
                  <div
                    key={d.label}
                    className="mt-0.5 truncate text-[9px] text-zinc-500"
                  >
                    {d.label} <span className="font-bold text-zinc-900">{d.value}</span>
                  </div>
                ))}
            </div>
            {c.ctaUrl && (
              <div className="px-1.5 pb-1.5">
                <a
                  href={c.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate rounded bg-[#1f5d3a] px-1 py-1 text-center text-[9px] font-bold text-white"
                >
                  {c.ctaLabel || "ดูเพิ่มเติม"}
                </a>
              </div>
            )}
          </div>
        ) : (
          (() => {
            const isCancel = c.kind === "cancel";
            const allD = Array.isArray(c.details) ? c.details : [];
            const priceD = allD.find((d) => d.label === "ราคาเริ่มต้น") ?? null;
            const restD = priceD ? allD.filter((d) => d !== priceD) : allD;
            return (
              <div
                key={key}
                className="w-56 shrink-0 overflow-hidden rounded-lg border bg-white text-zinc-900"
              >
                {c.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.imageUrl}
                    alt={c.title ?? ""}
                    className="aspect-[5/3] w-full bg-white object-contain"
                  />
                )}
                <div className="p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <div
                      className={cn(
                        "min-w-0 flex-1 truncate font-bold leading-tight",
                        isCancel && "text-red-600",
                      )}
                    >
                      {c.title}
                    </div>
                    {priceD && !isCancel && (
                      <div className="shrink-0 text-xs font-bold text-brand">
                        {priceD.value}
                      </div>
                    )}
                  </div>
                  {c.bodyText && (
                    <div
                      className={cn(
                        "mt-1 text-[11px]",
                        isCancel
                          ? "text-red-500 line-through"
                          : "text-zinc-400",
                      )}
                    >
                      {c.bodyText}
                    </div>
                  )}
                  {restD.length > 0 && (
                    <>
                      <div className="my-2 h-px bg-zinc-200" />
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                        {restD.map((d) => (
                          <div key={d.label}>
                            <dt className="text-[10px] text-zinc-400">
                              {d.label}
                            </dt>
                            <dd className="text-[11px] font-bold">{d.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </>
                  )}
                </div>
                {c.ctaUrl && (
                  <div className="p-3 pt-0">
                    <a
                      href={c.ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-md bg-[#1f5d3a] py-2 text-center text-xs font-bold text-white"
                    >
                      {c.ctaLabel || "ดูเพิ่มเติม"}
                    </a>
                  </div>
                )}
              </div>
            );
          })()
        );

      if (items.length === 0) {
        return <span className="italic opacity-75">[Flex Message]</span>;
      }
      if (items.length === 1) return renderBubble(items[0]!, 0);
      return (
        <div className="flex max-w-[36rem] gap-1.5 overflow-x-auto pb-1">
          {items.map((c, i) => renderBubble(c, i, true))}
        </div>
      );
    }

    default:
      return (
        <span className="italic opacity-75">[{message.message_type}]</span>
      );
  }
}

/* ─────────────────────── Customer Panel ─────────────────────── */

function CustomerPanel({
  detail,
  allTags,
  onTagsChange,
  onMessageSent,
}: {
  detail: ConversationDetail | null;
  allTags: Tag[];
  onTagsChange: () => void;
  onMessageSent: () => void | Promise<void>;
}) {
  if (!detail) {
    return <aside className="border-l bg-card" />;
  }
  return (
    <aside className="flex h-full min-h-0 flex-col border-l bg-card">
      <Tabs defaultValue="profile" className="flex h-full min-h-0 flex-col">
        <TabsList className={cn(TAB_LIST_VSCODE, "px-3")}>
          <TabsTrigger value="profile" className={TAB_TRIGGER_VSCODE}>
            <User className="size-3.5" /> โปรไฟล์
          </TabsTrigger>
          <TabsTrigger value="timeline" className={TAB_TRIGGER_VSCODE}>
            <Clock className="size-3.5" /> Timeline
          </TabsTrigger>
          <TabsTrigger value="calendar" className={TAB_TRIGGER_VSCODE}>
            <CalendarDays className="size-3.5" /> นัดหมาย
          </TabsTrigger>
          <TabsTrigger value="material" className={TAB_TRIGGER_VSCODE}>
            <FileText className="size-3.5" /> Material
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="min-h-0 flex-1 overflow-hidden">
          <ProfileTab
            detail={detail}
            allTags={allTags}
            onTagsChange={onTagsChange}
          />
        </TabsContent>
        <TabsContent value="timeline" className="min-h-0 flex-1 overflow-hidden">
          <TimelineTab detail={detail} />
        </TabsContent>
        <TabsContent value="calendar" className="min-h-0 flex-1 overflow-hidden">
          <CalendarTab detail={detail} />
        </TabsContent>
        <TabsContent value="material" className="min-h-0 flex-1 overflow-hidden">
          <MaterialTab detail={detail} onSent={onMessageSent} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function ProfileTab({
  detail,
  allTags,
  onTagsChange,
}: {
  detail: ConversationDetail;
  allTags: Tag[];
  onTagsChange: () => void;
}) {
  const { conversation, customer, leads, tags } = detail;
  const [stateUpdating, setStateUpdating] = useState(false);

  async function changeState(state: "LEAD" | "OWNER") {
    if (state === conversation.customer_state) return;
    setStateUpdating(true);
    try {
      const res = await fetch(
        `/api/admin/customers/${conversation.customer_id}/state`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`เปลี่ยน state ไม่สำเร็จ: ${JSON.stringify(err)}`);
        return;
      }
      onTagsChange();
    } finally {
      setStateUpdating(false);
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="border-b p-5 text-center">
        <Avatar size="lg" className="mx-auto mb-2 size-16">
          {conversation.customer_picture_url && (
            <AvatarImage src={conversation.customer_picture_url} />
          )}
          <AvatarFallback className="text-lg">
            {(conversation.customer_display_name ?? "?").charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="font-semibold">
          {conversation.customer_display_name ?? "ไม่ทราบชื่อ"}
        </div>
        <div className="mt-1 flex items-center justify-center gap-1.5">
          <StateBadge state={conversation.customer_state} />
        </div>
      </div>

      <div className="border-b p-5">
        <SectionLabel>Customer state (Rich Menu)</SectionLabel>
        <div className="grid grid-cols-2 gap-1">
          {(["LEAD", "OWNER"] as const).map((s) => {
            const active = conversation.customer_state === s;
            return (
              <button
                key={s}
                type="button"
                disabled={stateUpdating || active}
                onClick={() => changeState(s)}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                  active
                    ? s === "OWNER"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50",
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          เปลี่ยน state → sync Rich Menu บน LINE ทันที
          <br />
          • LEAD → Menu A (Pre-sale)
          <br />
          • OWNER → Menu B (After-sales)
        </p>
      </div>

      <div className="border-b p-5">
        <TagsSection
          customerId={conversation.customer_id}
          tags={tags}
          allTags={allTags}
          onChange={onTagsChange}
        />
      </div>

      <div className="border-b p-5">
        <SectionLabel>Profile</SectionLabel>
        <div className="space-y-1.5">
          <Row label="LINE userId" value={conversation.customer_line_user_id} mono />
          <Row label="เบอร์" value={customer?.phone ?? "—"} />
          <Row label="อีเมล" value={customer?.email ?? "—"} />
          <Row
            label="Add OA เมื่อ"
            value={
              customer?.followed_at
                ? new Date(customer.followed_at).toLocaleString("th-TH")
                : "—"
            }
          />
        </div>
      </div>

      <div className="p-5">
        <SectionLabel>Leads ({leads.length})</SectionLabel>
        {leads.length === 0 ? (
          <div className="text-xs text-muted-foreground">ยังไม่มี lead</div>
        ) : (
          <ul className="space-y-2">
            {leads.map((l) => (
              <li key={l.id} className="rounded-md border p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{l.type}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {l.status}
                  </Badge>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(l.created_at).toLocaleString("th-TH")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ScrollArea>
  );
}

type CalendarCategory = "all" | "test_drive" | "service";

type CalendarEvent = {
  id: string;
  category: "test_drive" | "service";
  title: string;
  subtitle?: string;
  date: string;
  status: string;
  iconType: "car" | "wrench";
};

type CalendarView = "month" | "list";

const MONTHS_TO_SHOW = 12;

type MaterialCategory = "car" | "promo" | "pin";

type Material = {
  id: string;
  category: MaterialCategory;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  details: { label: string; value: string }[];
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const CATEGORY_META: Record<
  MaterialCategory | "all",
  { label: string; Icon: LucideIcon; color: string }
> = {
  all: { label: "ทั้งหมด", Icon: LayoutGrid, color: "text-zinc-500" },
  car: { label: "รถ", Icon: Car, color: "text-blue-600" },
  promo: { label: "โปรโมชั่น", Icon: Sparkles, color: "text-amber-600" },
  pin: { label: "ที่ตั้ง", Icon: MapPin, color: "text-emerald-600" },
};

function MaterialTab({
  detail,
  onSent,
}: {
  detail: ConversationDetail;
  onSent: () => void | Promise<void>;
}) {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<MaterialCategory | "all">("all");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    fetch("/api/admin/materials")
      .then((r) => r.json())
      .then((d: { items: Material[] }) => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((m) => {
      if (activeCat !== "all" && m.category !== activeCat) return false;
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        (m.subtitle?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [items, search, activeCat]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const m of items) c[m.category] = (c[m.category] ?? 0) + 1;
    return c;
  }, [items]);

  async function handleSend(m: Material) {
    setSendingId(m.id);
    try {
      const isPin =
        m.category === "pin" &&
        typeof m.latitude === "number" &&
        typeof m.longitude === "number";
      const url = isPin
        ? `/api/admin/inbox/conversations/${detail.conversation.id}/send-location`
        : `/api/admin/inbox/conversations/${detail.conversation.id}/send-flex`;
      const payload = isPin
        ? {
            title: m.title,
            address: m.address ?? m.subtitle ?? m.title,
            latitude: m.latitude,
            longitude: m.longitude,
          }
        : {
            title: m.title,
            bodyText: m.subtitle,
            imageUrl: m.imageUrl,
            ctaLabel: m.ctaLabel,
            ctaUrl: m.ctaUrl,
            details: m.details,
            category: m.category,
          };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`ส่งไม่สำเร็จ: ${err.error ?? JSON.stringify(err)}`);
        return;
      }
      await onSent();
    } finally {
      setSendingId(null);
    }
  }

  async function handleSendGroup(list: Material[], groupKey: string) {
    if (list.length === 0) return;
    setSendingId(`__group__:${groupKey}`);
    const convId = detail.conversation.id;
    try {
      // Split: pins go as native location messages, others as flex carousel
      const pinItems = list.filter(
        (m) =>
          m.category === "pin" &&
          typeof m.latitude === "number" &&
          typeof m.longitude === "number",
      );
      const flexItems = list.filter((m) => m.category !== "pin");

      for (const m of pinItems.slice(0, 12)) {
        const res = await fetch(
          `/api/admin/inbox/conversations/${convId}/send-location`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: m.title,
              address: m.address ?? m.subtitle ?? m.title,
              latitude: m.latitude,
              longitude: m.longitude,
            }),
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(`ส่งหมุดไม่สำเร็จ: ${err.error ?? JSON.stringify(err)}`);
          return;
        }
      }

      if (flexItems.length > 0) {
        const items = flexItems.slice(0, 12).map((m) => ({
          title: m.title,
          bodyText: m.subtitle,
          imageUrl: m.imageUrl,
          ctaLabel: m.ctaLabel,
          ctaUrl: m.ctaUrl,
          details: m.details,
          category: m.category,
        }));
        const res = await fetch(
          `/api/admin/inbox/conversations/${convId}/send-flex`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(`ส่งไม่สำเร็จ: ${err.error ?? JSON.stringify(err)}`);
          return;
        }
      }

      setSelected((prev) => {
        const next = new Set(prev);
        for (const m of list) next.delete(m.id);
        return next;
      });
      await onSent();
    } finally {
      setSendingId(null);
    }
  }

  const groups = useMemo(() => {
    const order: MaterialCategory[] = ["car", "promo", "pin"];
    const grouped: Record<MaterialCategory, Material[]> = {
      car: [],
      promo: [],
      pin: [],
    };
    for (const m of filtered) grouped[m.category].push(m);
    return order
      .map((cat) => ({ cat, items: grouped[cat] }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 border-b p-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหา material…"
          className="h-8"
        />
        <div className="flex flex-wrap gap-1">
          {(["all", "car", "promo", "pin"] as const).map((cat) => {
            const { label, Icon } = CATEGORY_META[cat];
            const active = activeCat === cat;
            const n = counts[cat] ?? 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCat(cat)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                <Icon className="size-3" />
                {label}
                <span className="opacity-70">· {n}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3">
          {loading && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              กำลังโหลด…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              ไม่มี material ตรงเงื่อนไข
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <div className="space-y-4">
              {groups.map(({ cat, items }) => {
                const meta = CATEGORY_META[cat];
                const groupKey = `__group__:${cat}`;
                const groupSending = sendingId === groupKey;
                const selectedItems = items.filter((m) => selected.has(m.id));
                const hasSelection = selectedItems.length > 0;
                const targetItems = hasSelection ? selectedItems : items;
                return (
                  <section key={cat}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                        <meta.Icon className={cn("size-3.5", meta.color)} />
                        {meta.label}
                        <span className="font-medium text-muted-foreground">
                          · {items.length}
                          {hasSelection && (
                            <span className="ml-1 font-bold text-zinc-900">
                              ({selectedItems.length} เลือก)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {hasSelection && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelected((prev) => {
                                const next = new Set(prev);
                                for (const m of items) next.delete(m.id);
                                return next;
                              })
                            }
                            className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            ยกเลิก
                          </button>
                        )}
                        {targetItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleSendGroup(targetItems, cat)}
                            disabled={groupSending}
                            className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                          >
                            <Send className="size-2.5" />
                            {groupSending
                              ? "กำลังส่ง…"
                              : hasSelection
                                ? `ส่งที่เลือก (${Math.min(selectedItems.length, 12)})`
                                : `ส่งทั้งหมด (${Math.min(items.length, 12)})`}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-1.5">
                      {items.map((m) => (
                        <MaterialCard
                          key={m.id}
                          material={m}
                          sending={sendingId === m.id}
                          selected={selected.has(m.id)}
                          onToggleSelect={() => toggleSelected(m.id)}
                          onSend={() => handleSend(m)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function MaterialCard({
  material,
  sending,
  selected,
  onSend,
  onToggleSelect,
}: {
  material: Material;
  sending: boolean;
  selected: boolean;
  onSend: () => void;
  onToggleSelect: () => void;
}) {
  const { Icon, color } = CATEGORY_META[material.category];
  const tooltip = material.subtitle
    ? `${material.title} — ${material.subtitle}`
    : material.title;
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded border bg-muted transition-colors",
        selected
          ? "border-2 border-zinc-900 ring-2 ring-zinc-900/20"
          : "hover:border-zinc-900",
        sending && "opacity-50",
      )}
    >
      <button
        type="button"
        onClick={onSend}
        disabled={sending}
        title={tooltip}
        className="relative block aspect-square w-full text-left"
      >
        {material.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={material.imageUrl}
            alt={material.title}
            className="size-full bg-white object-contain"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center px-1">
            <Icon className={cn("size-4", color)} />
          </div>
        )}
      </button>

      <div className="border-t bg-card px-1.5 py-1">
        <div
          className="truncate text-[10px] font-bold leading-tight text-zinc-900"
          title={material.title}
        >
          {material.title}
        </div>
      </div>

      <div className="pointer-events-none absolute right-0.5 top-0.5 flex size-3.5 items-center justify-center rounded bg-white/90 shadow-sm">
        <Icon className={cn("size-2", color)} />
      </div>

      {material.category === "car" && (
        <button
          type="button"
          onClick={onToggleSelect}
          aria-label={selected ? "ยกเลิกการเลือก" : "เลือก"}
          title={selected ? "ยกเลิกการเลือก" : "เลือกเพื่อส่งรวม"}
          className={cn(
            "absolute left-1 top-1 flex size-4 items-center justify-center rounded-full border shadow-sm transition-colors",
            selected
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-300 bg-white/90 text-transparent hover:border-zinc-900 hover:text-zinc-400",
          )}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className="size-2.5"
            aria-hidden="true"
          >
            <path
              d="M3 8.5l3 3 7-7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-zinc-900/75 opacity-0 transition-opacity group-hover:opacity-100">
        <Send className="size-3.5 text-white" />
      </div>
      {sending && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-zinc-900/75 text-[8px] font-medium text-white">
          กำลังส่ง…
        </div>
      )}
    </div>
  );
}

function TimelineTab({ detail }: { detail: ConversationDetail }) {
  const messages = detail.messages;
  // Newest at top — group by date for readability
  const sorted = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime(),
      ),
    [messages],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Message[]>();
    for (const m of sorted) {
      const d = new Date(m.sent_at);
      const key = d.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries());
  }, [sorted]);

  if (sorted.length === 0) {
    return (
      <ScrollArea className="h-full">
        <div className="p-5 text-center text-xs text-muted-foreground">
          ยังไม่มีข้อความ
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 p-3">
        {grouped.map(([date, msgs]) => (
          <section key={date}>
            <div className="mb-2 sticky top-0 z-10 bg-card pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {date}
            </div>
            <ul className="space-y-1">
              {msgs.map((m) => (
                <TimelineRow key={m.id} message={m} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ScrollArea>
  );
}

function TimelineRow({ message }: { message: Message }) {
  const isOutbound = message.direction === "outbound";
  const isSystem = message.direction === "system";
  const isNote = message.is_internal_note;
  const time = new Date(message.sent_at).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const preview = timelinePreview(message);
  const TypeIcon = getTypeIcon(message.message_type);

  let label: string;
  let dotColor: string;
  if (isNote) {
    label = "Note";
    dotColor = "bg-amber-400";
  } else if (isSystem) {
    label = "System";
    dotColor = "bg-zinc-400";
  } else if (isOutbound) {
    label = "Agent";
    dotColor = "bg-emerald-500";
  } else {
    label = "Customer";
    dotColor = "bg-blue-500";
  }

  return (
    <li className="flex gap-2.5">
      <div className="flex flex-col items-center pt-1">
        <span className={cn("size-2 shrink-0 rounded-full", dotColor)} />
      </div>
      <div className="min-w-0 flex-1 pb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <TypeIcon className="size-3" />
          <span>{label}</span>
          <span className="text-zinc-300">·</span>
          <span className="font-bold text-zinc-900 tabular-nums">{time}</span>
        </div>
        <div
          className={cn(
            "mt-0.5 break-words text-xs leading-relaxed",
            isNote ? "text-amber-700" : "text-zinc-700",
          )}
        >
          {preview}
        </div>
      </div>
    </li>
  );
}

function getTypeIcon(type: string): LucideIcon {
  switch (type) {
    case "image":
    case "video":
    case "sticker":
      return ImageIcon;
    case "location":
      return MapPin;
    case "flex":
      return FileText;
    default:
      return MessageSquare;
  }
}

function timelinePreview(m: Message): string {
  if (m.is_internal_note) {
    return (m.content.text as string) ?? "[note]";
  }
  switch (m.message_type) {
    case "text":
      return (m.content.text as string) ?? "";
    case "image":
      return "📷 รูปภาพ";
    case "video":
      return "🎬 วิดีโอ";
    case "sticker":
      return "🎉 สติกเกอร์";
    case "location":
      return `📍 ${(m.content.title as string) ?? "ตำแหน่ง"}`;
    case "flex": {
      const c = m.content as { title?: string; items?: { title?: string }[] };
      if (Array.isArray(c.items) && c.items.length > 0) {
        return `🎴 ${c.items.length} รายการ — ${c.items[0]?.title ?? ""}`;
      }
      return `🎴 ${c.title ?? "Flex Message"}`;
    }
    default:
      return `[${m.message_type}]`;
  }
}

function CalendarTab({ detail }: { detail: ConversationDetail }) {
  const [view, setView] = useState<CalendarView>("month");
  const [category, setCategory] = useState<CalendarCategory>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const viewMonth = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, []);

  const events = useMemo<CalendarEvent[]>(() => {
    const list: CalendarEvent[] = [];
    for (const l of detail.leads) {
      if (l.type !== "test_drive") continue;
      const payload = l.payload as {
        preferred_date?: string;
        preferred_time?: string;
        dealer?: string;
        model?: string;
      };
      list.push({
        id: l.id,
        category: "test_drive",
        title: payload.model ? `ทดลองขับ — ${payload.model}` : "ทดลองขับ",
        subtitle: payload.dealer ?? payload.preferred_time,
        date: payload.preferred_date ?? l.created_at,
        status: l.status,
        iconType: "car",
      });
    }
    for (const s of detail.serviceBookings) {
      const typeLabel: Record<string, string> = {
        maintenance: "เช็คระยะ",
        inspection: "ตรวจสภาพ",
        repair: "ซ่อม",
      };
      list.push({
        id: s.id,
        category: "service",
        title: typeLabel[s.service_type] ?? s.service_type,
        subtitle: s.service_center ?? undefined,
        date: s.scheduled_at,
        status: s.status,
        iconType: "wrench",
      });
    }
    list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return list;
  }, [detail]);

  const filtered = useMemo(
    () =>
      category === "all"
        ? events
        : events.filter((e) => e.category === category),
    [events, category],
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of filtered) {
      const key = new Date(e.date).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [filtered]);

  const eventsForSelectedDate =
    selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];

  // 12 months from viewMonth — used by both Month view (stacked grids) and List view
  const monthList = useMemo(() => {
    return Array.from({ length: MONTHS_TO_SHOW }, (_, i) => {
      const monthStart = new Date(
        viewMonth.getFullYear(),
        viewMonth.getMonth() + i,
        1,
      );
      const days = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth() + 1,
        0,
      ).getDate();
      const dates = Array.from(
        { length: days },
        (_, j) =>
          new Date(monthStart.getFullYear(), monthStart.getMonth(), j + 1),
      );
      return { monthStart, dates };
    });
  }, [viewMonth]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <Tabs
          value={category}
          onValueChange={(v) => setCategory(v as CalendarCategory)}
          className="flex-1"
        >
          <TabsList className={cn(TAB_LIST_VSCODE, "border-b-0")}>
            <TabsTrigger value="all" className={cn(TAB_TRIGGER_VSCODE, "px-2 text-[11px]")}>
              ทั้งหมด
            </TabsTrigger>
            <TabsTrigger value="test_drive" className={cn(TAB_TRIGGER_VSCODE, "px-2 text-[11px]")}>
              <Car className="size-3" /> ทดลองขับ
            </TabsTrigger>
            <TabsTrigger value="service" className={cn(TAB_TRIGGER_VSCODE, "px-2 text-[11px]")}>
              <Wrench className="size-3" /> เช็คระยะ
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex shrink-0 overflow-hidden rounded-md border">
          <button
            type="button"
            onClick={() => setView("month")}
            className={cn(
              "px-2 py-1 text-[11px] transition-colors",
              view === "month"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
            title="Month view"
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "px-2 py-1 text-[11px] transition-colors",
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
            title="List view"
          >
            List
          </button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {view === "month" ? (
          <div>
            {monthList.map(({ monthStart }) => (
              <CalendarGrid
                key={monthStart.toISOString()}
                monthStart={monthStart}
                eventsByDate={eventsByDate}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            ))}
          </div>
        ) : (
          <div>
            {monthList.map(({ monthStart, dates }) => (
              <div key={monthStart.toISOString()}>
                <div className="sticky top-0 z-10 border-y border-border bg-muted px-3 py-1.5 text-sm font-semibold">
                  {MONTHS_TH[monthStart.getMonth()]}{" "}
                  {monthStart.getFullYear() + 543}
                </div>
                <div className="divide-y divide-border">
                  {dates.map((date) => {
                    const dateKey = date.toDateString();
                    const items = eventsByDate.get(dateKey) ?? [];
                    const isToday = dateKey === new Date().toDateString();
                    const dow = date.getDay();
                    const isWeekend = dow === 0 || dow === 6;
                    return (
                      <div
                        key={dateKey}
                        className={cn(
                          "flex gap-3 px-3 py-2",
                          isToday && "bg-blue-50/50",
                        )}
                      >
                        <div
                          className={cn(
                            "w-12 shrink-0 text-center",
                            isToday
                              ? "text-blue-600"
                              : isWeekend && "text-red-500",
                          )}
                        >
                          <div className="text-lg font-semibold leading-none">
                            {date.getDate()}
                          </div>
                          <div
                            className={cn(
                              "text-[10px]",
                              isToday
                                ? "text-blue-600/80"
                                : isWeekend
                                  ? "text-red-500/80"
                                  : "text-muted-foreground",
                            )}
                          >
                            {WEEKDAYS_FULL[dow]}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          {items.length === 0 ? (
                            <div className="py-1 text-[10px] text-muted-foreground/60">
                              —
                            </div>
                          ) : (
                            <ul className="space-y-1.5">
                              {items.map((e) => (
                                <EventCard key={e.id} event={e} />
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const WEEKDAYS_FULL = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"];
const MONTHS_TH = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

function CalendarGrid({
  monthStart,
  eventsByDate,
  selectedDate,
  onSelectDate,
}: {
  monthStart: Date;
  eventsByDate: Map<string, CalendarEvent[]>;
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
}) {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toDateString();

  const cells: Array<{ date: Date | null; key: string }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ date: null, key: `e${i}` });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), key: `d${d}` });
  }
  while (cells.length % 7 !== 0)
    cells.push({ date: null, key: `t${cells.length}` });

  return (
    <div>
      <div className="sticky top-0 z-10 border-y border-border bg-muted px-3 py-1.5 text-sm font-semibold">
        {MONTHS_TH[month]} {year + 543}
      </div>
      <div className="grid grid-cols-7 border-x border-border bg-background text-center text-[10px] text-muted-foreground">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={cn(
              "border-b border-r border-border py-1 last:border-r-0",
              (i === 0 || i === 6) && "text-red-500",
            )}
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-x border-b border-border bg-background">
        {cells.map(({ date, key }, idx) => {
          const isRowEnd = (idx + 1) % 7 === 0;
          if (!date)
            return (
              <div
                key={key}
                className={cn(
                  "aspect-square border-b border-r border-border last:border-r-0",
                  isRowEnd && "border-r-0",
                )}
              />
            );
          const dateKey = date.toDateString();
          const isToday = dateKey === today;
          const isSelected = dateKey === selectedDate;
          const events = eventsByDate.get(dateKey) ?? [];
          const hasEvent = events.length > 0;
          const dow = date.getDay();
          const isWeekend = dow === 0 || dow === 6;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : dateKey)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center border-b border-r border-border text-xs transition-colors",
                isRowEnd && "border-r-0",
                isSelected
                  ? "bg-blue-600 text-white"
                  : isToday
                    ? "bg-blue-50 font-semibold"
                    : "hover:bg-muted",
                !isSelected && isWeekend && "text-red-500",
              )}
            >
              <span>{date.getDate()}</span>
              {hasEvent && (
                <span
                  className={cn(
                    "absolute bottom-1 size-1 rounded-full",
                    isSelected ? "bg-white" : "bg-blue-500",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EventCard({ event: e }: { event: CalendarEvent }) {
  return (
    <li className="flex items-start gap-2 rounded-md border p-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
        {e.iconType === "car" ? (
          <Car className="size-3.5" />
        ) : (
          <Wrench className="size-3.5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-medium">{e.title}</span>
          <Badge variant="secondary" className="px-1.5 py-0 text-[9px] leading-none">
            {e.status}
          </Badge>
        </div>
        {e.subtitle && (
          <div className="truncate text-[10px] text-muted-foreground">
            {e.subtitle}
          </div>
        )}
        <div className="text-[10px] text-muted-foreground">
          {new Date(e.date).toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </li>
  );
}

function formatEventDate(dateString: string): string {
  const d = new Date(dateString);
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today) return "วันนี้";
  if (d.toDateString() === yesterday.toDateString()) return "เมื่อวาน";
  if (d.toDateString() === tomorrow.toDateString()) return "พรุ่งนี้";
  return d.toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <span className={cn("break-all", mono && "font-mono")}>{value}</span>
    </div>
  );
}

/* ─────────────────────── Tags Section ─────────────────────── */

function TagsSection({
  customerId,
  tags,
  allTags,
  onChange,
}: {
  customerId: string;
  tags: CustomerTag[];
  allTags: Tag[];
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState(false);
  const taggedIds = new Set(tags.map((t) => t.id));
  const available = allTags.filter((t) => !taggedIds.has(t.id));

  const grouped = useMemo(() => {
    const map: Record<string, Tag[]> = { intent: [], model: [], service: [], other: [] };
    for (const t of available) map[t.category]?.push(t);
    return map;
  }, [available]);

  async function add(tagId: string) {
    setPending(true);
    try {
      await fetch(`/api/admin/customers/${customerId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      setAdding(false);
      onChange();
    } finally {
      setPending(false);
    }
  }

  async function remove(tagId: string) {
    setPending(true);
    try {
      await fetch(`/api/admin/customers/${customerId}/tags/${tagId}`, {
        method: "DELETE",
      });
      onChange();
    } finally {
      setPending(false);
    }
  }

  const categoryLabel: Record<string, string> = {
    intent: "ความสนใจ",
    model: "รุ่นรถ",
    service: "บริการ",
    other: "อื่น ๆ",
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <SectionLabel>Tags ({tags.length})</SectionLabel>
        {!adding && available.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setAdding(true)}
          >
            <Plus className="size-3" /> เพิ่ม
          </Button>
        )}
      </div>

      {tags.length === 0 && !adding && (
        <div className="text-xs text-muted-foreground">ยังไม่มี tag</div>
      )}

      <div className="flex flex-wrap gap-1">
        {tags.map((t) => (
          <TagPill
            key={t.id}
            tag={t}
            onRemove={() => remove(t.id)}
            disabled={pending}
          />
        ))}
      </div>

      {adding && (
        <div className="mt-3 rounded-md border bg-muted/30 p-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium">เลือก tag</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-5"
              onClick={() => setAdding(false)}
            >
              <X className="size-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {(["intent", "model", "service", "other"] as const).map((cat) => {
              const items = grouped[cat] ?? [];
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {categoryLabel[cat]}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {items.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        disabled={pending}
                        onClick={() => add(t.id)}
                        className="rounded-full border bg-background px-2 py-0.5 text-xs hover:bg-accent disabled:opacity-50"
                        style={{ borderColor: t.color, color: t.color }}
                      >
                        + {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {available.length === 0 && (
              <div className="text-xs text-muted-foreground">
                tag ทั้งหมดถูกใช้แล้ว
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TagPill({
  tag,
  onRemove,
  disabled,
}: {
  tag: CustomerTag;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <span
      className="group inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${tag.color}1f`,
        color: tag.color,
        border: `1px solid ${tag.color}40`,
      }}
    >
      {tag.name}
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        className="opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 disabled:opacity-30"
        title="ลบ tag"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}
