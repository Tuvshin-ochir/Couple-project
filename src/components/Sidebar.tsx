"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/actions";
import type { Names, Who } from "@/lib/types";
import Avatar from "./Avatar";
import Icon, { type IconName } from "./Icon";
import MissButton from "./MissButton";

type Item = readonly [href: string, icon: IconName, label: string];

const GROUPS: { label?: string; items: Item[] }[] = [
  {
    items: [
      ["/", "home", "Нүүр"],
      ["/moment", "camera", "Өдрийн мөч"],
    ],
  },
  {
    label: "Хамтдаа",
    items: [
      ["/notes", "mail", "Захидал"],
      ["/dates", "video", "Болзоо"],
      ["/games", "dice", "Тоглоом"],
    ],
  },
  {
    label: "Бидний түүх",
    items: [
      ["/memories", "image", "Дурсамж"],
      ["/bucket", "sparkles", "Мөрөөдөл"],
      ["/days", "calendar", "Чухал өдрүүд"],
      ["/lists", "list", "Жагсаалт"],
    ],
  },
  {
    label: "Хоёулхнаа",
    items: [["/vault", "lock", "Нууц өрөө"]],
  },
];

// Утасны доод цэс — голд нь камер
const TABS: Item[] = [
  ["/", "home", "Нүүр"],
  ["/notes", "mail", "Захидал"],
  ["/moment", "camera", "Мөч"],
  ["/games", "dice", "Тоглоом"],
];

const MORE: Item[] = [
  ["/memories", "image", "Дурсамж"],
  ["/dates", "video", "Болзоо"],
  ["/bucket", "sparkles", "Мөрөөдөл"],
  ["/days", "calendar", "Чухал өдрүүд"],
  ["/lists", "list", "Жагсаалт"],
  ["/vault", "lock", "Нууц өрөө"],
  ["/settings", "settings", "Тохиргоо"],
];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export default function Sidebar({ names, me, unread }: { names: Names; me: Who; unread: number }) {
  const path = usePathname();
  const [sheet, setSheet] = useState(false);
  const close = () => setSheet(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const badge = (href: string) =>
    href === "/notes" && unread > 0 ? <span className="badge">{unread}</span> : null;

  const couple = (
    <span className="couple-mark" aria-hidden="true">
      <Avatar who="a" name={names.a} size="sm" />
      <Avatar who="b" name={names.b} size="sm" />
    </span>
  );

  return (
    <>
      {/* ── Компьютер: хажуугийн цэс ── */}
      <aside className="sidebar">
        <Link href="/" className="brand">
          {couple}
          <span className="brand-name">
            {names.a} <em>&</em> {names.b}
          </span>
        </Link>
        <nav className="nav" aria-label="Үндсэн цэс">
          {GROUPS.map((g, i) => (
            <div key={i} className="nav-group">
              {g.label && <div className="nav-label">{g.label}</div>}
              {g.items.map(([href, icon, label]) => (
                <Link key={href} href={href} className={isActive(path, href) ? "active" : undefined}>
                  <Icon name={icon} />
                  <span className="grow">{label}</span>
                  {badge(href)}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <MissButton variant="pill" />
          <div className="me-row">
            <Avatar who={me} name={names[me]} size="sm" />
            <span className="grow">{names[me]}</span>
            <Link href="/settings" className={`icon-btn${isActive(path, "/settings") ? " on" : ""}`} aria-label="Тохиргоо" title="Тохиргоо">
              <Icon name="settings" size={18} />
            </Link>
            <form action={logout}>
              <button className="icon-btn" aria-label="Гарах" title="Гарах">
                <Icon name="logout" size={18} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Утас: дээд мөр ── */}
      <header className="topbar">
        <Link href="/" className="brand" onClick={close}>
          {couple}
          <span className="brand-name">
            {names.a} <em>&</em> {names.b}
          </span>
        </Link>
        <MissButton variant="icon" />
      </header>

      {/* ── Утас: доод таб ── */}
      <nav className="tabbar" aria-label="Үндсэн цэс">
        {TABS.map(([href, icon, label]) => (
          <Link
            key={href}
            href={href}
            onClick={close}
            className={`${href === "/moment" ? "tab-cam" : ""}${isActive(path, href) && !sheet ? " active" : ""}`}
          >
            <span className="tab-ico">
              <Icon name={icon} size={href === "/moment" ? 24 : 22} />
              {badge(href)}
            </span>
            <span>{label}</span>
          </Link>
        ))}
        <button
          className={MORE.some(([h]) => isActive(path, h)) || sheet ? "active" : undefined}
          onClick={() => setSheet((v) => !v)}
          aria-expanded={sheet}
        >
          <span className="tab-ico">
            <Icon name="grid" size={22} />
          </span>
          <span>Бусад</span>
        </button>
      </nav>

      <div className={`scrim${sheet ? " on" : ""}`} onClick={close} />
      <div className={`sheet${sheet ? " open" : ""}`} role="dialog" aria-label="Бусад хуудсууд" aria-hidden={!sheet}>
        <div className="sheet-grip" />
        <div className="sheet-grid">
          {MORE.map(([href, icon, label]) => (
            <Link key={href} href={href} onClick={close} className={isActive(path, href) ? "active" : undefined} tabIndex={sheet ? 0 : -1}>
              <span className="tile-ico">
                <Icon name={icon} size={22} />
              </span>
              {label}
            </Link>
          ))}
        </div>
        <div className="me-row">
          <Avatar who={me} name={names[me]} size="sm" />
          <span className="grow">{names[me]}</span>
          <form action={logout}>
            <button className="btn line sm" tabIndex={sheet ? 0 : -1}>
              <Icon name="logout" size={16} /> Гарах
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
