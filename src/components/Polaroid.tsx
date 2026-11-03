import { filterCss, moodOf } from "@/lib/content";
import type { Who } from "@/lib/types";
import Avatar from "./Avatar";

type Props = {
  who: Who;
  name: string;
  src?: string | null;
  filter?: string;
  mood?: string;
  caption?: string;
  meta?: string;
  reaction?: string | null;
  tilt?: number;
  size?: "sm" | "md";
  className?: string;
  children?: React.ReactNode;
};

/** Polaroid хэлбэрийн зурагтай карт (сервер ба клиент хоёуланд ашиглана) */
export default function Polaroid({ who, name, src, filter = "none", mood, caption, meta, reaction, tilt = 0, size = "md", className = "", children }: Props) {
  const mo = mood ? moodOf(mood) : null;
  return (
    <figure className={`polaroid ${size} ${className}`} style={{ "--tilt": `${tilt}deg` } as React.CSSProperties}>
      <span className="tape" aria-hidden="true" />
      <div className="ph">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={caption || `${name} — өдрийн мөч`} style={{ filter: filterCss(filter) }} />
        ) : (
          <div className="ph-empty" aria-hidden="true">
            {mo?.emoji}
          </div>
        )}
        {children}
      </div>
      {mo && (
        <span className="sticker" title={mo.label}>
          {mo.emoji}
        </span>
      )}
      {reaction && (
        <span className="react-sticker" title="Хайртын хариу">
          {reaction}
        </span>
      )}
      <figcaption>{caption || mo?.label || " "}</figcaption>
      <div className="pmeta">
        <Avatar who={who} name={name} size="sm" />
        <span>{name}</span>
        {meta && <span className="pmeta-time">{meta}</span>}
      </div>
    </figure>
  );
}
