"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { prisma, scoped } from "@/lib/db";
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
  const session = await readSession();
  if (!session) throw new Error("Нэвтрээгүй байна");
  const { couple: s, me } = session;
  // Энэ хосын өгөгдөлд л хүрдэг client
  return { s, me, cid: s.id, db: scoped(s.id) };
}

/** Өөрчлөлтийн дараа: хувилбар нэмэгдүүлж (нөгөө тал шинэчлэгдэнэ), өөрийн дэлгэцийг сэргээнэ */
async function done(cid: string) {
  await prisma.couple.update({ where: { id: cid }, data: { version: { increment: 1 } } });
  refresh();
}

const str = (fd: FormData, key: string, max = 2000) => String(fd.get(key) ?? "").trim().slice(0, max);

// ───────── Бүртгэл, нэвтрэлт ─────────

/** Хосын нэр: жижиг латин үсэг, тоо, зураас — 3–30 тэмдэгт (URL-д ордог) */
const HANDLE_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;
const normHandle = (v: string) => v.trim().toLowerCase();

export async function createCouple(_: FormState, fd: FormData): Promise<FormState> {
  const handle = normHandle(str(fd, "handle", 40));
  const nameA = str(fd, "nameA", 30);
  const nameB = str(fd, "nameB", 30);
  const me = fd.get("me");
  const start = str(fd, "startDate", 10);
  const pw = String(fd.get("password") ?? "");
  if (!HANDLE_RE.test(handle)) return { error: "Хосын нэр 3–30 тэмдэгт, зөвхөн латин жижиг үсэг, тоо, зураас байна (жишээ: bat-saraa)" };
  if (!nameA || !nameB) return { error: "Хоёулангийн нэрийг оруулна уу" };
  if (!isWho(me)) return { error: "Чи аль нь болохоо сонгоно уу" };
  if (pw.length < 6) return { error: "Нууц үг дор хаяж 6 тэмдэгт байх ёстой" };
  if (pw !== String(fd.get("password2") ?? "")) return { error: "Нууц үгнүүд таарахгүй байна" };
  if (await prisma.couple.findUnique({ where: { handle }, select: { id: true } }))
    return { error: "Энэ хосын нэр аль хэдийн бүртгэлтэй байна — өөр нэр сонгоорой" };
  const passwordHash = hashPassword(pw);
  const couple = await prisma.couple.create({
    data: { handle, nameA, nameB, startDate: isDayKey(start) ? keyToUTC(start) : null, passwordHash },
  });
  await startSession(couple.id, me, passwordHash);
  redirect("/?welcome=1");
}

export type LoginState = { error?: string; names?: { a: string; b: string } } | undefined;

/**
 * Хоёр алхамтай нэвтрэлт: эхлээд хосын нэр + нууц үг шалгагдана, дараа нь "чи хэн бэ"
 * сонгоно. Нэрс зөвхөн нууц үг зөв үед л харагдана (хосын нэрээр бусдыг тагнахгүй).
 */
export async function login(_: LoginState, fd: FormData): Promise<LoginState> {
  const handle = normHandle(str(fd, "handle", 40));
  const couple = handle ? await prisma.couple.findUnique({ where: { handle } }) : null;
  if (!couple || !verifyPassword(String(fd.get("password") ?? ""), couple.passwordHash)) {
    await new Promise((r) => setTimeout(r, 700));
    return { error: "Хосын нэр эсвэл нууц үг буруу байна" };
  }
  const who = fd.get("who");
  if (!isWho(who)) return { names: { a: couple.nameA, b: couple.nameB } };
  await startSession(couple.id, who, couple.passwordHash);
  redirect("/");
}

export async function logout() {
  await endSession();
  await closeVault();
  redirect("/welcome");
}

/** Хосын бүх өгөгдлийг бүрмөсөн устгана (нууц үг + "УСТГАХ" гэж бичиж баталгаажуулна) */
export async function deleteCouple(_: FormState, fd: FormData): Promise<FormState> {
  const { s, cid } = await auth();
  if (!verifyPassword(String(fd.get("password") ?? ""), s.passwordHash)) return { error: "Нууц үг буруу байна" };
  if (str(fd, "confirm", 20) !== "УСТГАХ") return { error: "Баталгаажуулахын тулд УСТГАХ гэж бичнэ үү" };
  await prisma.couple.delete({ where: { id: cid } }); // бүх зурвас, зураг cascade-ээр устна
  await endSession();
  await closeVault();
  redirect("/welcome");
}

// ───────── Санаж байна ─────────

export async function sendNudge() {
  const { me, cid, db } = await auth();
  await db.nudge.create({ data: { coupleId: cid, by: me } });
  await db.nudge.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 60 * 864e5) } } });
  await done(cid);
}

// ───────── Зурвас ─────────

export async function addNote(fd: FormData) {
  const { me, cid, db } = await auth();
  const text = str(fd, "text", 2000);
  if (!text) return;
  const color = str(fd, "color", 10);
  await db.note.create({
    data: { coupleId: cid, by: me, text, color: (NOTE_COLORS as readonly string[]).includes(color) ? color : "pink" },
  });
  await done(cid);
}

export async function toggleLike(id: string) {
  const { me, cid, db } = await auth();
  const n = await db.note.findUnique({ where: { id } });
  if (!n) return;
  await db.note.update({ where: { id }, data: me === "a" ? { likedA: !n.likedA } : { likedB: !n.likedB } });
  await done(cid);
}

export async function deleteNote(id: string) {
  const { me, cid, db } = await auth();
  await db.note.deleteMany({ where: { id, by: me } });
  await done(cid);
}

// ───────── Нээх захидал ─────────

export async function addLetter(fd: FormData) {
  const { me, cid, db } = await auth();
  const title = str(fd, "title", 80);
  const body = str(fd, "body", 8000);
  if (!title || !body) return;
  await db.letter.create({ data: { coupleId: cid, by: me, title, body } });
  await done(cid);
}

/** Хүлээн авагч нээнэ — агуулга нь зөвхөн энэ үед клиент рүү очно */
export async function openLetter(id: string) {
  const { me, cid, db } = await auth();
  const l = await db.letter.findUnique({ where: { id } });
  if (!l) return null;
  if (l.by !== me && !l.openedAt) {
    await db.letter.update({ where: { id }, data: { openedAt: new Date() } });
    await done(cid);
  }
  return { title: l.title, body: l.body };
}

export async function deleteLetter(id: string) {
  const { me, cid, db } = await auth();
  await db.letter.deleteMany({ where: { id, by: me } });
  await done(cid);
}

// ───────── Дурсамж ─────────

export async function addMemory(fd: FormData): Promise<FormState> {
  const { me, cid, db } = await auth();
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
  await db.memory.create({
    data: {
      coupleId: cid, by: me,
      title,
      date: keyToUTC(date),
      place: str(fd, "place", 100),
      story: str(fd, "story", 4000),
      photos: { create: photos },
    },
  });
  await done(cid);
  return { ok: true };
}

export async function deleteMemory(id: string) {
  const { cid, db } = await auth();
  await db.memory.deleteMany({ where: { id } });
  await done(cid);
}

// ───────── Мөрөөдлийн жагсаалт ─────────

export async function addBucket(fd: FormData) {
  const { me, cid, db } = await auth();
  const text = str(fd, "text", 140);
  if (!text) return;
  await db.bucketItem.create({ data: { coupleId: cid, by: me, text } });
  await done(cid);
}

export async function toggleBucket(id: string) {
  const { cid, db } = await auth();
  const b = await db.bucketItem.findUnique({ where: { id } });
  if (!b) return;
  await db.bucketItem.update({ where: { id }, data: { doneAt: b.doneAt ? null : new Date() } });
  await done(cid);
}

export async function deleteBucket(id: string) {
  const { cid, db } = await auth();
  await db.bucketItem.deleteMany({ where: { id } });
  await done(cid);
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
  const { s, me, cid, db } = await auth();
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
  await db.moment.upsert({
    where: { coupleId_by_day: { coupleId: cid, by: me, day } },
    create: { coupleId: cid, by: me, day, ...data },
    update: data,
  });
  await done(cid);
  return { ok: true };
}

/** Хайртынхаа мөчид эможи үлдээх (дахин дарвал арилна) */
export async function reactMoment(id: string, emoji: string) {
  const { me, cid, db } = await auth();
  if (!REACTIONS.includes(emoji)) return;
  const m = await db.moment.findUnique({ where: { id }, select: { by: true, reaction: true } });
  if (!m || m.by === me) return;
  await db.moment.update({ where: { id }, data: { reaction: m.reaction === emoji ? null : emoji } });
  await done(cid);
}

export async function deleteMoment(id: string) {
  const { me, cid, db } = await auth();
  await db.moment.deleteMany({ where: { id, by: me } });
  await done(cid);
}

// ───────── Профайл зураг ─────────

export async function setAvatar(who: string, fd: FormData): Promise<FormState> {
  const { cid, db } = await auth();
  if (!isWho(who)) return { error: "Буруу хэрэглэгч" };
  let img;
  try {
    img = await imageFrom(fd, "photo", 1_000_000);
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!img) return { error: "Зураг сонгоно уу" };
  await db.avatarImage.upsert({ where: { coupleId_who: { coupleId: cid, who } }, create: { coupleId: cid, who, ...img }, update: img });
  await done(cid);
  return { ok: true };
}

export async function removeAvatar(who: string) {
  const { cid, db } = await auth();
  if (!isWho(who)) return;
  await db.avatarImage.deleteMany({ where: { who } });
  await done(cid);
}

// ───────── Чухал өдрүүд ─────────

export async function addDay(fd: FormData) {
  const { me, cid, db } = await auth();
  const title = str(fd, "title", 80);
  const date = str(fd, "date", 10);
  if (!title || !isDayKey(date)) return;
  const emoji = str(fd, "emoji", 8);
  await db.specialDay.create({
    data: {
      coupleId: cid, by: me,
      title,
      date: keyToUTC(date),
      emoji: DAY_TYPES.some(([e]) => e === emoji) ? emoji : "📌",
      yearly: fd.get("yearly") === "on",
    },
  });
  await done(cid);
}

export async function deleteDay(id: string) {
  const { cid, db } = await auth();
  await db.specialDay.deleteMany({ where: { id } });
  await done(cid);
}

// ───────── Хамтын жагсаалт ─────────

export async function addListItem(fd: FormData) {
  const { me, cid, db } = await auth();
  const title = str(fd, "title", 120);
  const type = str(fd, "type", 20);
  if (!title || !LIST_TYPES.some((t) => t.key === type)) return;
  const url = str(fd, "url", 500);
  await db.listItem.create({ data: { coupleId: cid, by: me, type, title, url: /^https?:\/\//i.test(url) ? url : "" } });
  await done(cid);
}

export async function toggleListItem(id: string) {
  const { cid, db } = await auth();
  const it = await db.listItem.findUnique({ where: { id } });
  if (!it) return;
  await db.listItem.update({ where: { id }, data: { doneAt: it.doneAt ? null : new Date() } });
  await done(cid);
}

export async function deleteListItem(id: string) {
  const { cid, db } = await auth();
  await db.listItem.deleteMany({ where: { id } });
  await done(cid);
}

// ───────── Болзоо ─────────

export async function addIdea(fd: FormData) {
  const { me, cid, db } = await auth();
  const text = str(fd, "text", 140);
  if (!text) return;
  await db.dateIdea.create({ data: { coupleId: cid, by: me, text } });
  await done(cid);
}

export async function deleteIdea(id: string) {
  const { cid, db } = await auth();
  await db.dateIdea.deleteMany({ where: { id } });
  await done(cid);
}

export async function logDate(fd: FormData) {
  const { me, cid, db } = await auth();
  const text = str(fd, "text", 140);
  if (!text) return;
  await db.dateLog.create({ data: { coupleId: cid, by: me, text, emoji: str(fd, "emoji", 8) || "💞" } });
  await done(cid);
}

export async function deleteDateLog(id: string) {
  const { cid, db } = await auth();
  await db.dateLog.deleteMany({ where: { id } });
  await done(cid);
}

export async function startSync(seconds: number) {
  const { me, cid, db } = await auth();
  if (!SYNC_SECONDS.includes(seconds)) return;
  await db.syncTimer.deleteMany({});
  await db.syncTimer.create({ data: { coupleId: cid, by: me, at: new Date(Date.now() + seconds * 1000) } });
  await done(cid);
}

// ───────── Тоглоом ─────────

export async function answerQotd(fd: FormData) {
  const { me, cid, db } = await auth();
  const text = str(fd, "text", 2000);
  if (!text) return;
  const day = qotdDay();
  await db.qotdAnswer.upsert({
    where: { coupleId_day_by: { coupleId: cid, day, by: me } },
    create: { coupleId: cid, by: me, day, question: dailyQuestion(day), text },
    update: { text },
  });
  await done(cid);
}

export async function chooseAnswer(game: string, q: number, choice: number) {
  const { me, cid, db } = await auth();
  const size = game === "wyr" ? WOULD_YOU_RATHER.length : game === "who" ? WHO_MORE.length : 0;
  if (!Number.isInteger(q) || q < 0 || q >= size || (choice !== 0 && choice !== 1)) return;
  await db.gameAnswer.upsert({
    where: { coupleId_game_q_by: { coupleId: cid, game, q, by: me } },
    create: { coupleId: cid, by: me, game, q, choice },
    update: { choice },
  });
  await done(cid);
}

export async function addQuiz(fd: FormData) {
  const { me, cid, db } = await auth();
  const question = str(fd, "question", 140);
  const answer = str(fd, "answer", 140);
  if (!question || !answer) return;
  await db.quizQuestion.create({ data: { coupleId: cid, by: me, question, answer } });
  await done(cid);
}

export async function guessQuiz(id: string, fd: FormData) {
  const { me, cid, db } = await auth();
  const guess = str(fd, "guess", 140);
  if (!guess) return;
  // Зөвхөн хайртынхаа асуултад таана
  await db.quizQuestion.updateMany({
    where: { id, by: { not: me }, guess: null },
    data: { guess, guessedAt: new Date() },
  });
  await done(cid);
}

export async function judgeQuiz(id: string, correct: boolean) {
  const { me, cid, db } = await auth();
  await db.quizQuestion.updateMany({ where: { id, by: { not: me } }, data: { correct } });
  await done(cid);
}

export async function deleteQuiz(id: string) {
  const { me, cid, db } = await auth();
  await db.quizQuestion.deleteMany({ where: { id, by: me } });
  await done(cid);
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
  const { cid } = await auth();
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
  await prisma.couple.update({
    where: { id: cid },
    data: {
      nameA,
      nameB,
      startDate: isDayKey(start) ? keyToUTC(start) : null,
      nextMeet: meetDate && !Number.isNaN(meetDate.getTime()) ? meetDate : null,
      cityA: cityA ? JSON.stringify(cityA) : null,
      cityB: cityB ? JSON.stringify(cityB) : null,
    },
  });
  await done(cid);
  return { ok: true };
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const { s, me, cid } = await auth();
  if (!verifyPassword(String(fd.get("current") ?? ""), s.passwordHash)) return { error: "Одоогийн нууц үг буруу байна" };
  const pw = String(fd.get("password") ?? "");
  if (pw.length < 4) return { error: "Шинэ нууц үг дор хаяж 4 тэмдэгт байх ёстой" };
  if (pw !== String(fd.get("password2") ?? "")) return { error: "Шинэ нууц үгнүүд таарахгүй байна" };
  const passwordHash = hashPassword(pw);
  await prisma.couple.update({ where: { id: cid }, data: { passwordHash } });
  // Бусад төхөөрөмжүүд дахин нэвтэрнэ, энэ төхөөрөмж нэвтэрсэн хэвээр үлдэнэ
  await startSession(cid, me, passwordHash);
  await done(cid);
  return { ok: true };
}

// ───────── Нууц өрөө (18+) ─────────

/** Нэвтэрсэн + нууц өрөө нээлттэй байх ёстой */
async function vaultAuth() {
  const ctx = await auth();
  if (!(await vaultUntil(ctx.cid, ctx.me, ctx.s.vaultPinHash))) throw new Error("Нууц өрөө түгжээтэй байна");
  return ctx;
}

const isPin = (v: string) => /^\d{4,6}$/.test(v);

export async function setupVault(_: FormState, fd: FormData): Promise<FormState> {
  const { s, me, cid } = await auth();
  if (s.vaultPinHash) return { error: "PIN аль хэдийн тохируулагдсан байна" };
  const pin = String(fd.get("pin") ?? "");
  if (!isPin(pin)) return { error: "PIN 4–6 оронтой тоо байх ёстой" };
  if (pin !== String(fd.get("pin2") ?? "")) return { error: "PIN-үүд таарахгүй байна" };
  if (fd.get("adult") !== "on") return { error: "Хоёулаа 18 нас хүрсэн гэдгээ баталгаажуулна уу" };
  const vaultPinHash = hashPassword(pin);
  await prisma.couple.update({ where: { id: cid }, data: { vaultPinHash } });
  await openVault(cid, me, vaultPinHash);
  await done(cid);
  return { ok: true };
}

export async function unlockVault(pin: string): Promise<FormState> {
  const { s, me, cid } = await auth();
  if (!s.vaultPinHash) return { error: "PIN тохируулаагүй байна" };
  if (!verifyPassword(pin, s.vaultPinHash)) {
    await new Promise((r) => setTimeout(r, 800));
    return { error: "PIN буруу байна" };
  }
  await openVault(cid, me, s.vaultPinHash);
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
  const { s, cid } = await auth();
  if (!verifyPassword(String(fd.get("password") ?? ""), s.passwordHash)) {
    await new Promise((r) => setTimeout(r, 800));
    return { error: "Нэвтрэх нууц үг буруу байна" };
  }
  await prisma.couple.update({ where: { id: cid }, data: { vaultPinHash: null } });
  await closeVault();
  await done(cid);
  return { ok: true };
}

export async function addVaultPhoto(fd: FormData): Promise<FormState> {
  const { me, cid, db } = await vaultAuth();
  let photo, thumb;
  try {
    photo = await imageFrom(fd, "photo", 4_000_000);
    thumb = await imageFrom(fd, "thumb", 600_000);
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!photo || !thumb) return { error: "Зураг сонгоно уу" };
  await db.vaultPhoto.create({
    data: {
      coupleId: cid, by: me,
      caption: str(fd, "caption", 120),
      mime: photo.mime,
      data: photo.data,
      thumb: thumb.data,
      viewOnce: fd.get("viewOnce") === "1",
    },
  });
  await done(cid);
  return { ok: true };
}

/**
 * "Нэг удаа харах" зургийг нээнэ. Хайрт нь нээвэл зургийг серверээс бүрмөсөн
 * устгаж, зөвхөн энэ удаад data URL хэлбэрээр буцаана.
 */
export async function openOnceVaultPhoto(id: string): Promise<{ src?: string; error?: string }> {
  const { me, cid, db } = await vaultAuth();
  const p = await db.vaultPhoto.findUnique({ where: { id } });
  if (!p || !p.viewOnce) return { error: "Зураг олдсонгүй" };
  if (p.viewedAt) return { error: "Энэ зургийг аль хэдийн үзсэн байна 🔥" };
  const src = `data:${p.mime};base64,${Buffer.from(p.data).toString("base64")}`;
  if (p.by !== me) {
    const empty = new Uint8Array(0);
    await db.vaultPhoto.update({ where: { id }, data: { viewedAt: new Date(), data: empty, thumb: empty } });
    await done(cid);
  }
  return { src };
}

export async function deleteVaultPhoto(id: string) {
  const { me, cid, db } = await vaultAuth();
  await db.vaultPhoto.deleteMany({ where: { id, by: me } });
  await done(cid);
}

export async function answerWish(item: number, answer: number) {
  const { me, cid, db } = await vaultAuth();
  if (!Number.isInteger(item) || item < 0 || item >= WISHES.length || ![0, 1, 2].includes(answer)) return;
  await db.vaultWish.upsert({
    where: { coupleId_item_by: { coupleId: cid, item, by: me } },
    create: { coupleId: cid, by: me, item, answer },
    update: { answer },
  });
  await done(cid);
}
