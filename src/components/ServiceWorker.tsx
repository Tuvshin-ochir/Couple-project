"use client";

import { useEffect } from "react";

/** Push мэдэгдэл хүлээн авах service worker-ийг бүртгэнэ (production болон localhost дээр) */
export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // хуучин браузер эсвэл private горим — мэдэгдэлгүйгээр ажиллана
    });
  }, []);
  return null;
}
