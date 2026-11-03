// Хөтөч талын push бүртгэл — AppSetup (асаах товч) болон Live (апп нээгдэх бүрт шалгах) хоёул хэрэглэнэ
import { savePushSubscription } from "@/app/actions";

/** Хэрэглэгч өөрөө унтраасан бол дахин автоматаар асаахгүй */
export const PUSH_OFF_KEY = "bh_push_off";

/** VAPID нийтийн түлхүүрийг (base64url) push бүртгэлд хэрэгтэй байт болгоно */
export function keyBytes(base64url: string) {
  const b64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const same = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Энэ төхөөрөмжийн бүртгэлийг баталгаажуулж серверт хадгална. Байхгүй (iOS заримдаа хаядаг,
 * сервер 410-аар устгасан) эсвэл хуучин түлхүүртэй бол шинээр үүсгэнэ — зөвшөөрөл дахин асуухгүй.
 */
export async function ensurePushSubscription(vapidKey: string) {
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  const reg = await navigator.serviceWorker.ready;
  const key = keyBytes(vapidKey);
  let sub = await reg.pushManager.getSubscription();
  const old = sub?.options.applicationServerKey;
  if (sub && old && !same(new Uint8Array(old), key)) {
    await sub.unsubscribe();
    sub = null;
  }
  sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  const r = await savePushSubscription(JSON.parse(JSON.stringify(sub)));
  if (r?.error) throw new Error(r.error);
  return sub;
}
