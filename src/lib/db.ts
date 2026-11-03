import "server-only";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

// Хөгжүүлэлтийн үед hot reload бүрт шинэ холболт үүсгэхгүйн тулд нэг л удаа үүсгэнэ
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
  return new PrismaClient({ adapter });
}

// Schema өөрчлөгдөж client дахин үүсгэгдвэл (HMR) хуучин instance-ийг ашиглахгүй
const cached = globalForPrisma.prisma;
export const prisma = cached instanceof PrismaClient ? cached : createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
