import "server-only";
import { messagingApi } from "@line/bot-sdk";

function requireToken(): string {
  const token = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error("LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is not set");
  return token;
}

export function getMessagingClient() {
  return new messagingApi.MessagingApiClient({
    channelAccessToken: requireToken(),
  });
}

export function getMessagingBlobClient() {
  return new messagingApi.MessagingApiBlobClient({
    channelAccessToken: requireToken(),
  });
}
