import "server-only";
import type { Couple, SpecialDay } from "@/generated/prisma/client";
import { dayKey, daysBetween, nextOccurrence, utcKey } from "./time";

export type Ev = {
  key: string;
  id?: string; // зөвхөн хэрэглэгчийн нэмсэн өдөрт
  emoji: string;
  title: string;
  date: string; // YYYY-MM-DD
  left: number;
  yearly?: boolean;
  auto?: boolean;
};

const MILESTONES = [100, 200, 300, 365, 500, 730, 1000, 1095, 1461, 1500, 1826, 2000, 2500, 3000, 3650, 5000];

/** Ирэх өдрүүд: хэрэглэгчийн нэмсэн + уулзалт, ой, "N хоног" (автоматаар) */
export function upcomingEvents(s: Couple, days: SpecialDay[], today: string, tz: string): Ev[] {
  const ev: Omit<Ev, "left">[] = days.map((d) => ({
    key: d.id,
    id: d.id,
    emoji: d.emoji,
    title: d.title,
    date: nextOccurrence(utcKey(d.date), d.yearly, today),
    yearly: d.yearly,
  }));

  if (s.nextMeet) ev.push({ key: "meet", emoji: "✈️", title: "Дараагийн уулзалт", date: dayKey(s.nextMeet, tz), auto: true });

  if (s.startDate) {
    const start = utcKey(s.startDate);
    const ann = nextOccurrence(start, true, today);
    const years = +ann.slice(0, 4) - +start.slice(0, 4);
    if (years > 0) ev.push({ key: "ann", emoji: "💞", title: `${years} жилийн ой`, date: ann, auto: true });
    const passed = daysBetween(start, today);
    for (const m of MILESTONES.filter((m) => m >= passed).slice(0, 2)) {
      const d = new Date(s.startDate.getTime() + m * 864e5);
      ev.push({ key: `m${m}`, emoji: "🎯", title: `Хамтдаа ${m} хоног`, date: utcKey(d), auto: true });
    }
  }

  return ev
    .map((e) => ({ ...e, left: daysBetween(today, e.date) }))
    .filter((e) => e.left >= 0)
    .sort((a, b) => a.left - b.left);
}

export const leftText = (n: number) => (n === 0 ? "Өнөөдөр! 🎉" : n === 1 ? "Маргааш" : `${n} хоног`);
