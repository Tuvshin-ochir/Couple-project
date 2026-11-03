// Аппын нэр, хуваалцах үеийн (Open Graph) мэдээлэл — нэг дор
// (public/sw.js импорт хийж чадахгүй тул тэнд нэр нь шууд бичигдсэн)

export const SITE_NAME = "Our cave";
export const SITE_DESC = "Алсын зайн хосуудын хамтын орон зай — зурвас, дурсамж, болзоо, тоглоом.";

// og:image гэх мэт бүрэн URL шаарддаг талбаруудад. Railway домэйнаа (build, runtime хоёуланд) өгдөг
// тул түүнийг дагана — домэйн солигдоход кодоо засах шаардлагагүй. Өөрийн домэйн холбовол SITE_URL.
const railway = process.env.RAILWAY_PUBLIC_DOMAIN;
export const SITE_URL = process.env.SITE_URL ?? (railway ? `https://${railway}` : "https://ourcave.up.railway.app");

/** Хуудас бүр openGraph-аа бүтнээр нь дарж бичдэг тул нийтлэг талбаруудыг (зураг ч мөн) энд нэмнэ */
export const og = (title: string, description: string) => ({
  type: "website" as const,
  siteName: SITE_NAME,
  locale: "mn_MN",
  // Messenger г.м-ийн картын гарчгийн ард зүрх
  title: `${title} ❤️`,
  description,
  // public/og.png — 1200×630, OUR♥CAVE
  images: [{ url: "/og.png", width: 1200, height: 630, alt: `${SITE_NAME} — алсын зайн хосуудын хамтын орон зай` }],
});
