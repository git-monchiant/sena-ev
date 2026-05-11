import "server-only";
import { validateSignature } from "@line/bot-sdk";

export type VerifiedIdToken = {
  sub: string;
  name?: string;
  picture?: string;
  email?: string;
};

export async function verifyLiffIdToken(idToken: string): Promise<VerifiedIdToken> {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  if (!channelId) throw new Error("LINE_LOGIN_CHANNEL_ID is not set");

  const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: idToken, client_id: channelId }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Invalid ID token: ${err}`);
  }

  return res.json();
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_MESSAGING_CHANNEL_SECRET;
  if (!secret) throw new Error("LINE_MESSAGING_CHANNEL_SECRET is not set");
  return validateSignature(body, secret, signature);
}
