import { connection } from "next/server";
import { readSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toListenState } from "@/lib/listen";
import { isHere, isListening, markHere } from "@/lib/presence";
import { other } from "@/lib/types";

// Our taste нээлттэй байх үед 2 секунд тутам: "би энд байна (хамт сонсож байна уу)" гэж бүртгээд,
// одоо тоглож буй дуу, хайрт нь хуудсанд/хамт байгаа эсэх, серверийн цагийг буцаана.
export async function POST(req: Request) {
  await connection();
  const session = await readSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { couple: s, me } = session;
  const body = (await req.json().catch(() => ({}))) as { together?: unknown };
  markHere(s.id, me, body.together === true);
  const l = await prisma.listen.findUnique({ where: { coupleId: s.id } });
  return Response.json(
    { now: Date.now(), state: toListenState(l), partnerHere: isHere(s.id, other(me)), partnerTogether: isListening(s.id, other(me)) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
