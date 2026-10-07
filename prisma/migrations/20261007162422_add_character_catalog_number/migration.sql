-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "catalogNumber" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Character_catalogNumber_key" ON "Character"("catalogNumber");

