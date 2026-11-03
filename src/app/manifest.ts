import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

// Утсанд "апп" шиг суулгах тохиргоо (Android: "Суулгах", iPhone: Share → Add to Home Screen)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: "Алсын зайн хосуудын хамтын орон зай",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "mn",
    background_color: "#f5f2ec",
    theme_color: "#f5f2ec",
    categories: ["lifestyle", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Дүрс дээр удаан дарахад гарах товчлолууд (Android). Эхнийх нь шууд "санаж байна" илгээнэ (Live.tsx)
    shortcuts: [
      { name: "Чамайг санаж байна", short_name: "Санаж байна", url: "/?send=miss", icons: [{ src: "/icons/sc-miss.png", sizes: "192x192", type: "image/png" }] },
      { name: "Өдрийн мөч", url: "/moment", icons: [{ src: "/icons/sc-moment.png", sizes: "192x192", type: "image/png" }] },
      { name: "Захидал", url: "/notes", icons: [{ src: "/icons/sc-notes.png", sizes: "192x192", type: "image/png" }] },
      { name: "Our taste", url: "/music", icons: [{ src: "/icons/sc-music.png", sizes: "192x192", type: "image/png" }] },
    ],
  };
}
