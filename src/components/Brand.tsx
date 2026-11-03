// "Our cave" брэнд: зүрх, агуйн нүх доторх зүрх, бичгэн тэмдэг. Бүгд хосын theme-ийн өнгийг (--rose) дагана.

// favicon.ico, icon.svg, public/icons-ийн апп дүрстэй ижил зүрх
export const HEART = "M24 40.6c-1-.6-17.5-10.4-17.5-22.7 0-6 4.4-10.4 9.9-10.4 3.4 0 6 1.7 7.6 4.4 1.6-2.7 4.2-4.4 7.6-4.4 5.5 0 9.9 4.4 9.9 10.4 0 12.3-16.5 22.1-17.5 22.7Z";
const SHINE = "M12.2 16.6c.3-2.6 2.2-4.4 4.6-4.6";

/** Бөндгөр дүүрэн зүрх — текст дотор, тэмдэг дээр */
export function Heart({ size = 14, shine = false, className = "" }: { size?: number; shine?: boolean; className?: string }) {
  return (
    <svg className={`heart ${className}`} width={size} height={size} viewBox="6 7 36 34.5" aria-hidden="true">
      <path d={HEART} fill="var(--rose)" />
      {shine && <path d={SHINE} fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2.6" strokeLinecap="round" />}
    </svg>
  );
}

/** Агуйн нүх (гараар зурсан мэт тэгш бус нуман хаалга), дотор нь зүрх — "манай гэр" */
export function CaveMark({ size = 40, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg className={`cave-mark${animated ? " anim" : ""}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M7 41.5c-.3-6.6.2-12 2.3-16.6C12.3 17.6 17.4 9.2 24.6 9.2c7.3 0 12.4 7.4 15 14.6 1.8 5.2 2 10.8 1.6 17.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path d="M3.5 41.5h41" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path className="cave-spark" d="M38.5 3.8c.4 2.2 1.1 2.9 3.3 3.3-2.2.4-2.9 1.1-3.3 3.3-.4-2.2-1.1-2.9-3.3-3.3 2.2-.4 2.9-1.1 3.3-3.3Z" fill="var(--rose)" />
      <g className="cave-heart">
        <path d={HEART} transform="translate(14.9 19.6) scale(.38)" fill="var(--rose)" />
      </g>
    </svg>
  );
}

/** OUR♥CAVE — сайтын нэрийн бичгэн тэмдэг */
export function Wordmark({ size = 17, mark = true, animated = false }: { size?: number; mark?: boolean; animated?: boolean }) {
  return (
    <span className="wordmark" style={{ fontSize: size }}>
      {mark && <CaveMark size={Math.round(size * 1.9)} animated={animated} />}
      <span className="wm-text" aria-label="Our cave">
        OUR
        <Heart size={Math.round(size * 0.62)} className="wm-heart" />
        CAVE
      </span>
    </span>
  );
}
