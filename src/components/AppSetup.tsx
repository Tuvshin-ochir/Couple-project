"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { removePushSubscription, sendTestPush } from "@/app/actions";
import { toast } from "@/lib/fx";
import { detectDevice, isStandalone, type Device } from "@/lib/device";
import { ensurePushSubscription, PUSH_OFF_KEY } from "@/lib/push-client";
import Icon from "./Icon";
import InstallGuide from "./InstallGuide";

type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };
type Status = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

const DISMISS_KEY = "bh_push_dismissed";

/**
 * Утсанд апп шиг суулгах + push мэдэгдэл асаах.
 * variant="card" — нүүр хуудсанд жижиг санал (асаагаагүй үед л), "full" — тохиргооны хэсэг.
 */
export default function AppSetup({ vapidKey, variant = "full" }: { vapidKey: string; variant?: "card" | "full" }) {
  const [status, setStatus] = useState<Status>("loading");
  const [standalone, setStandalone] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [device, setDevice] = useState<Device | null>(null);
  const [guide, setGuide] = useState(false);
  const [pending, start] = useTransition();
  const closeGuide = useCallback(() => setGuide(false), []);

  useEffect(() => {
    let alive = true;
    const onInstallable = (e: Event) => {
      e.preventDefault(); // өөрсдийн товчоор санал болгоно
      setInstallEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onInstallable);

    const detect = async () => {
      const d = detectDevice();
      let next: Status;
      // iPhone дээр push зөвхөн нүүр дэлгэцэнд нэмсэн апп дотор ажилладаг
      if ((d.kind === "ios" || (d.kind === "inapp" && d.ios)) && !isStandalone()) next = "ios-install";
      else if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window) || !vapidKey)
        next = "unsupported";
      else if (Notification.permission === "denied") next = "denied";
      else {
        const reg = await navigator.serviceWorker.getRegistration("/");
        const sub = await reg?.pushManager.getSubscription();
        next = sub && Notification.permission === "granted" ? "on" : "off";
      }
      let gone = false;
      try {
        gone = localStorage.getItem(DISMISS_KEY) === "1";
      } catch {}
      if (!alive) return;
      setStandalone(isStandalone());
      setDevice(d);
      setStatus(next);
      setDismissed(gone);
    };
    const t = setTimeout(detect, 0);
    return () => {
      alive = false;
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onInstallable);
    };
  }, [vapidKey]);

  const enable = () =>
    start(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus(permission === "denied" ? "denied" : "off");
          return;
        }
        await ensurePushSubscription(vapidKey);
        try {
          localStorage.removeItem(PUSH_OFF_KEY);
        } catch {}
        setStatus("on");
        toast("Мэдэгдэл асаалаа 💞 — хайрт чинь юм хийвэл утсанд чинь очно");
      } catch {
        toast("Мэдэгдэл асааж чадсангүй. Дахин оролдоно уу.", "error");
      }
    });

  const disable = () =>
    start(async () => {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      try {
        localStorage.setItem(PUSH_OFF_KEY, "1");
      } catch {}
      setStatus("off");
      toast("Мэдэгдэл унтарлаа");
    });

  const test = () =>
    start(async () => {
      await sendTestPush();
      toast("Туршилтын мэдэгдэл илгээлээ");
    });

  // Браузер өөрөө суулгах цонх гаргаж чадвал (Android/компьютерийн Chrome, Edge) түүнийг,
  // чадахгүй бол (iPhone, Samsung, апп доторх браузер г.м) төхөөрөмжид тохирсон зааврыг нээнэ
  const install = async () => {
    if (!installEvent) {
      setGuide(true);
      return;
    }
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };
  const canInstall = !standalone && device !== null;
  const mobileInstall = canInstall && device.kind !== "desktop";
  const guideEl = guide && device && <InstallGuide device={device} onClose={closeGuide} />;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  // ── Нүүр хуудасны жижиг санал ──
  if (variant === "card") {
    if (dismissed || !(status === "off" || status === "ios-install" || mobileInstall)) return null;
    const installFirst = status !== "off";
    return (
      <section className="card c12 setup-card">
        <span className="setup-ico" aria-hidden="true">
          <Icon name={installFirst ? "phone" : "bell"} size={22} />
        </span>
        <div className="setup-text">
          {installFirst ? (
            <>
              <b>Утсандаа апп болгож суулгаарай</b>
              <span className="small muted">Нүүр дэлгэцээсээ шууд нээгдэж, хайрт чинь санахад утсанд чинь мэдэгдэл очно.</span>
            </>
          ) : (
            <>
              <b>Утсандаа мэдэгдэл авах уу?</b>
              <span className="small muted">Хайрт чинь санах, зурвас бичих, мөчөө хуваалцах бүрт мэдэгдэнэ.</span>
            </>
          )}
        </div>
        <div className="setup-actions">
          {status === "off" && (
            <button className="btn sm" onClick={enable} disabled={pending}>
              Асаах
            </button>
          )}
          {canInstall && (
            <button className={`btn sm${installFirst ? "" : " line"}`} onClick={install}>
              Апп болгох
            </button>
          )}
          <button className="btn line sm" onClick={dismiss}>
            Дараа
          </button>
        </div>
        {guideEl}
      </section>
    );
  }

  // ── Тохиргооны хэсэг ──
  return (
    <section className="card app-setup">
      <h2>
        <Icon name="phone" size={18} /> Апп ба мэдэгдэл
      </h2>
      <div className="setup-row">
        <div>
          <b>Утсанд суулгах</b>
          <div className="small muted">
            {standalone
              ? "Апп хэлбэрээр нээгдсэн байна ✓"
              : "Нүүр дэлгэцэнд нэмбэл апп шиг, браузерын мөргүй нээгдэнэ."}
          </div>
        </div>
        {canInstall && (
          <button className="btn sm" onClick={install}>
            Апп болгох
          </button>
        )}
      </div>

      <div className="setup-row">
        <div>
          <b>Утасны мэдэгдэл</b>
          <div className="small muted">
            {status === "on" && "Асаалттай — хайрт чинь юм хийвэл энэ төхөөрөмж рүү мэдэгдэл очно."}
            {status === "off" && "Хайрт чинь санах, зурвас бичих, мөчөө хуваалцах бүрт мэдэгдэнэ."}
            {status === "denied" && "Зөвшөөрөл хаалттай. Утас/браузерын тохиргооноос энэ сайтын мэдэгдлийг зөвшөөрнө үү."}
            {status === "ios-install" && "iPhone дээр эхлээд нүүр дэлгэцэнд нэмсэн байх шаардлагатай."}
            {status === "unsupported" && "Энэ браузер push мэдэгдэл дэмжихгүй байна."}
            {status === "loading" && "Шалгаж байна…"}
          </div>
        </div>
        {status === "off" && (
          <button className="btn sm" onClick={enable} disabled={pending}>
            Асаах
          </button>
        )}
        {status === "ios-install" && (
          <button className="btn line sm" onClick={() => setGuide(true)}>
            Заавар
          </button>
        )}
        {status === "on" && (
          <div className="row">
            <button className="btn line sm" onClick={test} disabled={pending}>
              Турших
            </button>
            <button className="btn line sm" onClick={disable} disabled={pending}>
              Унтраах
            </button>
          </div>
        )}
      </div>
      {guideEl}
    </section>
  );
}
