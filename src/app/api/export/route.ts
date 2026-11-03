import { connection } from "next/server";
import { readSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Бүх өгөгдлийг (зургийг base64 хэлбэрээр) нэг JSON файл болгон татуулна
export async function GET() {
  await connection();
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!s || !(await readSession(s.passwordHash))) return new Response("Unauthorized", { status: 401 });

  const settings = { ...s, passwordHash: undefined }; // нууц үгийн хэшийг нөөцөд оруулахгүй
  const [notes, letters, memories, bucket, moments, days, lists, ideas, dateLog, qotd, games, quiz] = await Promise.all([
    prisma.note.findMany(),
    prisma.letter.findMany(),
    prisma.memory.findMany({ include: { photos: true } }),
    prisma.bucketItem.findMany(),
    prisma.moment.findMany({ omit: { thumb: true } }),
    prisma.specialDay.findMany(),
    prisma.listItem.findMany(),
    prisma.dateIdea.findMany(),
    prisma.dateLog.findMany(),
    prisma.qotdAnswer.findMany(),
    prisma.gameAnswer.findMany(),
    prisma.quizQuestion.findMany(),
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
