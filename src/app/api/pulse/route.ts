import { connection } from "next/server";
import { readSession } from "@/lib/auth";
import { scoped } from "@/lib/db";
import { other } from "@/lib/types";

// Клиент хэдэн секунд тутам шалгадаг жижиг хариу: өгөгдлийн хувилбар,
// зэрэг эхлүүлэх тоолуур, хайртын сүүлийн үйлдлүүдийн цаг.
export async function GET() {
  await connection();
  const session = await readSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { couple: s, me } = session;
  const db = scoped(s.id);

  const by = other(me);
  const latest = { orderBy: { createdAt: "desc" as const }, select: { createdAt: true } };
  const [sync, nudge, note, letter, qotd, moment, vault, song] = await Promise.all([
    db.syncTimer.findFirst({ orderBy: { createdAt: "desc" } }),
    db.nudge.findFirst({ where: { by }, ...latest }),
    db.note.findFirst({ where: { by }, ...latest }),
    db.letter.findFirst({ where: { by }, ...latest }),
    db.qotdAnswer.findFirst({ where: { by }, ...latest }),
    db.moment.findFirst({ where: { by }, orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    db.vaultPhoto.findFirst({ where: { by }, ...latest }),
    db.song.findFirst({ where: { by }, ...latest }),
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
        song: song?.createdAt.getTime() ?? 0,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
