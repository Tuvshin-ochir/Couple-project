"use client";

import { useSyncExternalStore } from "react";

const OPTIONS = [
  ["auto", "🌗 Автомат"],
  ["light", "☀️ Гэрэл"],
  ["dark", "🌙 Харанхуй"],
] as const;

const subscribe = (cb: () => void) => {
  window.addEventListener("bh:theme", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("bh:theme", cb);
    window.removeEventListener("storage", cb);
  };
};

const read = () => {
  try {
    return localStorage.getItem("theme") || "auto";
  } catch {
    return "auto";
  }
};

export default function ThemePicker() {
  const theme = useSyncExternalStore(subscribe, read, () => "auto");

  const set = (t: string) => {
    try {
      if (t === "auto") localStorage.removeItem("theme");
      else localStorage.setItem("theme", t);
    } catch {}
    if (t === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
    window.dispatchEvent(new Event("bh:theme"));
  };

  return (
    <div className="tabs">
      {OPTIONS.map(([k, label]) => (
        <button key={k} className={`tab${theme === k ? " on" : ""}`} onClick={() => set(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}
