---
name: ComicVerse
description: Descubre el universo de los cómics mientras lo lees.
colors:
  night: "#0b1220"
  plate: "#15233f"
  plate-raised: "#1c2d50"
  line: "rgb(127 147 184 / 0.28)"
  line-strong: "rgb(127 147 184 / 0.55)"
  star: "#eef1f7"
  dim: "#a9b6ce"
  gold: "#e2b04a"
  danger: "#f08a7e"
typography:
  display:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.11
    letterSpacing: "0.025em"
  headline:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.025em"
  brand:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0.025em"
  counter:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    fontFeature: "tnum"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
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
    fontFeature: "tnum"
  nav-label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.33
rounded:
  sm: "4px"
  md: "6px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  touch: "44px"
components:
  nav-item:
    textColor: "{colors.dim}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  nav-item-active:
    backgroundColor: "{colors.plate-raised}"
    textColor: "{colors.star}"
    rounded: "{rounded.md}"
  bottom-tab:
    textColor: "{colors.dim}"
    typography: "{typography.nav-label}"
    height: "64px"
  bottom-tab-active:
    textColor: "{colors.star}"
  filter-pill:
    textColor: "{colors.dim}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  filter-pill-active:
    backgroundColor: "{colors.plate-raised}"
    textColor: "{colors.star}"
    rounded: "{rounded.md}"
  character-card:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.star}"
    rounded: "{rounded.sm}"
  locked-slot:
    backgroundColor: "{colors.night}"
    textColor: "{colors.line-strong}"
    rounded: "{rounded.sm}"
  sky-chart:
    backgroundColor: "{colors.night}"
    rounded: "{rounded.md}"
---

# Design System: ComicVerse

## Overview

**Creative North Star: "Atlas estelar"**

La colección es un cielo nocturno grabado: leer enciende estrellas. El sistema es una carta celeste de noche, pensada para el móvil en el sofá justo después de leer. Suelo azul de Prusia casi negro, planchas un tono más claras, filetes de grabado de 1 px y texto en blanco estelar. Hay pocos valores y casi ningún adorno: la profundidad y el orden vienen del filete y del cambio de tono, nunca del brillo.

El único color con voz es el dorado, y está racionado: marca lo coleccionado, lo recién descubierto (hasta que se ha visto) y el foco del teclado. Los rótulos usan una romana grabada de mayúsculas (Marcellus) solo para la marca, los títulos de página y el "Nº" de catálogo; todo lo demás es Geist con cifras tabulares. Las portadas e imágenes de personaje se muestran como láminas sin tintar.

Rechazos confirmados: el "streaming oscuro con un acento neón" y el pop-art de tramas. Solo hay tema oscuro (`color-scheme: dark`), elegido por la escena de uso; no existe tema claro.

**Cobertura.** El sistema está aplicado en el shell privado (barra superior y barra inferior en el móvil, carril de iconos en tablet, barra lateral en escritorio, pie de atribución), en Mi colección (cielo y rejilla de cartas) y en la 404. El resto de pantallas (inicio, catálogo, ficha de cómic, biblioteca, ficha de personaje, universo, acceso) todavía no se han rediseñado: heredan el suelo y el texto a través de los alias genéricos `background` / `foreground` y siguen usando sus clases antiguas (`bg-foreground`, `border-foreground/20`…). Al rediseñarlas, deben pasar a los tokens con nombre de este documento.

**Key Characteristics:**
- Solo tema oscuro; suelo `night`, planchas `plate` / `plate-raised`.
- Filetes de 1 px en azul pálido translúcido como única estructura.
- Dorado reservado a coleccionado, nuevo y foco.
- Romana grabada para marca, títulos y "Nº"; Geist tabular para la interfaz y las cifras.
- Iconos SVG propios de trazo 1,5 px sobre rejilla de 24.
- Nada bloqueado se revela: un hueco solo muestra su número de catálogo.

## Colors

Una noche de pocos valores: tres azules de suelo y plancha, dos tintas de texto, un dorado racionado y un rojo de error.

### Primary
- **Dorado de constelación** (gold): estrellas y cartas coleccionadas (relleno de la estrella, filete de la carta, marca de estrella junto al número), el aro y la etiqueta "Nuevo" de lo recién descubierto, el contorno de foco (2 px, separación 2 px), la selección de texto (sobre `night`), el cursor de escritura y `accent-color` de los controles nativos.

### Neutral
- **Noche de Prusia** (night): suelo de todas las pantallas y de la barra superior del móvil; color del halo detrás de los rótulos del cielo.
- **Plancha** (plate): barra lateral, barra inferior, fondo de las láminas y de las barras de progreso nativas. Al 40 % de opacidad, fondo del cielo; al 30 %, fondo del hueco bloqueado.
- **Plancha alzada** (plate-raised): elemento de navegación o filtro activo; al 60 % de opacidad, su estado hover.
- **Filete** (line): bordes de barras, tarjetas, pills inactivas, pie y graduación del cielo.
- **Filete marcado** (line-strong): borde de la pill activa y del avatar, elipse exterior del cielo, líneas de constelación, puntos de personajes bloqueados, "?" del hueco bloqueado, barra de scroll.
- **Blanco estelar** (star): texto principal, estrellas descubiertas, enlaces subrayados, valor de las barras de progreso. 15,9:1 sobre `night`.
- **Tinta tenue** (dim): texto secundario, iconos y etiquetas inactivas, placeholders, rótulos del cielo. 9:1 sobre `night`, 7:1 sobre `plate`.
- **Rojo de error** (danger): mensajes de error. 7:1 sobre `night`. Definido en el sistema; aún sin uso en las pantallas rediseñadas.

### Named Rules
**The Gold Ration Rule.** El dorado solo significa "coleccionado", "nuevo hasta que se ve" o "foco". Nunca decora, nunca marca un estado activo de navegación (eso es `plate-raised` + `star`) y nunca es un botón.

**The No Glow Rule.** Sin brillos, sin sombras de color y sin degradados en el texto. Una estrella destaca por tamaño y relleno, no por halo luminoso.

## Typography

**Display Font:** Marcellus (con Georgia, serif), peso 400, servida desde el propio dominio con next/font.
**Body Font:** Geist (con system-ui, sans-serif).
**Label/Mono Font:** Geist Mono está cargada pero sin uso en las pantallas rediseñadas.

**Character:** Una romana de inscripción, como los rótulos de un atlas grabado, sobre una sans neutra y precisa. La romana nombra; la sans informa.

### Hierarchy
- **Display** (Marcellus 400, 36 px en md+, interlineado 1,11, tracking 0,025em): título de página ("Mi colección").
- **Headline** (Marcellus 400, 30 px, 1,2): el mismo título en el móvil; título de la 404.
- **Brand** (Marcellus 400, 18 px, tracking 0,025em): la palabra ComicVerse junto a la marca de estrella.
- **Counter** (Geist 600, 24 px, tabular): la cifra principal de progreso ("6 / 32").
- **Title** (Geist 500, 14 px, 1,25): nombre del personaje bajo la lámina.
- **Body** (Geist 400, 14 px, 1,43): texto de interfaz, navegación, filtros; párrafos limitados a `max-w-prose`.
- **Label** (Geist 400, 12 px): número de catálogo, nombre real, "cómics leídos", pie de atribución.
- **Nav label** (Geist 500, 11 px): etiqueta bajo el icono en la barra inferior.

### Named Rules
**The Tabular Rule.** Todas las cifras son tabulares (`font-variant-numeric: tabular-nums` en `body`): los contadores no bailan al cambiar.

**The Catalog Number Rule.** El número de catálogo se escribe "Nº 014 / 032": "Nº" en Marcellus, cifras en Geist tabular a tres dígitos, el total en `dim`. Las cifras nunca van en Marcellus por debajo de tamaño de título: a 12-14 px su 0 y su 1 se leen como O e I.

**The Engraved Title Rule.** Marcellus solo para marca, títulos de página, "Nº" y rótulos del cielo. Nunca para párrafos, botones ni etiquetas.

## Layout

- **Shell.** Móvil (< 768 px): barra superior pegajosa de 56 px (marca a la izquierda, avatar a la derecha) y barra inferior fija de 5 pestañas de 64 px de alto con `safe-area-inset-bottom`; el contenido reserva 80 px abajo. Tablet (md, 768 px): carril lateral fijo de 80 px solo con iconos (la marca queda en `sr-only`). Escritorio (lg, 1024 px): barra lateral de 240 px con iconos, etiquetas y marca. Perfil y "Cerrar sesión" van al pie de la barra lateral, separados por un filete.
- **Contenido.** Ancho máximo 72 rem (`max-w-6xl`), centrado; márgenes de 16 px en el móvil y 32 px desde md; 24 px arriba en el móvil, 32 px desde md.
- **Rejilla de cartas.** 3 columnas en el móvil, 4 desde sm, 5 desde md, 6 desde lg; separación de 12 px en horizontal y 24 px en vertical.
- **Filas de controles.** En el móvil, los filtros y la ordenación se desplazan en horizontal en una sola línea (sin barra de scroll visible) en vez de partirse; desde lg se reparten a los extremos de una fila.
- **Ritmo.** Pasos de 8 / 12 / 16 / 24 / 32 px. Todo objetivo táctil mide al menos 44 px (`min-h-11`), aunque se vea más pequeño.
- **Pie de atribución.** "Datos e imágenes de cómics proporcionados por Comic Vine" en todas las pantallas privadas, 12 px `dim` con enlace en `star`, sobre filete superior.

### Named Rules
**The Fixed Slot Rule.** En orden de catálogo y sin filtro, cada hueco ocupa siempre su sitio: al desbloquear un personaje la casilla cambia de estado en su lugar y la rejilla no se recoloca.

## Elevation & Depth

Sistema plano. No hay `box-shadow` en ningún componente. La profundidad se construye con tono (suelo `night` < plancha `plate` < plancha alzada `plate-raised`) y con filetes de 1 px. Las barras de navegación son planchas sobre el suelo, separadas por un filete; el cielo es una plancha translúcida al 40 %.

### Named Rules
**The Plate Not Shadow Rule.** Para separar o elevar algo, sube un tono de plancha o añade un filete. Nunca una sombra.

## Shapes

Esquinas casi rectas, como planchas de imprenta. Las láminas (cartas y huecos) usan 4 px (`rounded.sm`), proporción 3:4 y un filete de 1 px. Los contenedores interactivos (navegación, pills, cielo) usan 6 px (`rounded.md`). Lo circular queda para lo que es un punto: avatar con la inicial, punto de la pestaña activa, estrellas. Los iconos son trazos de 1,5 px con extremos y uniones redondeados en una rejilla de 24, en `currentColor`; la marca es una estrella de cuatro puntas rellena.

## Components

### Navegación
Carril tranquilo: lo activo se ilumina en blanco, no en color.
- **Barra lateral / carril:** elementos de 44 px de alto, 6 px de radio, icono de 24 px + etiqueta de 14 px (etiqueta solo en lg). Inactivo `dim`; hover `star` sobre `plate-raised` al 60 %; activo `star` sobre `plate-raised`, con `aria-current="page"`.
- **Barra inferior (móvil):** 5 columnas iguales (Inicio, Catálogo, Biblioteca, Colección, Universo), icono de 22 px sobre etiqueta de 11 px. Inactiva `dim`; activa `star` con un punto de 4 px en `star` en el borde superior: la pestaña "se enciende".
- Cada sección agrupa sus rutas hijas (la ficha de un personaje pertenece a Colección).

### Chips (filtros)
- **Style:** pill de 44 px de alto, 6 px de radio, 12 px de relleno lateral, filete `line`, texto `dim`, con el recuento a continuación en `dim`.
- **State:** activa con filete `line-strong`, fondo `plate-raised` y texto `star`; hover sube el filete a `line-strong` y el texto a `star`.
- **Ordenación:** secundaria, enlaces de texto sin caja (44 px de alto por relleno); el activo en `star` subrayado a 6 px, los demás en `dim`.

### Cards / Containers (láminas de personaje)
- **Corner Style:** 4 px.
- **Background:** imagen sin tintar a sangre sobre `plate`; sin imagen, "Sin imagen" en `dim`.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** filete `line`; `gold` si está coleccionada o es nueva.
- **Debajo de la lámina:** número de catálogo (Catalog Number Rule) con "Nuevo" en `gold` o, si está coleccionada y ya vista, la marca de estrella de 12 px en `gold`; nombre en Title con corazón relleno si es favorito; nombre real y "N cómics leídos" en Label `dim`.
- **Hover:** la imagen escala a 1,03 en 300 ms ease-out.

### Hueco bloqueado
Ausencia, no misterio. Misma lámina 3:4 de 4 px con filete `line` sobre `plate` al 30 %, un "?" en Marcellus de 30 px en `line-strong` y el número de catálogo al 70 % de opacidad. Ningún nombre, imagen ni id llega al navegador; "por descubrir" solo existe en el `aria-label`. No es enlace.

### Tu cielo (componente firma)
Una carta celeste grabada en SVG del servidor, sin JavaScript (viewBox 1000 × 360), dentro de una plancha al 40 % con filete y 6 px de radio.
- **Grabado:** elipse exterior en `line-strong`, 120 marcas de graduación en `line` (una larga cada 10), elipse interior y eclíptica punteadas (2 6). Trazos de 1 px que no escalan.
- **Posiciones:** espiral de girasol (ángulo áureo) que depende solo del número de catálogo, así un hueco bloqueado ocupa su sitio sin revelar quién es.
- **Estrellas:** descubiertas en `star`, coleccionadas en `gold`; el radio crece con lo leído (7 + 1,6 por cómic, hasta 5). Recién descubiertas con un aro `gold` de 2,5 px. Bloqueadas: puntos de radio 4 en `line-strong`, sin enlace.
- **Constelaciones:** solo relaciones curadas descubiertas, en `line-strong`, como máximo 3 por estrella (las de más cómics juntos).
- **Rótulos:** solo desde md, solo para coleccionadas, nuevas o con 3+ cómics; Marcellus 17 en `dim` con halo `night` de 6 px para que las líneas no los tachen; se colocan a la derecha, si chocan a la izquierda, y si chocan en ambos lados se omiten.
- **Interacción:** estrellas pulsables solo desde md (en el móvil quedan demasiado juntas; las cartas llevan los mismos enlaces); hover y foco escalan la estrella a 1,25 en 200 ms.

### Movimiento
- **Pop-in** (400 ms, `cubic-bezier(0.16, 1, 0.3, 1)`; de opacidad 0, 8 px abajo y escala 0,95 a reposo): animación de desbloqueo, siempre tras `motion-safe:`.
- Transiciones de color de 150 ms por defecto en navegación y filtros.

## Do's and Don'ts

### Do:
- **Do** usar los tokens con nombre (`night`, `plate`, `plate-raised`, `line`, `line-strong`, `star`, `dim`, `gold`, `danger`) en toda pantalla nueva o rediseñada.
- **Do** reservar `gold` a coleccionado, nuevo-hasta-visto y foco (Gold Ration Rule).
- **Do** escribir los números de catálogo como "Nº 014 / 032" con "Nº" en Marcellus y cifras en Geist tabular.
- **Do** separar con filetes de 1 px y con tonos de plancha, no con sombras.
- **Do** dar 44 px de zona táctil a todo control, aunque se dibuje más pequeño.
- **Do** dibujar iconos nuevos con trazo de 1,5 px en rejilla de 24, extremos redondeados y `currentColor`.
- **Do** mostrar un personaje bloqueado solo por su número de catálogo.
- **Do** mantener visible en todas las pantallas el pie de atribución a Comic Vine.

### Don't:
- **Don't** usar brillos, sombras de color, neones ni degradados en el texto.
- **Don't** introducir tramas ni recursos de pop-art.
- **Don't** añadir un tema claro: el sistema es solo oscuro.
- **Don't** usar emojis ni símbolos Unicode (★, ♥, →) como iconos; los iconos son los SVG propios. El "?" grabado del hueco bloqueado es un rótulo tipográfico, no un icono.
- **Don't** poner cifras en Marcellus a tamaño de texto o etiqueta.
- **Don't** exponer nombre, imagen o id de un personaje bloqueado, ni en el HTML.
- **Don't** tintar las portadas ni las imágenes de personaje.
- **Don't** dibujar en el cielo las relaciones de "aparecen juntos" ni más de 3 líneas por estrella; esas van en Universo.
