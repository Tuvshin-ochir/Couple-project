import { connection } from "next/server";
import { readSession } from "@/lib/auth";
import { scoped } from "@/lib/db";
import { isWho } from "@/lib/types";

export async function GET(_req: Request, ctx: RouteContext<"/avatars/[who]">) {
  await connection();
  const session = await readSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { who } = await ctx.params;
  if (!isWho(who)) return new Response("Not found", { status: 404 });
  const cid = session.couple.id;
  const img = await scoped(cid).avatarImage.findUnique({ where: { coupleId_who: { coupleId: cid, who } } });
  if (!img) return new Response("Not found", { status: 404 });

  return new Response(img.data, {
    headers: { "Content-Type": img.mime, "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
