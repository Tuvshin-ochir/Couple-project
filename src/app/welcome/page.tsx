import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Бид хоёр — алсын зайн хосуудын орон зай",
  description: "Өдрийн мөч, нээх захидал, хоёрын цаг, тоглоом, онлайн болзоо — хаана ч байсан хамтдаа.",
};

const FEATURES = [
  ["📸", "Өдрийн мөч", "Өдөр бүр нэг зураг, нэг сэтгэл. Хоёулаа хуваалцсаны дараа л бие биенийхээ мөчийг харна."],
  ["💌", "Нээх захидал", "\"Намайг санасан үедээ нээгээрэй\" — хайрт чинь нээх хүртэл битүүмжтэй байна."],
  ["🕰️", "Хоёрын цаг", "Хоёр хотын цаг, зай, ярихад тохиромжтой цаг, дараагийн уулзалт хүртэлх тоолуур."],
  ["🎲", "300+ асуулт", "Өдрийн асуулт, \"Аль нь дээр вэ?\", \"Хэн нь илүү?\", бие биенээ хэр мэдэх вэ."],
  ["🎬", "Онлайн болзоо", "Болзооны санаа, кино, дуугаа яг зэрэг асаах тоолуур."],
  ["🔒", "Нууц өрөө", "Тусдаа PIN-тэй 18+ орон зай: нэг удаа харах зураг, халуун карт, хүслийн тохирол."],
] as const;

export default function WelcomePage() {
  return (
    <main className="welcome">
      <section className="welcome-hero">
        <div className="welcome-text">
          <p className="welcome-eyebrow">💞 Бид хоёр</p>
          <h1>
            Хаана ч байсан <em>хамтдаа</em>
          </h1>
          <p className="welcome-sub">
            Алсын зайн хосуудад зориулсан жижигхэн гэр — зурвас, зураг, дурсамж, тоглоомоо нэг дор.
          </p>
          <div className="row">
            <Link href="/signup" className="btn welcome-cta">
              Хосоо бүртгүүлэх
            </Link>
            <Link href="/login" className="btn line welcome-login">
              Нэвтрэх
            </Link>
          </div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <figure className="polaroid sm" style={{ "--tilt": "-6deg" } as React.CSSProperties}>
            <span className="tape" />
            <div className="ph welcome-ph a">☕</div>
            <figcaption>Өглөөний кофе чамгүйгээр…</figcaption>
          </figure>
          <figure className="polaroid sm" style={{ "--tilt": "5deg" } as React.CSSProperties}>
            <span className="tape" />
            <div className="ph welcome-ph b">🌙</div>
            <figcaption>Чамайг санаж байна 💗</figcaption>
          </figure>
        </div>
      </section>

      <section className="welcome-features">
        {FEATURES.map(([emoji, title, text]) => (
          <article key={title} className="welcome-feature">
            <span className="welcome-ico">{emoji}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="welcome-steps">
        <h2>Хэрхэн эхлэх вэ?</h2>
        <ol>
          <li>
            <b>Хосоо бүртгүүл</b>
            <span>Хоёулангийн нэр, хосын нэр, нууц үг — нэг минут.</span>
          </li>
          <li>
            <b>Хайртдаа холбоос илгээ</b>
            <span>Урилгын холбоосоор орж, өөрийгөө сонгоод нэвтэрнэ.</span>
          </li>
          <li>
            <b>Өдөр бүр хамтдаа</b>
            <span>Мөч хуваалцаж, захидал бичиж, тоглоорой.</span>
          </li>
        </ol>
        <Link href="/signup" className="btn">
          Одоо эхлэх 💞
        </Link>
        <p className="small muted">Таны бүх зурвас, зураг зөвхөн та хоёрт л харагдана.</p>
      </section>
    </main>
  );
}
