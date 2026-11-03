"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { lockVault } from "@/app/actions";
import { useNow } from "@/lib/fx";
import Icon from "../Icon";

/** Үлдсэн хугацаа + түгжих товч. Хугацаа дуусмагц хуудсыг сэргээж түгжинэ. */
export default function VaultBar({ until }: { until: number }) {
  const now = useNow();
  const router = useRouter();
  const [pending, start] = useTransition();
  const left = now ? Math.max(0, until - now) : 0;
  const expired = now > 0 && left === 0;

  useEffect(() => {
    if (expired) router.refresh();
  }, [expired, router]);

  // Өөр таб руу шилжээд удаан байвал (жишээ нь утсаа тавиад) түгжинэ
  useEffect(() => {
    let hiddenAt = 0;
    const onVis = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 60_000) start(async () => void (await lockVault()));
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);

  return (
    <div className="vault-bar">
      <span className="vault-timer">
        <Icon name="clock" size={16} />
        {now ? `${m}:${String(s).padStart(2, "0")}` : "--:--"}
        <span className="vault-timer-label"> дараа түгжигдэнэ</span>
      </span>
      <button className="btn sm vault-lock-btn" disabled={pending} onClick={() => start(async () => void (await lockVault()))}>
        <Icon name="lock" size={15} /> Түгжих
      </button>
    </div>
  );
}
