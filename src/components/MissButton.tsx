"use client";

import { useState, useTransition } from "react";
import { sendNudge } from "@/app/actions";
import { toast } from "@/lib/fx";
import { Heart } from "./Brand";
import Icon from "./Icon";

// Илгээх үед товчноос хэдэн жижиг зүрх дээшээ хөөрнө — (x, y, эргэлт) бүр өөр
const BURST = [
  [-34, 58, -18],
  [-12, 74, 8],
  [14, 66, -6],
  [36, 52, 16],
  [-24, 40, 12],
  [26, 36, -14],
] as const;

function HeartBurst() {
  return (
    <span className="heart-burst" aria-hidden="true">
      {BURST.map(([x, y, r], i) => (
        <span key={i} style={{ "--x": `${x}px`, "--y": `${y}px`, "--r": `${r}deg`, "--i": i } as React.CSSProperties}>
          <Heart size={i % 2 ? 12 : 15} />
        </span>
      ))}
    </span>
  );
}

export default function MissButton({ variant = "big" }: { variant?: "big" | "pill" | "icon" }) {
  const [pending, start] = useTransition();
  // Дарсны дараа богино хугацаанд "илгээлээ" төлөвт орно (зүрхний бороогүйгээр)
  const [sent, setSent] = useState(false);

  const send = () => {
    setSent(true);
    setTimeout(() => setSent(false), 1800);
    toast("Санаж байгаагаа илгээлээ");
    start(async () => {
      await sendNudge();
    });
  };

  if (variant === "icon")
    return (
      <button
        className={`miss-icon${sent ? " sent" : ""}`}
        onClick={send}
        disabled={pending}
        aria-label="Чамайг санаж байна"
        title="Чамайг санаж байна"
      >
        <Icon name={sent ? "check" : "heart"} size={20} />
        {sent && <HeartBurst />}
      </button>
    );

  if (variant === "pill")
    return (
      <button className={`miss-pill${sent ? " sent" : ""}`} onClick={send} disabled={pending}>
        <Icon name={sent ? "check" : "heart"} size={17} /> {sent ? "Илгээлээ" : "Чамайг санаж байна"}
        {sent && <HeartBurst />}
      </button>
    );

  return (
    <button className={`miss-big${sent ? " sent" : ""}`} onClick={send} disabled={pending} aria-label="Чамайг санаж байна">
      <span className="miss-heart">
        <Icon name={sent ? "check" : "heart"} size={30} />
        {sent && <HeartBurst />}
      </span>
      <span>{sent ? "Илгээлээ — хайрт чинь мэдэх болно" : "Чамайг санаж байна"}</span>
    </button>
  );
}
