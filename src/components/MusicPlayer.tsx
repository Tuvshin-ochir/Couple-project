"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteSong, toggleSongLike } from "@/app/actions";
import type { Who } from "@/lib/types";
import Avatar from "./Avatar";
import Icon from "./Icon";
import SubmitButton from "./SubmitButton";

export type Track = {
  id: string;
  videoId: string;
  title: string;
  author: string;
  note: string;
  by: Who;
  byName: string;
  when: string;
  liked: boolean;
  likes: number;
};

// YouTube IFrame API-гийн бидэнд хэрэгтэй хэсэг
type YTPlayer = { loadVideoById(id: string): void; playVideo(): void; pauseVideo(): void; destroy(): void };
type YTApi = { Player: new (el: HTMLElement, opts: object) => YTPlayer };
declare global {
  interface Window {
    YT?: YTApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2 };

function loadYouTube(): Promise<YTApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

const thumb = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

export default function MusicPlayer({ tracks }: { tracks: Track[] }) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const tracksRef = useRef(tracks);
  const currentRef = useRef<string | null>(null);
  const shuffleRef = useRef(false);
  // Дуу дуусахад дараагийн рүү шилжих (YouTube event-ээс дуудагдана)
  const stepRef = useRef<(dir: 1 | -1) => void>(() => {});
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  useEffect(() => () => player.current?.destroy(), []);

  const play = useCallback(async (id: string) => {
    const t = tracksRef.current.find((x) => x.id === id);
    if (!t) return;
    currentRef.current = id;
    setCurrentId(id);
    if (player.current) {
      player.current.loadVideoById(t.videoId);
      return;
    }
    // Анх удаа: YouTube тоглуулагчийг хэрэглэгч дарах үед л ачаална
    setLoading(true);
    const YT = await loadYouTube();
    if (!host.current) return;
    player.current = new YT.Player(host.current, {
      width: "100%",
      height: "100%",
      videoId: t.videoId,
      playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
      events: {
        onReady: () => setLoading(false),
        onStateChange: (e: { data: number }) => {
          if (e.data === STATE.PLAYING) setPlaying(true);
          if (e.data === STATE.PAUSED) setPlaying(false);
          if (e.data === STATE.ENDED) stepRef.current(1);
        },
      },
    });
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      const list = tracksRef.current;
      if (!list.length) return;
      const i = list.findIndex((x) => x.id === currentRef.current);
      let n = (i + dir + list.length) % list.length;
      if (shuffleRef.current && list.length > 1) {
        do n = Math.floor(Math.random() * list.length);
        while (n === i);
      }
      play(list[n].id);
    },
    [play],
  );

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const toggle = () => {
    if (!player.current) return tracks[0] && play(currentId ?? tracks[0].id);
    if (playing) player.current.pauseVideo();
    else player.current.playVideo();
  };

  const current = tracks.find((t) => t.id === currentId) ?? null;
  const cover = current ?? tracks[0];

  if (!tracks.length)
    return (
      <div className="empty">
        <div className="big">
          <Icon name="music" size={30} />
        </div>
        <p>Playlist хоосон байна. Хоёулаа дуртай дуугаа нэмээрэй.</p>
      </div>
    );

  return (
    <div className="music">
      <section className="card now-playing">
        <div className="np-screen">
          {/* YouTube тоглуулагч энд үүснэ; түүнээс өмнө зураг + тоглуулах товч */}
          <div ref={host} className="np-host" />
          {!current && (
            <button type="button" className="np-cover" onClick={() => play(cover.id)} aria-label="Тоглуулах">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb(cover.videoId)} alt="" />
              <span className="np-play">
                <Icon name="play" size={28} />
              </span>
            </button>
          )}
          {loading && <span className="np-loading">Ачаалж байна…</span>}
        </div>
        <div className="np-info">
          <div className="np-text">
            <b>{(current ?? cover).title}</b>
            <span className="muted small">
              {(current ?? cover).author}
              {(current ?? cover).note && ` · "${(current ?? cover).note}"`}
            </span>
          </div>
          <div className="np-controls">
            <button
              type="button"
              className={`icon-btn${shuffle ? " on" : ""}`}
              onClick={() => setShuffle((v) => !v)}
              aria-pressed={shuffle}
              aria-label="Санамсаргүй дараалал"
              title="Санамсаргүй дараалал"
            >
              <Icon name="shuffle" size={19} />
            </button>
            <button type="button" className="icon-btn" onClick={() => step(-1)} aria-label="Өмнөх" disabled={!current}>
              <Icon name="prev" size={19} />
            </button>
            <button type="button" className="np-main" onClick={toggle} aria-label={playing ? "Түр зогсоох" : "Тоглуулах"}>
              <Icon name={playing ? "pause" : "play"} size={22} />
            </button>
            <button type="button" className="icon-btn" onClick={() => step(1)} aria-label="Дараагийн">
              <Icon name="next" size={19} />
            </button>
          </div>
        </div>
      </section>

      <ol className="tracks">
        {tracks.map((t, i) => {
          const isCurrent = t.id === currentId;
          return (
            <li key={t.id} className={`track${isCurrent ? " current" : ""}`}>
              <button type="button" className="track-main" onClick={() => play(t.id)}>
                <span className="track-num">
                  {isCurrent && playing ? (
                    <span className="eq" aria-label="Тоглож байна">
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : (
                    i + 1
                  )}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="track-thumb" src={thumb(t.videoId)} alt="" loading="lazy" />
                <span className="track-text">
                  <b>{t.title}</b>
                  <span className="muted small">
                    {t.author}
                    {t.note && ` · "${t.note}"`}
                  </span>
                </span>
              </button>
              <span className="track-meta">
                <Avatar who={t.by} name={t.byName} size="sm" />
                <span className="small muted track-when">{t.when}</span>
                <form action={toggleSongLike.bind(null, t.id)}>
                  <SubmitButton className={`icon-btn${t.liked ? " on liked" : ""}`} aria-label="Дуртай">
                    <Icon name="heart" size={16} />
                    {t.likes > 0 && <span className="small">{t.likes}</span>}
                  </SubmitButton>
                </form>
                <form action={deleteSong.bind(null, t.id)}>
                  <SubmitButton className="icon-btn" confirm="Энэ дууг playlist-ээс хасах уу?" aria-label="Хасах">
                    <Icon name="trash" size={16} />
                  </SubmitButton>
                </form>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
