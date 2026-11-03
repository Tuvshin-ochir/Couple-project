import "server-only";
import type { Who } from "./types";

// Хэн Our taste хуудсанд байгааг санах ойд барина (Railway дээр ганц сервер). Өгөгдлийн санд
// 2 секунд тутам бичих шаардлагагүй; сервер дахин асахад хоосорно — хэдхэн секундэд сэргэнэ.
const HERE_MS = 8000;

type Seen = { at: number; together: boolean };
const g = globalThis as typeof globalThis & { __bhHere?: Map<string, Seen> };
const here = (g.__bhHere ??= new Map<string, Seen>());

/** together — хуудсанд байгаад зогсохгүй, хамтын дуунд нэгдсэн эсэх */
export function markHere(coupleId: string, who: Who, together: boolean) {
  here.set(`${coupleId}:${who}`, { at: Date.now(), together });
}

const seen = (coupleId: string, who: Who): Seen | null => {
  const s = here.get(`${coupleId}:${who}`);
  return s && Date.now() - s.at < HERE_MS ? s : null;
};

export const isHere = (coupleId: string, who: Who) => seen(coupleId, who) !== null;
export const isListening = (coupleId: string, who: Who) => seen(coupleId, who)?.together === true;
