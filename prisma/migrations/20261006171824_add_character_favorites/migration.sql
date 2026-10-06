-- CreateTable
CREATE TABLE "CharacterFavorite" (
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CharacterFavorite_pkey" PRIMARY KEY ("userId","characterId")
);

-- CreateIndex
CREATE INDEX "CharacterFavorite_characterId_idx" ON "CharacterFavorite"("characterId");

-- AddForeignKey
ALTER TABLE "CharacterFavorite" ADD CONSTRAINT "CharacterFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterFavorite" ADD CONSTRAINT "CharacterFavorite_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
