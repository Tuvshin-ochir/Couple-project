import { connection } from "next/server";
import { readSession } from "@/lib/auth";
import { scoped } from "@/lib/db";

// Өдрийн мөчийн зураг. ?s=thumb бол хуанлид зориулсан жижиг хувилбар.
export async function GET(req: Request, ctx: RouteContext<"/moments/[id]">) {
  await connection();
  const session = await readSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const db = scoped(session.couple.id);

  const { id } = await ctx.params;
  const thumb = new URL(req.url).searchParams.get("s") === "thumb";
  const m = await db.moment.findUnique({
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
