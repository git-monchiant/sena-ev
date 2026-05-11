"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Car,
  FileText,
  Image as ImageIcon,
  MapPin,
  MessageSquare,
  MoreVertical,
  Plus,
  Reply,
  Search,
  Send,
  User,
  Wrench,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  async function handleSendLocation(loc: {
    title: string;
    address: string;
    latitude: number;
    longitude: number;
  }) {
    if (!selectedId) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/admin/inbox/conversations/${selectedId}/send-location`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...loc, quotedMessageId: quoted?.id ?? null }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`ส่งตำแหน่งไม่สำเร็จ: ${JSON.stringify(err)}`);
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

  return (
    <div className="grid h-full min-h-0 grid-cols-[300px_800px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)]">
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
        onSendLocation={handleSendLocation}
        quoted={quoted}
        onQuote={setQuoted}
        onClearQuote={() => setQuoted(null)}
        allTags={allTags}
        onTagsChange={() => selectedId && fetchDetail(selectedId)}
      />
      <CustomerPanel
        detail={detail}
        allTags={allTags}
        onTagsChange={() => selectedId && fetchDetail(selectedId)}
      />
    </div>
  );
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

type ComposerMode = "text" | "image" | "location";

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
  onSendLocation,
  quoted,
  onQuote,
  onClearQuote,
  allTags,
  onTagsChange,
}: {
  detail: ConversationDetail | null;
  text: string;
  onTextChange: (t: string) => void;
  internalNote: boolean;
  onToggleNote: (v: boolean) => void;
  sending: boolean;
  onSendText: () => void;
  onSendImage: (file: File) => void;
  onSendLocation: (loc: {
    title: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  quoted: QuotedDraft | null;
  onQuote: (q: QuotedDraft) => void;
  onClearQuote: () => void;
  allTags: Tag[];
  onTagsChange: () => void;
}) {
  const [mode, setMode] = useState<ComposerMode>("text");
  const scrollRef = useRef<HTMLDivElement>(null);

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

        <Tabs value={mode} onValueChange={(v) => setMode(v as ComposerMode)}>
          <div className="px-2">
            <TabsList className={TAB_LIST_VSCODE}>
              <TabsTrigger value="text" className={TAB_TRIGGER_VSCODE}>
                <MessageSquare className="size-3.5" />
                ข้อความ
              </TabsTrigger>
              <TabsTrigger value="image" className={TAB_TRIGGER_VSCODE}>
                <ImageIcon className="size-3.5" />
                รูป
              </TabsTrigger>
              <TabsTrigger value="location" className={TAB_TRIGGER_VSCODE}>
                <MapPin className="size-3.5" />
                ตำแหน่ง
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-[190px] p-4">
            <TabsContent value="text" className="mt-0">
              <TextComposer
                text={text}
                onTextChange={onTextChange}
                internalNote={internalNote}
                onToggleNote={onToggleNote}
                sending={sending}
                onSend={onSendText}
              />
            </TabsContent>
            <TabsContent value="image" className="mt-0">
              <ImageComposer sending={sending} onSend={onSendImage} />
            </TabsContent>
            <TabsContent value="location" className="mt-0">
              <LocationComposer sending={sending} onSend={onSendLocation} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </section>
  );
}

/* ─────────────────────── Composers ─────────────────────── */

function TextComposer({
  text,
  onTextChange,
  internalNote,
  onToggleNote,
  sending,
  onSend,
}: {
  text: string;
  onTextChange: (t: string) => void;
  internalNote: boolean;
  onToggleNote: (v: boolean) => void;
  sending: boolean;
  onSend: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={internalNote}
          onChange={(e) => onToggleNote(e.target.checked)}
          className="size-3"
        />
        Internal note (agent เท่านั้น)
      </label>
      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={
            internalNote
              ? "บันทึกภายใน (ไม่ส่งหา user)..."
              : "พิมพ์ข้อความตอบลูกค้า..."
          }
          rows={2}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <Button
          type="button"
          onClick={onSend}
          disabled={sending || !text.trim()}
          className={cn(
            "self-end",
            internalNote && "bg-amber-600 hover:bg-amber-700",
          )}
        >
          <Send className="size-4" />
          {sending ? "กำลังส่ง..." : internalNote ? "บันทึก" : "ส่ง"}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        กด ⌘/Ctrl+Enter เพื่อส่ง
      </p>
    </div>
  );
}

function ImageComposer({
  sending,
  onSend,
}: {
  sending: boolean;
  onSend: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSend() {
    if (!file) return;
    onSend(file);
    reset();
  }

  if (!file) {
    return (
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-muted/30 p-8 text-sm text-muted-foreground transition-colors hover:bg-accent">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <ImageIcon className="size-6" />
        <span>คลิกเพื่อเลือกรูป (JPG/PNG/WebP, max 10MB)</span>
      </label>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl ?? ""}
          alt="preview"
          className="max-h-48 max-w-full rounded border"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={reset}
          className="absolute -right-2 -top-2 size-6 rounded-full"
        >
          <X className="size-3" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 text-xs text-muted-foreground">
          {file.name} · {Math.round(file.size / 1024)} KB
        </div>
        <Button type="button" onClick={handleSend} disabled={sending}>
          <Send className="size-4" />
          {sending ? "กำลังส่ง..." : "ส่งรูป"}
        </Button>
      </div>
    </div>
  );
}

const PRESET_LOCATIONS = [
  {
    title: "Sena EV — โชว์รูม Bangna",
    address: "Bangna-Trat Road, Bangkok",
    latitude: 13.6747,
    longitude: 100.6071,
  },
];

function LocationComposer({
  sending,
  onSend,
}: {
  sending: boolean;
  onSend: (loc: {
    title: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  function applyPreset(p: (typeof PRESET_LOCATIONS)[number]) {
    setTitle(p.title);
    setAddress(p.address);
    setLat(String(p.latitude));
    setLng(String(p.longitude));
  }

  function handleSend() {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (!title.trim() || !address.trim() || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      alert("กรอกข้อมูลให้ครบ");
      return;
    }
    onSend({ title: title.trim(), address: address.trim(), latitude, longitude });
    setTitle("");
    setAddress("");
    setLat("");
    setLng("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {PRESET_LOCATIONS.map((p) => (
          <Button
            key={p.title}
            type="button"
            variant="outline"
            size="sm"
            className="h-6 rounded-full text-xs"
            onClick={() => applyPreset(p)}
          >
            <MapPin className="size-3" />
            {p.title}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ชื่อสถานที่"
          className="col-span-2"
        />
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="ที่อยู่"
          className="col-span-2"
        />
        <Input
          type="number"
          step="any"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="Latitude"
        />
        <Input
          type="number"
          step="any"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          placeholder="Longitude"
        />
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={handleSend} disabled={sending}>
          <Send className="size-4" />
          {sending ? "กำลังส่ง..." : "ส่งตำแหน่ง"}
        </Button>
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
}: {
  message: Message;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  customerName: string | null;
  customerPicture: string | null;
  onQuote: (preview: string) => void;
}) {
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
          className={cn(
            "relative w-fit max-w-full overflow-hidden shadow-sm",
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

    case "flex":
      return <span className="italic opacity-75">[Flex Message]</span>;

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
}: {
  detail: ConversationDetail | null;
  allTags: Tag[];
  onTagsChange: () => void;
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
          <TabsTrigger value="calendar" className={TAB_TRIGGER_VSCODE}>
            <CalendarDays className="size-3.5" /> นัดหมาย
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="min-h-0 flex-1 overflow-hidden">
          <ProfileTab
            detail={detail}
            allTags={allTags}
            onTagsChange={onTagsChange}
          />
        </TabsContent>
        <TabsContent value="calendar" className="min-h-0 flex-1 overflow-hidden">
          <CalendarTab detail={detail} />
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
