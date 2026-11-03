import Link from "next/link";

export function PageHead({ emoji, title, sub }: { emoji: string; title: string; sub?: string }) {
  return (
    <header className="page-head">
      <span className="page-ico" aria-hidden="true">
        {emoji}
      </span>
      <div>
        <h1>{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
    </header>
  );
}

export function Empty({ emoji, children }: { emoji: string; children: React.ReactNode }) {
  return (
    <div className="empty">
      <div className="big" aria-hidden="true">
        {emoji}
      </div>
      <p>{children}</p>
    </div>
  );
}

/** Хуудасны таб — URL-ийн query параметрээр солигдоно */
export function Tabs({
  items,
  current,
  href,
}: {
  items: readonly (readonly [string, React.ReactNode])[];
  current: string;
  href: (key: string) => string;
}) {
  return (
    <nav className="tabs">
      {items.map(([key, label]) => (
        <Link key={key} href={href(key)} className={`tab${key === current ? " on" : ""}`} scroll={false}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
