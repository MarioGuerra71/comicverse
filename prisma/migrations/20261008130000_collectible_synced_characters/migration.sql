-- Todo personaje que aparece en un cómic sincronizado con Comic Vine es coleccionable
-- (los creados antes de esta regla nacieron como no coleccionables).
UPDATE "Character" c
SET "isCollectible" = true
WHERE NOT c."isCollectible"
  AND EXISTS (
    SELECT 1 FROM "ComicCharacter" cc
    JOIN "Comic" co ON co.id = cc."comicId"
    WHERE cc."characterId" = c.id AND co."charactersSyncedAt" IS NOT NULL
  );
