---
version: 1
slug: "src-app-app-layout-tsx"
primary_target: "src/app/(app)/layout.tsx"
related_targets: ["src/app/(app)/dashboard/page.tsx"]
---

Scope: shell privado de la app (AppShell y sistema de diseño) y todas sus pantallas; primera pantalla: Inicio. Modo: Operate. Sustituye a «Página de arte original» (el usuario la ve demasiado simple para 2026).

Audiencia y tarea: lector de cómics que vuelve cada semana a seguir leyendo, entintar personajes y completar álbumes; entrevistadores en una demo. Pidió (2026-10-14): modo oscuro, movimiento y 3D, cristal y luz; referencias Marvel Unlimited/Netflix y Letterboxd/Goodreads; conservar rojo Marvel / azul DC y los álbumes con la carta en grande.

Restricciones: navegación y controles estándar; spoilers (de un bloqueado solo viaja su número); fuentes servidas desde el proyecto (CSP); color de editorial sin logos ni tipografías de las editoriales; atribución a Comic Vine visible; reducir movimiento respetado.

## Direction contract

THESIS: ComicVerse es una tienda de cómics cerrada a medianoche: las portadas brillan retroiluminadas como en una caja de luz, el letrero de neón es el color de la editorial y las colecciones se hojean como un longbox. Rechaza la app oscura de tarjetas grises con un acento y el muro de streaming genérico.

OWN-WORLD: Suelo casi negro cálido #0C0A10 con un leve resplandor del color de la editorial que se filtra desde arriba; paneles de cristal ahumado (blanco al 4–7 % con desenfoque y un filo de luz de 1 px arriba); texto crema de caja de luz #F4EFE6, secundario #A9A2B5. Neón: rojo #FF2D3B (Marvel) / azul #2F8CFF (DC) con halo, reservado a identidad, sección activa, lo nuevo y el progreso. Portadas a todo color con su propio resplandor detrás (la imagen difuminada). Display: Big Shoulders Display (rotulación de letrero nocturno, mayúsculas condensadas) para títulos y recuentos monumentales; Geist para la interfaz; Caveat solo para las etiquetas de precio a mano («¡nuevo!», «coleccionado»).

STORY: Entras de noche en tu tienda: el cómic que estás leyendo está en la caja de luz, debajo hojeas tus cajas (seguir leyendo, lo último, tus álbumes) y el letrero te dice cuánto universo has encendido; tocas una portada y la tienda te lleva a ella.

FIRST VIEWPORT: Escritorio: barra lateral de cristal ahumado con el letrero de neón «ComicVerse» en el color de la zona, selector Marvel/DC y las 7 secciones (activa: pastilla de cristal con filo de neón). Inicio: caja de luz a todo el ancho con el último cómic leído o en curso (portada grande inclinada, su resplandor detrás, título display, botón «Seguir»); a la derecha, el contador monumental «% del universo encendido» en neón; debajo, el longbox «Seguir leyendo» con portadas inclinadas hacia atrás que se ponen de pie al pasar el puntero o el foco. Móvil: barra superior de cristal, caja de luz a todo el ancho, longbox deslizable.

FORM: Tienda de cómics a medianoche, candidato 4 de 7 de la lista propia; seed ad426a58. Raises: el color de la editorial inunda zonas enteras (Metro); rojo/azul reservado a orientación y estado (señalética de aeropuerto); jerarquía por contraste de escala con recuentos monumentales (espécimen tipográfico); progreso de álbumes siempre a la misma escala (folio botánico); la nota a mano como única marca humana (J-card). Movimiento firma: «hojear el longbox» (portadas inclinadas en 3D que se levantan al pasar). Build path: code-led.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
