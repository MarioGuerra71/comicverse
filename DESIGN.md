---
name: ComicVerse
description: Descubre el universo de los cómics mientras lo lees.
colors:
  paper: "#0c0a10"
  sheet: "rgb(255 255 255 / 0.045)"
  sheet-raised: "rgb(255 255 255 / 0.09)"
  edge: "rgb(255 255 255 / 0.12)"
  line: "rgb(255 255 255 / 0.08)"
  line-strong: "rgb(255 255 255 / 0.2)"
  ink: "#f4efe6"
  ink-soft: "#a9a2b5"
  blue: "rgb(169 162 181 / 0.3)"
  blue-ink: "#8a8396"
  danger: "#ff6b6b"
  editor-marvel: "#ff2d3b"
  editor-ink-marvel: "#ff5560"
  glow-marvel: "rgb(255 45 59 / 0.35)"
  editor-dc: "#2f8cff"
  editor-ink-dc: "#5aa5ff"
  glow-dc: "rgb(47 140 255 / 0.35)"
  cardboard: "#a88a62"
typography:
  monumental:
    fontFamily: "Big Shoulders, system-ui, sans-serif"
    fontSize: "clamp(5rem, 14vw, 9rem)"
    fontWeight: 900
    lineHeight: 0.8
  display:
    fontFamily: "Big Shoulders, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Big Shoulders, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0.025em"
  count:
    fontFamily: "Big Shoulders, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    fontFeature: "\"tnum\""
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.25
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: "0.025em"
  hand:
    fontFamily: "Caveat, cursive"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  page-x-mobile: "16px"
  page-x-desktop: "32px"
  section: "48px"
  target: "44px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.title}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.sheet-raised}"
  tab:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "44px"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "44px"
  nav-item:
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.xl}"
    padding: "0 12px"
    height: "44px"
  panel:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.2xl}"
  zone-switch-active:
    backgroundColor: "{colors.editor-marvel}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    height: "40px"
---

# Design System: ComicVerse

## Overview

**Creative North Star: "Tienda de cómics a medianoche"**

ComicVerse es una tienda de cómics cerrada a medianoche. Las portadas brillan retroiluminadas como en una caja de luz, el letrero de neón tiene el color de la editorial (rojo Marvel, azul DC) y las colecciones se hojean como un longbox. El suelo es una noche cálida casi negra; encima flotan paneles de cristal ahumado con un filo de luz de 1 px; el texto es la luz crema de la caja de luz.

La jerarquía se hace con escala, no con color: títulos en letras de letrero condensadas en mayúsculas y recuentos monumentales en neón frente a una interfaz pequeña y tranquila en Geist. Las portadas y cartas van siempre a todo color; son el único contenido saturado aparte del neón. La única marca humana es la nota a mano en Caveat («¡nuevo!», «coleccionado»).

Rechaza la app oscura de tarjetas grises con un acento y el muro de streaming genérico.

**Key Characteristics:**
- Suelo #0c0a10 con el resplandor de la editorial filtrándose desde arriba.
- Cristal ahumado (blanco 4,5 % + desenfoque 18 px + filo de luz) para toda superficie.
- Neón de la editorial reservado a identidad, sección activa, lo nuevo y el progreso.
- Big Shoulders en mayúsculas para títulos y cifras; Geist para la interfaz; Caveat solo para notas a mano.
- 3D con propósito: longbox que se levanta, caja de luz que se endereza, hoja de archivador que gira, carta que vuela y se voltea. Todo se apaga con «reducir movimiento».

## Colors

Noche cálida, luz crema y un solo neón por zona.

### Primary
- **Neón Marvel** (editor-marvel): letrero «ComicVerse», sección activa, zona activa del selector, barras de progreso, filo bajo la cabecera, foco, selección y cursor. Su versión legible como texto pequeño es editor-ink-marvel (5,9:1); el halo es glow-marvel.
- **Neón DC** (editor-dc / editor-ink-dc / glow-dc): exactamente los mismos papeles dentro de la zona DC.

### Neutral
- **Suelo nocturno** (paper): fondo de toda la app; también texto sobre el botón crema.
- **Cristal ahumado** (sheet) y **cristal encendido** (sheet-raised): paneles en reposo y en hover/seleccionado, pistas de progreso.
- **Filo de luz** (edge): anillo de 1 px de paneles, campos y pastillas. **line** separa filas de listas; **line-strong** para la barra de desplazamiento.
- **Luz de caja de luz** (ink): texto principal (17:1) y botón principal.
- **Luz atenuada** (ink-soft): texto secundario, etiquetas, placeholders (7,6:1).
- **Luz apagada** (blue / blue-ink): huecos por descubrir (borde discontinuo, aspa) y su número (5,3:1). El nombre es heredado; ya no es azul.
- **Cartón de longbox** (cardboard): solo el borde inferior de 4 px y el reflejo interior del longbox.
- **Peligro** (danger): errores.

Superficies sólidas puntuales (tapa del archivador #17131d, anverso/reverso de la carta #15121b, lomo #1d1924→#2a2533) son variantes oscuras del suelo para objetos físicos opacos; no son tokens nuevos.

### Named Rules
**La regla del neón reservado.** El color de la editorial solo marca identidad (letrero, franja de editorial), la sección o zona activa, lo nuevo y el progreso. Nunca decora fondos, bordes de reposo ni iconos inactivos. Si en una pantalla brilla todo, no brilla nada.

**La regla de la zona.** El neón nunca se escribe en hex en un componente: se usa `--editor`, `--editor-ink`, `--brand` y `--glow`, que `data-publisher="marvel|dc"` redefine para toda la zona (el AppShell lo pone en la raíz; el selector de zona lo pone en cada botón). Marvel es rojo y DC azul, sin logos ni tipografías de las editoriales.

**La regla de la portada.** Solo las portadas y cartas llevan color pleno. La interfaz no añade otros acentos.

## Typography

**Display Font:** Big Shoulders (variable, eje opsz; con system-ui)
**Body Font:** Geist (con system-ui, sans-serif)
**Hand Font:** Caveat

**Character:** Rotulación de letrero nocturno, condensada y en mayúsculas, contra una interfaz neutra y pequeña. Las cifras son tabulares en todo el body para que los contadores no bailen.

### Hierarchy
- **Monumental** (900, clamp(5rem,14vw,9rem), 0.8, clase `neon`): la cifra-héroe de una pantalla («20 % del universo encendido»). Una por pantalla.
- **Display** (800, 2.25rem → 3rem → 3.75rem, 0.9, mayúsculas, tracking-tight): título de pantalla en PageHeader y título de la caja de luz. La cifra de PageHeader va a la derecha en 900 y neón.
- **Headline** (800, 1.5rem → 1.875rem, mayúsculas, tracking-wide): títulos de sección (SectionHeading).
- **Count** (800, 1.125–2.25rem): recuentos y números de catálogo, siempre con ceros a tres cifras (`025/037`) y el total en ink-soft más pequeño.
- **Title** (Geist 700, 0.875rem): nombres de cómics, cartas y álbumes.
- **Body** (Geist 400, 0.875–1rem): texto corrido; `max-w-prose` en párrafos.
- **Label** (Geist 400, 0.75rem, mayúsculas, tracking 0.025em): pie bajo una cifra («personajes», «cómics leídos»). Siempre debajo de su número, nunca encima de un título.
- **Hand** (Caveat 700, 1–1.25rem, editor-ink): notas de estado.

### Named Rules
**La regla de la nota a mano.** Caveat solo para notas de estado breves («¡nuevo!», «coleccionado», «descubierto», «¡Está libre!»). Como etiqueta adhesiva va girada 3°, sobre paper al 90 % con anillo de neón. Nunca para títulos ni párrafos.

**La regla de la escala.** La jerarquía sale del contraste de tamaño entre Big Shoulders y Geist, no de pesos intermedios ni de color.

## Layout

- Escritorio (≥1024 px): barra lateral de cristal fija de 256 px con letrero, selector de zona y 7 secciones. Tablet (768–1023 px): carril de iconos de 80 px. Móvil: barra superior de cristal de 56 px y barra inferior fija de 4 pestañas + «Más».
- Contenido en `max-w-6xl` centrado, márgenes de 16 px (móvil) y 32 px (≥768 px); secciones separadas por 48 px.
- Las filas de portadas (longbox, descubrimientos) se deslizan en horizontal en móvil y se vuelven rejilla (5–6 columnas) en escritorio.
- El progreso de los álbumes se muestra siempre a la misma escala (cifra `000/000`, porcentaje y barra de 6 px) para que se comparen entre sí.
- Todo objetivo táctil mide al menos 44 px.
- El pie con la atribución a Comic Vine es visible en todas las pantallas.

## Elevation & Depth

La profundidad es luz, no sombra gris: cristal translúcido sobre la noche, halos del color de la editorial y sombras negras largas solo bajo objetos físicos (portadas, álbumes, archivador, carta).

### Shadow Vocabulary
- **Filo de cristal** (`inset 0 1px 0 rgb(255 255 255 / 0.08)` + `backdrop-filter: blur(18px) saturate(140%)`): todo panel `glass`.
- **Halo de neón** (`0 0 18–24px var(--glow)`): pestaña o sección activa, zona activa, hover de álbumes y cartas. En texto: `text-shadow: 0 0 6px var(--glow), 0 0 22px var(--glow)` (clase `neon`).
- **Halo crema** (`0 0 24px rgb(244 239 230 / 0.35)`): hover del botón principal.
- **Sombra de objeto** (`0 18px 30px -18px rgb(0 0 0 / 0.9)` a `0 30px 80px -30px rgb(0 0 0 / 0.9)`): portadas, tapas y archivador.
- **Resplandor del suelo** (degradado radial de `--glow` desde arriba, opacidad 0,6): fijo detrás de toda la app.
- **Resplandor de portada**: la propia portada desenfocada (blur 64 px, 35 %, saturación 150 %) detrás de la caja de luz.

### Named Rules
**La regla del halo con motivo.** Un halo de neón aparece solo por estado (activo, hover, foco, nuevo). En reposo las superficies no brillan.

## Shapes

Formas suaves y redondeadas: pastillas (full) para botones, pestañas, selector y paginación; 12 px para campos y elementos de navegación; 16 px para paneles y cajas; 24 px para la caja de luz; 8 px para portadas. Los álbumes cerrados tienen lomo recto (6 px) y canto redondeado (12 px) con tres anillas. Los huecos por descubrir son un recuadro discontinuo con un aspa fina.

## Components

### Buttons
- **Principal** (inkButton): pastilla crema con texto paper, 44 px, 600; hover con halo crema; `active: scale(0.98)`; deshabilitado al 50 %.
- **Secundario** (outlineButton): pastilla de cristal con filo; hover a sheet-raised.
- **Enlace discreto** (quietLink): texto ink-soft; activo en ink, 600, subrayado de neón de 2 px.

### Tabs / Selector de zona
- **Pestaña** (inkTab): pastilla de cristal; seleccionada con fondo editor al 15 %, anillo de neón y halo.
- **Selector Marvel | DC**: grupo de pastillas sobre negro al 30 %; la zona activa rellena con su propio neón y texto blanco.

### Inputs / Fields
- **Campo** (inkField): cristal sheet, borde edge de 1 px, 12 px de radio, 44 px. Foco: el borde pasa a neón. Placeholder en ink-soft.

### Navigation
- **Barra lateral**: elementos de 44 px, radio 12 px; activo con editor al 12 %, anillo de neón al 60 %, halo e icono en neón; inactivo en ink-soft con hover a sheet-raised.
- **Barra inferior móvil**: 4 pestañas + «Más» (menú de cristal en rejilla de 2); activa en editor-ink con una raya de neón de 2 px arriba.
- **Letrero**: «COMICVERSE» en Big Shoulders 900 con clase `neon`.

### Cabecera de pantalla (PageHeader)
Título display a la izquierda, cifra monumental en neón a la derecha con su etiqueta debajo, filo de neón degradado de 1 px y, opcionalmente, una barra de cristal con casillas (HeaderField: cifra count + etiqueta, cada una enlaza a su pantalla).

### Caja de luz (signature)
Banda de cristal de radio 24 px con la portada en curso inclinada (`perspective 1200px, rotateY(-14deg) rotate(-2deg)`) que se endereza al pasar o enfocar, su resplandor detrás, título display, botón principal y la cifra monumental.

### Longbox (signature)
Fila de portadas inclinadas hacia atrás (`perspective 900px, rotateX(26deg)`) sobre un borde de cartón de 4 px; al pasar o enfocar se ponen de pie, suben 10 px, crecen al 104 % y ganan halo.

### Álbumes y archivador
- **Estantería**: tapas con lomo y anillas; hover sube 6 px, gira -1° y gana halo; nota «¡N nuevos!» a mano.
- **Archivador**: doble página (una en móvil) de fundas 3×3 con anillas; la hoja gira en 3D (650 ms); se pasa página con botones, flechas, esquinas dobladas o deslizando.
- **Carta en grande**: vuela desde su funda, se inclina siguiendo el puntero con brillo holográfico y se voltea para ver la ficha; al cerrar vuelve a su funda y devuelve el foco.

### Franja de editorial (PublisherStrip)
Pastilla de cristal con un punto de neón y el nombre de la editorial en 0.75rem, 700, mayúsculas.

### Motion
- Curva firma `cubic-bezier(0.16, 1, 0.3, 1)` para levantar, enderezar, abrir y aparecer (pop-in 400 ms, longbox 450 ms, caja de luz 500 ms, carta 520 ms). Estados de interfaz: 200 ms.
- **La regla de reducir movimiento.** Todo 3D y desplazamiento se anula con `prefers-reduced-motion: reduce`: en CSS (longbox, caja de luz), con `motion-safe:` en Tailwind y comprobando `matchMedia` en JS (archivador y carta solo cambian sin animar).

## Do's and Don'ts

### Do:
- **Do** usar `var(--editor)`, `--editor-ink` y `--glow` para todo neón, y `data-publisher` para cambiar de zona.
- **Do** construir superficies con `glass` + anillo edge; hover a sheet-raised.
- **Do** poner títulos y cifras en Big Shoulders mayúsculas y números de catálogo con tres cifras (`007/120`).
- **Do** mostrar a los personajes bloqueados solo como hueco discontinuo con su número en blue-ink; su nombre e imagen no viajan al cliente.
- **Do** mantener objetivos de 44 px, foco visible con contorno de neón de 2 px y la atribución a Comic Vine.
- **Do** desactivar todo movimiento 3D con «reducir movimiento».

### Don't:
- **Don't** usar el neón como decoración, fondo de panel en reposo o color de iconos inactivos.
- **Don't** escribir el rojo o el azul en hex dentro de un componente, ni usar logos o tipografías de Marvel o DC.
- **Don't** revelar nada de un personaje bloqueado (nombre, imagen, silueta, pistas): solo recuentos y números.
- **Don't** usar Caveat fuera de notas de estado breves.
- **Don't** hacer tarjetas grises opacas con sombra suave: la profundidad es cristal, luz y halo.
- **Don't** añadir acentos de color a la interfaz: el color pleno es de las portadas y cartas.
