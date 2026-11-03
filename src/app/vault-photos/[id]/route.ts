import { connection } from "next/server";
import { readSession } from "@/lib/auth";
import { scoped } from "@/lib/db";
import { vaultUntil } from "@/lib/vault";

// Нууц өрөөний зураг — нэвтэрсэн + өрөө нээлттэй үед л. "Нэг удаа харах" зургийг
// хайрт нь энд татаж болохгүй (openOnceVaultPhoto-оор нэг л удаа нээгдэнэ).
export async function GET(req: Request, ctx: RouteContext<"/vault-photos/[id]">) {
  await connection();
  const session = await readSession();
  if (!session) return new Response("Locked", { status: 403 });
  const { couple: s, me } = session;
  if (!(await vaultUntil(s.id, me, s.vaultPinHash))) return new Response("Locked", { status: 403 });
  const db = scoped(s.id);

  const { id } = await ctx.params;
  const thumb = new URL(req.url).searchParams.get("s") === "thumb";
  const p = await db.vaultPhoto.findUnique({ where: { id } });
  if (!p || (p.viewOnce && p.by !== me) || p.viewedAt) return new Response("Not found", { status: 404 });

  return new Response(thumb ? p.thumb : p.data, {
    headers: {
      "Content-Type": thumb ? "image/jpeg" : p.mime,
      // Хөтөч дээр кэшлэхгүй — өрөө түгжигдсэний дараа ч харагдахгүй байх
      "Cache-Control": "no-store",
    },
  });
}
