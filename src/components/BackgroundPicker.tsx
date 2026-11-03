"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveBackground } from "@/app/actions";
import { BG_PRESETS } from "@/lib/backgrounds";
import { toast } from "@/lib/fx";

type Bg = [string, string] | null;

/** Хадгалахаас өмнө шууд харуулна — :root дээрх --bg-1/--bg-2, .app[data-tint]-ээр бүх theme солигдоно */
function preview(bg: Bg) {
  const root = document.documentElement.style;
  const app = document.querySelector<HTMLElement>(".app");
  if (bg) {
    root.setProperty("--bg-1", bg[0]);
    root.setProperty("--bg-2", bg[1]);
    app?.setAttribute("data-tint", "");
  } else {
    root.removeProperty("--bg-1");
    root.removeProperty("--bg-2");
    app?.removeAttribute("data-tint");
  }
}

export default function BackgroundPicker({ value }: { value: Bg }) {
  const [current, setCurrent] = useState<Bg>(value);
  const [custom, setCustom] = useState<[string, string]>(value ?? ["#f3b49b", "#86b3de"]);
  const [pending, start] = useTransition();
  const saved = useRef<Bg>(value);

  // Өөрийн өнгийг хадгалалгүй гарвал хадгалсан өнгө рүүгээ буцна. Утгыг нь серверийн <style>
  // барина — inline-аар үлдээвэл хайрт нь дараа нь солиход хуучин өнгө наалдана
  useEffect(
    () => () => {
      preview(saved.current);
      document.documentElement.style.removeProperty("--bg-1");
      document.documentElement.style.removeProperty("--bg-2");
    },
    [],
  );

  const key = current?.join(",") ?? "";
  const presetOn = (a: string, b: string) => key === `${a},${b}`;
  const isCustom = current !== null && !BG_PRESETS.some(([, a, b]) => presetOn(a, b));

  const apply = (bg: Bg) => {
    setCurrent(bg);
    preview(bg);
    saved.current = bg;
    start(async () => {
      await saveBackground(bg ? bg.join(",") : null);
      toast("Арын өнгө солигдлоо — хайрт чинь ч бас ингэж харна");
    });
  };

  const pick = (i: 0 | 1, color: string) => {
    const next: [string, string] = i === 0 ? [color, custom[1]] : [custom[0], color];
    setCustom(next);
    preview(next);
  };

  return (
    <div className="bg-picker">
      <div className="bg-swatches" role="radiogroup" aria-label="Арын өнгө">
        <button type="button" role="radio" aria-checked={!current} className={`bg-swatch${!current ? " on" : ""}`} onClick={() => apply(null)} disabled={pending}>
          <span className="bg-dot plain" />
          Цаас
        </button>
        {BG_PRESETS.map(([name, a, b]) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={presetOn(a, b)}
            className={`bg-swatch${presetOn(a, b) ? " on" : ""}`}
            onClick={() => apply([a, b])}
            disabled={pending}
          >
            <span className="bg-dot" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} />
            {name}
          </button>
        ))}
      </div>

      <div className={`bg-custom${isCustom ? " on" : ""}`}>
        <span className="small muted">Өөрсдийн өнгө:</span>
        <label className="bg-color" title="Эхний өнгө">
          <input type="color" value={custom[0]} onChange={(e) => pick(0, e.target.value)} aria-label="Эхний өнгө" />
        </label>
        <label className="bg-color" title="Хоёр дахь өнгө">
          <input type="color" value={custom[1]} onChange={(e) => pick(1, e.target.value)} aria-label="Хоёр дахь өнгө" />
        </label>
        <button type="button" className="btn line sm" onClick={() => apply(custom)} disabled={pending}>
          Хэрэглэх
        </button>
      </div>
    </div>
  );
}
