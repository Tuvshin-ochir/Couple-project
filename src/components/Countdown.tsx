"use client";

import { pad, partsOf } from "@/lib/time";
import { useNow } from "@/lib/fx";

const LABELS = [
  ["d", "хоног"],
  ["h", "цаг"],
  ["m", "минут"],
  ["s", "секунд"],
] as const;

export default function Countdown({ target }: { target: string }) {
  const now = useNow();
  const ms = new Date(target).getTime() - now;

  if (now && ms <= 0) return <p className="cd-done">Уулзах өдөр болжээ! 🎉</p>;

  const p = partsOf(ms);
  return (
    <div className="cd">
      {LABELS.map(([k, label]) => (
        <div key={k}>
          <b>{now ? (k === "d" ? p[k] : pad(p[k])) : "--"}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
