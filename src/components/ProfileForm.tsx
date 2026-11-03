"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { saveProfile } from "@/app/actions";
import { CITIES } from "@/lib/content";
import { pad } from "@/lib/time";
import { toast, useMounted } from "@/lib/fx";
import type { City, Names } from "@/lib/types";

type Props = {
  names: Names;
  startDate: string;
  nextMeet: string | null; // ISO
  cityA: City | null;
  cityB: City | null;
};

const selectedOf = (c: City | null) =>
  !c ? "" : CITIES.some((x) => x.name === c.name && x.tz === c.tz) ? c.name : "__custom";

function toLocalInput(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ProfileForm({ names, startDate, nextMeet, cityA, cityB }: Props) {
  const [state, action, pending] = useActionState(saveProfile, undefined);
  const meetInput = useRef<HTMLInputElement>(null);
  const meetIso = useRef<HTMLInputElement>(null);
  const mounted = useMounted();

  // datetime-local нь браузерын цагийн бүсээр харагдах ёстой тул клиент дээр бөглөнө
  useEffect(() => {
    if (meetInput.current && nextMeet) meetInput.current.value = toLocalInput(nextMeet);
  }, [nextMeet]);

  useEffect(() => {
    if (state?.ok) toast("✓ Хадгалагдлаа");
  }, [state]);

  return (
    // action-ийг гараар дуудна — хадгалсны дараа форм reset хийгдэхгүй үлдэнэ
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <h2>Бидний тухай</h2>
      <div className="cols2">
        <label className="field">
          <span>Нэг дэх нэр</span>
          <input name="nameA" defaultValue={names.a} maxLength={30} required />
        </label>
        <label className="field">
          <span>Хоёр дахь нэр</span>
          <input name="nameB" defaultValue={names.b} maxLength={30} required />
        </label>
      </div>
      <div className="cols2">
        <label className="field">
          <span>Үерхэж эхэлсэн өдөр</span>
          <input type="date" name="startDate" defaultValue={startDate} />
        </label>
        <label className="field">
          <span>Дараагийн уулзалт</span>
          <input
            ref={meetInput}
            type="datetime-local"
            onChange={(e) => {
              if (meetIso.current) meetIso.current.value = e.target.value ? new Date(e.target.value).toISOString() : "";
            }}
          />
          <input ref={meetIso} type="hidden" name="nextMeetIso" defaultValue={nextMeet ?? ""} />
        </label>
      </div>
      <div className="cols2">
        <CityField k="A" name={names.a} city={cityA} />
        <CityField k="B" name={names.b} city={cityB} />
      </div>
      {mounted && (
        <datalist id="tzlist">
          {Intl.supportedValuesOf("timeZone").map((z) => (
            <option key={z} value={z} />
          ))}
        </datalist>
      )}
      {state?.error && <p className="err">{state.error}</p>}
      <div className="row end">
        <button className="btn" disabled={pending}>
          {pending ? "Хадгалж байна…" : "Хадгалах"}
        </button>
      </div>
    </form>
  );
}

function CityField({ k, name, city }: { k: "A" | "B"; name: string; city: City | null }) {
  const [sel, setSel] = useState(selectedOf(city));
  const custom = sel === "__custom";
  const own = custom && city && selectedOf(city) === "__custom" ? city : null;

  return (
    <div className="field">
      <span>{name} аль хотод байна?</span>
      <select name={`city${k}`} value={sel} onChange={(e) => setSel(e.target.value)}>
        <option value="">— Сонгох —</option>
        {CITIES.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
        <option value="__custom">Бусад хот…</option>
      </select>
      {custom && (
        <div className="custom-city">
          <input name={`cname${k}`} placeholder="Хотын нэр" defaultValue={own?.name ?? ""} />
          <input name={`ctz${k}`} list="tzlist" placeholder="Цагийн бүс, ж: Asia/Seoul" defaultValue={own?.tz ?? ""} required />
          <div className="cols2">
            <input name={`clat${k}`} type="number" step="any" placeholder="Өргөрөг (lat)" defaultValue={own?.lat ?? ""} />
            <input name={`clon${k}`} type="number" step="any" placeholder="Уртраг (lon)" defaultValue={own?.lon ?? ""} />
          </div>
        </div>
      )}
    </div>
  );
}
