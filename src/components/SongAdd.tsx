"use client";

import { useEffect, useState, useTransition } from "react";
import { addSong } from "@/app/actions";
import type { YtResult } from "@/app/api/yt-search/route";
import { pulseNow, toast } from "@/lib/fx";
import Icon from "./Icon";

const isLink = (q: string) => /youtu\.?be|^https?:\/\//i.test(q);

/** Дууг нэрээр нь YouTube-ээс хайж эсвэл холбоосоор нь нэмнэ */
export default function SongAdd({ have }: { have: string[] }) {
  const [q, setQ] = useState("");
  const [note, setNote] = useState("");
  const [results, setResults] = useState<YtResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const link = isLink(q.trim());

  // Бичиж дуусахыг хүлээгээд хайна; шинэ үсэг ирвэл өмнөх хүсэлтийг цуцална
  useEffect(() => {
    const term = q.trim();
    const skip = term.length < 2 || isLink(term);
    const ctrl = new AbortController();
    const t = setTimeout(
      async () => {
        if (skip) {
          setResults([]);
          setError("");
          setSearching(false);
          return;
        }
        setSearching(true);
        try {
          const r = await fetch(`/api/yt-search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
          const j = (await r.json()) as { results?: YtResult[]; error?: string };
          setResults(j.results ?? []);
          setError(j.error ?? (j.results?.length ? "" : "Юу ч олдсонгүй — өөрөөр бичээд үзээрэй"));
        } catch {
          if (!ctrl.signal.aborted) setError("Хайлт амжилтгүй боллоо");
        }
        if (!ctrl.signal.aborted) setSearching(false);
      },
      skip ? 0 : 450,
    );
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const add = (url: string, id?: string) => {
    setAdding(id ?? url);
    start(async () => {
      const fd = new FormData();
      fd.set("url", url);
      fd.set("note", note);
      const r = await addSong(fd);
      setAdding(null);
      if (r?.error) {
        toast(r.error, "error");
        return;
      }
      toast("Playlist-д нэмэгдлээ");
      setNote("");
      if (!id) setQ("");
      pulseNow();
    });
  };

  return (
    <section className="card song-add">
      <form
        className="song-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (link) add(q.trim());
        }}
      >
        <span className="song-add-ico" aria-hidden="true">
          <Icon name={link ? "link" : "search"} size={18} />
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Дууны нэр эсвэл YouTube холбоос"
          aria-label="Дуу хайх"
          autoComplete="off"
          enterKeyHint={link ? "done" : "search"}
        />
        {link && (
          <button className="btn" disabled={pending}>
            {pending ? "Нэмж байна…" : "Нэмэх"}
          </button>
        )}
      </form>
      <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} placeholder="Тэмдэглэл: яагаад энэ дуу? (заавал биш)" aria-label="Тэмдэглэл" />

      {searching && <p className="small muted">Хайж байна…</p>}
      {!searching && error && <p className="small muted">{error}</p>}
      {!searching && results.length > 0 && (
        <ul className="yt-results">
          {results.map((r) => {
            const inList = have.includes(r.id);
            return (
              <li key={r.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="yt-thumb" src={`https://i.ytimg.com/vi/${r.id}/mqdefault.jpg`} alt="" loading="lazy" />
                <span className="yt-text">
                  <b>{r.title}</b>
                  <span className="small muted">
                    {r.author} · {r.duration}
                  </span>
                </span>
                <button
                  type="button"
                  className={`btn sm${inList ? " line" : ""}`}
                  disabled={inList || pending}
                  onClick={() => add(`https://youtu.be/${r.id}`, r.id)}
                  aria-label={inList ? "Playlist-д байгаа" : `${r.title} нэмэх`}
                >
                  <Icon name={inList ? "check" : "plus"} size={15} />
                  <span className="yt-add-label">{inList ? "Байгаа" : adding === r.id ? "…" : "Нэмэх"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {!q && <p className="small muted">Дууны нэр, дуучны нэрээр хайгаад нэмээрэй. YouTube холбоос хуулж оруулж ч болно.</p>}
    </section>
  );
}
