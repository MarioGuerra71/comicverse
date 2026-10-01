-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('COMICVINE');

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "publisherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startYear" INTEGER,
    "source" "DataSource" NOT NULL,
    "externalId" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comic" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "issueNumber" TEXT,
    "title" TEXT NOT NULL,
    "storyTitle" TEXT,
    "description" TEXT,
    "releaseDate" DATE,
    "coverUrl" TEXT,
    "coverThumbUrl" TEXT,
    "source" "DataSource" NOT NULL,
    "externalId" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "publisherId" TEXT,
    "name" TEXT NOT NULL,
    "realName" TEXT,
    "summary" TEXT,
    "imageUrl" TEXT,
    "imageThumbUrl" TEXT,
    "appearancesCount" INTEGER,
    "firstAppearanceExternalId" TEXT,
    "isCollectible" BOOLEAN NOT NULL DEFAULT false,
    "source" "DataSource" NOT NULL,
    "externalId" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detailsSyncedAt" TIMESTAMP(3),

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComicCharacter" (
    "comicId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,

    CONSTRAINT "ComicCharacter_pkey" PRIMARY KEY ("comicId","characterId")
);

-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "DataSource" NOT NULL,
    "externalId" TEXT NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComicCreator" (
    "comicId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "roles" TEXT NOT NULL,

    CONSTRAINT "ComicCreator_pkey" PRIMARY KEY ("comicId","creatorId")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "DataSource" NOT NULL,
    "externalId" TEXT NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComicEvent" (
    "comicId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "ComicEvent_pkey" PRIMARY KEY ("comicId","eventId")
);

-- CreateIndex
CREATE INDEX "Series_publisherId_idx" ON "Series"("publisherId");

-- CreateIndex
CREATE UNIQUE INDEX "Series_source_externalId_key" ON "Series"("source", "externalId");

-- CreateIndex
CREATE INDEX "Comic_seriesId_idx" ON "Comic"("seriesId");

-- CreateIndex
CREATE INDEX "Comic_releaseDate_idx" ON "Comic"("releaseDate");

-- CreateIndex
CREATE UNIQUE INDEX "Comic_source_externalId_key" ON "Comic"("source", "externalId");

-- CreateIndex
CREATE INDEX "Character_isCollectible_idx" ON "Character"("isCollectible");

-- CreateIndex
CREATE INDEX "Character_publisherId_idx" ON "Character"("publisherId");

-- CreateIndex
CREATE UNIQUE INDEX "Character_source_externalId_key" ON "Character"("source", "externalId");

-- CreateIndex
CREATE INDEX "ComicCharacter_characterId_idx" ON "ComicCharacter"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_source_externalId_key" ON "Creator"("source", "externalId");

-- CreateIndex
CREATE INDEX "ComicCreator_creatorId_idx" ON "ComicCreator"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_source_externalId_key" ON "Event"("source", "externalId");

-- CreateIndex
CREATE INDEX "ComicEvent_eventId_idx" ON "ComicEvent"("eventId");

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comic" ADD CONSTRAINT "Comic_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComicCharacter" ADD CONSTRAINT "ComicCharacter_comicId_fkey" FOREIGN KEY ("comicId") REFERENCES "Comic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComicCharacter" ADD CONSTRAINT "ComicCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComicCreator" ADD CONSTRAINT "ComicCreator_comicId_fkey" FOREIGN KEY ("comicId") REFERENCES "Comic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComicCreator" ADD CONSTRAINT "ComicCreator_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComicEvent" ADD CONSTRAINT "ComicEvent_comicId_fkey" FOREIGN KEY ("comicId") REFERENCES "Comic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComicEvent" ADD CONSTRAINT "ComicEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
