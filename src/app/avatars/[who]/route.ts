import { connection } from "next/server";
import { readSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, ctx: RouteContext<"/avatars/[who]">) {
  await connection();
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!s || !(await readSession(s.passwordHash))) return new Response("Unauthorized", { status: 401 });

  const { who } = await ctx.params;
  const img = await prisma.avatarImage.findUnique({ where: { who } });
  if (!img) return new Response("Not found", { status: 404 });

  return new Response(img.data, {
    headers: { "Content-Type": img.mime, "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
