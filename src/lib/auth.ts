import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Couple } from "@/generated/prisma/client";
import { prisma } from "./db";
import type { Who } from "./types";

// Хос бүр нэг нууц үгтэй. Нэвтрэхдээ хосын нэр, "би хэн бэ", нууц үгээ оруулна.
// Cookie: "<coupleId>.<who>.<issuedAt>.<hmac>" — нууц үг солигдвол бүх session хүчингүй болно.

const COOKIE = "bh_session";
const MAX_AGE = 60 * 60 * 24 * 180; // 180 хоног

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET .env файлд тохируулагдаагүй байна");
  return s;
}

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(pw, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const sign = (payload: string, pwHash: string) =>
  createHmac("sha256", secret()).update(`${payload}|${pwHash}`).digest("base64url");

export async function startSession(coupleId: string, who: Who, pwHash: string) {
  const payload = `${coupleId}.${who}.${Date.now()}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload, pwHash)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** Нэвтэрсэн хос ба хэн болохыг буцаана (cookie буруу/хуучирсан бол null) */
export async function readSession(): Promise<{ couple: Couple; me: Who } | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [coupleId, who, ts, sig] = raw.split(".");
  if (!coupleId || (who !== "a" && who !== "b") || !ts || !sig) return null;
  if (Date.now() - Number(ts) > MAX_AGE * 1000) return null;
  const couple = await prisma.couple.findUnique({ where: { id: coupleId } });
  if (!couple) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(`${coupleId}.${who}.${ts}`, couple.passwordHash));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { couple, me: who };
}
