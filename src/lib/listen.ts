// "Хамт сонсох" — клиент, сервер хоёулаа хэрэглэдэг төлөв (Listen мөрийн JSON хэлбэр)
import type { Who } from "./types";

export type ListenState = {
  by: Who;
  songId: string;
  videoId: string;
  title: string;
  startedAt: number; // ms — дууны 0-р секунд таарах серверийн цаг
  pausedAt: number | null; // секунд; null = тоглож байна
  changedAt: number; // ms — сүүлд тоглуулсан/зогсоосон
};

export type ListenRow = {
  by: string;
  songId: string;
  videoId: string;
  title: string;
  startedAt: Date;
  pausedAt: number | null;
  changedAt: Date;
};

export const toListenState = (l: ListenRow | null): ListenState | null =>
  l && {
    by: l.by as Who,
    songId: l.songId,
    videoId: l.videoId,
    title: l.title,
    startedAt: l.startedAt.getTime(),
    pausedAt: l.pausedAt,
    changedAt: l.changedAt.getTime(),
  };

/** Одоо тоглож байгаа хэдэн дэх секунд (serverNow = серверийн цаг, ms) */
export const listenPosition = (l: ListenState, serverNow: number) => l.pausedAt ?? Math.max(0, (serverNow - l.startedAt) / 1000);
