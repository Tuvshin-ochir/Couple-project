import { connection } from "next/server";
import { readSession } from "@/lib/auth";
import { scoped } from "@/lib/db";

// Бүх өгөгдлийг (зургийг base64 хэлбэрээр) нэг JSON файл болгон татуулна
export async function GET() {
  await connection();
  const session = await readSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const s = session.couple;
  const db = scoped(s.id);

  // нууц үг, PIN-ий хэшийг нөөцөд оруулахгүй
  const settings = { ...s, passwordHash: undefined, vaultPinHash: undefined };
  const [notes, letters, memories, bucket, moments, days, lists, ideas, dateLog, qotd, games, quiz] = await Promise.all([
    db.note.findMany(),
    db.letter.findMany(),
    db.memory.findMany({ include: { photos: true } }),
    db.bucketItem.findMany(),
    db.moment.findMany({ omit: { thumb: true } }),
    db.specialDay.findMany(),
    db.listItem.findMany(),
    db.dateIdea.findMany(),
    db.dateLog.findMany(),
    db.qotdAnswer.findMany(),
    db.gameAnswer.findMany(),
    db.quizQuestion.findMany(),
  ]);

  const data = {
    app: "bid-hoyor",
    exportedAt: new Date().toISOString(),
    settings,
    notes,
    letters,
    memories: memories.map((m) => ({
      ...m,
      photos: m.photos.map((p) => ({ id: p.id, mime: p.mime, base64: Buffer.from(p.data).toString("base64") })),
    })),
    bucket,
    moments: moments.map(({ photo, ...m }) => ({ ...m, photo: photo ? Buffer.from(photo).toString("base64") : null })),
    days,
    lists,
    ideas,
    dateLog,
    qotd,
    games,
    quiz,
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="bid-hoyor-${stamp}.json"`,
    },
  });
}
