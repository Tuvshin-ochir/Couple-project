-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QotdAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "by" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "question" TEXT NOT NULL DEFAULT '',
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_QotdAnswer" ("by", "createdAt", "day", "id", "text") SELECT "by", "createdAt", "day", "id", "text" FROM "QotdAnswer";
DROP TABLE "QotdAnswer";
ALTER TABLE "new_QotdAnswer" RENAME TO "QotdAnswer";
CREATE UNIQUE INDEX "QotdAnswer_day_by_key" ON "QotdAnswer"("day", "by");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
