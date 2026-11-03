-- CreateTable
CREATE TABLE "Listen" (
    "coupleId" TEXT NOT NULL PRIMARY KEY,
    "by" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "pausedAt" REAL,
    "changedAt" DATETIME NOT NULL,
    "notifiedAt" DATETIME,
    CONSTRAINT "Listen_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
