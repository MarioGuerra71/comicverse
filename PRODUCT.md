# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dos públicos con el mismo peso (confirmado por el usuario, 2026-10-06):

- **Lectores de cómics** que llevan sus lecturas semana a semana: añaden cómics a su biblioteca, los marcan como leídos y vuelven para ver crecer su colección. Uso real y repetido, en escritorio, tablet y móvil.
- **Entrevistadores técnicos y de producto** que ven ComicVerse como proyecto de portfolio en una demo de pocos minutos: deben entender el concepto rápido y notar calidad de diseño e ingeniería.

El diseño debe aguantar uso diario y, a la vez, tener momentos que luzcan en una demo.

## Product Purpose

Descubrir, coleccionar y organizar cómics y personajes (empieza con Marvel; preparado para DC y otras editoriales). Ciclo central: leer → descubrir personajes → desbloquear cartas → descubrir relaciones → expandir el grafo → completar el universo. Éxito: el lector vuelve para seguir completando su colección.

## Positioning

"Descubrir el universo mientras lees": el usuario no ve todo desde el principio. Cada cómic marcado como **Leído** desbloquea a los personajes que aparecen en él; sin leer, un personaje es solo una silueta "?". Es un sistema de colección y progreso de videojuego aplicado a la lectura real de cómics, no un catálogo ni una wiki.

**La colección es el corazón del producto** (confirmado por el usuario): ver tus cartas crecer y completarse, como un álbum de cromos. El desbloqueo es el momento que la alimenta; la biblioteca, el grafo y el dashboard la rodean.

## Operating Context

- Navegación principal: Inicio (dashboard), Catálogo, Biblioteca, Colección, Grafo; perfil aparte.
- Flujo típico: buscar un cómic en el catálogo → ficha del cómic → marcar estado (Pendiente, Leyendo, Leído, Abandonado), puntuar 1–5, favorito, reseña privada → animación de desbloqueo → colección / ficha de personaje / grafo.
- Cartas de personaje con tres estados: bloqueada (silueta "?", sin nombre ni imagen), descubierta, coleccionada (≥ 5 cómics leídos).
- Textos de interfaz en español; contenido de cómics (títulos, descripciones) en inglés, tal como viene de Comic Vine.

## Capabilities and Constraints

- Universo semilla actual: 4 series de Spider-Man (833 cómics) y 32 personajes coleccionables; 179 relaciones (59 curadas con tipo: aliado, enemigo, familia, pareja, compañero, rival; el resto "aparecen juntos"). Se ampliará por tandas.
- **Spoilers:** nada de un personaje bloqueado (nombre, imagen, id) llega al navegador; solo contadores. Esconder con CSS no vale.
- Datos e imágenes de **Comic Vine** (uso no comercial, atribución obligatoria visible). Imágenes enlazadas desde `comicvine.gamespot.com`, de calidad y encuadre variables (portadas y retratos de distintas épocas, de 1962 a hoy).
- **No se puede usar la marca de Marvel**: ni logos, ni tipografías, ni identidad visual propia de Marvel.
- Coste cero: solo herramientas y servicios gratuitos. Next.js 16, Tailwind v4, despliegue previsto en Vercel.
- CSP estricta: cualquier dominio externo nuevo (fuentes, imágenes) debe añadirse a la política; las fuentes deben servirse desde el propio proyecto.
- El grafo actual no convence al usuario y se replanteará en el rediseño.

## Brand Commitments

- Nombre: **ComicVerse** (se mantiene). Logo y tipografía por decidir.
- **Paleta por editorial (requisito fijado por el usuario, 2026-10-07):** al estar en la zona de Marvel (sus cómics, personajes, colección), la interfaz usa una paleta **inspirada** en Marvel (rojo intenso); en la de DC, una inspirada en DC (azul). El sistema debe permitir cambiar de paleta por editorial sin rehacer componentes. Solo color: **nunca** logos, tipografías ni elementos de identidad de las editoriales (ver restricción de marca).
- El usuario **rechaza** el primer estilo construido («Atlas estelar»: azul de Prusia casi negro + dorado + romana grabada) por parecer genérico, «de IA». No volver a esa combinación.
- Tono pedido: moderno y profesional, **no infantil**. Referencias de producto citadas por el usuario: interfaces de videojuegos/RPG, apps de coleccionismo, streaming, Goodreads, Letterboxd, MyAnimeList. Evitar exceso de colores, sombras y animaciones, y el diseño sobrecargado.

## Evidence on Hand

- Datos reales en la base de datos local: 833 cómics con portada, 32 personajes con imagen, relaciones y descripciones (`data/universe.json`, `data/relationships.json`).
- No existen logo, ilustraciones propias, capturas de marketing, testimonios ni métricas de uso: no inventarlos.

## Product Principles

1. **La colección es la recompensa**: cada pantalla debe hacer sentir el progreso hacia completar el universo.
2. **El misterio es parte del producto**: lo bloqueado se muestra como ausencia, nunca se insinúa con datos.
3. **Primero el uso real**: rápido y claro para quien vuelve cada semana; los momentos de lucimiento no estorban la tarea.
4. **Honestidad con la fuente**: los datos son de Comic Vine y se atribuyen; nada se presenta como oficial de Marvel.

## Accessibility & Inclusion

Etiquetas en todos los campos, `role="alert"` en errores, `aria-label` en navegación y controles, objetivos táctiles ≥ 44 px, `lang="es"`, respeto a "reducir movimiento", y vista en lista como alternativa al grafo.
