---
name: ComicVerse
description: Descubre el universo de los cómics mientras lo lees.
colors:
  paper: "#f4f1ea"
  sheet: "#fbfaf6"
  sheet-raised: "#ece7dc"
  line: "rgb(20 20 20 / 0.14)"
  line-strong: "rgb(20 20 20 / 0.32)"
  ink: "#141414"
  ink-soft: "#55534d"
  blue: "#8ec5e8"
  blue-ink: "#2f72a3"
  editor: "#e62429"
  editor-ink: "#b81a1f"
  editor-dc: "#0476f2"
  editor-ink-dc: "#0258b8"
  danger: "#b3261e"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    fontFeature: "tnum"
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
  hand-number:
    fontFamily: "Caveat, cursive"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
  hand-note:
    fontFamily: "Caveat, cursive"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
  hand-label:
    fontFamily: "Caveat, cursive"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
rounded:
  none: "0px"
  avatar: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  tab-filter:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  tab-filter-hover:
    backgroundColor: "{colors.sheet-raised}"
  tab-filter-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  nav-item:
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  nav-item-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  bottom-nav-item-active:
    textColor: "{colors.editor-ink}"
    height: "64px"
  bar:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    height: "56px"
  title-block:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  character-panel:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.none}"
  locked-panel:
    textColor: "{colors.blue-ink}"
    rounded: "{rounded.none}"
---

# Design System: ComicVerse

## Overview

**Creative North Star: "Página de arte original"**

Cada pantalla es una página de cómic original a lápiz y tinta, sobre la mesa del dibujante: cartulina lisa, filetes de plumilla, viñetas entintadas y viñetas aún por dibujar en lápiz azul no fotográfico. Encima, el editor ha pasado con su lápiz graso en el color de la editorial para marcar lo que importa: dónde estás, qué es nuevo, qué ya tienes. La colección se entinta al leer.

La interfaz es plana, de papel y tinta. Los límites son filetes de 2 px en tinta, no sombras ni tonos. El color pleno solo existe dentro de las viñetas (portadas e imágenes de personajes); todo lo demás es cartulina, tinta, lápiz azul y el lápiz del editor. Solo hay tema claro (decisión del usuario).

Rechazos confirmados: la app oscura de streaming con un acento, el pop-art de tramas y tipos condensados, y el mundo anterior "Atlas estelar" (marino, oro, Marcellus), rechazado por genérico. La paleta por editorial (rojo inspirado en Marvel, azul inspirado en DC) es solo color: nunca logos ni tipografías de las editoriales.

**Key Characteristics:**
- Cartulina lisa como suelo, sin cuadrícula ni textura de fondo.
- Filetes y bordes de viñeta en tinta de 2 px; esquinas rectas.
- Tinta llena = seleccionado, en toda la app.
- Lápiz del editor (color de la editorial) solo para identidad, sección activa, lo nuevo y lo coleccionado.
- Caveat a mano para números de catálogo, notas del editor y rótulos de relación del reparto; Geist para todo lo demás.
- Iconos propios en SVG de trazo, nunca emojis ni Unicode.

## Colors

Cartulina, tinta y dos lápices: uno azul para lo que aún no existe y uno del editor para lo que importa.

### Primary
- **Lápiz del editor, rojo** (editor): marcas del editor sobre la página: recuadro alrededor de una viñeta nueva, barra de 2 px de la pestaña activa en el móvil, subrayado de la ordenación activa, selección de texto, anillo de foco y cursor. Nunca como texto.
- **Lápiz del editor, rojo legible** (editor-ink): el mismo color cuando es texto: notas a mano "¡nuevo!" y "coleccionado", etiqueta de la pestaña activa del móvil (6:1).
- **Lápiz del editor, azul DC** (editor-dc / editor-ink-dc): sustituyen a los dos anteriores dentro de `[data-publisher="dc"]`. Mismos papeles, mismo reparto.

### Secondary
- **Lápiz azul no fotográfico** (blue): solo líneas: borde de 1,5 px y aspa de las viñetas por dibujar (personajes bloqueados). Nunca texto ni relleno.
- **Lápiz azul legible** (blue-ink): el número de catálogo de un bloqueado, única información que viaja de él (4,7:1).

### Neutral
- **Cartulina** (paper): suelo de toda la app; también el texto sobre tinta llena.
- **Papel** (sheet): barras (superior, lateral, inferior, pie), cajetín, pestañas en reposo y fondo de la viñeta sin imagen.
- **Papel trabajado** (sheet-raised): hover de pestañas y pista de las barras de progreso.
- **Tinta** (ink): texto principal, filetes de 2 px, bordes de viñeta, relleno del estado seleccionado, corazón de favorito, valor de progreso (16:1).
- **Tinta suave** (ink-soft): texto secundario, enlaces de navegación en reposo, placeholders (6,7:1).
- **Filete fino / filete marcado** (line / line-strong): separadores neutros y barra de scroll.
- **Error** (danger): solo mensajes de error (6:1).

### Named Rules
**The Editor's Pencil Rule.** El color de la editorial marca solo cuatro cosas: identidad (selección, foco, cursor), sección activa, lo nuevo y lo coleccionado. No marca favoritos (el corazón va en tinta) ni decora. Si no responde a "dónde estoy" o "qué ha cambiado en mi colección", no lleva color del editor.

**The Colour-Inside-Panels Rule.** El color pleno vive solo dentro de las viñetas: portadas e imágenes. Fuera de ellas, la página es cartulina, tinta y lápiz.

**The Publisher Switch Rule.** La editorial cambia el color por atributo, no por componente: `[data-publisher="dc"]` redefine `--editor` y `--editor-ink`. Los componentes solo usan los tokens del editor, nunca un rojo o azul literal.

**The Plain Paper Rule.** El suelo es cartulina lisa. Nada de cuadrículas, puntos, tramas ni degradados de fondo: la retícula de fondo es una seña de UI generada. El lápiz azul aparece solo donde dice algo (una viñeta por dibujar).

## Typography

**Display Font:** Geist (con system-ui, sans-serif), servida desde el proyecto con next/font
**Body Font:** Geist
**Hand Font:** Caveat (con cursive), servida desde el proyecto con next/font

**Character:** Geist pesada y apretada hace de rotulación de interfaz; Caveat es la mano del editor que numera las viñetas y anota al margen. Cifras tabulares en todo el cuerpo para que los contadores no bailen.

### Hierarchy
- **Display** (800, 1.875rem en móvil y 2.25rem desde md, tracking -0.025em): título de pantalla en el cajetín ("Mi colección") y en la 404.
- **Brand** (800, 1.125rem, tracking -0.025em): "ComicVerse" junto a la marca de viñetas.
- **Title** (700, 0.875rem, 1.25): nombre del personaje bajo la viñeta.
- **Body** (400, 0.875rem): texto corriente, pestañas (600), enlaces de navegación; párrafos a max-w-prose.
- **Label** (400, 0.75rem): metadatos (nombre real, cómics leídos), pie de atribución, unidad del contador; en la barra inferior, 11px a 500 (600 activa).
- **Hand number** (Caveat 700): contador del cajetín a 2.25rem con el total a 1.5rem en tinta suave; número de viñeta "001/032" a 1.5rem con "/032" a 1rem y 500.
- **Hand note** (Caveat 700, 1.25rem "¡nuevo!", 1.125rem "coleccionado"): notas del editor bajo el nombre.
- **Hand label** (Caveat 700, 1.5rem, interlineado 1, tinta, en minúscula): rótulo del tipo de relación en la página de reparto ("aliados", "enemigos"…); el de "por descubrir" va a 1.875rem en blue-ink.

### Named Rules
**The Handwritten Digits Rule.** Los números de catálogo y el recuento de la colección se escriben a mano en Caveat, siempre con tres cifras (001) y su total. Caveat no se usa para títulos, botones ni texto corrido. Excepción acotada (contrato de dirección del Universo): los rótulos de tipo de relación de la página de reparto van en Caveat, porque son la mano del editor clasificando el reparto. No se extiende a títulos de pantalla, de sección ni de personaje, que siguen en Geist.

**The Weight-Not-Opacity Rule.** Lo secundario dentro de un número a mano se aligera por tamaño y peso, no por transparencia (en azul la opacidad bajaba el contraste).

## Layout

Columna central de hasta 72rem (max-w-6xl) con márgenes de 16px en móvil y 32px desde md; respiro vertical de 24px y 32px. El shell cambia por tamaño: en móvil, barra superior de 56px y barra inferior fija de 5 pestañas (64px de alto, con safe-area); en tablet (md, 768px), carril lateral de iconos de 80px; en escritorio (lg, 1024px), barra lateral de 240px con iconos y texto. El pie de atribución a Comic Vine cierra todas las páginas privadas y deja 96px de relleno inferior en móvil para no quedar bajo la barra.

La rejilla de colección es un álbum: 3 columnas en móvil, 4 en sm, 5 en md y 6 en lg, con calles de 16px en horizontal y 28px en vertical. En orden de catálogo y sin filtro, los huecos bloqueados ocupan su sitio, de modo que al desbloquear la viñeta se entinta sin recolocar la página. En móvil, las filas de filtros y de ordenación se desplazan en horizontal en lugar de partirse.

La página de reparto (Universo) reparte el ancho en dos columnas desde lg: protagonista a 1/3, fijo arriba al desplazar (sticky, 24px), y reparto a 2/3, con 40px de calle; en móvil y tablet el protagonista va en horizontal (viñeta de 112px, 144px desde sm) sobre el reparto. Los grupos de relación se encajan como viñetas de distinto ancho: cada grupo ocupa tantas columnas como miembros tiene, en una rejilla de 4 columnas desde sm y de 5 desde xl (1280px), con calles de 24px en horizontal y 32px en vertical. El servidor los empaqueta en filas sin huecos y el orden del DOM es el visual: sin relleno denso que desordene el tabulador. En móvil, la tira de protagonistas y cada grupo son filas que se desplazan en horizontal con snap.

Toda zona táctil mide al menos 44px (min-h-11).

## Elevation & Depth

Plano por completo. No hay sombras ni brillo: la profundidad la dan los filetes de tinta de 2px, el cambio de papel (sheet sobre paper, sheet-raised al pasar) y el relleno de tinta del estado seleccionado. Lo único que sobresale es el recuadro del editor alrededor de una viñeta nueva: un contorno de 2px en color del editor separado 4px del borde, como un rodeo a lápiz.

### Named Rules
**The Ink-Not-Shadow Rule.** Ni sombras, ni glow, ni degradados. Si algo necesita separarse, lleva un filete de tinta o cambia de papel.

**The Publisher Block Rule** (decisión del usuario, 2026-10-08). Única excepción a «sin degradados»: el **bloque de la editorial**. El menú lateral (vertical, `bg-brand-fade-y`), la barra superior del móvil (`bg-brand-fade-x`) y el título del cajetín de cada página van en `--brand` (rojo Marvel #E62429; azul DC #0367D6 bajo `[data-publisher="dc"]`) con texto blanco, y se funden a papel como el logotipo de la editorial. El texto blanco va **siempre sobre color pleno**: en el cajetín el fundido es una banda aparte a la derecha que el título no pisa. La sección activa del menú es un recuadro de papel con texto en `editor-ink`.

## Shapes

Esquinas rectas en todo: barras, cajetín, pestañas, enlaces de navegación y viñetas tienen radio 0, como el corte de una plancha. Los bordes son de tinta a 2px; la viñeta por dibujar usa lápiz azul a 1,5px con un aspa de esquina a esquina. Única excepción: la inicial del perfil va en un círculo entintado de 2px (avatar). Nada de píldoras.

Iconos propios en SVG sobre una rejilla de 24, trazo de 1,5px con extremos redondeados en currentColor; la marca (dos viñetas separadas por la calle) usa trazo de 2px. El set: Inicio (hoja con esquina doblada), Catálogo (cómic abierto), Biblioteca (lomos en balda), Colección (cartas apiladas), Universo (viñetas unidas), corazón, estrella de puntuación, salir.

## Components

### Navigation
Rotulación de borde de página: sobria en reposo, entintada al estar activa.
- **Barras:** papel (sheet) con filete de tinta de 2px hacia el contenido (abajo en la superior, a la derecha en la lateral, arriba en la inferior y en el pie).
- **Lateral y carril:** enlaces de 44px con borde de 2px transparente; hover = borde de tinta y texto en tinta; activo = caja de tinta llena con texto en cartulina, igual que las pestañas de filtro. Perfil y "Cerrar sesión" bajo un filete de tinta, con el mismo hover.
- **Barra inferior (móvil):** 5 pestañas de icono 22px y etiqueta de 11px en tinta suave; la activa pasa a editor-ink y lleva una barra de 2px × 32px en color del editor en el borde superior.

### Chips / Filter tabs
- **Style:** caja recta de 44px, borde de tinta de 2px, papel (sheet), texto 600 en tinta, con el recuento al lado en peso normal.
- **State:** hover = papel trabajado; activa = tinta llena con texto en cartulina.

### Sort links
Ordenación secundaria y discreta: enlaces de texto en tinta suave con zona táctil de 44px por relleno; el activo va en tinta, 600, subrayado de 2px en color del editor separado 6px.

### Title block (cajetín)
El cajetín impreso de una página de arte original: caja de tinta de 2px sobre papel, título display a la izquierda, contador a mano a la derecha tras un filete vertical, y debajo, tras un filete horizontal, una línea de label con las relaciones y un enlace subrayado en tinta.

### Character panel (carta)
- **Número:** "001/032" a mano en tinta sobre la viñeta.
- **Viñeta:** proporción 3:4, borde de tinta de 2px, radio 0, imagen a todo color dentro (único sitio con color pleno); al pasar, la imagen crece a 1.03 en 300ms ease-out. Sin imagen: "Sin imagen" en label tinta suave sobre papel.
- **Nuevo:** recuadro del editor (contorno 2px, separación 4px) y nota "¡nuevo!" a mano en editor-ink bajo el nombre.
- **Coleccionado:** nota "coleccionado" a mano en editor-ink bajo el nombre.
- **Favorito:** corazón relleno de 14px en tinta junto al nombre, con texto oculto "(favorito)".

### Locked panel (viñeta por dibujar)
Solo lápiz azul: viñeta 3:4 con borde de 1,5px y aspa de 1px, y el número a mano en blue-ink. Ni nombre, ni imagen, ni id: del bloqueado solo viaja su número de catálogo.

### Cast page (página de reparto)
La página de presentación de personajes: un protagonista en grande y su reparto agrupado por tipo, rotulado a mano. Sin grafo, sin líneas cruzadas: la relación se lee en el rótulo.
- **Cajetín:** `PageHeader` con el título "Universo de X" y el recuento a mano de relaciones descubiertas sobre el total, con tres cifras ("066/179").
- **Tira de protagonistas:** miniaturas 3:4 de 48px con borde de tinta de 2px, del más conectado al menos. En móvil, una fila deslizable con snap; desde lg, una fila de 12 y el resto en un `<details>` nativo "Ver todo el reparto (N)", abierto si el protagonista está fuera de la primera fila. El activo lleva un contorno de tinta de 3px separado 2px (aria-current="page"); el foco del teclado conserva el contorno de 2px del editor.
- **Protagonista:** viñeta 3:4 grande, nombre en display (800, 1.5rem y 1.875rem desde md), estado como nota a mano en editor-ink, nombre real y cómics leídos en body, y enlace subrayado "Ver su ficha" con zona táctil de 44px.
- **Grupos:** orden fijo aliados, enemigos, familia, pareja, compañeros, rivales, aparecen juntos (los tipos desconocidos caen en "aparecen juntos"). Cabecera con el rótulo a mano (hand label) y el número de miembros a mano en tinta suave, sobre un filete de tinta de 2px. Cada miembro es una viñeta 3:4 con el nombre (title), la nota del editor "¡nuevo!" con su recuadro o "coleccionado", y "N cómics juntos" en label tinta suave. Tocar un miembro lo hace protagonista.
- **Por descubrir:** el mismo bloque en lápiz azul: rótulo y número a mano en blue-ink sobre un filete azul de 1,5px, hasta 6 viñetas por dibujar con aspa (aria-hidden) y una línea que da solo el número. Sin nombres, ni imágenes, ni números de catálogo: del bloqueado solo viaja cuántos son.
- **Movimiento:** al cambiar de protagonista, las viñetas de cada grupo se entintan en cascada con pop-in, 45ms entre una y otra y como mucho 8 pasos (360ms); solo con motion-safe.

### Browser chrome
Selección de texto en color del editor con texto en papel; foco visible como contorno de 2px en color del editor separado 2px; cursor y controles nativos (accent-color) en color del editor; barras de progreso en tinta sobre papel trabajado.

## Do's and Don'ts

### Do:
- **Do** separar zonas con filetes de tinta de 2px y cambios de papel (paper, sheet, sheet-raised).
- **Do** marcar lo seleccionado con tinta llena y texto en cartulina, en navegación lateral y pestañas por igual.
- **Do** usar el color del editor solo para identidad, sección activa, lo nuevo y lo coleccionado, siempre por los tokens `--editor` / `--editor-ink`.
- **Do** cambiar de editorial con `data-publisher="dc"` en un contenedor, sin tocar componentes.
- **Do** escribir números de catálogo y recuentos a mano en Caveat, con tres cifras y su total.
- **Do** dibujar los personajes bloqueados solo en lápiz azul y con su número, nada más.
- **Do** usar los iconos SVG propios de `icons.tsx` (trazo 1,5px, currentColor).
- **Do** mantener zonas táctiles de 44px y contraste AA en todo texto (editor-ink y blue-ink existen para eso).

### Don't:
- **Don't** usar el color del editor en favoritos, decoración, fondos ni iconos en reposo.
- **Don't** poner color pleno fuera de las viñetas (portadas e imágenes).
- **Don't** poner cuadrícula, puntos, tramas ni texturas en el fondo.
- **Don't** usar píldoras ni esquinas redondeadas (salvo el círculo del avatar), sombras, glow ni degradados (salvo el bloque de la editorial).
- **Don't** usar emojis ni caracteres Unicode como iconos.
- **Don't** usar logos ni tipografías de Marvel o DC: la editorial se expresa solo con color.
- **Don't** usar lápiz azul (blue) como texto ni como relleno.
- **Don't** añadir tema oscuro: el sistema es solo claro.
- **Don't** escribir estilos sueltos para cabeceras, pestañas, botones, campos o paginación: usa las piezas de `src/components/ui/page-parts.tsx` (`PageHeader`, `HeaderField`, `SectionHeading`, `Pagination`, `inkTab`, `inkButton`, `outlineButton`, `quietLink`, `inkField`).
