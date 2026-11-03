import type { Metadata, Viewport } from "next";
import { Bad_Script, Onest, Prata } from "next/font/google";
import ServiceWorker from "@/components/ServiceWorker";
import Toaster from "@/components/Toaster";
import { og, SITE_DESC, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Гарчиг — нарийн, романтик дидон сериф (Ө, Ү үсэгтэй, ганц жинтэй)
const prata = Prata({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: "400",
  variable: "--font-serif",
});

// Үндсэн текст — кириллд зориулсан орчин үеийн гротеск
const onest = Onest({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

// Гар бичмэл — polaroid тайлбар, зурвас
const badScript = Bad_Script({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: "400",
  variable: "--font-hand",
});

// favicon.ico, icon.svg, apple-icon.png нь app/ дотроосоо автоматаар холбогдоно (энд icons
// бичвэл icon.svg-ийг дарчихна). og:image нь og()-д — хуудас openGraph-аа дарж бичсэн ч алга болохгүй
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  // iPhone дээр нүүр дэлгэцэнд нэмэхэд апп шиг (браузерын мөргүй) нээгдэнэ
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  formatDetection: { telephone: false },
  // Messenger, Telegram г.м-д холбоос хуваалцахад гарах карт
  openGraph: og(SITE_NAME, SITE_DESC),
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f2ec" },
    { media: "(prefers-color-scheme: dark)", color: "#12110f" },
  ],
  viewportFit: "cover",
};

// Хадгалсан өнгийг (гэрэл/харанхуй) зурагдахаас өмнө тохируулна
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mn" className={`${prata.variable} ${onest.variable} ${badScript.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Toaster />
        <ServiceWorker />
      </body>
    </html>
  );
}
