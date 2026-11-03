"use client";

import { useTransition } from "react";
import { sendNudge } from "@/app/actions";
import { hearts, toast } from "@/lib/fx";
import Icon from "./Icon";

export default function MissButton({ variant = "big" }: { variant?: "big" | "pill" | "icon" }) {
  const [pending, start] = useTransition();

  const send = () => {
    hearts(14);
    toast("💗 Санаж байгаагаа илгээлээ");
    start(async () => {
      await sendNudge();
    });
  };

  if (variant === "icon")
    return (
      <button className="miss-icon" onClick={send} disabled={pending} aria-label="Чамайг санаж байна" title="Чамайг санаж байна">
        <Icon name="heart" size={20} />
      </button>
    );

  if (variant === "pill")
    return (
      <button className="miss-pill" onClick={send} disabled={pending}>
        <Icon name="heart" size={18} /> Чамайг санаж байна
      </button>
    );

  return (
    <button className="miss-big" onClick={send} disabled={pending} aria-label="Чамайг санаж байна">
      <span className="miss-heart">
        <Icon name="heart" size={44} />
      </span>
      <span>Чамайг санаж байна</span>
    </button>
  );
}
