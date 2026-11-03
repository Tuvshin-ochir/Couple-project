import "server-only";
import webpush from "web-push";
import { prisma } from "./db";
import type { Who } from "./types";

// Утасны push мэдэгдэл (Web Push + VAPID). Түлхүүргүй орчинд (VAPID_*) чимээгүй алгасна.

let configured = false;

function ready() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  if (!configured) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://bid-hoyor-production.up.railway.app", pub, priv);
    configured = true;
  }
  return true;
}

export const vapidPublicKey = () => process.env.VAPID_PUBLIC_KEY ?? "";

export type PushPayload = {
  title: string;
  body: string;
  url: string; // мэдэгдэл дээр дарахад нээгдэх хуудас
  tag?: string; // ижил tag-тай мэдэгдлүүд нэг мөр болно
};

/** Хосын нэг хүний бүх төхөөрөмж рүү илгээнэ; хүчингүй болсон бүртгэлийг устгана */
export async function pushTo(coupleId: string, who: Who, payload: PushPayload) {
  if (!ready()) return;
  const subs = await prisma.pushSubscription.findMany({ where: { coupleId, who } });
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 6, urgency: "high" },
        );
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await prisma.pushSubscription.deleteMany({ where: { id: s.id } });
      }
    }),
  );
}
