import { connection } from "next/server";
import { readSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { other } from "@/lib/types";

// Клиент хэдэн секунд тутам шалгадаг жижиг хариу: өгөгдлийн хувилбар,
// зэрэг эхлүүлэх тоолуур, хайртын сүүлийн үйлдлүүдийн цаг.
export async function GET() {
  await connection();
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  const me = s && (await readSession(s.passwordHash));
  if (!s || !me) return Response.json({ error: "unauthorized" }, { status: 401 });

  const by = other(me);
  const latest = { orderBy: { createdAt: "desc" as const }, select: { createdAt: true } };
  const [sync, nudge, note, letter, qotd, moment, vault] = await Promise.all([
    prisma.syncTimer.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.nudge.findFirst({ where: { by }, ...latest }),
    prisma.note.findFirst({ where: { by }, ...latest }),
    prisma.letter.findFirst({ where: { by }, ...latest }),
    prisma.qotdAnswer.findFirst({ where: { by }, ...latest }),
    prisma.moment.findFirst({ where: { by }, orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    prisma.vaultPhoto.findFirst({ where: { by }, ...latest }),
  ]);

  return Response.json(
    {
      v: s.version,
      now: Date.now(),
      sync: sync ? { at: sync.at.getTime(), by: sync.by } : null,
      latest: {
        nudge: nudge?.createdAt.getTime() ?? 0,
        note: note?.createdAt.getTime() ?? 0,
        letter: letter?.createdAt.getTime() ?? 0,
        qotd: qotd?.createdAt.getTime() ?? 0,
        moment: moment?.updatedAt.getTime() ?? 0,
        vault: vault?.createdAt.getTime() ?? 0,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
