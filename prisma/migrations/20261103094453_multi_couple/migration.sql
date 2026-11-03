/*
  Warnings:

  - You are about to drop the `Settings` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `AvatarImage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `coupleId` to the `AvatarImage` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `AvatarImage` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `coupleId` to the `BucketItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupleId` to the `DateIdea` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupleId` to the `DateLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupleId` to the `GameAnswer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupleId` to the `Letter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupleId` to the `ListItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupleId` to the `Memory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupleId` to the `Moment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupleId` to the `Note` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupleId` to the `Nudge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupleId` to the `QotdAnswer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupleId` to the `QuizQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupleId` to the `SpecialDay` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupleId` to the `SyncTimer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupleId` to the `VaultPhoto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupleId` to the `VaultWish` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Settings";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Couple" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "handle" TEXT NOT NULL,
    "nameA" TEXT NOT NULL,
    "nameB" TEXT NOT NULL,
    "startDate" DATETIME,
    "nextMeet" DATETIME,
    "cityA" TEXT,
    "cityB" TEXT,
    "passwordHash" TEXT NOT NULL,
    "vaultPinHash" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AvatarImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "who" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BLOB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AvatarImage_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AvatarImage" ("data", "mime", "updatedAt", "who") SELECT "data", "mime", "updatedAt", "who" FROM "AvatarImage";
DROP TABLE "AvatarImage";
ALTER TABLE "new_AvatarImage" RENAME TO "AvatarImage";
CREATE UNIQUE INDEX "AvatarImage_coupleId_who_key" ON "AvatarImage"("coupleId", "who");
CREATE TABLE "new_BucketItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "doneAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BucketItem_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BucketItem" ("by", "createdAt", "doneAt", "id", "text") SELECT "by", "createdAt", "doneAt", "id", "text" FROM "BucketItem";
DROP TABLE "BucketItem";
ALTER TABLE "new_BucketItem" RENAME TO "BucketItem";
CREATE INDEX "BucketItem_coupleId_idx" ON "BucketItem"("coupleId");
CREATE TABLE "new_DateIdea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '💡',
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DateIdea_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DateIdea" ("by", "createdAt", "emoji", "id", "text") SELECT "by", "createdAt", "emoji", "id", "text" FROM "DateIdea";
DROP TABLE "DateIdea";
ALTER TABLE "new_DateIdea" RENAME TO "DateIdea";
CREATE INDEX "DateIdea_coupleId_idx" ON "DateIdea"("coupleId");
CREATE TABLE "new_DateLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '💞',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DateLog_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DateLog" ("by", "createdAt", "emoji", "id", "text") SELECT "by", "createdAt", "emoji", "id", "text" FROM "DateLog";
DROP TABLE "DateLog";
ALTER TABLE "new_DateLog" RENAME TO "DateLog";
CREATE INDEX "DateLog_coupleId_idx" ON "DateLog"("coupleId");
CREATE TABLE "new_GameAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "q" INTEGER NOT NULL,
    "choice" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameAnswer_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GameAnswer" ("by", "choice", "createdAt", "game", "id", "q") SELECT "by", "choice", "createdAt", "game", "id", "q" FROM "GameAnswer";
DROP TABLE "GameAnswer";
ALTER TABLE "new_GameAnswer" RENAME TO "GameAnswer";
CREATE UNIQUE INDEX "GameAnswer_coupleId_game_q_by_key" ON "GameAnswer"("coupleId", "game", "q", "by");
CREATE TABLE "new_Letter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "openedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Letter_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Letter" ("body", "by", "createdAt", "id", "openedAt", "title") SELECT "body", "by", "createdAt", "id", "openedAt", "title" FROM "Letter";
DROP TABLE "Letter";
ALTER TABLE "new_Letter" RENAME TO "Letter";
CREATE INDEX "Letter_coupleId_idx" ON "Letter"("coupleId");
CREATE TABLE "new_ListItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '',
    "doneAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListItem_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ListItem" ("by", "createdAt", "doneAt", "id", "title", "type", "url") SELECT "by", "createdAt", "doneAt", "id", "title", "type", "url" FROM "ListItem";
DROP TABLE "ListItem";
ALTER TABLE "new_ListItem" RENAME TO "ListItem";
CREATE INDEX "ListItem_coupleId_idx" ON "ListItem"("coupleId");
CREATE TABLE "new_Memory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "place" TEXT NOT NULL DEFAULT '',
    "story" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Memory_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Memory" ("by", "createdAt", "date", "id", "place", "story", "title") SELECT "by", "createdAt", "date", "id", "place", "story", "title" FROM "Memory";
DROP TABLE "Memory";
ALTER TABLE "new_Memory" RENAME TO "Memory";
CREATE INDEX "Memory_coupleId_idx" ON "Memory"("coupleId");
CREATE TABLE "new_Moment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Moment_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Moment" ("by", "caption", "createdAt", "day", "filter", "id", "mime", "mood", "photo", "reaction", "thumb", "updatedAt") SELECT "by", "caption", "createdAt", "day", "filter", "id", "mime", "mood", "photo", "reaction", "thumb", "updatedAt" FROM "Moment";
DROP TABLE "Moment";
ALTER TABLE "new_Moment" RENAME TO "Moment";
CREATE INDEX "Moment_coupleId_day_idx" ON "Moment"("coupleId", "day");
CREATE UNIQUE INDEX "Moment_coupleId_by_day_key" ON "Moment"("coupleId", "by", "day");
CREATE TABLE "new_Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'pink',
    "likedA" BOOLEAN NOT NULL DEFAULT false,
    "likedB" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Note_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Note" ("by", "color", "createdAt", "id", "likedA", "likedB", "text") SELECT "by", "color", "createdAt", "id", "likedA", "likedB", "text" FROM "Note";
DROP TABLE "Note";
ALTER TABLE "new_Note" RENAME TO "Note";
CREATE INDEX "Note_coupleId_idx" ON "Note"("coupleId");
CREATE TABLE "new_Nudge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Nudge_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Nudge" ("by", "createdAt", "id") SELECT "by", "createdAt", "id" FROM "Nudge";
DROP TABLE "Nudge";
ALTER TABLE "new_Nudge" RENAME TO "Nudge";
CREATE INDEX "Nudge_coupleId_createdAt_idx" ON "Nudge"("coupleId", "createdAt");
CREATE TABLE "new_QotdAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "question" TEXT NOT NULL DEFAULT '',
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QotdAnswer_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QotdAnswer" ("by", "createdAt", "day", "id", "question", "text") SELECT "by", "createdAt", "day", "id", "question", "text" FROM "QotdAnswer";
DROP TABLE "QotdAnswer";
ALTER TABLE "new_QotdAnswer" RENAME TO "QotdAnswer";
CREATE UNIQUE INDEX "QotdAnswer_coupleId_day_by_key" ON "QotdAnswer"("coupleId", "day", "by");
CREATE TABLE "new_QuizQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "guess" TEXT,
    "correct" BOOLEAN,
    "guessedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuizQuestion_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QuizQuestion" ("answer", "by", "correct", "createdAt", "guess", "guessedAt", "id", "question") SELECT "answer", "by", "correct", "createdAt", "guess", "guessedAt", "id", "question" FROM "QuizQuestion";
DROP TABLE "QuizQuestion";
ALTER TABLE "new_QuizQuestion" RENAME TO "QuizQuestion";
CREATE INDEX "QuizQuestion_coupleId_idx" ON "QuizQuestion"("coupleId");
CREATE TABLE "new_SpecialDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '📌',
    "yearly" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpecialDay_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SpecialDay" ("by", "createdAt", "date", "emoji", "id", "title", "yearly") SELECT "by", "createdAt", "date", "emoji", "id", "title", "yearly" FROM "SpecialDay";
DROP TABLE "SpecialDay";
ALTER TABLE "new_SpecialDay" RENAME TO "SpecialDay";
CREATE INDEX "SpecialDay_coupleId_idx" ON "SpecialDay"("coupleId");
CREATE TABLE "new_SyncTimer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "at" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SyncTimer_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SyncTimer" ("at", "by", "createdAt", "id") SELECT "at", "by", "createdAt", "id" FROM "SyncTimer";
DROP TABLE "SyncTimer";
ALTER TABLE "new_SyncTimer" RENAME TO "SyncTimer";
CREATE INDEX "SyncTimer_coupleId_idx" ON "SyncTimer"("coupleId");
CREATE TABLE "new_VaultPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "mime" TEXT NOT NULL,
    "data" BLOB NOT NULL,
    "thumb" BLOB NOT NULL,
    "viewOnce" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VaultPhoto_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VaultPhoto" ("by", "caption", "createdAt", "data", "id", "mime", "thumb", "viewOnce", "viewedAt") SELECT "by", "caption", "createdAt", "data", "id", "mime", "thumb", "viewOnce", "viewedAt" FROM "VaultPhoto";
DROP TABLE "VaultPhoto";
ALTER TABLE "new_VaultPhoto" RENAME TO "VaultPhoto";
CREATE INDEX "VaultPhoto_coupleId_idx" ON "VaultPhoto"("coupleId");
CREATE TABLE "new_VaultWish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "by" TEXT NOT NULL,
    "item" INTEGER NOT NULL,
    "answer" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VaultWish_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VaultWish" ("answer", "by", "createdAt", "id", "item") SELECT "answer", "by", "createdAt", "id", "item" FROM "VaultWish";
DROP TABLE "VaultWish";
ALTER TABLE "new_VaultWish" RENAME TO "VaultWish";
CREATE UNIQUE INDEX "VaultWish_coupleId_item_by_key" ON "VaultWish"("coupleId", "item", "by");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Couple_handle_key" ON "Couple"("handle");
