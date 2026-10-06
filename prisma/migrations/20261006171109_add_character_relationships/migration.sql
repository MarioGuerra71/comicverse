-- CreateTable
CREATE TABLE "CharacterRelationship" (
    "characterAId" TEXT NOT NULL,
    "characterBId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "CharacterRelationship_pkey" PRIMARY KEY ("characterAId","characterBId")
);

-- CreateIndex
CREATE INDEX "CharacterRelationship_characterBId_idx" ON "CharacterRelationship"("characterBId");

-- AddForeignKey
ALTER TABLE "CharacterRelationship" ADD CONSTRAINT "CharacterRelationship_characterAId_fkey" FOREIGN KEY ("characterAId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRelationship" ADD CONSTRAINT "CharacterRelationship_characterBId_fkey" FOREIGN KEY ("characterBId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
