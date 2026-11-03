import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Who } from "./types";

// Хос нэг нууц үгтэй. Нэвтрэхдээ "би хэн бэ" гэдгээ сонгоод нууц үгээ оруулна.
// Cookie: "<who>.<issuedAt>.<hmac>" — нууц үг солигдвол бүх session хүчингүй болно.

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

export async function startSession(who: Who, pwHash: string) {
  const payload = `${who}.${Date.now()}`;
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

export async function readSession(pwHash: string): Promise<Who | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [who, ts, sig] = raw.split(".");
  if ((who !== "a" && who !== "b") || !ts || !sig) return null;
  if (Date.now() - Number(ts) > MAX_AGE * 1000) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(`${who}.${ts}`, pwHash));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return who;
}
