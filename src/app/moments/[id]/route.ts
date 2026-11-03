import { connection } from "next/server";
import { readSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Өдрийн мөчийн зураг. ?s=thumb бол хуанлид зориулсан жижиг хувилбар.
export async function GET(req: Request, ctx: RouteContext<"/moments/[id]">) {
  await connection();
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!s || !(await readSession(s.passwordHash))) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const thumb = new URL(req.url).searchParams.get("s") === "thumb";
  const m = await prisma.moment.findUnique({
    where: { id },
    select: { mime: true, photo: !thumb, thumb },
  });
  const data = thumb ? m?.thumb : m?.photo;
  if (!m?.mime || !data) return new Response("Not found", { status: 404 });

  return new Response(data, {
    headers: {
      "Content-Type": thumb ? "image/jpeg" : m.mime,
      // URL-д ?v=<updatedAt> орох тул удаан кэшлэж болно
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
