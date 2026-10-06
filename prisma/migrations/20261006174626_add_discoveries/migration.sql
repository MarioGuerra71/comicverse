-- CreateTable
CREATE TABLE "Discovery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "viaComicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Discovery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Discovery_userId_createdAt_idx" ON "Discovery"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Discovery_characterId_idx" ON "Discovery"("characterId");

-- CreateIndex
CREATE INDEX "Discovery_viaComicId_idx" ON "Discovery"("viaComicId");

-- AddForeignKey
ALTER TABLE "Discovery" ADD CONSTRAINT "Discovery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discovery" ADD CONSTRAINT "Discovery_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discovery" ADD CONSTRAINT "Discovery_viaComicId_fkey" FOREIGN KEY ("viaComicId") REFERENCES "Comic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
