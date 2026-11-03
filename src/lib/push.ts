import "server-only";
import webpush from "web-push";
import { prisma } from "./db";
import { SITE_URL } from "./site";
import type { Who } from "./types";

// Утасны push мэдэгдэл (Web Push + VAPID). Түлхүүргүй орчинд (VAPID_*) чимээгүй алгасна.

let configured = false;

function ready() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  if (!configured) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || SITE_URL, pub, priv);
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
  image?: string; // Android дээр том зураг (дууны нүүр г.м)
};

/** Хосын нэг хүний бүх төхөөрөмж рүү илгээнэ; хүчингүй болсон бүртгэлийг устгана */
export async function pushTo(coupleId: string, who: Who, payload: PushPayload) {
  if (!ready()) return;
  const subs = await prisma.pushSubscription.findMany({ where: { coupleId, who } });
  await Promise.all(
    subs.map(async (s) => {
      try {
        // Утас унтраастай байсан ч 24 цагийн дотор асвал хүрнэ; high — iOS/Android шууд сэрээнэ
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24, urgency: "high" },
        );
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        // 404/410 — бүртгэл хүчингүй; 403 — өөр VAPID түлхүүрээр бүртгэгдсэн. Клиент дараа нь дахин бүртгэнэ (Live)
        if (code === 404 || code === 410 || code === 403) await prisma.pushSubscription.deleteMany({ where: { id: s.id } });
        else console.error("push failed", code ?? "", (e as Error).message?.slice(0, 200));
      }
    }),
  );
}
