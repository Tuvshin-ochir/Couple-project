import { connection } from "next/server";
import { readSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Дурсамжийн зургийг зөвхөн нэвтэрсэн хост харна
export async function GET(_req: Request, ctx: RouteContext<"/photos/[id]">) {
  await connection();
  const session = await readSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  // Зураг нь зөвхөн энэ хосын дурсамжид хамаарах ёстой
  const photo = await prisma.photo.findFirst({ where: { id, memory: { coupleId: session.couple.id } } });
  if (!photo) return new Response("Not found", { status: 404 });

  return new Response(photo.data, {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
