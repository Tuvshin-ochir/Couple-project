"use client";

import { useActionState, useState } from "react";
import { deleteCouple } from "@/app/actions";

export default function DeleteCouple() {
  const [state, action, pending] = useActionState(deleteCouple, undefined);
  const [open, setOpen] = useState(false);

  if (!open)
    return (
      <button type="button" className="btn line sm" onClick={() => setOpen(true)}>
        Хосын бүртгэл устгах…
      </button>
    );

  return (
    <form
      action={action}
      className="stack"
      onSubmit={(e) => {
        if (!window.confirm("Бүх зурвас, зураг, дурсамж бүрмөсөн устна. Итгэлтэй байна уу?")) e.preventDefault();
      }}
    >
      <p className="small">
        Бүх зурвас, зураг, дурсамж, нууц өрөөний агуулга <b>бүрмөсөн</b> устна. Сэргээх боломжгүй.
      </p>
      <div className="cols2">
        <input name="password" type="password" placeholder="Хосын нууц үг" autoComplete="current-password" required />
        <input name="confirm" placeholder="УСТГАХ гэж бичнэ үү" autoComplete="off" required />
      </div>
      {state?.error && <p className="err">{state.error}</p>}
      <div className="row">
        <button className="btn danger sm" disabled={pending}>
          {pending ? "Устгаж байна…" : "Бүрмөсөн устгах"}
        </button>
        <button type="button" className="btn line sm" onClick={() => setOpen(false)}>
          Болих
        </button>
      </div>
    </form>
  );
}
