import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Зөвхөн танилцуулга, нэвтрэх хуудсууд нээлттэй — хосын зураг, API-г мөлхүүлэхгүй
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/photos/", "/moments/", "/avatars/", "/vault-photos/"] },
    host: SITE_URL,
  };
}
