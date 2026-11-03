import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Who } from "./types";

// "Нууц өрөө"-ний түр түгжээ: PIN зөв бол 15 минут нээлттэй байна.
// Cookie нь PIN-ий хэштэй холбоотой тул PIN солигдвол бүх нээлттэй өрөө түгжигдэнэ.

const COOKIE = "bh_vault";
export const VAULT_MINUTES = 15;

const sign = (payload: string, pinHash: string) =>
  createHmac("sha256", process.env.SESSION_SECRET ?? "").update(`vault|${payload}|${pinHash}`).digest("base64url");

export async function openVault(who: Who, pinHash: string) {
  const payload = `${who}.${Date.now()}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload, pinHash)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VAULT_MINUTES * 60,
  });
}

export async function closeVault() {
  (await cookies()).delete(COOKIE);
}

/** Нээлттэй бол түгжигдэх агшныг (ms), түгжээтэй бол 0-ийг буцаана */
export async function vaultUntil(who: Who, pinHash: string | null): Promise<number> {
  if (!pinHash) return 0;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return 0;
  const [w, ts, sig] = raw.split(".");
  if (w !== who || !ts || !sig) return 0;
  const until = Number(ts) + VAULT_MINUTES * 60_000;
  if (!(until > Date.now())) return 0;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(`${w}.${ts}`, pinHash));
  return a.length === b.length && timingSafeEqual(a, b) ? until : 0;
}
