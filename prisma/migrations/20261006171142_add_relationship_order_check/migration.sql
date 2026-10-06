-- Una sola fila por pareja: el id menor siempre en characterAId.
-- COLLATE "C" compara byte a byte, igual que el operador < de JavaScript que usa el importador.
ALTER TABLE "CharacterRelationship"
  ADD CONSTRAINT "CharacterRelationship_order_check"
  CHECK ("characterAId" COLLATE "C" < "characterBId" COLLATE "C");
