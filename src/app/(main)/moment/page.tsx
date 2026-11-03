import type { Metadata } from "next";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import Icon from "@/components/Icon";
import MomentPair, { momentSrc, type MomentLite } from "@/components/MomentPair";
import { PageHead } from "@/components/ui";
import { LOW_MOODS, filterCss, lowMoodText, moodOf } from "@/lib/content";
import { getCtx } from "@/lib/ctx";
import { dayKey, fmtKey, isDayKey, pad, weekdayOfKey } from "@/lib/time";
import type { Who } from "@/lib/types";

export const metadata: Metadata = { title: "Өдрийн мөч" };

const WD = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];

const shiftMonth = (m: string, by: number) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + by, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
};

export default async function MomentPage(props: PageProps<"/moment">) {
  const ctx = await getCtx();
  const { me, partner, names, tz, db } = ctx;
  const sp = await props.searchParams;
  const today = dayKey(new Date(), tz);
  const day = typeof sp.day === "string" && isDayKey(sp.day) && sp.day <= today ? sp.day : today;
  const month = typeof sp.m === "string" && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : day.slice(0, 7);
  const isToday = day === today;

  const [dayMoments, monthMoments] = await Promise.all([
    db.moment.findMany({ where: { day }, omit: { photo: true, thumb: true } }),
    db.moment.findMany({ where: { day: { startsWith: month } }, omit: { photo: true, thumb: true } }),
  ]);

  // Өнөөдөр өөрөө хуваалцаагүй бол хайртынхаа өнөөдрийн мөчийг хуанлид ч харуулахгүй
  const postedToday = monthMoments.some((m) => m.day === today && m.by === me);
  const visible = monthMoments.filter((m) => !(m.day === today && m.by === partner && !postedToday));
  const byDay = new Map<string, MomentLite[]>();
  for (const m of visible) byDay.set(m.day, [...(byDay.get(m.day) ?? []), m]);

  const [y, mo] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(y, mo - 1, 1)).getUTCDay() + 6) % 7; // Даваа гарагаас эхэлнэ
  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const canNext = next <= today.slice(0, 7);

  const partnerToday = dayMoments.find((m) => m.by === partner);
  const stats = (w: Who) => {
    const list = monthMoments.filter((m) => m.by === w);
    const counts = new Map<string, number>();
    for (const m of list) counts.set(m.mood, (counts.get(m.mood) ?? 0) + 1);
    const top = [...counts].sort((a, b) => b[1] - a[1])[0];
    return { count: list.length, top: top ? moodOf(top[0]) : null };
  };

  return (
    <>
      <PageHead emoji="📸" title="Өдрийн мөч" sub="Өдөр бүр нэг зураг, нэг сэтгэл. Хоёулаа хуваалцсаны дараа бие биенийхээ мөчийг харна." />

      <section className="moment-stage">
        <div className="stage-head">
          <div>
            <div className="eyebrow">{isToday ? "Өнөөдөр" : "Тэр өдөр"}</div>
            <h2>
              {fmtKey(day)} · {weekdayOfKey(day)}
            </h2>
          </div>
          {!isToday && (
            <Link href="/moment" className="btn line sm" scroll={false}>
              Өнөөдөр рүү буцах
            </Link>
          )}
        </div>
        <MomentPair ctx={ctx} moments={dayMoments} isToday={isToday} />
        {isToday && postedToday && partnerToday && LOW_MOODS.includes(partnerToday.mood) && (
          <div className="hint">
            💡 {names[partner]} өнөөдөр {lowMoodText(partnerToday.mood)}. Залгах эсвэл{" "}
            <Link href="/notes">дулаахан зурвас</Link> үлдээгээрэй.
          </div>
        )}
      </section>

      <section className="card cal-card">
        <div className="cal-head">
          <Link href={`/moment?m=${prev}`} className="icon-btn" scroll={false} aria-label="Өмнөх сар">
            <Icon name="left" />
          </Link>
          <h2>
            {y} оны {mo}-р сар
          </h2>
          {canNext ? (
            <Link href={`/moment?m=${next}`} className="icon-btn" scroll={false} aria-label="Дараагийн сар">
              <Icon name="right" />
            </Link>
          ) : (
            <span className="icon-btn" aria-hidden="true" />
          )}
        </div>
        <div className="cal">
          {WD.map((w) => (
            <div key={w} className="cal-wd">
              {w}
            </div>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <div key={`x${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const key = `${month}-${pad(i + 1)}`;
            const list = (byDay.get(key) ?? []).sort((a, b) => a.by.localeCompare(b.by));
            const photos = list.filter((m) => m.mime);
            const cls = `cal-day${key === today ? " today" : ""}${key === day ? " sel" : ""}${photos.length ? " has-ph" : ""}`;
            const inner = (
              <>
                {photos.length > 0 && (
                  <span className={`cal-ph n${photos.length}`}>
                    {photos.map((m) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={m.id} src={momentSrc(m, true)!} alt="" loading="lazy" style={{ filter: filterCss(m.filter) }} />
                    ))}
                  </span>
                )}
                <span className="cal-num">{i + 1}</span>
                {list.length > 0 && (
                  <span className="cal-moods">
                    {list.map((m) => (
                      <span key={m.id}>{moodOf(m.mood).emoji}</span>
                    ))}
                  </span>
                )}
              </>
            );
            return key > today ? (
              <span key={key} className={`${cls} future`}>
                {inner}
              </span>
            ) : (
              <Link key={key} href={`/moment?m=${month}&day=${key}`} className={cls} scroll={false} aria-label={fmtKey(key)}>
                {inner}
              </Link>
            );
          })}
        </div>
        <div className="cal-stats">
          {(["a", "b"] as const).map((w) => {
            const st = stats(w);
            return (
              <div key={w} className="cal-stat">
                <Avatar who={w} name={names[w]} size="sm" />
                <span>
                  <b>{names[w]}</b> энэ сард {st.count} мөч
                  {st.top && (
                    <span className="muted">
                      {" "}
                      · ихэвчлэн {st.top.emoji} {st.top.label.toLowerCase()}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
