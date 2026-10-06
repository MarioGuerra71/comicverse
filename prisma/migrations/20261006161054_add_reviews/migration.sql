-- CreateTable
CREATE TABLE "Review" (
    "userId" TEXT NOT NULL,
    "comicId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("userId","comicId")
);

-- CreateIndex
CREATE INDEX "Review_comicId_idx" ON "Review"("comicId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_comicId_fkey" FOREIGN KEY ("userId", "comicId") REFERENCES "UserComic"("userId", "comicId") ON DELETE CASCADE ON UPDATE CASCADE;
