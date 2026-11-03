"use client";

import { useTransition } from "react";
import { logout, removePushSubscription } from "@/app/actions";

/** Гарахаас өмнө энэ төхөөрөмжийн push бүртгэлийг цуцална — гарсан утсанд хосын мэдэгдэл очихгүй */
export default function LogoutButton({ className, label, children }: { className: string; label?: string; children: React.ReactNode }) {
  const [pending, start] = useTransition();

  const leave = () =>
    start(async () => {
      try {
        const reg = await navigator.serviceWorker?.getRegistration("/");
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          await removePushSubscription(sub.endpoint);
          await sub.unsubscribe();
        }
      } catch {
        // мэдэгдэлгүй төхөөрөмж — шууд гарна
      }
      await logout();
    });

  return (
    <button type="button" className={className} onClick={leave} disabled={pending} aria-label={label} title={label}>
      {children}
    </button>
  );
}
