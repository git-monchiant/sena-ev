import "server-only";
import { EventEmitter } from "node:events";

export type InboxEvent =
  | { type: "new_message"; conversationId: string; messageId: string; customerName: string; preview: string; messageType: string; at: number }
  | { type: "status_change"; conversationId: string; status: string; at: number }
  | { type: "assigned"; conversationId: string; agentId: string; at: number }
  | { type: "test"; payload: string; at: number };

declare global {
  // eslint-disable-next-line no-var
  var __sena_ev_inbox_bus: EventEmitter | undefined;
}

function getBus(): EventEmitter {
  if (!global.__sena_ev_inbox_bus) {
    const bus = new EventEmitter();
    bus.setMaxListeners(100);
    global.__sena_ev_inbox_bus = bus;
  }
  return global.__sena_ev_inbox_bus;
}

export function emitInboxEvent(event: InboxEvent): void {
  getBus().emit("event", event);
}

export function subscribeInbox(listener: (event: InboxEvent) => void): () => void {
  const bus = getBus();
  bus.on("event", listener);
  return () => bus.off("event", listener);
}

const ENCODER = new TextEncoder();

export function encodeSseFrame(event: { event?: string; data: unknown; id?: string }): Uint8Array {
  let frame = "";
  if (event.id) frame += `id: ${event.id}\n`;
  if (event.event) frame += `event: ${event.event}\n`;
  frame += `data: ${JSON.stringify(event.data)}\n\n`;
  return ENCODER.encode(frame);
}

export function encodeSseComment(text: string): Uint8Array {
  return ENCODER.encode(`: ${text}\n\n`);
}

export function createInboxStream(): ReadableStream<Uint8Array> {
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  return new ReadableStream({
    start(controller) {
      controller.enqueue(encodeSseComment("connected"));
      controller.enqueue(
        encodeSseFrame({ event: "ready", data: { at: Date.now() } }),
      );

      unsubscribe = subscribeInbox((event) => {
        try {
          controller.enqueue(
            encodeSseFrame({ event: event.type, data: event, id: String(event.at) }),
          );
        } catch {
          // controller may be closed; cleanup will run via cancel
        }
      });

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encodeSseComment("heartbeat"));
        } catch {
          // ignored
        }
      }, 15_000);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });
}
