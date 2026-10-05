-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('PENDING', 'READING', 'READ', 'DROPPED');

-- CreateTable
CREATE TABLE "UserComic" (
    "userId" TEXT NOT NULL,
    "comicId" TEXT NOT NULL,
    "status" "ReadingStatus" NOT NULL DEFAULT 'PENDING',
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER,
    "startedAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserComic_pkey" PRIMARY KEY ("userId","comicId")
);

-- CreateTable
CREATE TABLE "ReadingHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comicId" TEXT NOT NULL,
    "fromStatus" "ReadingStatus",
    "toStatus" "ReadingStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserComic_userId_status_idx" ON "UserComic"("userId", "status");

-- CreateIndex
CREATE INDEX "UserComic_comicId_idx" ON "UserComic"("comicId");

-- CreateIndex
CREATE INDEX "ReadingHistory_userId_createdAt_idx" ON "ReadingHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReadingHistory_comicId_idx" ON "ReadingHistory"("comicId");

-- AddForeignKey
ALTER TABLE "UserComic" ADD CONSTRAINT "UserComic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserComic" ADD CONSTRAINT "UserComic_comicId_fkey" FOREIGN KEY ("comicId") REFERENCES "Comic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingHistory" ADD CONSTRAINT "ReadingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingHistory" ADD CONSTRAINT "ReadingHistory_comicId_fkey" FOREIGN KEY ("comicId") REFERENCES "Comic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
