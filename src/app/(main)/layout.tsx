import type { Metadata } from "next";
import { Suspense } from "react";
import Live from "@/components/Live";
import { parseBg } from "@/lib/backgrounds";
import { Heart } from "@/components/Brand";
import { BootLoader } from "@/components/Loader";
import Sidebar from "@/components/Sidebar";
import { getCtx } from "@/lib/ctx";
import { vapidPublicKey } from "@/lib/push";
import { dayKey, daysBetween, utcKey } from "@/lib/time";

// Хосын хувийн хуудсууд — хайлтын системд бүү гарга
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<BootLoader />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

// Нэвтрэлт шалгаж, цэс болон бодит цагийн синкийг байрлуулна
async function Shell({ children }: { children: React.ReactNode }) {
  const { s, me, partner, names, avatars, tz, db } = await getCtx();
  const unread = await db.letter.count({ where: { by: partner, openedAt: null } });
  // Профайл зураг байвал бүх .av-a / .av-b аватар дээр автоматаар харагдана
  const avatarCss = (["a", "b"] as const)
    .filter((w) => avatars[w])
    .map((w) => `.av-${w}{background:url(/avatars/${w}?v=${avatars[w]}) center/cover;color:transparent}`)
    .join("");
  // Хосын сонгосон өнгө (Тохиргоо → Арын өнгө) — :root дээр тавьснаар .app-аас гадуурх
  // toast, body зэрэг нь ч бүхэл theme-ийг дагана (globals.css → "Хосын өнгөөр будсан theme")
  const bg = parseBg(s.bg);
  const css = avatarCss + (bg ? `:root{--bg-1:${bg[0]};--bg-2:${bg[1]}}` : "");
  const together = s.startDate ? daysBetween(utcKey(s.startDate), dayKey(new Date(), tz)) : -1;

  return (
    <div className="app" data-tint={bg ? "" : undefined}>
      {css && <style>{css}</style>}
      <Sidebar names={names} me={me} unread={unread} />
      <main className="view">
        {children}
        {/* Хуудас бүрийн доор — хоёулангийн жижиг гарын үсэг */}
        <footer className="couple-foot">
          {names.a} <Heart size={12} /> {names.b}
          {together >= 0 && <span> · {together.toLocaleString("en-US")} хоног хамтдаа</span>}
        </footer>
      </main>
      <Live me={me} names={names} vapidKey={vapidPublicKey()} />
    </div>
  );
}
