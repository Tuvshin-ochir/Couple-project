// Цагийн бүс, огнооны туслах функцууд. Сервер ба клиент хоёуланд ажиллана.
// Зөвхөн огноо (төрсөн өдөр, дурсамж г.м) нь UTC шөнө дунд хадгалагдаж,
// "YYYY-MM-DD" түлхүүрээр харьцуулагдана.

export const WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
export const DEFAULT_TZ = "Asia/Ulaanbaatar";

export const pad = (n: number) => String(n).padStart(2, "0");

const formatters = new Map<string, Intl.DateTimeFormat>();
const EN_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function tzParts(tz: string, d: Date = new Date()) {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      weekday: "short",
      hourCycle: "h23",
    });
    formatters.set(tz, f);
  }
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(d)) p[x.type] = x.value;
  return {
    y: +p.year,
    m: +p.month,
    d: +p.day,
    h: +p.hour % 24,
    mi: +p.minute,
    s: +p.second,
    wd: EN_WEEKDAYS.indexOf(p.weekday),
  };
}

export function validTz(tz?: string | null): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** UTC-ээс хэдэн минутын зөрүүтэй вэ (жишээ нь Улаанбаатар = 480) */
export function tzOffsetMin(tz: string, d: Date = new Date()) {
  const p = tzParts(tz, d);
  const wall = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
  return Math.round((wall - Math.floor(d.getTime() / 1000) * 1000) / 60000);
}

export function dayKey(d: Date, tz: string) {
  const p = tzParts(tz, d);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

export const isDayKey = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
export const keyToUTC = (k: string) => new Date(`${k}T00:00:00.000Z`);
export const utcKey = (d: Date) => d.toISOString().slice(0, 10);

/** Тухайн бүсийн өдрийн эхлэл (UTC агшин) */
export function startOfDay(k: string, tz: string) {
  const guess = keyToUTC(k);
  return new Date(guess.getTime() - tzOffsetMin(tz, guess) * 60000);
}

export const daysBetween = (a: string, b: string) =>
  Math.round((keyToUTC(b).getTime() - keyToUTC(a).getTime()) / 864e5);

export function fmtKey(k: string) {
  const [y, m, d] = k.split("-").map(Number);
  return `${y} оны ${m}-р сарын ${d}`;
}

export function fmtKeyShort(k: string) {
  const [, m, d] = k.split("-").map(Number);
  return `${m}-р сарын ${d}`;
}

export const weekdayOfKey = (k: string) => WEEKDAYS[keyToUTC(k).getUTCDay()];

export const fmtDate = (d: Date, tz: string) => fmtKey(dayKey(d, tz));

export function fmtTime(d: Date, tz: string) {
  const p = tzParts(tz, d);
  return `${pad(p.h)}:${pad(p.mi)}`;
}

export function rel(d: Date, tz: string, now: Date = new Date()) {
  const s = (now.getTime() - d.getTime()) / 1000;
  if (s < 60) return "дөнгөж сая";
  if (s < 3600) return `${Math.floor(s / 60)} минутын өмнө`;
  if (s < 86400) return `${Math.floor(s / 3600)} цагийн өмнө`;
  const days = daysBetween(dayKey(d, tz), dayKey(now, tz));
  if (days <= 1) return "өчигдөр";
  if (days < 7) return `${days} өдрийн өмнө`;
  return fmtDate(d, tz);
}

/** Хоёр огнооны хоорондох жил/сар/өдөр */
export function ymd(fromKey: string, toKey: string) {
  const [y1, m1, d1] = fromKey.split("-").map(Number);
  const [y2, m2, d2] = toKey.split("-").map(Number);
  let y = y2 - y1;
  let m = m2 - m1;
  let d = d2 - d1;
  if (d < 0) {
    m -= 1;
    d += new Date(Date.UTC(y2, m2 - 1, 0)).getUTCDate();
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  return { y, m, d };
}

export function ymdText({ y, m, d }: { y: number; m: number; d: number }) {
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} жил`);
  if (m > 0) parts.push(`${m} сар`);
  if (d > 0 || parts.length === 0) parts.push(`${d} өдөр`);
  return parts.join(" ");
}

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Жил бүр давтагдах өдрийн дараагийн тохиолдол (өнөөдрийг оруулаад) */
export function nextOccurrence(k: string, yearly: boolean, today: string) {
  if (!yearly) return k;
  const [, m, d] = k.split("-");
  const at = (y: number) => (m === "02" && d === "29" && !isLeap(y) ? `${y}-02-28` : `${y}-${m}-${d}`);
  const ty = +today.slice(0, 4);
  const thisYear = at(ty);
  return thisYear >= today ? thisYear : at(ty + 1);
}

export function partsOf(ms: number) {
  const t = Math.max(0, ms);
  return {
    d: Math.floor(t / 864e5),
    h: Math.floor((t % 864e5) / 36e5),
    m: Math.floor((t % 36e5) / 6e4),
    s: Math.floor((t % 6e4) / 1e3),
  };
}

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** "Хоёулаа сэрүүн" цагууд (08:00–23:00), миний цагаар */
export function talkWindows(myTz: string, theirTz: string) {
  const delta = (tzOffsetMin(theirTz) - tzOffsetMin(myTz)) / 60;
  const ok: boolean[] = [];
  for (let h = 0; h < 24; h++) {
    const o = (((h + delta) % 24) + 24) % 24;
    ok.push(h >= 8 && h < 23 && o >= 8 && o < 23);
  }
  const ranges: [number, number][] = [];
  let start: number | null = null;
  for (let h = 0; h <= 24; h++) {
    if (h < 24 && ok[h]) {
      if (start === null) start = h;
    } else if (start !== null) {
      ranges.push([start, h]);
      start = null;
    }
  }
  return ranges;
}
