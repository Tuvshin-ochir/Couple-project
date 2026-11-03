"use client";

import { useNow } from "@/lib/fx";
import { distanceKm, pad, talkWindows, tzOffsetMin, tzParts, WEEKDAYS } from "@/lib/time";
import { other, type City, type Names, type Who } from "@/lib/types";
import Avatar from "./Avatar";

export default function Clocks({ cities, names, me }: { cities: Record<Who, City>; names: Names; me: Who }) {
  const now = useNow();
  const date = new Date(now);
  const a = cities.a;
  const b = cities.b;
  const km = a.lat != null && a.lon != null && b.lat != null && b.lon != null
    ? Math.round(distanceKm({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon }))
    : null;

  let diffText = "";
  let talk = "";
  if (now) {
    const diff = Math.abs(tzOffsetMin(b.tz, date) - tzOffsetMin(a.tz, date)) / 60;
    diffText = diff === 0 ? "Цагийн зөрүүгүй" : `${diff} цагийн зөрүү`;
    const ranges = talkWindows(cities[me].tz, cities[other(me)].tz);
    talk = ranges.length
      ? `💬 Ярихад тохиромжтой: ${ranges.map(([s, e]) => `${pad(s)}:00–${pad(e)}:00`).join(", ")} (чиний цагаар)`
      : "Хоёулаа сэрүүн байх цаг бараг алга — өглөө эрт эсвэл орой оройтож ярилцаарай 💤";
  }

  return (
    <>
      <div className="clocks">
        {(["a", "b"] as const).map((w) => {
          const p = now ? tzParts(cities[w].tz, date) : null;
          return (
            <div className="clock" key={w}>
              <Avatar who={w} name={names[w]} />
              <div>
                <div className="clock-time">{p ? `${pad(p.h)}:${pad(p.mi)}` : "--:--"}</div>
                <div className="small muted">
                  {cities[w].name}
                  {p && ` · ${WEEKDAYS[p.wd]} ${p.h >= 6 && p.h < 19 ? "☀️" : "🌙"}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="facts">
        {diffText && <span>⏱️ {diffText}</span>}
        {km != null && <span>📍 {km.toLocaleString("en-US")} км зайтай</span>}
      </div>
      {talk && <p className="small muted">{talk}</p>}
    </>
  );
}
