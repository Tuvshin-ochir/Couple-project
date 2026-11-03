// Клиент талын жижиг туслахууд: мэдэгдэл (toast), цаг тоолуур, зураг жижигрүүлэх.
import { useSyncExternalStore } from "react";

export function toast(msg: string, kind: "ok" | "error" = "ok") {
  window.dispatchEvent(new CustomEvent("bh:toast", { detail: { msg, kind } }));
}

/** Live компонентод шууд шинэчлэлт шалгуулах дохио */
export const pulseNow = () => window.dispatchEvent(new Event("bh:pulse"));

// Нэг интервалыг олон компонент хуваалцана. Сервер дээр 0 буцаадаг тул
// hydration-ий зөрүү гарахгүй — клиент дээр холбогдмогц жинхэнэ цаг орж ирнэ.
type Clock = { subscribe: (cb: () => void) => () => void; get: () => number };
const clocks = new Map<number, Clock>();

function createClock(ms: number): Clock {
  let now = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  const subs = new Set<() => void>();
  return {
    subscribe(cb) {
      subs.add(cb);
      if (!timer) {
        now = Date.now();
        timer = setInterval(() => {
          now = Date.now();
          subs.forEach((f) => f());
        }, ms);
      }
      return () => {
        subs.delete(cb);
        if (!subs.size && timer) {
          clearInterval(timer);
          timer = undefined;
        }
      };
    },
    get: () => now,
  };
}

function clockFor(ms: number) {
  let c = clocks.get(ms);
  if (!c) {
    c = createClock(ms);
    clocks.set(ms, c);
  }
  return c;
}

const serverNow = () => 0;

export function useNow(ms = 1000) {
  const c = clockFor(ms);
  return useSyncExternalStore(c.subscribe, c.get, serverNow);
}

const noopSubscribe = () => () => {};

/** Клиент дээр ачаалагдсан эсэх (серверт false) */
export const useMounted = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

/** Зургийг клиент дээр жижигрүүлж JPEG болгоно */
export function compressImage(file: File, max = 1600, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}
