import type { Metadata } from "next";
import { addDay, deleteDay } from "@/app/actions";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import { Empty, PageHead } from "@/components/ui";
import { DAY_TYPES } from "@/lib/content";
import { getCtx } from "@/lib/ctx";
import { upcomingEvents, type Ev } from "@/lib/events";
import { dayKey, daysBetween, fmtKey, utcKey, weekdayOfKey } from "@/lib/time";

export const metadata: Metadata = { title: "Чухал өдрүүд" };

export default async function DaysPage() {
  const { s, tz, db } = await getCtx();
  const today = dayKey(new Date(), tz);
  const days = await db.specialDay.findMany();
  const upcoming = upcomingEvents(s, days, today, tz);
  const past: Ev[] = days
    .filter((d) => !d.yearly && utcKey(d.date) < today)
    .map((d) => ({ key: d.id, id: d.id, emoji: d.emoji, title: d.title, date: utcKey(d.date), left: daysBetween(today, utcKey(d.date)) }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHead icon="calendar" title="Чухал өдрүүд" sub="Төрсөн өдөр, ой, аялал — юуг ч мартахгүй." />

      <form action={addDay} className="card">
        <div className="cols3">
          <label className="field">
            <span>Нэр</span>
            <input name="title" maxLength={80} required placeholder="Хайртын төрсөн өдөр" />
          </label>
          <label className="field">
            <span>Огноо</span>
            <input type="date" name="date" required />
          </label>
          <label className="field">
            <span>Төрөл</span>
            <select name="emoji" defaultValue="🎂">
              {DAY_TYPES.map(([e, l]) => (
                <option key={e} value={e}>
                  {e} {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="row between">
          <label className="check">
            <input type="checkbox" name="yearly" defaultChecked /> Жил бүр давтагдана
          </label>
          <SubmitButton toastMsg="📅 Нэмэгдлээ">Нэмэх</SubmitButton>
        </div>
      </form>

      {upcoming.length ? (
        <div className="ev-list">
          {upcoming.map((e) => (
            <EventRow key={e.key} e={e} />
          ))}
        </div>
      ) : (
        <Empty emoji="🗓️">Одоохондоо ирэх өдөр алга. Дээрээс нэмээрэй.</Empty>
      )}

      {past.length > 0 && (
        <>
          <h2 className="sec">Өнгөрсөн</h2>
          <div className="ev-list past">
            {past.map((e) => (
              <EventRow key={e.key} e={e} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function EventRow({ e }: { e: Ev }) {
  return (
    <div className={`card ev${e.left === 0 ? " today" : ""}`}>
      <span className="ev-emoji" aria-hidden="true">
        {e.emoji}
      </span>
      <div className="grow">
        <b>{e.title}</b>
        <div className="small muted">
          {fmtKey(e.date)} · {weekdayOfKey(e.date)}
          {e.yearly && " · жил бүр"}
          {e.auto && " · автоматаар"}
        </div>
      </div>
      <div className="ev-left">
        {e.left < 0 ? (
          <small>{-e.left} хоногийн өмнө</small>
        ) : e.left === 0 ? (
          "Өнөөдөр! 🎉"
        ) : (
          <>
            {e.left}
            <small>хоног үлдлээ</small>
          </>
        )}
      </div>
      {e.id && (
        <form action={deleteDay.bind(null, e.id)}>
          <SubmitButton className="icon-btn" confirm="Энэ өдрийг устгах уу?" aria-label="Устгах">
            <Icon name="trash" size={17} />
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
