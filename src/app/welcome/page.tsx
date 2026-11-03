import type { Metadata } from "next";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { Wordmark } from "@/components/Brand";
import { og } from "@/lib/site";

export const metadata: Metadata = {
  // absolute — эс бөгөөс загвар "%s · Our cave" нэрийг давхар бичнэ
  title: { absolute: "Our cave — алсын зайн хосуудын орон зай" },
  description: "Өдрийн мөч, нээх захидал, хоёрын цаг, тоглоом, онлайн болзоо — хаана ч байсан хамтдаа.",
  openGraph: og("Our cave — хаана ч байсан хамтдаа", "Өдрийн мөч, нээх захидал, хоёрын цаг, тоглоом, онлайн болзоо — алсын зайн хосуудын хамтын орон зай."),
};

const FEATURES: [IconName, string, string][] = [
  ["camera", "Өдрийн мөч", "Өдөр бүр нэг зураг, нэг сэтгэл. Хоёулаа хуваалцсаны дараа л бие биенийхээ мөчийг харна."],
  ["mail", "Нээх захидал", "\"Намайг санасан үедээ нээгээрэй\" — хайрт чинь нээх хүртэл битүүмжтэй байна."],
  ["map", "Хоёрын цаг, зай", "Хоёр хотын цаг, зай, ярихад тохиромжтой цаг, дараагийн уулзалт хүртэлх тоолуур."],
  ["dice", "300+ асуулт", "Өдрийн асуулт, \"Аль нь дээр вэ?\", \"Хэн нь илүү?\", бие биенээ хэр мэдэх вэ."],
  ["music", "Our taste", "Хамтын playlist — YouTube-ээс дууг нэрээр нь хайж нэмээд, сайт дотроо сонсоно."],
  ["lock", "Нууц өрөө", "Тусдаа PIN-тэй 18+ орон зай: нэг удаа харах зураг, халуун карт, хүслийн тохирол."],
];

export default function WelcomePage() {
  return (
    <main className="welcome">
      <section className="welcome-hero">
        <div className="welcome-text">
          <p className="welcome-eyebrow">
            <Wordmark size={14} />
          </p>
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
            <div className="ph welcome-ph a">
              <span>08:12 · Улаанбаатар</span>
            </div>
            <figcaption>Өглөөний кофе чамгүйгээр…</figcaption>
          </figure>
          <figure className="polaroid sm" style={{ "--tilt": "5deg" } as React.CSSProperties}>
            <span className="tape" />
            <div className="ph welcome-ph b">
              <span>01:12 · Берлин</span>
            </div>
            <figcaption>Чамайг санаж байна</figcaption>
          </figure>
        </div>
      </section>

      <section className="welcome-features">
        {FEATURES.map(([icon, title, text]) => (
          <article key={title} className="welcome-feature">
            <span className="welcome-ico">
              <Icon name={icon} size={24} />
            </span>
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
          Одоо эхлэх
        </Link>
        <p className="small muted">Таны бүх зурвас, зураг зөвхөн та хоёрт л харагдана.</p>
      </section>
    </main>
  );
}
