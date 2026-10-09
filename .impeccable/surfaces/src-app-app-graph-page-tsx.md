---
version: 1
slug: "src-app-app-graph-page-tsx"
primary_target: "src/app/(app)/graph/page.tsx"
related_targets: []
---

# Universo (/graph)

Modo: Experience dentro de la app. Público: lectores que quieren ver quién se relaciona con quién y saltar de personaje en personaje; entrevistadores en una demo. Tarea principal (usuario, 2026-10-09): «ver quién se relaciona». Rechazado: el grafo de React Flow (un lío, parece técnico, no dice nada).

## Direction contract

THESIS: El universo es una página de reparto de cómic: el protagonista es la viñeta grande y sus relaciones son viñetas agrupadas por tipo, rotuladas a mano. Rechaza el grafo de nodos y aristas: ninguna línea cruzada, la relación se lee en el rótulo.

OWN-WORLD: «Página de arte original» intacta: cartulina, viñetas con filete de tinta de 2 px, títulos Geist 800, tipos de relación y contadores a mano en Caveat (editor-ink para lo nuevo/activo), relaciones por descubrir como viñetas a lápiz azul con aspa y solo su número, cajetín con el bloque de la editorial.

STORY: Llegas y ves al personaje más conectado de tu zona en grande con todo su reparto alrededor; entiendes de un vistazo aliados, enemigos y familia; tocas una viñeta y esa pasa a ser la protagonista; ves cuántas relaciones te faltan por descubrir y vuelves a leer.

FIRST VIEWPORT: Cajetín «Universo de X» con el recuento a mano de relaciones de la zona. Debajo, una tira de elección de protagonista (miniaturas). Columna izquierda (≈1/3): viñeta 3:4 grande del protagonista, nombre, estado a mano, cómics leídos, enlace a su ficha. Derecha (≈2/3): bloques por tipo («aliados», «enemigos», «familia», «pareja», «compañeros», «rivales», «aparecen juntos») con rótulo a mano y fila de viñetas con «N cómics juntos»; al final, «por descubrir» a lápiz. Móvil: protagonista en horizontal arriba y cada tipo como fila deslizable con snap.

FORM: Página de reparto (splash page de presentación de personajes), posición 1 de 7 en mi lista; donación del muro de streaming: filas horizontales por tipo en móvil. Seed key 7821a16d (surface, experience). Build path: code-led. Interacción firma: al cambiar de protagonista, las viñetas del reparto se entintan en cascada (pop-in escalonado, respetando reducir movimiento).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
