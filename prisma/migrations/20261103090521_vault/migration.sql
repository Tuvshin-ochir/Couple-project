-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "vaultPinHash" TEXT;

-- CreateTable
CREATE TABLE "VaultPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "by" TEXT NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "mime" TEXT NOT NULL,
    "data" BLOB NOT NULL,
    "thumb" BLOB NOT NULL,
    "viewOnce" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "VaultWish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "by" TEXT NOT NULL,
    "item" INTEGER NOT NULL,
    "answer" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "VaultWish_item_by_key" ON "VaultWish"("item", "by");
