import type { QotdAnswer } from "@/generated/prisma/client";
import { answerQotd } from "@/app/actions";
import { dailyQuestion } from "@/lib/content";
import type { Ctx } from "@/lib/ctx";
import { fmtKeyShort } from "@/lib/time";
import Avatar from "./Avatar";
import Icon from "./Icon";
import SubmitButton from "./SubmitButton";

export function AnswerBubble({ a, name }: { a: QotdAnswer; name: string }) {
  return (
    <div className="answer">
      <Avatar who={a.by as "a" | "b"} name={name} size="sm" />
      <div>
        <b>{name}</b>
        <p>{a.text}</p>
      </div>
    </div>
  );
}

/** Өдрийн асуулт — хоёулаа хариулсны дараа л бие биенийхээ хариултыг харна */
export default function QotdCard({ ctx, answers, day }: { ctx: Ctx; answers: QotdAnswer[]; day: string }) {
  const { me, partner, names } = ctx;
  const mine = answers.find((a) => a.by === me);
  const theirs = answers.find((a) => a.by === partner);

  return (
    <>
      <div className="card-head">
        <h2>
          <Icon name="chat" size={18} /> Өнөөдрийн асуулт
        </h2>
        <span className="small muted">{fmtKeyShort(day)}</span>
      </div>
      {/* Хариулт байвал тэр үеийн асуултыг харуулна (асуултын сан өөрчлөгдсөн ч зөв) */}
      <p className="qotd-q">{answers.find((a) => a.question)?.question || dailyQuestion(day)}</p>
      {mine ? (
        <div className="answers">
          <AnswerBubble a={mine} name={names[me]} />
          {theirs ? (
            <AnswerBubble a={theirs} name={names[partner]} />
          ) : (
            <div className="answer waiting">
              <Avatar who={partner} name={names[partner]} size="sm" />
              <span className="muted">{names[partner]} хараахан хариулаагүй байна ⏳</span>
            </div>
          )}
        </div>
      ) : (
        <form action={answerQotd} className="stack">
          <textarea name="text" rows={3} maxLength={2000} placeholder="Хариултаа бичээрэй…" required />
          <div className="row between">
            <span className="small muted">
              {theirs
                ? `🔒 ${names[partner]} хариулсан — чи хариулбал харагдана`
                : "Хоёулаа хариулсны дараа бие биенийхээ хариултыг харна"}
            </span>
            <SubmitButton burst={theirs ? 8 : 0}>Хариулах</SubmitButton>
          </div>
        </form>
      )}
    </>
  );
}
