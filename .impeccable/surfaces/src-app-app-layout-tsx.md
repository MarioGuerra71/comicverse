---
version: 1
slug: "src-app-app-layout-tsx"
primary_target: "src/app/(app)/layout.tsx"
related_targets: ["src/app/(app)/collection/page.tsx"]
---

Scope: shell privado de la app (AppShell y sistema de diseño) y, después, la Colección como primera pantalla. Modo: Operate.

Audiencia y tarea: lector de cómics, de noche, en el móvil, desde el sofá, nada más leer; y entrevistadores en una demo corta. Tarea: saber dónde está todo, marcar lecturas y ver crecer la colección.

Restricciones: navegación y controles estándar; spoilers (nada de un bloqueado llega al navegador); fuentes servidas desde el proyecto (CSP); sin marca de Marvel; atribución a Comic Vine visible.

## Direction contract

THESIS: La colección es un cielo nocturno grabado: leer enciende estrellas. Rechaza el "streaming oscuro con un acento neón" y el pop-art de tramas.

OWN-WORLD: Azul de Prusia muy oscuro (#0B1220) como suelo, planchas un tono más claras (#15233F), filetes de 1 px en azul pálido (#7F93B8 a baja opacidad), texto en blanco estelar (#EEF1F7), dorado (#E2B04A) reservado a "recién descubierto" y a lo coleccionado. Rótulos en romana grabada de mayúsculas (Marcellus) para títulos y números de catálogo; Geist para la interfaz. Sin brillos, sin sombras de color, sin degradados en el texto. Portadas como láminas sin tintar con su crédito de fuente.

STORY: El lector entiende en un vistazo cuánto universo ha descubierto, ve qué se acaba de encender y vuelve a leer para completar el cielo.

FIRST VIEWPORT: Móvil: barra inferior de 5 pestañas (Inicio, Catálogo, Biblioteca, Colección, Universo) con iconos SVG propios y etiqueta; arriba una barra fina con la marca ComicVerse en romana grabada y el acceso al perfil. Tablet: carril lateral de iconos. Escritorio: barra lateral con etiquetas y la marca. En Colección, el cielo (posiciones de los 32 personajes, encendidas y unidas por constelaciones) encabeza la rejilla de cartas con "Nº 006 / 032".

FORM: Atlas estelar, candidato 7 de 7 de la lista propia; seed 6e1bb28c. Raises: número de catálogo fijo (Saville), dorado de "nuevo" hasta que se ve (panel de puertas), cambio de estado en su sitio sin recolocar la rejilla (split-flap), pocos valores y filetes a 1 px (edición crítica), láminas sin tintar con crédito (anuario).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
