"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login } from "@/app/actions";
import Avatar from "@/components/Avatar";
import { Heart, Wordmark } from "@/components/Brand";

/**
 * 1-р алхам: хосын нэр + нууц үг. Зөв бол 2-р алхамд "чи хэн бэ" товчнууд гарна.
 * Талбарууд controlled тул action дууссаны дараа форм reset хийхэд арилахгүй.
 */
export default function LoginForm({ initialHandle }: { initialHandle: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  const [handle, setHandle] = useState(initialHandle);
  const [password, setPassword] = useState("");
  const names = state?.names;

  return (
    <form action={action} className="auth-card stack">
      <div className="auth-hero">
        <Wordmark size={15} />
      </div>
      {names ? (
        <>
          <h1 className="center">
            {names.a} <Heart size={22} shine className="heart-beat" /> {names.b}
          </h1>
          <p className="center muted">Тавтай морил! Чи хэн бэ?</p>
          <input type="hidden" name="handle" value={handle} />
          <input type="hidden" name="password" value={password} />
          <div className="who-pick center">
            {(["a", "b"] as const).map((w) => (
              <button key={w} type="submit" name="who" value={w} className="who-btn" disabled={pending}>
                <Avatar who={w} name={names[w]} size="sm" />
                {names[w]}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h1 className="center">Нэвтрэх</h1>
          <p className="center muted">Хосын нэр, нууц үгээ оруулна уу.</p>
          <label className="field">
            <span>Хосын нэр</span>
            <input
              name="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="bat-saraa"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username"
              required
              autoFocus={!initialHandle}
            />
          </label>
          <label className="field">
            <span>Нууц үг</span>
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              autoFocus={!!initialHandle}
            />
          </label>
          {state?.error && <p className="err">{state.error}</p>}
          <button className="btn wide" disabled={pending}>
            {pending ? "Шалгаж байна…" : "Үргэлжлүүлэх"}
          </button>
          <p className="center small">
            Шинэ хос уу? <Link href="/signup">Бүртгүүлэх</Link>
          </p>
        </>
      )}
    </form>
  );
}
