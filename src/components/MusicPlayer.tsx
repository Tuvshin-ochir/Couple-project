"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteSong, listenPause, listenPlay, toggleSongLike } from "@/app/actions";
import { listenPosition, type ListenState } from "@/lib/listen";
import type { Who } from "@/lib/types";
import Avatar from "./Avatar";
import { Heart } from "./Brand";
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
type YTPlayer = {
  loadVideoById(o: { videoId: string; startSeconds?: number }): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  destroy(): void;
};
type YTApi = { Player: new (el: HTMLElement, opts: object) => YTPlayer };
declare global {
  interface Window {
    YT?: YTApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const STATE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };
const POLL_MS = 2000;
const DRIFT_S = 2; // хоёр талын зөрүү үүнээс их бол тааруулна

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

/**
 * Хамтын playlist + "хамт сонсох". Хэн нэг нь тоглуулахад төлөв серверт хадгалагдаж (Listen),
 * нөгөө нь энэ хуудсанд байвал 2 секунд тутам шалгаж яг ижил секундэд тааруулна.
 * Тоглуулах/зогсоох/дараагийн нь хоёуланд нь үйлчилнэ; "Салах" дарвал ганцаараа үлдэнэ.
 */
export default function MusicPlayer({
  tracks,
  me,
  partnerName,
  initial,
  initialNow,
}: {
  tracks: Track[];
  me: Who;
  partnerName: string;
  initial: ListenState | null;
  initialNow: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const tracksRef = useRef(tracks);
  const currentRef = useRef<string | null>(null);
  const shuffleRef = useRef(false);
  const togetherRef = useRef(false);
  const remoteRef = useRef<ListenState | null>(initial);
  const partnerHereRef = useRef(false);
  const leftRef = useRef(false); // "Салах" дарсан — автоматаар дахин нэгдэхгүй
  const skew = useRef(0); // серверийн цаг − энэ төхөөрөмжийн цаг
  const quietUntil = useRef(0); // програмаар өөрчилсөн — YouTube-ийн event-ийг хэрэглэгчийнх гэж бүү ойлго
  const localAt = useRef(0); // сүүлд өөрөө өөрчилсөн (серверийн цагаар) — үүнээс хуучин төлөвийг үл тооно
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlers = useRef<{ ended: () => void; userState: (state: number) => void }>({ ended: () => {}, userState: () => {} });

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [together, setTogether] = useState(false);
  const [remote, setRemote] = useState<ListenState | null>(initial);
  const [partnerHere, setPartnerHere] = useState(false);
  const [partnerTogether, setPartnerTogether] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

  const serverNow = () => Date.now() + skew.current;
  const quiet = (ms = 2000) => (quietUntil.current = Date.now() + ms);

  useEffect(() => {
    skew.current = initialNow - Date.now();
    // ?listen=1 (мэдэгдлээс орсон) — URL-аас арилгана, нэгдэх нь доорх эффектээр
    const url = new URL(window.location.href);
    if (url.searchParams.has("listen")) {
      url.searchParams.delete("listen");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }, [initialNow]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  useEffect(
    () => () => {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      player.current?.destroy();
    },
    [],
  );

  const setTog = (v: boolean) => {
    togetherRef.current = v;
    setTogether(v);
  };

  // Автоматаар тоглуулж чадаагүй бол (утасны браузер дуутай autoplay-г хориглодог) товч гаргана
  const expectPlaying = () => {
    // 2 секунд тутмын шалгалт дахин дахин дуудна — хүлээж байгаа бол шинээр эхлүүлэхгүй
    if (tapTimer.current) return;
    tapTimer.current = setTimeout(() => {
      tapTimer.current = null;
      const st = player.current?.getPlayerState();
      if (st !== STATE.PLAYING && st !== STATE.BUFFERING) setNeedsTap(true);
    }, 3500);
  };

  /** Дууг тухайн секундээс ачаална (play=false бол зогссон байдлаар) */
  const loadAt = useCallback(async (t: Track, pos: number, play: boolean) => {
    currentRef.current = t.id;
    setCurrentId(t.id);
    quiet(3000);
    if (player.current) {
      player.current.loadVideoById({ videoId: t.videoId, startSeconds: pos });
      if (!play) setTimeout(() => player.current?.pauseVideo(), 600);
    } else {
      // Анх удаа: YouTube тоглуулагчийг хэрэгтэй үед л ачаална
      setLoading(true);
      const YT = await loadYouTube();
      if (!host.current) return;
      player.current = new YT.Player(host.current, {
        width: "100%",
        height: "100%",
        videoId: t.videoId,
        playerVars: { autoplay: play ? 1 : 0, start: Math.floor(pos), playsinline: 1, rel: 0 },
        events: {
          onReady: () => {
            setLoading(false);
            quiet(2500);
            if (pos % 1 > 0.3) player.current?.seekTo(pos, true);
            if (play) player.current?.playVideo();
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === STATE.PLAYING) {
              setPlaying(true);
              setNeedsTap(false);
            }
            if (e.data === STATE.PAUSED || e.data === STATE.ENDED) setPlaying(false);
            if (e.data === STATE.ENDED) handlers.current.ended();
            else if (Date.now() > quietUntil.current) handlers.current.userState(e.data);
          },
        },
      });
    }
    if (play) expectPlaying();
  }, []);

  /** Өөрийн өөрчлөлтийг серверт илгээж, хариуг нь шууд төлөв болгоно */
  const broadcast = (p: Promise<{ state: ListenState | null; now: number } | null>) => {
    localAt.current = serverNow();
    p.then((r) => {
      if (!r?.state) return;
      remoteRef.current = r.state;
      setRemote(r.state);
    }).catch(() => {});
  };

  /** Сервер дээрх төлөвт тааруулна (хамт сонсож байх үед) — давтан дуудахад аюулгүй */
  const follow = useCallback(
    (r: ListenState) => {
      const t = tracksRef.current.find((x) => x.id === r.songId);
      if (!t) return;
      const pos = listenPosition(r, Date.now() + skew.current);
      const p = player.current;
      if (!p || currentRef.current !== r.songId) return void loadAt(t, pos, r.pausedAt === null);
      const st = p.getPlayerState();
      const live = st === STATE.PLAYING || st === STATE.BUFFERING;
      if (r.pausedAt !== null) {
        if (live) {
          quiet();
          p.pauseVideo();
        }
        if (Math.abs(p.getCurrentTime() - pos) > 1) {
          quiet();
          p.seekTo(pos, true);
        }
        return;
      }
      if (!live && st !== STATE.ENDED) {
        quiet();
        p.seekTo(pos, true);
        p.playVideo();
        expectPlaying();
      } else if (live && Math.abs(p.getCurrentTime() - pos) > DRIFT_S) {
        quiet();
        p.seekTo(pos, true);
      }
    },
    [loadAt],
  );

  // ── Хэрэглэгчийн үйлдэл (хоёуланд нь үйлчилнэ) ──
  const userPlay = (id: string, pos = 0) => {
    const t = tracksRef.current.find((x) => x.id === id);
    if (!t) return;
    leftRef.current = false;
    setTog(true);
    setNeedsTap(false);
    void loadAt(t, pos, true);
    broadcast(listenPlay(id, pos));
  };

  const userStep = (dir: 1 | -1) => {
    const list = tracksRef.current;
    if (!list.length) return;
    const i = list.findIndex((x) => x.id === currentRef.current);
    let n = (i + dir + list.length) % list.length;
    if (shuffleRef.current && list.length > 1) {
      do n = Math.floor(Math.random() * list.length);
      while (n === i);
    }
    userPlay(list[n].id);
  };

  const userToggle = () => {
    const p = player.current;
    if (!p || !currentRef.current) {
      const r = remoteRef.current;
      return userPlay(r?.songId ?? tracks[0].id, r ? listenPosition(r, serverNow()) : 0);
    }
    quiet();
    if (playing) {
      p.pauseVideo();
      if (togetherRef.current) broadcast(listenPause(p.getCurrentTime()));
    } else {
      p.playVideo();
      setNeedsTap(false);
      leftRef.current = false;
      setTog(true);
      broadcast(listenPlay(currentRef.current, p.getCurrentTime()));
    }
  };

  /** Хайртынхаа тоглуулж буй дуунд нэгдэх (товч дарах = дуутай тоглуулах зөвшөөрөл) */
  const join = () => {
    const r = remoteRef.current;
    leftRef.current = false;
    setTog(true);
    setNeedsTap(false);
    if (!r) return player.current?.playVideo();
    const t = tracksRef.current.find((x) => x.id === r.songId);
    if (!t) return;
    const pos = listenPosition(r, serverNow());
    if (player.current && currentRef.current === r.songId) {
      quiet();
      player.current.seekTo(pos, true);
      player.current.playVideo();
      expectPlaying();
    } else void loadAt(t, pos, r.pausedAt === null);
  };

  const leave = () => {
    leftRef.current = true;
    setTog(false);
    setNeedsTap(false);
    quiet();
    player.current?.pauseVideo();
  };

  // YouTube-ийн event-үүд — хамгийн сүүлийн утгуудыг ашиглахын тулд ref-ээр
  useEffect(() => {
    handlers.current = {
      // Дуу дууслаа: хайрт нь хамт байгаа бөгөөд тэр удирдаж байвал түүнийхийг хүлээнэ (давхар алгасахгүй)
      ended: () => {
        const r = remoteRef.current;
        if (togetherRef.current && r && r.by !== me && partnerHereRef.current) return;
        userStep(1);
      },
      // YouTube-ийн өөрийнх нь товчоор зогсоох/тоглуулах
      userState: (st) => {
        if (!togetherRef.current || !player.current || !currentRef.current) return;
        const r = remoteRef.current;
        if (st === STATE.PAUSED) broadcast(listenPause(player.current.getCurrentTime()));
        // Тоглуулбал: хайрт нь энэ дууг аль хэдийн тоглуулж байвал түүнд тааруулна, үгүй бол үргэлжлүүлнэ
        if (st === STATE.PLAYING) {
          if (r && r.songId === currentRef.current && r.pausedAt === null) follow(r);
          else broadcast(listenPlay(currentRef.current, player.current.getCurrentTime()));
        }
      },
    };
  });

  // ── Сервертэй 2 секунд тутам: "энд байна" + төлөв авах ──
  useEffect(() => {
    let busy = false;
    let first = true;
    const tick = async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const t0 = Date.now();
        const res = await fetch("/api/listen", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ together: togetherRef.current }),
        });
        if (!res.ok) return;
        const j = (await res.json()) as { now: number; state: ListenState | null; partnerHere: boolean; partnerTogether: boolean };
        skew.current = j.now - (t0 + Date.now()) / 2;
        partnerHereRef.current = j.partnerTogether;
        setPartnerHere(j.partnerHere);
        setPartnerTogether(j.partnerTogether);
        const r = j.state;
        // Өөрийн дөнгөж хийсэн өөрчлөлтөөс хуучин хариу ирвэл үл тооно
        if (!r || r.changedAt < localAt.current - 100) return;
        remoteRef.current = r;
        setRemote(r);
        const fresh = r.pausedAt === null && listenPosition(r, serverNow()) < 20 * 60;
        if (togetherRef.current) follow(r);
        // Хайрт нь тоглуулж байхад орж ирвэл (эсвэл энд байхад эхлүүлбэл) шууд нэгдэнэ
        else if (fresh && r.by !== me && !leftRef.current && (first || r.changedAt > Date.now() + skew.current - 10_000)) join();
        first = false;
      } catch {
        // сүлжээ тасарсан — дараагийн удаа
      } finally {
        busy = false;
      }
    };
    void tick();
    const id = setInterval(tick, POLL_MS);
    const onVis = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // join/follow нь ref-үүдээр ажилладаг — интервалыг дахин үүсгэх шаардлагагүй
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const current = tracks.find((t) => t.id === currentId) ?? null;
  const cover = current ?? tracks.find((t) => t.id === remote?.songId) ?? tracks[0];
  const partnerPlaying = remote && remote.pausedAt === null && remote.by !== me;
  const remoteTrack = remote ? tracks.find((t) => t.id === remote.songId) : null;

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
      {/* ── Хамт сонсох мөр ── */}
      {together ? (
        <div className={`listen-bar${partnerTogether ? " live" : ""}`} role="status">
          <span className="listen-hearts" aria-hidden="true">
            <Heart size={16} className="heart-beat" />
          </span>
          <span className="grow">
            {partnerTogether ? (
              <>
                <b>{partnerName}</b> хамт сонсож байна 💞
              </>
            ) : partnerHere ? (
              <>
                <b>{partnerName}</b> энд байгаа ч тусдаа сонсож байна
              </>
            ) : (
              <>
                Хамт сонсох горим · <b>{partnerName}</b> орж ирэхэд яг ижил секундээс сонсоно
              </>
            )}
          </span>
          <button type="button" className="btn line sm" onClick={leave}>
            Салах
          </button>
        </div>
      ) : (
        partnerPlaying &&
        remoteTrack && (
          <div className="listen-bar invite" role="status">
            <span className="listen-hearts" aria-hidden="true">
              🎧
            </span>
            <span className="grow">
              <b>{partnerName}</b> одоо “{remoteTrack.title}” сонсож байна
            </span>
            <button type="button" className="btn sm" onClick={join}>
              <Heart size={13} /> Хамт сонсох
            </button>
          </div>
        )
      )}

      <section className="card now-playing">
        <div className="np-screen">
          {/* YouTube тоглуулагч энд үүснэ; түүнээс өмнө зураг + тоглуулах товч */}
          <div ref={host} className="np-host" />
          {!current && (
            <button
              type="button"
              className="np-cover"
              onClick={() => (partnerPlaying ? join() : userPlay(cover.id))}
              aria-label="Тоглуулах"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb(cover.videoId)} alt="" />
              <span className="np-play">
                <Icon name="play" size={28} />
              </span>
            </button>
          )}
          {needsTap && (
            <button type="button" className="np-tap" onClick={join}>
              <span className="np-play">
                <Icon name="play" size={28} />
              </span>
              <b>Дарж хамт сонсох</b>
              <span className="small">{partnerName}-тай яг ижил секундээс</span>
            </button>
          )}
          {loading && <span className="np-loading">Ачаалж байна…</span>}
        </div>
        <div className="np-info">
          <div className="np-text">
            <b>{cover.title}</b>
            <span className="muted small">
              {cover.author}
              {cover.note && ` · "${cover.note}"`}
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
            <button type="button" className="icon-btn" onClick={() => userStep(-1)} aria-label="Өмнөх" disabled={!current}>
              <Icon name="prev" size={19} />
            </button>
            <button type="button" className="np-main" onClick={userToggle} aria-label={playing ? "Түр зогсоох" : "Тоглуулах"}>
              <Icon name={playing ? "pause" : "play"} size={22} />
            </button>
            <button type="button" className="icon-btn" onClick={() => userStep(1)} aria-label="Дараагийн">
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
              <button type="button" className="track-main" onClick={() => userPlay(t.id)}>
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
