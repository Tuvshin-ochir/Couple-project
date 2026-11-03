import type { Metadata, Viewport } from "next";
import { Bad_Script, Onest, Prata } from "next/font/google";
import Toaster from "@/components/Toaster";
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

export const metadata: Metadata = {
  title: { default: "Бид хоёр 💞", template: "%s · Бид хоёр" },
  description: "Алсын зайн хосуудын хамтын орон зай — зурвас, дурсамж, болзоо, тоглоом.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#171015" },
  ],
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
      </body>
    </html>
  );
}
