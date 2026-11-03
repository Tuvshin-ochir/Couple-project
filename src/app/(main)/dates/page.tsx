import type { Metadata } from "next";
import { addIdea, deleteDateLog, deleteIdea, logDate, startSync } from "@/app/actions";
import Avatar from "@/components/Avatar";
import IdeaRoller from "@/components/IdeaRoller";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import { Empty, PageHead, Tabs } from "@/components/ui";
import { DATE_IDEAS, IDEA_TAGS, SYNC_SECONDS, hashStr } from "@/lib/content";
import { getCtx } from "@/lib/ctx";
import { dayKey, fmtDate } from "@/lib/time";
import type { Who } from "@/lib/types";

export const metadata: Metadata = { title: "Болзоо" };

export default async function DatesPage(props: PageProps<"/dates">) {
  const { names, tz, db } = await getCtx();
  const sp = await props.searchParams;
  const tag = IDEA_TAGS.some(([k]) => k === sp.tag) ? (sp.tag as string) : "all";
  const [custom, log] = await Promise.all([
    db.dateIdea.findMany({ orderBy: { createdAt: "desc" } }),
    db.dateLog.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const ideas = [
    ...DATE_IDEAS.map((d) => ({ ...d, id: null as string | null })),
    ...custom.map((d) => ({ emoji: d.emoji, text: d.text, tag: "custom", id: d.id })),
  ];
  const shown = ideas.filter((i) => tag === "all" || i.tag === tag);
  const doneCount = (text: string) => log.filter((l) => l.text === text).length;

  return (
    <>
      <PageHead emoji="🎬" title="Онлайн болзоо" sub="Зай хол ч хамтдаа өнгөрүүлэх олон арга бий." />

      <div className="grid two">
        <section className="card">
          <h2>🎲 Санамсаргүй болзоо</h2>
          <IdeaRoller ideas={ideas} initial={hashStr(dayKey(new Date(), tz)) % ideas.length} big />
        </section>
        <section className="card">
          <h2>⏯️ Зэрэг эхлүүлэх</h2>
          <p className="small muted">
            Кино, дуугаа яг зэрэг асаахад. Нэг нь товч дарахад хоёулангийнх нь дэлгэц дээр ижил тоолуур гарна.
          </p>
          <div className="row wrap">
            {SYNC_SECONDS.map((sec) => (
              <form key={sec} action={startSync.bind(null, sec)}>
                <SubmitButton className="btn line sm">{sec} сек</SubmitButton>
              </form>
            ))}
          </div>
          <p className="small muted">💡 Тоолуур 0 болоход хоёулаа зэрэг ▶ дарна.</p>
        </section>
      </div>

      <h2 className="sec">💡 Болзооны санаанууд</h2>
      <Tabs items={IDEA_TAGS} current={tag} href={(k) => (k === "all" ? "/dates" : `/dates?tag=${k}`)} />
      {shown.length ? (
        <div className="idea-grid">
          {shown.map((i) => {
            const n = doneCount(i.text);
            return (
              <div key={i.id ?? i.text} className={`idea${n ? " did" : ""}`}>
                <span className="idea-emoji" aria-hidden="true">
                  {i.emoji}
                </span>
                <p>{i.text}</p>
                <div className="row">
                  <form action={logDate}>
                    <input type="hidden" name="text" value={i.text} />
                    <input type="hidden" name="emoji" value={i.emoji} />
                    <SubmitButton className="btn line sm" toastMsg="💞 Болзооны түүхэнд нэмэгдлээ" burst={6}>
                      {n ? `✓ ${n} удаа` : "Хийлээ"}
                    </SubmitButton>
                  </form>
                  {i.id && (
                    <form action={deleteIdea.bind(null, i.id)}>
                      <SubmitButton className="icon-btn" confirm="Энэ санааг устгах уу?" aria-label="Устгах">
                        <Icon name="trash" size={17} />
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty emoji="💡">Өөрсдийн болзооны санаагаа доороос нэмээрэй.</Empty>
      )}
      <form action={addIdea} className="row compose">
        <input name="text" maxLength={140} placeholder="Өөрсдийн болзооны санаа нэмэх…" required />
        <SubmitButton>Нэмэх</SubmitButton>
      </form>

      <h2 className="sec">📖 Болзооны түүх</h2>
      {log.length ? (
        <ul className="check-list">
          {log.map((l) => {
            const by = l.by as Who;
            return (
              <li key={l.id} className="check-item">
                <span className="idea-emoji" aria-hidden="true">
                  {l.emoji}
                </span>
                <div className="grow">
                  <div>{l.text}</div>
                  <div className="small muted row">
                    <Avatar who={by} name={names[by]} size="sm" />
                    {fmtDate(l.createdAt, tz)}
                  </div>
                </div>
                <form action={deleteDateLog.bind(null, l.id)}>
                  <SubmitButton className="icon-btn" confirm="Түүхээс устгах уу?" aria-label="Устгах">
                    <Icon name="trash" size={17} />
                  </SubmitButton>
                </form>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty emoji="🗓️">Хамтдаа хийсэн болзоогоо &ldquo;Хийлээ&rdquo; товчоор тэмдэглээрэй.</Empty>
      )}
    </>
  );
}
