-- CreateTable
CREATE TABLE "CharacterVersionImage" (
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterVersionImage_pkey" PRIMARY KEY ("userId","characterId","seriesId")
);

-- CreateIndex
CREATE INDEX "CharacterVersionImage_characterId_idx" ON "CharacterVersionImage"("characterId");

-- CreateIndex
CREATE INDEX "CharacterVersionImage_seriesId_idx" ON "CharacterVersionImage"("seriesId");

-- AddForeignKey
ALTER TABLE "CharacterVersionImage" ADD CONSTRAINT "CharacterVersionImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterVersionImage" ADD CONSTRAINT "CharacterVersionImage_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterVersionImage" ADD CONSTRAINT "CharacterVersionImage_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
