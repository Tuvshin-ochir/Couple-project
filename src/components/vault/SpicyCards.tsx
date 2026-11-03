"use client";

import { useState } from "react";
import { SPICY, SPICY_CATS, type SpicyCat } from "@/lib/content";

export default function SpicyCards() {
  const [cat, setCat] = useState<SpicyCat>("flirt");
  const [i, setI] = useState(0);
  const list = SPICY[cat];

  const next = () => {
    let n = i;
    while (list.length > 1 && n === i) n = Math.floor(Math.random() * list.length);
    setI(n);
  };

  return (
    <>
      <div className="tabs">
        {SPICY_CATS.map(([k, label]) => (
          <button
            key={k}
            className={`tab${k === cat ? " on" : ""}`}
            onClick={() => {
              setCat(k);
              setI(Math.floor(Math.random() * SPICY[k].length));
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="qcard spicy" key={`${cat}-${i}`}>
        <span className="qtag">{SPICY_CATS.find(([k]) => k === cat)?.[1]}</span>
        <p className="q">{list[i % list.length]}</p>
      </div>
      <div className="row center">
        <button className="btn" onClick={next}>
          Дараагийн карт →
        </button>
      </div>
    </>
  );
}
