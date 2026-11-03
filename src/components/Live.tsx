"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sendNudge } from "@/app/actions";
import { toast, useNow } from "@/lib/fx";
import { other, type Names, type Who } from "@/lib/types";
import MissOverlay from "./MissOverlay";

type Pulse = {
  v: number;
  now: number;
  sync: { at: number; by: Who } | null;
  latest: Record<"nudge" | "note" | "letter" | "qotd" | "moment" | "vault" | "song", number>;
};

const POLL_MS = 3000;

/**
 * Хоёр тал бие биенийхээ өөрчлөлтийг харахын тулд /api/pulse-ыг байнга шалгана.
 * Өгөгдлийн хувилбар өөрчлөгдвөл хуудсыг сэргээж, хайртаасаа шинэ зүйл ирвэл мэдэгдэнэ.
 */
export default function Live({ me, names }: { me: Who; names: Names }) {
  const router = useRouter();
  const version = useRef<number | null>(null);
  const busy = useRef(false);
  // skew = серверийн цаг − энэ төхөөрөмжийн цаг (хоёр тал яг зэрэг тоолохын тулд)
  const [sync, setSync] = useState<(NonNullable<Pulse["sync"]> & { skew: number }) | null>(null);
  // Хайртаасаа "санаж байна" ирсэн үед (апп нээлттэй эсвэл мэдэгдэл дээр дарж орсон)
  const [missed, setMissed] = useState(false);

  const notify = useCallback(
    (latest: Pulse["latest"]) => {
      const pn = names[other(me)];
      const messages: Record<keyof Pulse["latest"], string> = {
        nudge: "",
        note: `💌 ${pn} шинэ зурвас үлдээлээ`,
        letter: `✉️ ${pn} чамд захидал бичлээ`,
        qotd: `❓ ${pn} өнөөдрийн асуултад хариуллаа`,
        moment: `📸 ${pn} өдрийн мөчөө хуваалцлаа`,
        vault: `🔒 ${pn} Нууц өрөөнд шинэ зүйл үлдээлээ`,
        song: `🎵 ${pn} шинэ дуу нэмлээ`,
      };
      const key = `bh_seen_${me}`;
      let seen: Record<string, number> = {};
      try {
        seen = JSON.parse(localStorage.getItem(key) || "{}");
      } catch {}
      let changed = false;
      for (const k of Object.keys(messages) as (keyof Pulse["latest"])[]) {
        const t = latest[k] || 0;
        if (seen[k] === undefined) {
          seen[k] = t; // анх удаа — хуучныг мэдэгдэхгүй
          changed = true;
        } else if (t > seen[k]) {
          if (k === "nudge") setMissed(true);
          else toast(messages[k]);
          seen[k] = t;
          changed = true;
        }
      }
      if (changed) {
        try {
          localStorage.setItem(key, JSON.stringify(seen));
        } catch {}
      }
    },
    [me, names],
  );

  const poll = useCallback(async () => {
    if (busy.current || document.visibilityState !== "visible") return;
    busy.current = true;
    try {
      const r = await fetch("/api/pulse", { cache: "no-store" });
      if (r.status === 401) router.refresh();
      if (!r.ok) return;
      const p: Pulse = await r.json();
      if (version.current !== null && p.v !== version.current) router.refresh();
      version.current = p.v;
      setSync(p.sync && p.sync.at + 6000 > p.now ? { ...p.sync, skew: p.now - Date.now() } : null);
      notify(p.latest);
    } catch {
      // сүлжээ тасарсан — дараагийн удаа дахин оролдоно
    } finally {
      busy.current = false;
    }
  }, [notify, router]);

  useEffect(() => {
    // Серверт хэрэглэгчийн цагийн бүсийг мэдэгдэнэ (огноог зөв харуулахын тулд)
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const cookie = `tz=${encodeURIComponent(tz)}`;
      if (tz && !document.cookie.split("; ").includes(cookie)) {
        document.cookie = `${cookie}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      }
    } catch {}

    // Утасны мэдэгдэл дээр дарж орсон бол (?miss=…) анимацитай цонх нээнэ
    const first = setTimeout(() => {
      const url = new URL(window.location.href);
      if (url.searchParams.has("miss")) {
        setMissed(true);
        url.searchParams.delete("miss");
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
      }
      // Апп-ын дүрс дээр удаан дараад "Санаж байна" товчлолоор орсон бол (?send=miss) шууд илгээнэ.
      // Параметрийг эхлээд арилгаж, refresh хийхэд дахин илгээгдэхгүй
      if (url.searchParams.get("send") === "miss") {
        url.searchParams.delete("send");
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
        sendNudge().then(
          () => toast("Санаж байгаагаа илгээлээ"),
          () => toast("Илгээж чадсангүй — дахин оролдоорой", "error"),
        );
      }
      poll();
    }, 0);
    const id = setInterval(poll, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("bh:pulse", poll);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("bh:pulse", poll);
    };
  }, [poll, router]);

  return (
    <>
      {sync && <SyncOverlay sync={sync} names={names} />}
      {missed && <MissOverlay who={other(me)} name={names[other(me)]} onClose={() => setMissed(false)} />}
    </>
  );
}

function SyncOverlay({ sync, names }: { sync: NonNullable<Pulse["sync"]> & { skew: number }; names: Names }) {
  const now = useNow(200);
  if (!now) return null;
  const ms = sync.at - (now + sync.skew);
  if (ms < -5000) return null;
  return (
    <div className="sync-ov" role="timer" aria-live="assertive">
      {ms > 0 ? (
        <>
          <small>{names[sync.by]} эхлүүлэв — бэлдээрэй</small>
          <b>{Math.ceil(ms / 1000)}</b>
        </>
      ) : (
        <b className="go">▶ ОДОО!</b>
      )}
    </div>
  );
}
