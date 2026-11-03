import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Build үед (prisma generate) DATABASE_URL байхгүй байж болно
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
