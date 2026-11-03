"use client";

import { toast, useMounted } from "@/lib/fx";

/** Хайртдаа илгээх урилгын холбоос (/login?c=<хосын нэр>) */
export default function InviteLink({ handle }: { handle: string }) {
  const mounted = useMounted();
  const url = `${mounted ? window.location.origin : ""}/login?c=${handle}`;
  const canShare = mounted && typeof navigator.share === "function";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast("🔗 Холбоос хуулагдлаа");
    } catch {
      window.prompt("Холбоосыг хуулна уу:", url);
    }
  };

  return (
    <div className="invite">
      <code>{url}</code>
      <button type="button" className="btn sm" onClick={copy}>
        Хуулах
      </button>
      {canShare && (
        <button
          type="button"
          className="btn line sm"
          onClick={() => navigator.share({ title: "Бид хоёр 💞", text: "Манай хосын орон зайд нэгдээрэй", url }).catch(() => {})}
        >
          Илгээх
        </button>
      )}
    </div>
  );
}
