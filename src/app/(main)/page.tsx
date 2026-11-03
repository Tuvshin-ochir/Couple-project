import Link from "next/link";
import Avatar from "@/components/Avatar";
import Clocks from "@/components/Clocks";
import Countdown from "@/components/Countdown";
import Icon from "@/components/Icon";
import IdeaRoller from "@/components/IdeaRoller";
import MissButton from "@/components/MissButton";
import MomentPair from "@/components/MomentPair";
import QotdCard from "@/components/QotdCard";
import { DATE_IDEAS, hashStr, qotdDay } from "@/lib/content";
import { getCtx } from "@/lib/ctx";
import { prisma } from "@/lib/db";
import { leftText, upcomingEvents } from "@/lib/events";
import { dayKey, daysBetween, fmtKey, fmtKeyShort, fmtTime, rel, startOfDay, tzParts, utcKey, weekdayOfKey, ymd, ymdText } from "@/lib/time";
import type { Who } from "@/lib/types";

function greeting(h: number) {
  if (h >= 5 && h < 11) return "Өглөөний мэнд";
  if (h >= 11 && h < 17) return "Өдрийн мэнд";
  if (h >= 17 && h < 22) return "Оройн мэнд";
  return "Сайхан амраарай";
}

export default async function HomePage() {
  const ctx = await getCtx();
  const { s, me, partner, names, tz, cityA, cityB } = ctx;
  const now = new Date();
  const today = dayKey(now, tz);
  const qday = qotdDay(now);
  const since = startOfDay(today, tz);

  const [nudgeA, nudgeB, lastNudge, moments, lastNote, qotd, specialDays, customIdeas, stats] = await Promise.all([
    prisma.nudge.count({ where: { by: "a", createdAt: { gte: since } } }),
    prisma.nudge.count({ where: { by: "b", createdAt: { gte: since } } }),
    prisma.nudge.findFirst({ where: { by: partner }, orderBy: { createdAt: "desc" } }),
    prisma.moment.findMany({ where: { day: today }, omit: { photo: true, thumb: true } }),
    prisma.note.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.qotdAnswer.findMany({ where: { day: qday } }),
    prisma.specialDay.findMany(),
    prisma.dateIdea.findMany({ orderBy: { createdAt: "desc" } }),
    Promise.all([
      prisma.memory.count(),
      prisma.note.count(),
      prisma.letter.count(),
      prisma.moment.count(),
      prisma.bucketItem.count(),
      prisma.bucketItem.count({ where: { doneAt: { not: null } } }),
    ]),
  ]);

  const start = s.startDate ? utcKey(s.startDate) : null;
  const together = start ? daysBetween(start, today) : 0;
  const upcoming = upcomingEvents(s, specialDays, today, tz).slice(0, 3);
  const ideas = [...DATE_IDEAS, ...customIdeas.map((i) => ({ emoji: i.emoji, text: i.text }))];
  const [memCount, noteCount, letterCount, momentCount, bucketAll, bucketDone] = stats;
  const hour = tzParts(tz, now).h;

  return (
    <div className="bento">
      {/* ── Толгой ── */}
      <section className="hero c12">
        <div className="hero-text">
          <p className="eyebrow">
            {greeting(hour)}, {names[me]} · {fmtKeyShort(today)}, {weekdayOfKey(today)}
          </p>
          <h1 className="hero-title">
            {names.a} <em>&</em> {names.b}
          </h1>
          {start && together < 0 ? (
            <p className="hero-sub">
              Хамтын түүх <b>{-together}</b> хоногийн дараа эхэлнэ 💫
            </p>
          ) : start ? (
            <p className="hero-sub">
              <b>{together.toLocaleString("en-US")}</b> хоног хамтдаа · {ymdText(ymd(start, today))}
            </p>
          ) : (
            <Link className="btn ghost sm" href="/settings">
              Үерхэж эхэлсэн өдрөө оруулах →
            </Link>
          )}
        </div>
        <div className="hero-avatars" aria-hidden="true">
          <Avatar who="a" name={names.a} size="xl" />
          <span className="hero-heart">
            <Icon name="heart" size={22} />
          </span>
          <Avatar who="b" name={names.b} size="xl" />
        </div>
      </section>

      {/* ── Өнөөдрийн мөч ── */}
      <section className="card c7 r2 moments-card">
        <div className="card-head">
          <h2>
            <Icon name="camera" size={18} /> Өнөөдрийн мөч
          </h2>
          <Link href="/moment" className="link-more">
            Хуанли <Icon name="right" size={16} />
          </Link>
        </div>
        <MomentPair ctx={ctx} moments={moments} isToday size="sm" />
      </section>

      {/* ── Санаж байна ── */}
      <section className="card c5 miss-card">
        <MissButton />
        <p className="small center">
          Өнөөдөр {names.a} <b>{nudgeA}</b> · {names.b} <b>{nudgeB}</b> удаа санасан
        </p>
        {lastNudge && (
          <p className="muted small center">
            {names[partner]} сүүлд {rel(lastNudge.createdAt, tz, now)}
          </p>
        )}
      </section>

      {/* ── Уулзалт ── */}
      <section className="card c5 meet-card">
        <div className="card-head">
          <h2>
            <Icon name="send" size={18} /> Дараагийн уулзалт
          </h2>
        </div>
        {s.nextMeet ? (
          <>
            <Countdown target={s.nextMeet.toISOString()} />
            <p className="muted small">
              {fmtKey(dayKey(s.nextMeet, tz))} · {fmtTime(s.nextMeet, tz)}
            </p>
          </>
        ) : (
          <div className="empty-inline">
            <p className="muted">Дахин уулзах өдрөө тохируулаарай — хоёулаа хамт тоолъё.</p>
            <Link className="btn ghost sm" href="/settings">
              Огноо оруулах
            </Link>
          </div>
        )}
      </section>

      {/* ── Өдрийн асуулт ── */}
      <section className="card c7">
        <QotdCard ctx={ctx} answers={qotd} day={qday} />
      </section>

      {/* ── Хоёрын цаг ── */}
      <section className="card c5">
        <div className="card-head">
          <h2>
            <Icon name="clock" size={18} /> Хоёрын цаг
          </h2>
        </div>
        {cityA && cityB ? (
          <Clocks cities={{ a: cityA, b: cityB }} names={names} me={me} />
        ) : (
          <div className="empty-inline">
            <p className="muted">Хоёулаа аль хотод байгаагаа сонговол цаг, зай, ярихад тохиромжтой цаг харагдана.</p>
            <Link className="btn ghost sm" href="/settings">
              Хот сонгох
            </Link>
          </div>
        )}
      </section>

      {/* ── Сүүлийн зурвас ── */}
      <section className="card c4">
        <div className="card-head">
          <h2>
            <Icon name="mail" size={18} /> Сүүлийн зурвас
          </h2>
          <Link href="/notes" className="link-more">
            Бүгд <Icon name="right" size={16} />
          </Link>
        </div>
        {lastNote ? (
          <div className={`note mini sw-${lastNote.color}`}>
            <p>{lastNote.text}</p>
            <footer>
              <Avatar who={lastNote.by as Who} name={names[lastNote.by as Who]} size="sm" />
              <span>
                {names[lastNote.by as Who]} · {rel(lastNote.createdAt, tz, now)}
              </span>
            </footer>
          </div>
        ) : (
          <div className="empty-inline">
            <p className="muted">Одоохондоо зурвас алга.</p>
            <Link className="btn ghost sm" href="/notes">
              Анхны зурвасаа бичих
            </Link>
          </div>
        )}
      </section>

      {/* ── Ойрын өдрүүд ── */}
      <section className="card c4">
        <div className="card-head">
          <h2>
            <Icon name="calendar" size={18} /> Ойрын өдрүүд
          </h2>
          <Link href="/days" className="link-more">
            Бүгд <Icon name="right" size={16} />
          </Link>
        </div>
        {upcoming.length ? (
          <ul className="mini-ev">
            {upcoming.map((e) => (
              <li key={e.key}>
                <span className="mini-ev-emoji" aria-hidden="true">
                  {e.emoji}
                </span>
                <div>
                  <b>{e.title}</b>
                  <div className="small muted">{fmtKeyShort(e.date)}</div>
                </div>
                <em>{leftText(e.left)}</em>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-inline">
            <p className="muted">Төрсөн өдөр, ой, аяллаа нэмээрэй.</p>
            <Link className="btn ghost sm" href="/days">
              Өдөр нэмэх
            </Link>
          </div>
        )}
      </section>

      {/* ── Болзооны санаа ── */}
      <section className="card c4">
        <div className="card-head">
          <h2>
            <Icon name="video" size={18} /> Өнөөдөр юу хийх вэ?
          </h2>
          <Link href="/dates" className="link-more">
            Бүгд <Icon name="right" size={16} />
          </Link>
        </div>
        <IdeaRoller ideas={ideas} initial={hashStr(today) % ideas.length} />
      </section>

      {/* ── Тоо баримт ── */}
      <section className="stats c12">
        <Link href="/moment">
          <b>{momentCount}</b>
          <span>өдрийн мөч</span>
        </Link>
        <Link href="/memories">
          <b>{memCount}</b>
          <span>дурсамж</span>
        </Link>
        <Link href="/notes">
          <b>{noteCount + letterCount}</b>
          <span>захидал</span>
        </Link>
        <Link href="/bucket">
          <b>
            {bucketDone}/{bucketAll}
          </b>
          <span>мөрөөдөл биелсэн</span>
        </Link>
      </section>
    </div>
  );
}
