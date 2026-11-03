import { Suspense } from "react";
import Live from "@/components/Live";
import Sidebar from "@/components/Sidebar";
import { getCtx } from "@/lib/ctx";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="loading">
          <span className="pulse-heart">💞</span>
        </div>
      }
    >
      <Shell>{children}</Shell>
    </Suspense>
  );
}

// Нэвтрэлт шалгаж, цэс болон бодит цагийн синкийг байрлуулна
async function Shell({ children }: { children: React.ReactNode }) {
  const { me, partner, names, avatars, db } = await getCtx();
  const unread = await db.letter.count({ where: { by: partner, openedAt: null } });
  // Профайл зураг байвал бүх .av-a / .av-b аватар дээр автоматаар харагдана
  const avatarCss = (["a", "b"] as const)
    .filter((w) => avatars[w])
    .map((w) => `.av-${w}{background:url(/avatars/${w}?v=${avatars[w]}) center/cover;color:transparent}`)
    .join("");

  return (
    <div className="app">
      {avatarCss && <style>{avatarCss}</style>}
      <Sidebar names={names} me={me} unread={unread} />
      <main className="view">{children}</main>
      <Live me={me} names={names} />
    </div>
  );
}
