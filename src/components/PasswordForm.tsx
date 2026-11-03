"use client";

import { useActionState, useEffect } from "react";
import { changePassword } from "@/app/actions";
import { toast } from "@/lib/fx";

export default function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);

  useEffect(() => {
    if (state?.ok) toast("🔒 Нууц үг солигдлоо");
  }, [state]);

  return (
    <form action={action} className="card">
      <h2>Нууц үг солих</h2>
      <p className="small muted">Хоёулаа нэг нууц үгээр нэвтэрдэг. Солибол бусад төхөөрөмжүүд дахин нэвтэрнэ.</p>
      <div className="cols3">
        <input name="current" type="password" placeholder="Одоогийн нууц үг" autoComplete="current-password" required />
        <input name="password" type="password" placeholder="Шинэ нууц үг" autoComplete="new-password" minLength={4} required />
        <input name="password2" type="password" placeholder="Дахин оруулах" autoComplete="new-password" minLength={4} required />
      </div>
      {state?.error && <p className="err">{state.error}</p>}
      <div className="row end">
        <button className="btn line" disabled={pending}>
          Солих
        </button>
      </div>
    </form>
  );
}
