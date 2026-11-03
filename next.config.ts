import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Home хавтсанд өөр lock файл байгаа тул төслийн үндсийг тодорхой заана
  turbopack: { root: __dirname },
  cacheComponents: true,
  partialPrefetching: true,
  // Хуучин "Сэтгэл" хуудас "Өдрийн мөч" болсон
  async redirects() {
    return [{ source: "/mood", destination: "/moment", permanent: false }];
  },
  experimental: {
    serverActions: {
      // Дурсамжийн зургууд (клиент дээр жижигрүүлсэн) нэг дор илгээгддэг
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
