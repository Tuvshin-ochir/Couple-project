"use client";

import { useState } from "react";
import { QCATS, QUESTIONS, type QCat } from "@/lib/content";

type Pick = { cat: QCat; q: string };

const pool = (cat: QCat | "all"): Pick[] =>
  cat === "all"
    ? QCATS.flatMap(([c]) => QUESTIONS[c].map((q) => ({ cat: c, q })))
    : QUESTIONS[cat].map((q) => ({ cat, q }));

export default function QuestionCards() {
  const [cat, setCat] = useState<QCat | "all">("all");
  const [i, setI] = useState(0);
  const [seen, setSeen] = useState(1);
  const list = pool(cat);
  const card = list[i % list.length];

  const next = () => {
    let n = i;
    while (list.length > 1 && n === i) n = Math.floor(Math.random() * list.length);
    setI(n);
    setSeen((s) => s + 1);
  };

  return (
    <>
      <div className="tabs">
        {([["all", "Бүгд"], ...QCATS] as [QCat | "all", string][]).map(([k, label]) => (
          <button
            key={k}
            className={`tab${k === cat ? " on" : ""}`}
            onClick={() => {
              setCat(k);
              setI(Math.floor(Math.random() * pool(k).length));
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="qcard" key={`${cat}-${i}`}>
        <span className="qtag">{QCATS.find(([c]) => c === card.cat)?.[1]}</span>
        <p className="q">{card.q}</p>
      </div>
      <div className="row center">
        <button className="btn" onClick={next}>
          Дараагийн асуулт →
        </button>
      </div>
      <p className="small muted center">
        Дуудлага дээрээ ээлжлэн асуугаарай · {seen} дахь асуулт · нийт {list.length}
      </p>
    </>
  );
}
