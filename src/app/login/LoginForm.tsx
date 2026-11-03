"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";
import Avatar from "@/components/Avatar";
import type { Names } from "@/lib/types";

export default function LoginForm({ names }: { names: Names }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="auth-card stack">
      <div className="auth-hero" aria-hidden="true">
        🔒
      </div>
      <h1 className="center">
        {names.a} <em>&</em> {names.b}
      </h1>
      <p className="center muted">Бидний орон зай. Чи хэн бэ?</p>
      <div className="who-pick center">
        {(["a", "b"] as const).map((w) => (
          <label key={w}>
            <input type="radio" name="who" value={w} required />
            <span>
              <Avatar who={w} name={names[w]} size="sm" />
              {names[w]}
            </span>
          </label>
        ))}
      </div>
      <label className="field">
        <span>Нууц үг</span>
        <input name="password" type="password" autoComplete="current-password" required autoFocus />
      </label>
      {state?.error && <p className="err">{state.error}</p>}
      <button className="btn wide" disabled={pending}>
        {pending ? "Шалгаж байна…" : "Нэвтрэх"}
      </button>
    </form>
  );
}
