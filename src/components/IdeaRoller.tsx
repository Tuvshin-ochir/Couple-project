"use client";

import { useState } from "react";
import { logDate } from "@/app/actions";
import SubmitButton from "./SubmitButton";

type Idea = { emoji: string; text: string };

export default function IdeaRoller({ ideas, initial, big }: { ideas: Idea[]; initial: number; big?: boolean }) {
  const [i, setI] = useState(initial % Math.max(1, ideas.length));
  const [spin, setSpin] = useState(0);
  const idea = ideas[i];
  if (!idea) return null;

  const roll = () => {
    if (ideas.length < 2) return;
    let n = i;
    while (n === i) n = Math.floor(Math.random() * ideas.length);
    setI(n);
    setSpin((s) => s + 1);
  };

  return (
    <>
      <div className={big ? "roll-card" : "idea-big"} key={spin}>
        <span className="roll-emoji" aria-hidden="true">
          {idea.emoji}
        </span>
        <p>{idea.text}</p>
      </div>
      <div className="row">
        <button type="button" className={big ? "btn" : "btn ghost sm"} onClick={roll}>
          🎲 {big ? "Сугалах" : "Өөр санаа"}
        </button>
        <form action={logDate}>
          <input type="hidden" name="text" value={idea.text} />
          <input type="hidden" name="emoji" value={idea.emoji} />
          <SubmitButton className={big ? "btn ghost" : "btn line sm"} toastMsg="💞 Болзооны түүхэнд нэмэгдлээ" burst={6}>
            ✓ Хийлээ
          </SubmitButton>
        </form>
      </div>
    </>
  );
}
