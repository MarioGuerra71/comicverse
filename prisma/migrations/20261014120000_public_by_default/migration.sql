-- AlterTable
ALTER TABLE "User" ALTER COLUMN "isPublic" SET DEFAULT true;


-- Decisión del usuario: los perfiles son públicos por defecto. Las cuentas existentes nunca
-- eligieron (antes era privado por defecto), así que pasan también a públicas.
UPDATE "User" SET "isPublic" = true;
