"use client";

import { useActionState, useState } from "react";
import { setupCouple } from "@/app/actions";

export default function SetupForm() {
  const [state, action, pending] = useActionState(setupCouple, undefined);
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");

  return (
    <form action={action} className="auth-card stack">
      <div className="auth-hero" aria-hidden="true">
        💞
      </div>
      <h1 className="center">Тавтай морил!</h1>
      <p className="center muted">Алсын зайн хайрын тань жижигхэн гэр. Эхлээд хэдэн зүйл тохируулъя.</p>
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
          <input name="password" type="password" minLength={4} autoComplete="new-password" required />
        </label>
        <label className="field">
          <span>Дахин оруулах</span>
          <input name="password2" type="password" minLength={4} autoComplete="new-password" required />
        </label>
      </div>
      <p className="small muted">Хайрт чинь энэ нууц үгээр нэвтэрч, өөрийгөө сонгоно.</p>
      {state?.error && <p className="err">{state.error}</p>}
      <button className="btn wide" disabled={pending}>
        {pending ? "Түр хүлээнэ үү…" : "Эхлэх 💞"}
      </button>
    </form>
  );
}
