import type { Metadata } from "next";
import { addNote, deleteNote, toggleLike } from "@/app/actions";
import Avatar from "@/components/Avatar";
import LetterCard from "@/components/LetterCard";
import LetterForm from "@/components/LetterForm";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import { Empty, PageHead, Tabs } from "@/components/ui";
import { NOTE_COLORS } from "@/lib/content";
import { getCtx } from "@/lib/ctx";
import type { Db } from "@/lib/db";
import { dayKey, fmtKeyShort, rel } from "@/lib/time";
import type { Who } from "@/lib/types";

export const metadata: Metadata = { title: "Захидал" };

export default async function NotesPage(props: PageProps<"/notes">) {
  const ctx = await getCtx();
  const { me, partner, names, tz, db } = ctx;
  const tab = (await props.searchParams).tab === "letters" ? "letters" : "wall";
  const unread = await db.letter.count({ where: { by: partner, openedAt: null } });

  return (
    <>
      <PageHead emoji="💌" title="Захидал" sub="Өдөр тутмын бяцхан зурвас, эсвэл тодорхой мөчид нээх захидал." />
      <Tabs
        items={[
          ["wall", "📝 Зурвасын хана"],
          ["letters", <>✉️ Нээх захидал {unread > 0 && <span className="badge">{unread}</span>}</>],
        ]}
        current={tab}
        href={(k) => (k === "wall" ? "/notes" : `/notes?tab=${k}`)}
      />
      {tab === "wall" ? <Wall db={db} me={me} names={names} tz={tz} /> : <Letters db={db} me={me} partner={partner} names={names} tz={tz} />}
    </>
  );
}

async function Wall({ db, me, names, tz }: { db: Db; me: Who; names: Record<Who, string>; tz: string }) {
  const notes = await db.note.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();

  return (
    <>
      <form action={addNote} className="card compose">
        <textarea name="text" rows={3} maxLength={2000} placeholder="Хайртдаа юу хэлмээр байна? 💭" required />
        <div className="row between">
          <div className="swatches" role="radiogroup" aria-label="Өнгө">
            {NOTE_COLORS.map((c, i) => (
              <label key={c}>
                <input type="radio" name="color" value={c} defaultChecked={i === 0} />
                <span className={`sw sw-${c}`} />
              </label>
            ))}
          </div>
          <SubmitButton toastMsg="💌 Зурвас илгээгдлээ">Илгээх 💌</SubmitButton>
        </div>
      </form>

      {notes.length ? (
        <div className="notes-grid">
          {notes.map((n) => {
            const by = n.by as Who;
            const liked = me === "a" ? n.likedA : n.likedB;
            const likes = Number(n.likedA) + Number(n.likedB);
            return (
              <article key={n.id} className={`note sw-${n.color}`}>
                <p>{n.text}</p>
                <footer>
                  <Avatar who={by} name={names[by]} size="sm" />
                  <span className="grow">
                    {names[by]} · {rel(n.createdAt, tz, now)}
                  </span>
                  <form action={toggleLike.bind(null, n.id)}>
                    <SubmitButton className={`icon-btn heart${liked ? " on" : ""}`} aria-label="Таалагдлаа">
                      {liked ? "❤️" : "🤍"}
                      {likes > 0 && ` ${likes}`}
                    </SubmitButton>
                  </form>
                  {by === me && (
                    <form action={deleteNote.bind(null, n.id)}>
                      <SubmitButton className="icon-btn" confirm="Энэ зурвасыг устгах уу?" aria-label="Устгах">
                        <Icon name="trash" size={17} />
                      </SubmitButton>
                    </form>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty emoji="📝">Зурвасын хана хоосон байна. Өнөөдрийн бяцхан бодлоо үлдээгээрэй.</Empty>
      )}
    </>
  );
}

async function Letters({ db, me, partner, names, tz }: { db: Db; me: Who; partner: Who; names: Record<Who, string>; tz: string }) {
  const letters = await db.letter.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();
  const toMe = letters.filter((l) => l.by === partner);
  const mine = letters.filter((l) => l.by === me);

  const card = (l: (typeof letters)[number], own: boolean) => (
    <LetterCard
      key={l.id}
      id={l.id}
      title={l.title}
      by={l.by as Who}
      fromName={names[l.by as Who]}
      dateText={fmtKeyShort(dayKey(l.createdAt, tz))}
      own={own}
      status={l.openedAt ? `📖 Нээсэн · ${rel(l.openedAt, tz, now)}` : "🔒 Нээгээгүй"}
      // Битүүмжтэй захидлын агуулгыг клиент рүү илгээхгүй
      body={own || l.openedAt ? l.body : null}
    />
  );

  return (
    <>
      <LetterForm />
      <h2 className="sec">Чамд ирсэн захидлууд</h2>
      {toMe.length ? (
        <div className="env-grid">{toMe.map((l) => card(l, false))}</div>
      ) : (
        <Empty emoji="📭">Одоохондоо захидал ирээгүй байна.</Empty>
      )}
      <h2 className="sec">Миний бичсэн</h2>
      {mine.length ? (
        <div className="env-grid">{mine.map((l) => card(l, true))}</div>
      ) : (
        <Empty emoji="✍️">Хайртдаа анхны &ldquo;Нээх захидал&rdquo;-аа бичээрэй.</Empty>
      )}
    </>
  );
}
