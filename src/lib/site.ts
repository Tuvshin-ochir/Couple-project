// Аппын нэр, хуваалцах үеийн (Open Graph) мэдээлэл — нэг дор
// (public/sw.js импорт хийж чадахгүй тул тэнд нэр нь шууд бичигдсэн)

export const SITE_NAME = "Our cave";
export const SITE_DESC = "Алсын зайн хосуудын хамтын орон зай — зурвас, дурсамж, болзоо, тоглоом.";

// og:image гэх мэт бүрэн URL шаарддаг талбаруудад. Өөр домэйн холбовол SITE_URL-ээр солино.
export const SITE_URL = process.env.SITE_URL ?? "https://bid-hoyor-production.up.railway.app";

/** Хуудас бүр openGraph-аа бүтнээр нь дарж бичдэг тул нийтлэг талбаруудыг (зураг ч мөн) энд нэмнэ */
export const og = (title: string, description: string) => ({
  type: "website" as const,
  siteName: SITE_NAME,
  locale: "mn_MN",
  title,
  description,
  // public/og.png — 1200×630, OUR♥CAVE
  images: [{ url: "/og.png", width: 1200, height: 630, alt: `${SITE_NAME} — алсын зайн хосуудын хамтын орон зай` }],
});
