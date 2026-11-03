"use client";

import { useActionState, useState, useTransition } from "react";
import { resetVaultPin, setupVault, unlockVault } from "@/app/actions";
import { hearts } from "@/lib/fx";
import Icon from "../Icon";

/** Анх удаа: PIN тохируулах + 18+ баталгаажуулалт */
export function VaultSetup() {
  const [state, action, pending] = useActionState(setupVault, undefined);
  return (
    <form action={action} className="vault-gate stack">
      <div className="vault-lock-ico">
        <Icon name="lock" size={34} />
      </div>
      <h1>Нууц өрөө</h1>
      <p className="vault-sub">Зөвхөн та хоёрт зориулсан 18+ орон зай. Тусдаа PIN-ээр түгжигдэнэ.</p>
      <div className="cols2">
        <input name="pin" type="password" inputMode="numeric" pattern="\d{4,6}" maxLength={6} placeholder="PIN (4–6 орон)" required />
        <input name="pin2" type="password" inputMode="numeric" pattern="\d{4,6}" maxLength={6} placeholder="PIN дахин" required />
      </div>
      <label className="check">
        <input type="checkbox" name="adult" required /> Бид хоёулаа 18 нас хүрсэн бөгөөд зөвшөөрч байна
      </label>
      <p className="small vault-note">PIN-ээ хайртдаа хэлээрэй. Нууц өрөө 15 минутын дараа автоматаар түгжигдэнэ.</p>
      {state?.error && <p className="err">{state.error}</p>}
      <button className="btn wide" disabled={pending}>
        {pending ? "Түр хүлээнэ үү…" : "Нууц өрөө үүсгэх 🔐"}
      </button>
    </form>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

/** PIN самбар */
export function VaultLock() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);
  const [forgot, setForgot] = useState(false);
  const [pending, start] = useTransition();

  const submit = (value: string) =>
    start(async () => {
      const r = await unlockVault(value);
      if (r?.error) {
        setError(r.error);
        setPin("");
        setShake((n) => n + 1);
      } else hearts(10);
    });

  const press = (k: string) => {
    if (pending) return;
    setError("");
    if (k === "⌫") return setPin((p) => p.slice(0, -1));
    if (!k || pin.length >= 6) return;
    setPin(pin + k);
  };

  return (
    <div className="vault-gate">
      <div className="vault-lock-ico">
        <Icon name="lock" size={34} />
      </div>
      <h1>Нууц өрөө</h1>
      <p className="vault-sub">PIN-ээ оруулна уу</p>
      <div className={`pin-dots${shake ? " shake" : ""}`} key={shake} aria-label={`${pin.length} орон оруулсан`}>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={i < pin.length ? "on" : ""} />
        ))}
      </div>
      {error && <p className="err center">{error}</p>}
      <div className="pin-pad">
        {KEYS.map((k, i) =>
          k ? (
            <button key={i} type="button" onClick={() => press(k)} aria-label={k === "⌫" ? "Арилгах" : k}>
              {k}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
      <button type="button" className="btn wide" disabled={pin.length < 4 || pending} onClick={() => submit(pin)}>
        {pending ? "Шалгаж байна…" : "Нээх"}
      </button>
      <button type="button" className="link-btn vault-forgot" onClick={() => setForgot((v) => !v)}>
        PIN мартсан?
      </button>
      {forgot && <ResetPin />}
    </div>
  );
}

function ResetPin() {
  const [state, action, pending] = useActionState(resetVaultPin, undefined);
  return (
    <form action={action} className="stack vault-reset">
      <p className="small vault-note">Нэвтрэх нууц үгээ оруулбал PIN шинээр тохируулна. Зургууд устахгүй.</p>
      <input name="password" type="password" placeholder="Нэвтрэх нууц үг" autoComplete="current-password" required />
      {state?.error && <p className="err">{state.error}</p>}
      <button className="btn line sm" disabled={pending}>
        PIN шинэчлэх
      </button>
    </form>
  );
}
