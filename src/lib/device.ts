// Хэрэглэгчийн төхөөрөмж, браузерыг таньж апп суулгах зааврыг тохируулна (зөвхөн клиент дээр)

export type Device =
  | { kind: "ios"; browser: "safari" | "chrome" | "other"; ipad: boolean; version: number }
  | { kind: "inapp"; app: string; ios: boolean }
  | { kind: "android"; browser: "chrome" | "samsung" | "firefox" | "other" }
  | { kind: "desktop"; browser: "chrome" | "edge" | "safari" | "firefox" | "other" };

// Messenger, Instagram г.м апп доторх браузер — эндээс нүүр дэлгэцэнд нэмэх боломжгүй
const IN_APP: [RegExp, string][] = [
  [/messenger/i, "Messenger"],
  [/instagram/i, "Instagram"],
  [/FBAN|FBAV|FB_IAB|FBIOS/, "Facebook"],
  [/musical_ly|tiktok|BytedanceWebview/i, "TikTok"],
  [/Line\//, "LINE"],
  [/KAKAOTALK/i, "KakaoTalk"],
  [/Snapchat/i, "Snapchat"],
  [/Twitter/i, "X"],
];

export function detectDevice(): Device {
  const ua = navigator.userAgent;
  // iPadOS 13+ компьютерийн Safari шиг танигдана — мэдрэгч дэлгэцээр нь ялгана
  const ipad = /iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const ios = ipad || /iPhone|iPod/.test(ua);

  const app = IN_APP.find(([re]) => re.test(ua));
  if (app) return { kind: "inapp", app: app[1], ios };

  if (ios) {
    const [, major = "0", minor = "0"] = ua.match(/OS (\d+)_(\d+)/) ?? ua.match(/Version\/(\d+)\.(\d+)/) ?? [];
    const version = Number(`${major}.${minor}`);
    const browser = /CriOS/.test(ua) ? "chrome" : /FxiOS|EdgiOS|OPiOS|OPT\//.test(ua) ? "other" : /Safari\//.test(ua) ? "safari" : "other";
    return { kind: "ios", browser, ipad, version };
  }

  if (/Android/.test(ua)) {
    const browser = /SamsungBrowser/.test(ua) ? "samsung" : /Firefox/.test(ua) ? "firefox" : /EdgA|OPR|YaBrowser/.test(ua) ? "other" : /Chrome/.test(ua) ? "chrome" : "other";
    return { kind: "android", browser };
  }

  const browser = /Edg\//.test(ua) ? "edge" : /OPR|YaBrowser/.test(ua) ? "other" : /Chrome/.test(ua) ? "chrome" : /Firefox/.test(ua) ? "firefox" : /Safari/.test(ua) ? "safari" : "other";
  return { kind: "desktop", browser };
}

export const isStandalone = () =>
  matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
