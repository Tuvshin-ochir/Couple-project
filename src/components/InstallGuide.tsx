"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Device } from "@/lib/device";
import { toast } from "@/lib/fx";
import { SITE_NAME } from "@/lib/site";
import Icon, { type IconName } from "./Icon";

type Step = [icon: IconName, text: React.ReactNode];
type Guide = {
  where: string;
  steps: Step[];
  // Браузерын товч хаана байгааг заах сум (мэдэхгүй бол байхгүй)
  arrow?: "bottom" | "top-right" | "bottom-right";
  warn?: React.ReactNode;
  copyLink?: boolean;
};

const OPEN: Step = [
  "heart",
  <>
    Нүүр дэлгэцэн дээрх <b>{SITE_NAME}</b> дүрсээр ороод <b>Мэдэгдэл асаах</b> дар — утас чинь зөвшөөрөл асууна, <b>Allow</b> гэж хариулаарай
  </>,
];

/** Төхөөрөмж, браузер бүрт тохирсон алхмууд */
function guideFor(d: Device): Guide {
  if (d.kind === "inapp")
    return {
      where: `${d.app} доторх браузер`,
      arrow: "top-right",
      copyLink: true,
      steps: [
        ["more", <>Дээд (заримдаа доод) буланд байгаа <b>•••</b> товчийг дар</>],
        ["link", <>{d.ios ? <><b>Safari-д нээх</b> (Open in Safari)</> : <><b>Браузерт нээх</b> (Open in browser)</>} гэснийг сонго</>],
        ["phone", <>Тэнд нээгдсэн сайтаас <b>Апп болгох</b>-ыг дахин дар — тухайн утсанд тохирсон заавар гарна</>],
      ],
      warn: <>{d.app} доторх браузераас нүүр дэлгэцэнд нэмэх боломжгүй. Товч олдохгүй бол холбоосоо хуулаад {d.ios ? "Safari" : "Chrome"}-д буулгаарай.</>,
    };

  if (d.kind === "ios") {
    const warn =
      d.version > 0 && d.version < 16.4 ? (
        <>Таны iOS {d.version} байна. Мэдэгдэл авахын тулд <b>16.4</b>-өөс шинэ хувилбар хэрэгтэй: Settings → General → Software Update.</>
      ) : undefined;
    if (d.browser === "safari")
      return {
        where: d.ipad ? "iPad · Safari" : "iPhone · Safari",
        arrow: d.ipad ? "top-right" : "bottom",
        warn,
        steps: [
          ["share", <>{d.ipad ? "Дээд мөрний баруун талд" : "Доод мөрөнд"} байгаа <b>Хуваалцах</b> товчийг дар. Харагдахгүй бол эхлээд <b>•••</b> товч → <b>Хуваалцах</b> (Share)</>],
          ["addbox", <>Жагсаалтыг доош гүйлгээд <b>Нүүр дэлгэцэнд нэмэх</b> (Add to Home Screen)-ийг сонго</>],
          ["check", <><b>Open as Web App</b> асаалттай байгааг шалгаад баруун дээд талын <b>Нэмэх</b> (Add) дар</>],
          OPEN,
        ],
      };
    if (d.browser === "chrome")
      return {
        where: d.ipad ? "iPad · Chrome" : "iPhone · Chrome",
        arrow: "top-right",
        warn,
        steps: [
          ["share", <>Хаягийн мөрний баруун талын <b>Хуваалцах</b> товчийг дар</>],
          ["addbox", <><b>Нүүр дэлгэцэнд нэмэх</b> (Add to Home Screen)-ийг сонго</>],
          ["check", <><b>Нэмэх</b> (Add) дар</>],
          OPEN,
        ],
      };
    return {
      where: d.ipad ? "iPad" : "iPhone",
      warn: warn ?? <>Энэ браузерт алхмууд өөр байж болно — хамгийн найдвартай нь <b>Safari</b>.</>,
      copyLink: true,
      steps: [
        ["more", <>Браузерын цэс (<b>☰</b> эсвэл <b>•••</b>) → <b>Хуваалцах</b> (Share)</>],
        ["addbox", <><b>Нүүр дэлгэцэнд нэмэх</b> (Add to Home Screen) → <b>Нэмэх</b></>],
        OPEN,
      ],
    };
  }

  if (d.kind === "android") {
    if (d.browser === "samsung")
      return {
        where: "Android · Samsung Internet",
        arrow: "bottom-right",
        steps: [
          ["list", <>Доод мөрний баруун талын <b>☰</b> цэсийг дар</>],
          ["addbox", <><b>Хуудас нэмэх</b> (Add page to) → <b>Нүүр дэлгэц</b> (Home screen)</>],
          ["check", <><b>Нэмэх</b> (Add) дар</>],
          OPEN,
        ],
      };
    return {
      where: d.browser === "firefox" ? "Android · Firefox" : d.browser === "chrome" ? "Android · Chrome" : "Android",
      arrow: d.browser === "chrome" ? "top-right" : undefined,
      steps: [
        ["dots", <>{d.browser === "chrome" ? "Баруун дээд буланд" : "Браузерын"} <b>⋮</b> цэсийг дар</>],
        ["addbox", <><b>Апп суулгах</b> (Install app) эсвэл <b>Нүүр дэлгэцэнд нэмэх</b> (Add to Home screen)-ийг сонго</>],
        ["check", <><b>Суулгах</b> (Install) дар</>],
        OPEN,
      ],
    };
  }

  // Компьютер
  if (d.browser === "chrome" || d.browser === "edge")
    return {
      where: d.browser === "edge" ? "Компьютер · Edge" : "Компьютер · Chrome",
      arrow: "top-right",
      steps: [
        ["install", <>Хаягийн мөрний баруун талын <b>суулгах</b> дүрс дээр дар</>],
        [
          "dots",
          d.browser === "edge" ? (
            <>Харагдахгүй бол <b>•••</b> цэс → <b>Apps</b> → <b>Install this site as an app</b></>
          ) : (
            <>Харагдахгүй бол <b>⋮</b> цэс → <b>Cast, save, and share</b> → <b>Install page as app</b></>
          ),
        ],
        ["check", <><b>Install</b> дар — {SITE_NAME} тусдаа цонхонд, апп шиг нээгдэнэ</>],
      ],
    };
  if (d.browser === "safari")
    return {
      where: "Mac · Safari",
      steps: [
        ["share", <>Цэсний мөрнөөс <b>File</b> → <b>Add to Dock</b> (эсвэл хэрэгслийн мөрний <b>Хуваалцах</b> → <b>Add to Dock</b>)</>],
        ["check", <><b>Add</b> дар — Dock-оос апп шиг нээгдэнэ</>],
      ],
      warn: <>macOS Sonoma (14)-өөс хойшхи хувилбарт ажиллана.</>,
    };
  return {
    where: d.browser === "firefox" ? "Компьютер · Firefox" : "Компьютер",
    copyLink: true,
    steps: [
      ["install", <>Энэ холбоосыг <b>Chrome</b> эсвэл <b>Edge</b>-ээр нээ</>],
      ["check", <>Хаягийн мөрний <b>суулгах</b> дүрс → <b>Install</b></>],
      ["phone", <>Эсвэл утсаараа энэ сайтыг нээгээд <b>Апп болгох</b>-ыг дар</>],
    ],
    warn: d.browser === "firefox" ? <>Firefox компьютер дээр сайтыг апп болгож суулгахыг дэмждэггүй.</> : undefined,
  };
}

/** Апп суулгах алхам алхмаар заавар — төхөөрөмжөөсөө хамаарч өөр */
export default function InstallGuide({ device, onClose }: { device: Device; onClose: () => void }) {
  const g = guideFor(device);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      toast("Холбоос хуулагдлаа");
    } catch {
      window.prompt("Холбоосыг хуулна уу:", window.location.origin);
    }
  };

  return createPortal(
    <div className={`ig-scrim${g.arrow ? ` to-${g.arrow}` : ""}`} onClick={onClose}>
      <div className="ig-sheet" role="dialog" aria-modal="true" aria-labelledby="ig-title" onClick={(e) => e.stopPropagation()}>
        <div className="ig-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ig-app" src="/icons/icon-192.png" alt="" width={52} height={52} />
          <div className="grow">
            <h2 id="ig-title">Апп болгож суулгах</h2>
            <p className="small muted">{g.where} · {g.steps.length} алхам</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Хаах">
            <Icon name="x" size={18} />
          </button>
        </div>
        {g.warn && <p className="ig-warn">{g.warn}</p>}
        <ol className="ig-steps">
          {g.steps.map(([icon, text], i) => (
            <li key={i}>
              <span className="ig-ico" aria-hidden="true">
                <Icon name={icon} size={20} />
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        <div className="ig-actions">
          {g.copyLink && (
            <button type="button" className="btn line" onClick={copy}>
              <Icon name="link" size={16} /> Холбоос хуулах
            </button>
          )}
          <button type="button" className="btn" onClick={onClose}>
            Ойлголоо
          </button>
        </div>
      </div>
      {g.arrow && (
        <span className={`ig-arrow ${g.arrow}`} aria-hidden="true">
          <Icon name="down" size={30} />
        </span>
      )}
    </div>,
    document.body,
  );
}
