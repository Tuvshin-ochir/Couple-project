"use client";

import { useEffect, useState } from "react";

type T = { id: number; msg: string; kind: "ok" | "error" };

export default function Toaster() {
  const [items, setItems] = useState<T[]>([]);

  useEffect(() => {
    let n = 0;
    const onToast = (e: Event) => {
      const { msg, kind } = (e as CustomEvent<{ msg: string; kind: "ok" | "error" }>).detail;
      const id = ++n;
      setItems((xs) => [...xs.slice(-3), { id, msg, kind }]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3400);
    };
    window.addEventListener("bh:toast", onToast);
    return () => window.removeEventListener("bh:toast", onToast);
  }, []);

  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
