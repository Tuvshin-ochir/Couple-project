"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createCouple } from "@/app/actions";

/** Монгол нэрийг латин хосын нэр болгох санал (хэрэглэгч засаж болно) */
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m",
  н: "n", о: "o", ө: "u", п: "p", р: "r", с: "s", т: "t", у: "u", ү: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};
const slug = (v: string) =>
  Array.from(v.trim().toLowerCase())
    .map((c) => TRANSLIT[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 14);

export default function SignupForm() {
  const [state, action, pending] = useActionState(createCouple, undefined);
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [handle, setHandle] = useState("");
  const [touched, setTouched] = useState(false);
  const suggested = [slug(nameA), slug(nameB)].filter(Boolean).join("-");
  const value = touched ? handle : suggested;

  return (
    <form action={action} className="auth-card stack">
      <div className="auth-hero" aria-hidden="true">
        💞
      </div>
      <h1 className="center">Хосоо бүртгүүлэх</h1>
      <p className="center muted">Алсын зайн хайрын тань жижигхэн гэр. Хэдхэн зүйл тохируулъя.</p>
      <div className="cols2">
        <label className="field">
          <span>Нэг дэх нэр</span>
          <input name="nameA" maxLength={30} placeholder="Бат" required value={nameA} onChange={(e) => setNameA(e.target.value)} />
        </label>
        <label className="field">
          <span>Хоёр дахь нэр</span>
          <input name="nameB" maxLength={30} placeholder="Сараа" required value={nameB} onChange={(e) => setNameB(e.target.value)} />
        </label>
      </div>
      <label className="field">
        <span>Хосын нэр (нэвтрэхэд ашиглана)</span>
        <input
          name="handle"
          value={value}
          onChange={(e) => {
            setTouched(true);
            setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
          }}
          placeholder="bat-saraa"
          minLength={3}
          maxLength={30}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
        />
        <small className="field-hint">Латин жижиг үсэг, тоо, зураас. Хайрт чинь энэ нэрээр нэвтэрнэ.</small>
      </label>
      <label className="field">
        <span>Үерхэж эхэлсэн өдөр</span>
        <input type="date" name="startDate" />
      </label>
      <div className="field">
        <span>Чи аль нь вэ?</span>
        <div className="who-pick">
          <label>
            <input type="radio" name="me" value="a" required />
            <span>
              <i className="av av-a sm" aria-hidden="true">
                {Array.from(nameA.trim())[0]?.toUpperCase() || "1"}
              </i>
              {nameA.trim() || "Нэг дэх"}
            </span>
          </label>
          <label>
            <input type="radio" name="me" value="b" />
            <span>
              <i className="av av-b sm" aria-hidden="true">
                {Array.from(nameB.trim())[0]?.toUpperCase() || "2"}
              </i>
              {nameB.trim() || "Хоёр дахь"}
            </span>
          </label>
        </div>
      </div>
      <div className="cols2">
        <label className="field">
          <span>Хосын нууц үг</span>
          <input name="password" type="password" minLength={6} autoComplete="new-password" required />
        </label>
        <label className="field">
          <span>Дахин оруулах</span>
          <input name="password2" type="password" minLength={6} autoComplete="new-password" required />
        </label>
      </div>
      <p className="small muted">Хоёулаа нэг нууц үг ашиглана. Хайртдаа хэлж өгөөрэй.</p>
      {state?.error && <p className="err">{state.error}</p>}
      <button className="btn wide" disabled={pending}>
        {pending ? "Түр хүлээнэ үү…" : "Эхлэх 💞"}
      </button>
      <p className="center small">
        Аль хэдийн бүртгэлтэй юу? <Link href="/login">Нэвтрэх</Link>
      </p>
    </form>
  );
}
