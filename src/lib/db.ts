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

// ───────── Хос бүрийн тусгаарлалт ─────────

// Couple нь өөрөө хос; Photo нь Memory-оор дамжин хамаарна (тусад нь шалгана)
const UNSCOPED = new Set(["Couple", "Photo"]);

const FILTERED = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "delete",
  "deleteMany",
  "upsert",
]);

type Args = { where?: object; data?: object | object[]; create?: object };

/**
 * Зөвхөн тухайн хосын өгөгдөлд хүрдэг client. Бүх унших/засах/устгах хүсэлтэд
 * coupleId шүүлтүүр, үүсгэх хүсэлтэд coupleId-г автоматаар нэмнэ — нэг газар
 * мартсан ч өөр хосын өгөгдөл хэзээ ч гарахгүй.
 */
export function scoped(coupleId: string) {
  return prisma.$extends({
    name: "couple-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (UNSCOPED.has(model)) return query(args);
          const a = { ...(args as Args) };
          if (FILTERED.has(operation)) a.where = { ...a.where, coupleId };
          if (operation === "create") a.data = { ...a.data, coupleId };
          if (operation === "createMany" || operation === "createManyAndReturn")
            a.data = ([] as object[]).concat(a.data ?? []).map((d) => ({ ...d, coupleId }));
          if (operation === "upsert") a.create = { ...a.create, coupleId };
          return query(a as typeof args);
        },
      },
    },
  });
}

export type Db = ReturnType<typeof scoped>;
