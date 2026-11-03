"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { City, Names, Who } from "@/lib/types";
import { HEART } from "./Brand";

type Pt = [number, number];

const HEART_SVG = `<svg viewBox="6 7 36 34.5" width="16" height="16" aria-hidden="true"><path d="${HEART}" fill="currentColor"/></svg>`;

/** Хоёр цэгийн хоорондох хамгийн богино (great-circle) нум — онгоцны зам шиг муруй */
function greatCircle(a: City, b: City, n = 64): Pt[] {
  const rad = (d: number) => (d * Math.PI) / 180;
  const deg = (r: number) => (r * 180) / Math.PI;
  const [p1, l1, p2, l2] = [rad(a.lat!), rad(a.lon!), rad(b.lat!), rad(b.lon!)];
  const d = 2 * Math.asin(Math.sqrt(Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2));
  if (d < 1e-6) return [[a.lat!, a.lon!]];
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(p1) * Math.cos(l1) + B * Math.cos(p2) * Math.cos(l2);
    const y = A * Math.cos(p1) * Math.sin(l1) + B * Math.cos(p2) * Math.sin(l2);
    const z = A * Math.sin(p1) + B * Math.sin(p2);
    pts.push([deg(Math.atan2(z, Math.hypot(x, y))), deg(Math.atan2(y, x))]);
  }
  // Номхон далайг гатлахад уртраг үсрэхгүй байлгах
  for (let i = 1; i < pts.length; i++) {
    while (pts[i][1] - pts[i - 1][1] > 180) pts[i][1] -= 360;
    while (pts[i][1] - pts[i - 1][1] < -180) pts[i][1] += 360;
  }
  return pts;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export default function DistanceMap({ cities, names, km }: { cities: Record<Who, City>; names: Names; km: number }) {
  const el = useRef<HTMLDivElement>(null);
  // Props-ийг утгаар нь харьцуулна (сервер бүр шинэ объект өгдөг)
  const spec = JSON.stringify({ cities, names, km });

  useEffect(() => {
    const { cities: c, names: n, km: dist } = JSON.parse(spec) as { cities: Record<Who, City>; names: Names; km: number };
    let cancelled = false;
    let raf = 0;
    let map: import("leaflet").Map | null = null;

    import("leaflet").then((L) => {
      if (cancelled || !el.current) return;
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--rose").trim() || "#a5463d";
      const pts = greatCircle(c.a, c.b);
      const end = pts[pts.length - 1];

      map = L.map(el.current, { zoomControl: false, scrollWheelZoom: false, attributionControl: true });
      map.attributionControl.setPrefix(false);
      // OSM tile — түлхүүргүй; өнгийг CSS шүүлтүүрээр (.map-tiles) сайтын аялгуунд оруулна
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        className: "map-tiles",
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const pin = (w: Who) =>
        L.divIcon({
          className: "map-pin-wrap",
          html: `<span class="map-pin"><span class="av av-${w}">${esc(Array.from(n[w].trim())[0]?.toUpperCase() ?? "?")}</span></span><span class="map-city">${esc(c[w].name)}</span>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

      if (pts.length > 1) {
        L.polyline(pts, { color: accent, weight: 2.5, opacity: 0.9, dashArray: "2 7", lineCap: "round" }).addTo(map);
        L.marker(pts[Math.floor(pts.length / 2)], {
          icon: L.divIcon({ className: "map-km-wrap", html: `<span class="map-km">${dist.toLocaleString("en-US")} км</span>`, iconSize: [0, 0] }),
          interactive: false,
        }).addTo(map);
      }
      L.marker(pts[0], { icon: pin("a"), keyboard: false }).addTo(map);
      L.marker(end, { icon: pin("b"), keyboard: false }).addTo(map);
      map.fitBounds(L.latLngBounds(pts.length > 1 ? pts : [pts[0], pts[0]]), { padding: [56, 56], maxZoom: 7 });

      // Нумын дагуу жижиг зүрх аялна — нэгнээсээ нөгөө рүүгээ (хөдөлгөөн багасгах тохиргоотой бол үгүй)
      if (pts.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const heart = L.divIcon({ className: "map-heart-wrap", html: `<span class="map-heart">${HEART_SVG}</span>`, iconSize: [0, 0] });
        const dot = L.marker(pts[0], { icon: heart, interactive: false, keyboard: false }).addTo(map);
        const t0 = performance.now();
        const loop = (t: number) => {
          // rAF-ийн хугацаа t0-оос өмнөх байж болно — сөрөг индекс гаргахгүй
          const f = (Math.max(0, t - t0) % 5000) / 5000;
          dot.setLatLng(pts[Math.floor(f * (pts.length - 1))]);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      map?.remove();
    };
  }, [spec]);

  return <div ref={el} className="map" role="img" aria-label={`Газрын зураг: ${cities.a.name} — ${cities.b.name}, ${km} км`} />;
}
