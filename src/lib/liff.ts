"use client";

import type { Liff } from "@line/liff";

let liffInstance: Liff | null = null;
let initPromise: Promise<Liff> | null = null;

export async function initLiff(): Promise<Liff> {
  if (liffInstance) {
    console.log("[LIFF] initLiff() — using cached instance");
    return liffInstance;
  }
  if (initPromise) {
    console.log("[LIFF] initLiff() — joining in-flight init");
    return initPromise;
  }

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) throw new Error("NEXT_PUBLIC_LIFF_ID is not set");

  console.log("[LIFF] initLiff() — fresh init", {
    liffId,
    url: window.location.href,
    referrer: document.referrer,
  });

  initPromise = (async () => {
    const liffModule = await import("@line/liff");
    const liff = liffModule.default;
    await liff.init({ liffId });
    liffInstance = liff;
    console.log("[LIFF] init complete", {
      isLoggedIn: liff.isLoggedIn(),
      isInClient: liff.isInClient(),
      os: liff.getOS(),
    });
    return liff;
  })();

  return initPromise;
}

export async function ensureLogin(): Promise<Liff> {
  const liff = await initLiff();
  if (!liff.isLoggedIn()) {
    console.log("[LIFF] ensureLogin() — calling liff.login() (will redirect)");
    liff.login();
    return new Promise(() => {});
  }
  return liff;
}

export async function getProfile() {
  const liff = await ensureLogin();
  return liff.getProfile();
}

export async function getIDToken() {
  const liff = await ensureLogin();
  return liff.getIDToken();
}

export async function sendTextMessage(text: string) {
  const liff = await ensureLogin();
  if (!liff.isApiAvailable("sendMessages")) {
    throw new Error("sendMessages ใช้ได้เฉพาะใน LINE app");
  }
  await liff.sendMessages([{ type: "text", text }]);
}

export async function scanQRCode(): Promise<string | null> {
  const liff = await ensureLogin();
  if (!liff.isApiAvailable("scanCodeV2")) {
    throw new Error("scanCodeV2 ใช้ได้เฉพาะใน LINE app");
  }
  const result = await liff.scanCodeV2();
  return result.value;
}

export async function closeLiff() {
  const liff = await initLiff();
  liff.closeWindow();
}

export async function getLiffContext() {
  const liff = await initLiff();
  return {
    isInClient: liff.isInClient(),
    os: liff.getOS(),
    language: liff.getLanguage(),
    version: liff.getVersion(),
    lineVersion: liff.getLineVersion(),
  };
}
