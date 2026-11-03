import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "./db";
import { readSession } from "./auth";
import { DEFAULT_TZ, validTz } from "./time";
import { other, type City, type Who } from "./types";

export function parseCity(raw: string | null): City | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(raw);
    return validTz(c?.tz) ? { name: String(c.name || c.tz), tz: c.tz, lat: c.lat ?? null, lon: c.lon ?? null } : null;
  } catch {
    return null;
  }
}

/** Хэрэглэгчийн цагийн бүс: браузерын "tz" cookie → хотынх → Улаанбаатар */
export function viewerTz(jarTz: string | undefined, city: City | null) {
  let tz = jarTz;
  try {
    if (tz?.includes("%")) tz = decodeURIComponent(tz);
  } catch {}
  return validTz(tz) ? tz : city?.tz ?? DEFAULT_TZ;
}

export const getSettings = cache(() => prisma.settings.findUnique({ where: { id: 1 } }));

/** Нэвтэрсэн хүний мэдээлэл. Нэвтрээгүй бол /login, хос үүсээгүй бол /setup руу шилжүүлнэ. */
export const getCtx = cache(async () => {
  // Хуудас бүр хүсэлтийн үед (нэвтрэлт, одоогийн цаг) рендерлэгдэнэ — prerender үед
  // өгөгдлийн сан руу хандахгүй, Date.now() дуудагдахгүй
  await connection();
  const jar = await cookies();
  const s = await getSettings();
  if (!s) redirect("/setup");
  const me = await readSession(s.passwordHash);
  if (!me) redirect("/login");
  const cityA = parseCity(s.cityA);
  const cityB = parseCity(s.cityB);
  const partner = other(me);
  const names = { a: s.nameA, b: s.nameB };
  // Профайл зургийн хувилбар (кэш шинэчлэхэд ашиглана) — зураг байхгүй бол 0
  const avatarRows = await prisma.avatarImage.findMany({ select: { who: true, updatedAt: true } });
  const avatars: Record<Who, number> = { a: 0, b: 0 };
  for (const r of avatarRows) if (r.who === "a" || r.who === "b") avatars[r.who] = r.updatedAt.getTime();
  return {
    s,
    me,
    partner,
    names,
    avatars,
    cityA,
    cityB,
    tz: viewerTz(jar.get("tz")?.value, me === "a" ? cityA : cityB),
    nameOf: (w: Who) => names[w],
  };
});

export type Ctx = Awaited<ReturnType<typeof getCtx>>;
