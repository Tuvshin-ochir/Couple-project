"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { endSession, hashPassword, readSession, startSession, verifyPassword } from "@/lib/auth";
import { parseCity, viewerTz } from "@/lib/ctx";
import { closeVault, openVault, vaultUntil } from "@/lib/vault";
import {
  CITIES,
  DAY_TYPES,
  LIST_TYPES,
  MOODS,
  NOTE_COLORS,
  PHOTO_FILTERS,
  REACTIONS,
  SYNC_SECONDS,
  WHO_MORE,
  WISHES,
  WOULD_YOU_RATHER,
  dailyQuestion,
  qotdDay,
} from "@/lib/content";
import { dayKey, isDayKey, keyToUTC, validTz } from "@/lib/time";
import { isWho, type City } from "@/lib/types";

export type FormState = { error?: string; ok?: boolean } | undefined;

// Server Action бүр шууд POST хүсэлтээр дуудагдаж болох тул заавал нэвтрэлтийг шалгана
async function auth() {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!s) throw new Error("Хос хараахан бүртгэгдээгүй байна");
  const me = await readSession(s.passwordHash);
  if (!me) throw new Error("Нэвтрээгүй байна");
  return { s, me };
}

/** Өөрчлөлтийн дараа: хувилбар нэмэгдүүлж (нөгөө тал шинэчлэгдэнэ), өөрийн дэлгэцийг сэргээнэ */
async function done() {
  await prisma.settings.update({ where: { id: 1 }, data: { version: { increment: 1 } } });
  refresh();
}

const str = (fd: FormData, key: string, max = 2000) => String(fd.get(key) ?? "").trim().slice(0, max);

// ───────── Бүртгэл, нэвтрэлт ─────────

export async function setupCouple(_: FormState, fd: FormData): Promise<FormState> {
  if (await prisma.settings.findUnique({ where: { id: 1 } })) redirect("/login");
  const nameA = str(fd, "nameA", 30);
  const nameB = str(fd, "nameB", 30);
  const me = fd.get("me");
  const start = str(fd, "startDate", 10);
  const pw = String(fd.get("password") ?? "");
  if (!nameA || !nameB) return { error: "Хоёулангийн нэрийг оруулна уу" };
  if (!isWho(me)) return { error: "Чи аль нь болохоо сонгоно уу" };
  if (pw.length < 4) return { error: "Нууц үг дор хаяж 4 тэмдэгт байх ёстой" };
  if (pw !== String(fd.get("password2") ?? "")) return { error: "Нууц үгнүүд таарахгүй байна" };
  const passwordHash = hashPassword(pw);
  await prisma.settings.create({
    data: { id: 1, nameA, nameB, startDate: isDayKey(start) ? keyToUTC(start) : null, passwordHash },
  });
  await startSession(me, passwordHash);
  redirect("/");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!s) redirect("/setup");
  const who = fd.get("who");
  if (!isWho(who)) return { error: "Чи хэн бэ? Сонгоно уу" };
  if (!verifyPassword(String(fd.get("password") ?? ""), s.passwordHash)) {
    await new Promise((r) => setTimeout(r, 700));
    return { error: "Нууц үг буруу байна" };
  }
  await startSession(who, s.passwordHash);
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

// ───────── Санаж байна ─────────

export async function sendNudge() {
  const { me } = await auth();
  await prisma.nudge.create({ data: { by: me } });
  await prisma.nudge.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 60 * 864e5) } } });
  await done();
}

// ───────── Зурвас ─────────

export async function addNote(fd: FormData) {
  const { me } = await auth();
  const text = str(fd, "text", 2000);
  if (!text) return;
  const color = str(fd, "color", 10);
  await prisma.note.create({
    data: { by: me, text, color: (NOTE_COLORS as readonly string[]).includes(color) ? color : "pink" },
  });
  await done();
}

export async function toggleLike(id: string) {
  const { me } = await auth();
  const n = await prisma.note.findUnique({ where: { id } });
  if (!n) return;
  await prisma.note.update({ where: { id }, data: me === "a" ? { likedA: !n.likedA } : { likedB: !n.likedB } });
  await done();
}

export async function deleteNote(id: string) {
  const { me } = await auth();
  await prisma.note.deleteMany({ where: { id, by: me } });
  await done();
}

// ───────── Нээх захидал ─────────

export async function addLetter(fd: FormData) {
  const { me } = await auth();
  const title = str(fd, "title", 80);
  const body = str(fd, "body", 8000);
  if (!title || !body) return;
  await prisma.letter.create({ data: { by: me, title, body } });
  await done();
}

/** Хүлээн авагч нээнэ — агуулга нь зөвхөн энэ үед клиент рүү очно */
export async function openLetter(id: string) {
  const { me } = await auth();
  const l = await prisma.letter.findUnique({ where: { id } });
  if (!l) return null;
  if (l.by !== me && !l.openedAt) {
    await prisma.letter.update({ where: { id }, data: { openedAt: new Date() } });
    await done();
  }
  return { title: l.title, body: l.body };
}

export async function deleteLetter(id: string) {
  const { me } = await auth();
  await prisma.letter.deleteMany({ where: { id, by: me } });
  await done();
}

// ───────── Дурсамж ─────────

export async function addMemory(fd: FormData): Promise<FormState> {
  const { me } = await auth();
  const title = str(fd, "title", 100);
  const date = str(fd, "date", 10);
  if (!title || !isDayKey(date)) return { error: "Гарчиг, огноогоо оруулна уу" };
  const files = fd
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0 && f.type.startsWith("image/"))
    .slice(0, 6);
  const photos: { mime: string; data: Uint8Array<ArrayBuffer> }[] = [];
  for (const f of files) {
    if (f.size > 3_000_000) return { error: "Нэг зураг 3MB-аас ихгүй байх ёстой" };
    photos.push({ mime: f.type, data: new Uint8Array(await f.arrayBuffer()) });
  }
  await prisma.memory.create({
    data: {
      by: me,
      title,
      date: keyToUTC(date),
      place: str(fd, "place", 100),
      story: str(fd, "story", 4000),
      photos: { create: photos },
    },
  });
  await done();
  return { ok: true };
}

export async function deleteMemory(id: string) {
  await auth();
  await prisma.memory.deleteMany({ where: { id } });
  await done();
}

// ───────── Мөрөөдлийн жагсаалт ─────────

export async function addBucket(fd: FormData) {
  const { me } = await auth();
  const text = str(fd, "text", 140);
  if (!text) return;
  await prisma.bucketItem.create({ data: { by: me, text } });
  await done();
}

export async function toggleBucket(id: string) {
  await auth();
  const b = await prisma.bucketItem.findUnique({ where: { id } });
  if (!b) return;
  await prisma.bucketItem.update({ where: { id }, data: { doneAt: b.doneAt ? null : new Date() } });
  await done();
}

export async function deleteBucket(id: string) {
  await auth();
  await prisma.bucketItem.deleteMany({ where: { id } });
  await done();
}

// ───────── Өдрийн мөч ─────────

async function imageFrom(fd: FormData, key: string, maxBytes: number) {
  const f = fd.get(key);
  if (!(f instanceof File) || f.size === 0) return null;
  if (!f.type.startsWith("image/") || f.size > maxBytes) throw new Error("Зураг хэт том эсвэл буруу төрөлтэй байна");
  return { mime: f.type, data: new Uint8Array(await f.arrayBuffer()) };
}

/** Өнөөдрийн мөчөө оруулах/солих (өдөрт нэг) */
export async function postMoment(fd: FormData): Promise<FormState> {
  const { s, me } = await auth();
  const mood = str(fd, "mood", 20);
  if (!MOODS.some((m) => m.key === mood)) return { error: "Сэтгэлээ сонгоно уу" };
  const filter = str(fd, "filter", 20);
  const tz = viewerTz((await cookies()).get("tz")?.value, parseCity(me === "a" ? s.cityA : s.cityB));
  const day = dayKey(new Date(), tz);

  let photo, thumb;
  try {
    photo = await imageFrom(fd, "photo", 4_000_000);
    thumb = await imageFrom(fd, "thumb", 600_000);
  } catch (e) {
    return { error: (e as Error).message };
  }
  const removePhoto = fd.get("removePhoto") === "1";
  const image = photo
    ? { mime: photo.mime, photo: photo.data, thumb: thumb?.data ?? photo.data }
    : removePhoto
      ? { mime: null, photo: null, thumb: null }
      : {};

  const data = {
    mood,
    caption: str(fd, "caption", 120),
    filter: PHOTO_FILTERS.some((f) => f.key === filter) ? filter : "none",
    ...image,
  };
  await prisma.moment.upsert({
    where: { by_day: { by: me, day } },
    create: { by: me, day, ...data },
    update: data,
  });
  await done();
  return { ok: true };
}

/** Хайртынхаа мөчид эможи үлдээх (дахин дарвал арилна) */
export async function reactMoment(id: string, emoji: string) {
  const { me } = await auth();
  if (!REACTIONS.includes(emoji)) return;
  const m = await prisma.moment.findUnique({ where: { id }, select: { by: true, reaction: true } });
  if (!m || m.by === me) return;
  await prisma.moment.update({ where: { id }, data: { reaction: m.reaction === emoji ? null : emoji } });
  await done();
}

export async function deleteMoment(id: string) {
  const { me } = await auth();
  await prisma.moment.deleteMany({ where: { id, by: me } });
  await done();
}

// ───────── Профайл зураг ─────────

export async function setAvatar(who: string, fd: FormData): Promise<FormState> {
  await auth();
  if (!isWho(who)) return { error: "Буруу хэрэглэгч" };
  let img;
  try {
    img = await imageFrom(fd, "photo", 1_000_000);
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!img) return { error: "Зураг сонгоно уу" };
  await prisma.avatarImage.upsert({ where: { who }, create: { who, ...img }, update: img });
  await done();
  return { ok: true };
}

export async function removeAvatar(who: string) {
  await auth();
  if (!isWho(who)) return;
  await prisma.avatarImage.deleteMany({ where: { who } });
  await done();
}

// ───────── Чухал өдрүүд ─────────

export async function addDay(fd: FormData) {
  const { me } = await auth();
  const title = str(fd, "title", 80);
  const date = str(fd, "date", 10);
  if (!title || !isDayKey(date)) return;
  const emoji = str(fd, "emoji", 8);
  await prisma.specialDay.create({
    data: {
      by: me,
      title,
      date: keyToUTC(date),
      emoji: DAY_TYPES.some(([e]) => e === emoji) ? emoji : "📌",
      yearly: fd.get("yearly") === "on",
    },
  });
  await done();
}

export async function deleteDay(id: string) {
  await auth();
  await prisma.specialDay.deleteMany({ where: { id } });
  await done();
}

// ───────── Хамтын жагсаалт ─────────

export async function addListItem(fd: FormData) {
  const { me } = await auth();
  const title = str(fd, "title", 120);
  const type = str(fd, "type", 20);
  if (!title || !LIST_TYPES.some((t) => t.key === type)) return;
  const url = str(fd, "url", 500);
  await prisma.listItem.create({ data: { by: me, type, title, url: /^https?:\/\//i.test(url) ? url : "" } });
  await done();
}

export async function toggleListItem(id: string) {
  await auth();
  const it = await prisma.listItem.findUnique({ where: { id } });
  if (!it) return;
  await prisma.listItem.update({ where: { id }, data: { doneAt: it.doneAt ? null : new Date() } });
  await done();
}

export async function deleteListItem(id: string) {
  await auth();
  await prisma.listItem.deleteMany({ where: { id } });
  await done();
}

// ───────── Болзоо ─────────

export async function addIdea(fd: FormData) {
  const { me } = await auth();
  const text = str(fd, "text", 140);
  if (!text) return;
  await prisma.dateIdea.create({ data: { by: me, text } });
  await done();
}

export async function deleteIdea(id: string) {
  await auth();
  await prisma.dateIdea.deleteMany({ where: { id } });
  await done();
}

export async function logDate(fd: FormData) {
  const { me } = await auth();
  const text = str(fd, "text", 140);
  if (!text) return;
  await prisma.dateLog.create({ data: { by: me, text, emoji: str(fd, "emoji", 8) || "💞" } });
  await done();
}

export async function deleteDateLog(id: string) {
  await auth();
  await prisma.dateLog.deleteMany({ where: { id } });
  await done();
}

export async function startSync(seconds: number) {
  const { me } = await auth();
  if (!SYNC_SECONDS.includes(seconds)) return;
  await prisma.syncTimer.deleteMany({});
  await prisma.syncTimer.create({ data: { by: me, at: new Date(Date.now() + seconds * 1000) } });
  await done();
}

// ───────── Тоглоом ─────────

export async function answerQotd(fd: FormData) {
  const { me } = await auth();
  const text = str(fd, "text", 2000);
  if (!text) return;
  const day = qotdDay();
  await prisma.qotdAnswer.upsert({
    where: { day_by: { day, by: me } },
    create: { by: me, day, question: dailyQuestion(day), text },
    update: { text },
  });
  await done();
}

export async function chooseAnswer(game: string, q: number, choice: number) {
  const { me } = await auth();
  const size = game === "wyr" ? WOULD_YOU_RATHER.length : game === "who" ? WHO_MORE.length : 0;
  if (!Number.isInteger(q) || q < 0 || q >= size || (choice !== 0 && choice !== 1)) return;
  await prisma.gameAnswer.upsert({
    where: { game_q_by: { game, q, by: me } },
    create: { by: me, game, q, choice },
    update: { choice },
  });
  await done();
}

export async function addQuiz(fd: FormData) {
  const { me } = await auth();
  const question = str(fd, "question", 140);
  const answer = str(fd, "answer", 140);
  if (!question || !answer) return;
  await prisma.quizQuestion.create({ data: { by: me, question, answer } });
  await done();
}

export async function guessQuiz(id: string, fd: FormData) {
  const { me } = await auth();
  const guess = str(fd, "guess", 140);
  if (!guess) return;
  // Зөвхөн хайртынхаа асуултад таана
  await prisma.quizQuestion.updateMany({
    where: { id, by: { not: me }, guess: null },
    data: { guess, guessedAt: new Date() },
  });
  await done();
}

export async function judgeQuiz(id: string, correct: boolean) {
  const { me } = await auth();
  await prisma.quizQuestion.updateMany({ where: { id, by: { not: me } }, data: { correct } });
  await done();
}

export async function deleteQuiz(id: string) {
  const { me } = await auth();
  await prisma.quizQuestion.deleteMany({ where: { id, by: me } });
  await done();
}

// ───────── Тохиргоо ─────────

function cityFrom(fd: FormData, k: "A" | "B"): City | null {
  const v = str(fd, `city${k}`, 60);
  if (!v) return null;
  if (v !== "__custom") return CITIES.find((c) => c.name === v) ?? null;
  const tz = str(fd, `ctz${k}`, 60);
  if (!validTz(tz)) return null;
  const num = (key: string) => {
    const raw = str(fd, key, 20);
    const n = Number(raw);
    return raw !== "" && Number.isFinite(n) ? n : null;
  };
  return { name: str(fd, `cname${k}`, 40) || tz, tz, lat: num(`clat${k}`), lon: num(`clon${k}`) };
}

export async function saveProfile(_: FormState, fd: FormData): Promise<FormState> {
  await auth();
  const nameA = str(fd, "nameA", 30);
  const nameB = str(fd, "nameB", 30);
  if (!nameA || !nameB) return { error: "Хоёулангийн нэрийг оруулна уу" };
  for (const k of ["A", "B"] as const) {
    if (str(fd, `city${k}`, 60) === "__custom" && !validTz(str(fd, `ctz${k}`, 60)))
      return { error: "Цагийн бүс буруу байна (жишээ нь: Asia/Seoul)" };
  }
  const start = str(fd, "startDate", 10);
  const meet = str(fd, "nextMeetIso", 40);
  const meetDate = meet ? new Date(meet) : null;
  const cityA = cityFrom(fd, "A");
  const cityB = cityFrom(fd, "B");
  await prisma.settings.update({
    where: { id: 1 },
    data: {
      nameA,
      nameB,
      startDate: isDayKey(start) ? keyToUTC(start) : null,
      nextMeet: meetDate && !Number.isNaN(meetDate.getTime()) ? meetDate : null,
      cityA: cityA ? JSON.stringify(cityA) : null,
      cityB: cityB ? JSON.stringify(cityB) : null,
    },
  });
  await done();
  return { ok: true };
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const { s, me } = await auth();
  if (!verifyPassword(String(fd.get("current") ?? ""), s.passwordHash)) return { error: "Одоогийн нууц үг буруу байна" };
  const pw = String(fd.get("password") ?? "");
  if (pw.length < 4) return { error: "Шинэ нууц үг дор хаяж 4 тэмдэгт байх ёстой" };
  if (pw !== String(fd.get("password2") ?? "")) return { error: "Шинэ нууц үгнүүд таарахгүй байна" };
  const passwordHash = hashPassword(pw);
  await prisma.settings.update({ where: { id: 1 }, data: { passwordHash } });
  // Бусад төхөөрөмжүүд дахин нэвтэрнэ, энэ төхөөрөмж нэвтэрсэн хэвээр үлдэнэ
  await startSession(me, passwordHash);
  await done();
  return { ok: true };
}

// ───────── Нууц өрөө (18+) ─────────

/** Нэвтэрсэн + нууц өрөө нээлттэй байх ёстой */
async function vaultAuth() {
  const { s, me } = await auth();
  if (!(await vaultUntil(me, s.vaultPinHash))) throw new Error("Нууц өрөө түгжээтэй байна");
  return { s, me };
}

const isPin = (v: string) => /^\d{4,6}$/.test(v);

export async function setupVault(_: FormState, fd: FormData): Promise<FormState> {
  const { s, me } = await auth();
  if (s.vaultPinHash) return { error: "PIN аль хэдийн тохируулагдсан байна" };
  const pin = String(fd.get("pin") ?? "");
  if (!isPin(pin)) return { error: "PIN 4–6 оронтой тоо байх ёстой" };
  if (pin !== String(fd.get("pin2") ?? "")) return { error: "PIN-үүд таарахгүй байна" };
  if (fd.get("adult") !== "on") return { error: "Хоёулаа 18 нас хүрсэн гэдгээ баталгаажуулна уу" };
  const vaultPinHash = hashPassword(pin);
  await prisma.settings.update({ where: { id: 1 }, data: { vaultPinHash } });
  await openVault(me, vaultPinHash);
  await done();
  return { ok: true };
}

export async function unlockVault(pin: string): Promise<FormState> {
  const { s, me } = await auth();
  if (!s.vaultPinHash) return { error: "PIN тохируулаагүй байна" };
  if (!verifyPassword(pin, s.vaultPinHash)) {
    await new Promise((r) => setTimeout(r, 800));
    return { error: "PIN буруу байна" };
  }
  await openVault(me, s.vaultPinHash);
  refresh();
  return { ok: true };
}

export async function lockVault() {
  await auth();
  await closeVault();
  refresh();
}

/** PIN мартсан бол нэвтрэх нууц үгээр шинэчилнэ (зураг устахгүй) */
export async function resetVaultPin(_: FormState, fd: FormData): Promise<FormState> {
  const { s } = await auth();
  if (!verifyPassword(String(fd.get("password") ?? ""), s.passwordHash)) {
    await new Promise((r) => setTimeout(r, 800));
    return { error: "Нэвтрэх нууц үг буруу байна" };
  }
  await prisma.settings.update({ where: { id: 1 }, data: { vaultPinHash: null } });
  await closeVault();
  await done();
  return { ok: true };
}

export async function addVaultPhoto(fd: FormData): Promise<FormState> {
  const { me } = await vaultAuth();
  let photo, thumb;
  try {
    photo = await imageFrom(fd, "photo", 4_000_000);
    thumb = await imageFrom(fd, "thumb", 600_000);
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!photo || !thumb) return { error: "Зураг сонгоно уу" };
  await prisma.vaultPhoto.create({
    data: {
      by: me,
      caption: str(fd, "caption", 120),
      mime: photo.mime,
      data: photo.data,
      thumb: thumb.data,
      viewOnce: fd.get("viewOnce") === "1",
    },
  });
  await done();
  return { ok: true };
}

/**
 * "Нэг удаа харах" зургийг нээнэ. Хайрт нь нээвэл зургийг серверээс бүрмөсөн
 * устгаж, зөвхөн энэ удаад data URL хэлбэрээр буцаана.
 */
export async function openOnceVaultPhoto(id: string): Promise<{ src?: string; error?: string }> {
  const { me } = await vaultAuth();
  const p = await prisma.vaultPhoto.findUnique({ where: { id } });
  if (!p || !p.viewOnce) return { error: "Зураг олдсонгүй" };
  if (p.viewedAt) return { error: "Энэ зургийг аль хэдийн үзсэн байна 🔥" };
  const src = `data:${p.mime};base64,${Buffer.from(p.data).toString("base64")}`;
  if (p.by !== me) {
    const empty = new Uint8Array(0);
    await prisma.vaultPhoto.update({ where: { id }, data: { viewedAt: new Date(), data: empty, thumb: empty } });
    await done();
  }
  return { src };
}

export async function deleteVaultPhoto(id: string) {
  const { me } = await vaultAuth();
  await prisma.vaultPhoto.deleteMany({ where: { id, by: me } });
  await done();
}

export async function answerWish(item: number, answer: number) {
  const { me } = await vaultAuth();
  if (!Number.isInteger(item) || item < 0 || item >= WISHES.length || ![0, 1, 2].includes(answer)) return;
  await prisma.vaultWish.upsert({
    where: { item_by: { item, by: me } },
    create: { by: me, item, answer },
    update: { answer },
  });
  await done();
}
