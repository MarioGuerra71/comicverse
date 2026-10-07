---
version: 1
slug: "src-app-app-layout-tsx"
primary_target: "src/app/(app)/layout.tsx"
related_targets: ["src/app/(app)/collection/page.tsx"]
---

Scope: shell privado de la app (AppShell y sistema de diseño) y "Mi colección" como primera pantalla. Modo: Operate. Sustituye al mundo "Atlas estelar", rechazado por el usuario por genérico.

Audiencia y tarea: lector de cómics que lleva su colección semana a semana y entrevistadores en una demo corta. Tarea: saber dónde está todo, marcar lecturas y ver crecer la colección.

Restricciones: navegación y controles estándar; spoilers (de un bloqueado solo viaja su número de catálogo); fuentes servidas desde el proyecto (CSP); paleta por editorial (rojo inspirado en Marvel, azul inspirado en DC) sin logos ni tipografías de las editoriales; atribución a Comic Vine visible; solo tema claro (decisión del usuario).

## Direction contract

THESIS: Cada pantalla es una página de arte original a lápiz y tinta, y la colección se entinta al leer. Rechaza la app oscura de streaming con un acento y el pop-art de tramas y tipos condensados.

OWN-WORLD: Cartulina lisa #F4F1EA (sin cuadrícula de fondo: es una seña de UI generada), lápiz azul #8EC5E8 solo en las viñetas por dibujar, tinta #141414 a plumilla para texto, filetes de 2 px y bordes de viñeta, papel #FBFAF6 en barras. El lápiz del editor es el color de la editorial (#E62429 Marvel / #0476F2 DC; texto en #B81A1F / #0258B8) y solo marca identidad, sección activa, lo nuevo y lo coleccionado. El color pleno vive solo dentro de las viñetas (portadas e imágenes). Geist pesada para títulos e interfaz; Caveat a mano para números de catálogo y notas del editor.

STORY: El lector ve su página de colección: viñetas entintadas (descubiertos) y viñetas por dibujar con el aspa azul (bloqueados), sabe cuánto lleva y qué acaba de entintarse, y vuelve a leer para completar la página.

FIRST VIEWPORT: Móvil: barra superior de papel con la marca (icono de viñetas + ComicVerse) y el perfil, filete de tinta; barra inferior de 5 pestañas con la activa en el color del editor. En Colección: el cajetín entintado (título "Mi colección" y "15/32 personajes" a mano), pestañas de filtro entintadas (activa en tinta llena), ordenación discreta subrayada en el color del editor, y la rejilla de viñetas numeradas a mano en orden de catálogo con los huecos en su sitio.

FORM: Página de arte original, candidato 7 de 7 de la lista propia (re-roll 1); seed 6e1bb28c. Raises: color de editorial reservado a identidad y orientación (señalización), color pleno solo dentro de las viñetas (léxico con láminas), números de catálogo grandes como el número de una portada (espécimen bitmap).

ADAPTACIONES: el crédito de fuente no se repite en cada viñeta: lo cubre el pie global visible ("no sobrecargado"). Las notas del editor van bajo el nombre y no junto al número (en tres columnas de móvil no caben). El grafo con "constelaciones" del mundo anterior desaparece de la colección; las relaciones se ven en Universo.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
