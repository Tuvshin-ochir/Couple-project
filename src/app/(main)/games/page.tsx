import type { Metadata } from "next";
import Link from "next/link";
import { addQuiz, chooseAnswer, deleteQuiz, guessQuiz, judgeQuiz } from "@/app/actions";
import Avatar from "@/components/Avatar";
import QotdCard, { AnswerBubble } from "@/components/QotdCard";
import QuestionCards from "@/components/QuestionCards";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import { Empty, PageHead, Tabs } from "@/components/ui";
import { WHO_MORE, WOULD_YOU_RATHER, dailyQuestion, qotdDay } from "@/lib/content";
import { getCtx, type Ctx } from "@/lib/ctx";
import { prisma } from "@/lib/db";
import { fmtKey } from "@/lib/time";
import type { Who } from "@/lib/types";

export const metadata: Metadata = { title: "Тоглоом" };

const TABS = [
  ["qotd", "❓ Өдрийн асуулт"],
  ["cards", "🃏 Асуулт карт"],
  ["wyr", "⚖️ Аль нь дээр вэ?"],
  ["who", "👀 Хэн нь илүү?"],
  ["quiz", "🎯 Намайг хэр мэдэх вэ?"],
] as const;

type Tab = (typeof TABS)[number][0];

export default async function GamesPage(props: PageProps<"/games">) {
  const ctx = await getCtx();
  const sp = await props.searchParams;
  const tab: Tab = TABS.some(([k]) => k === sp.tab) ? (sp.tab as Tab) : "qotd";
  const q = Number(sp.q);

  return (
    <>
      <PageHead emoji="🎲" title="Хосын тоглоом" sub="Бие биенээ илүү сайн таньж мэдэх асуулт, тоглоомууд." />
      <Tabs items={TABS} current={tab} href={(k) => (k === "qotd" ? "/games" : `/games?tab=${k}`)} />
      {tab === "qotd" && <Qotd ctx={ctx} />}
      {tab === "cards" && <QuestionCards />}
      {tab === "wyr" && <ChoiceGame ctx={ctx} game="wyr" q={q} />}
      {tab === "who" && <ChoiceGame ctx={ctx} game="who" q={q} />}
      {tab === "quiz" && <Quiz ctx={ctx} />}
    </>
  );
}

async function Qotd({ ctx }: { ctx: Ctx }) {
  const { me, names } = ctx;
  const today = qotdDay();
  const answers = await prisma.qotdAnswer.findMany({ orderBy: { day: "desc" } });
  const byDay = new Map<string, typeof answers>();
  for (const a of answers) byDay.set(a.day, [...(byDay.get(a.day) ?? []), a]);
  const past = [...byDay.keys()].filter((d) => d !== today).slice(0, 30);

  return (
    <>
      <section className="card">
        <QotdCard ctx={ctx} answers={byDay.get(today) ?? []} day={today} />
      </section>
      <h2 className="sec">Өмнөх асуултууд</h2>
      {past.length ? (
        past.map((d) => {
          const list = byDay.get(d)!;
          const answeredByMe = list.some((a) => a.by === me);
          return (
            <div key={d} className="card hist">
              <div className="small muted">{fmtKey(d)}</div>
              <p className="qotd-q sm">{list.find((a) => a.question)?.question || dailyQuestion(d)}</p>
              <div className="answers">
                {(["a", "b"] as const).map((w) => {
                  const a = list.find((x) => x.by === w);
                  if (a && (w === me || answeredByMe)) return <AnswerBubble key={w} a={a} name={names[w]} />;
                  return (
                    <div key={w} className="answer waiting">
                      <Avatar who={w} name={names[w]} size="sm" />
                      <span className="muted">{a ? "🔒 Чи хариулаагүй тул нуугдсан" : "Хариулаагүй"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <Empty emoji="🗒️">Өдөр бүр шинэ асуулт гарна. Хариултууд энд хадгалагдана.</Empty>
      )}
    </>
  );
}

/** "Аль нь дээр вэ?" ба "Хэн нь илүү?" — хоёулаа сонгосны дараа тохирлыг харуулна */
async function ChoiceGame({ ctx, game, q }: { ctx: Ctx; game: "wyr" | "who"; q: number }) {
  const { me, partner, names } = ctx;
  const size = game === "wyr" ? WOULD_YOU_RATHER.length : WHO_MORE.length;
  const answers = await prisma.gameAnswer.findMany({ where: { game } });
  const pick = (w: Who, i: number) => answers.find((a) => a.by === w && a.q === i);

  let i = Number.isInteger(q) && q >= 0 && q < size ? q : -1;
  if (i < 0) {
    // Анх ороход хариулаагүй эхний асуулт руу
    i = Array.from({ length: size }, (_, k) => k).find((k) => !pick(me, k)) ?? 0;
  }

  const mine = pick(me, i);
  const theirs = pick(partner, i);
  const prompt = game === "wyr" ? "Аль нь дээр вэ?" : WHO_MORE[i];
  const options = game === "wyr" ? WOULD_YOU_RATHER[i] : [names.a, names.b];

  let both = 0;
  let same = 0;
  for (let k = 0; k < size; k++) {
    const m = pick(me, k);
    const t = pick(partner, k);
    if (m && t) {
      both++;
      if (m.choice === t.choice) same++;
    }
  }
  const answered = answers.filter((a) => a.by === me).length;
  const link = (k: number) => `/games?tab=${game}&q=${k}`;

  return (
    <>
      <div className="card game">
        <div className="row between small muted">
          <span>
            {i + 1} / {size}
          </span>
          <span>Чи {answered} асуултад хариулсан</span>
        </div>
        <p className="game-q">{prompt}</p>
        <div className="choices">
          {options.map((label, c) => (
            <form key={c} action={chooseAnswer.bind(null, game, i, c)}>
              <SubmitButton className={`choice${mine?.choice === c ? " picked" : ""}`}>
                {game === "who" && <Avatar who={c === 0 ? "a" : "b"} name={label} />}
                <span>{label}</span>
                <span className="who">
                  {mine?.choice === c && <Avatar who={me} name={names[me]} size="sm" />}
                  {mine && theirs?.choice === c && <Avatar who={partner} name={names[partner]} size="sm" />}
                </span>
              </SubmitButton>
            </form>
          ))}
        </div>
        <p className="center small">
          {!mine
            ? "Сонголтоо хийгээрэй"
            : !theirs
              ? `⏳ ${names[partner]} хараахан хариулаагүй`
              : mine.choice === theirs.choice
                ? "💞 Ижилхэн бодолтой байна!"
                : "🙈 Өөр өөр бодолтой байна — яагаад гэдгээ ярилцаарай"}
        </p>
        <div className="row between">
          {i > 0 ? (
            <Link className="btn line sm" href={link(i - 1)} scroll={false}>
              ← Өмнөх
            </Link>
          ) : (
            <span />
          )}
          {i < size - 1 && (
            <Link className="btn sm" href={link(i + 1)} scroll={false}>
              Дараагийн →
            </Link>
          )}
        </div>
      </div>
      {both > 0 && (
        <div className="card match">
          <b>Тохирол: {Math.round((same / both) * 100)}%</b>
          <span className="muted small">
            {" "}
            · хоёулаа хариулсан {both} асуултаас {same} нь ижил
          </span>
        </div>
      )}
    </>
  );
}

async function Quiz({ ctx }: { ctx: Ctx }) {
  const { me, partner, names } = ctx;
  const all = await prisma.quizQuestion.findMany({ orderBy: { createdAt: "desc" } });
  const forMe = all.filter((x) => x.by === partner);
  const mine = all.filter((x) => x.by === me);
  const judged = forMe.filter((x) => x.correct !== null);
  const right = judged.filter((x) => x.correct).length;

  return (
    <>
      <form action={addQuiz} className="card compose">
        <h2>Өөрийнхөө тухай асуулт нэмэх</h2>
        <p className="small muted">{names[partner]} чамайг хэр сайн мэддэгийг шалгая. Зөв хариулт нь таах хүртэл нуугдана.</p>
        <div className="cols2">
          <input name="question" maxLength={140} placeholder="Миний хамгийн дуртай хоол юу вэ?" required />
          <input name="answer" maxLength={140} placeholder="Зөв хариулт" required />
        </div>
        <div className="row end">
          <SubmitButton toastMsg="🎯 Асуулт нэмэгдлээ">Нэмэх</SubmitButton>
        </div>
      </form>

      <h2 className="sec">
        🎯 Таах ээлж чинь{" "}
        {judged.length > 0 && (
          <span className="badge">
            {right}/{judged.length}
          </span>
        )}
      </h2>
      {forMe.length ? (
        <div className="quiz-list">
          {forMe.map((x) =>
            x.guess === null ? (
              <form key={x.id} action={guessQuiz.bind(null, x.id)} className="card quiz">
                <p className="quiz-q">{x.question}</p>
                <div className="row">
                  <input name="guess" maxLength={140} placeholder="Таамаг…" required />
                  <SubmitButton className="btn sm">Таах</SubmitButton>
                </div>
              </form>
            ) : (
              <div key={x.id} className={`card quiz${x.correct === true ? " right" : x.correct === false ? " wrong" : ""}`}>
                <p className="quiz-q">{x.question}</p>
                <div className="small">
                  Чиний таамаг: <b>{x.guess}</b>
                </div>
                <div className="small">
                  Зөв хариулт: <b>{x.answer}</b>
                </div>
                {x.correct === null ? (
                  <div className="row">
                    <span className="small muted">Таасан уу?</span>
                    <form action={judgeQuiz.bind(null, x.id, true)}>
                      <SubmitButton className="btn sm" burst={8}>
                        ✓ Зөв
                      </SubmitButton>
                    </form>
                    <form action={judgeQuiz.bind(null, x.id, false)}>
                      <SubmitButton className="btn line sm">✗ Буруу</SubmitButton>
                    </form>
                  </div>
                ) : (
                  <div className="small">{x.correct ? "🎉 Зөв таалаа!" : "😅 Буруу таалаа"}</div>
                )}
              </div>
            ),
          )}
        </div>
      ) : (
        <Empty emoji="🤔">{names[partner]} одоохондоо асуулт нэмээгүй байна.</Empty>
      )}

      <h2 className="sec">📝 Миний асуултууд</h2>
      {mine.length ? (
        <div className="quiz-list">
          {mine.map((x) => (
            <div key={x.id} className="card quiz">
              <p className="quiz-q">{x.question}</p>
              <div className="small">
                Хариулт: <b>{x.answer}</b>
              </div>
              <div className="small muted">
                {x.guess === null ? (
                  "⏳ Хараахан таагаагүй"
                ) : (
                  <>
                    Таамаг: <b>{x.guess}</b> {x.correct === true ? "✓" : x.correct === false ? "✗" : ""}
                  </>
                )}
              </div>
              <div className="row end">
                <form action={deleteQuiz.bind(null, x.id)}>
                  <SubmitButton className="icon-btn" confirm="Энэ асуултыг устгах уу?" aria-label="Устгах">
                    <Icon name="trash" size={17} />
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty emoji="✏️">Өөрийнхөө тухай асуулт нэмээрэй.</Empty>
      )}
    </>
  );
}
