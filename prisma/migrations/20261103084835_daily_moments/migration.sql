/*
  Warnings:

  - You are about to drop the `Mood` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Mood";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Moment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "by" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "filter" TEXT NOT NULL DEFAULT 'none',
    "mime" TEXT,
    "photo" BLOB,
    "thumb" BLOB,
    "reaction" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AvatarImage" (
    "who" TEXT NOT NULL PRIMARY KEY,
    "mime" TEXT NOT NULL,
    "data" BLOB NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Moment_day_idx" ON "Moment"("day");

-- CreateIndex
CREATE UNIQUE INDEX "Moment_by_day_key" ON "Moment"("by", "day");
