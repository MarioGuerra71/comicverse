# CLAUDE.md — ComicVerse

> Contexto permanente del proyecto. Léelo entero antes de tocar código.
> Si algo de este archivo contradice el código real, **gana el código**: avisa al usuario y propón actualizar este archivo.
> Mantén la sección 17 (Estado y pendientes) al día al terminar cada paso.

---

## 1. Qué es ComicVerse

Aplicación web (responsive: escritorio, tablet y móvil) para **descubrir, coleccionar y organizar cómics y personajes**. Empieza con **Marvel** y la arquitectura queda preparada para añadir **DC y otras editoriales**.

Es un **proyecto de portfolio** pensado para enseñarse en entrevistas de trabajo: debe verse y estar construido de forma profesional (arquitectura limpia, tests, README, seguridad), pero **sin ningún coste** (ver regla 1).

Idea diferencial: **"Descubrir el universo mientras lees"**. El usuario no ve todo desde el principio: cada vez que marca un cómic como **Leído**, desbloquea los personajes que aparecen en él, con lo que se amplía su colección, sus relaciones y su grafo personal. Se parece a un sistema de colección/progreso de videojuego aplicado a los cómics.

Ciclo central del producto:

> Leer → descubrir personajes → desbloquear cartas → descubrir relaciones → expandir el grafo → completar el universo

La IA es una **capa futura opcional**; la experiencia principal no depende de ella.

---

## 2. Cómo trabajar con el usuario (OBLIGATORIO)

- **Idioma:** responde siempre en **español**. Identificadores de código, nombres de archivos y mensajes de commit en **inglés**; comentarios, textos de interfaz y nombres de los tests (`it("...")`) en **español**.
- **Perfil del usuario:** desarrollador web junior que viene de PHP/MySQL. Es la primera vez que usa Next.js, Prisma, TypeScript estricto, Docker y tests automáticos. Explica cada concepto nuevo con una analogía cotidiana breve y evita dar nada por sabido.
- **Ritmo:** un paso pequeño cada vez. Para cada paso: **qué hacemos, por qué y cómo comprobarlo**. No pases al siguiente hasta que el anterior esté verificado (`npm test`, `npm run typecheck`, `npm run lint` y prueba manual si procede).
- Indica **siempre qué archivo creas o modificas y por qué**. Entrega archivos completos cuando haga falta. **No elimines funcionalidad existente sin avisar.**
- Si hay varias opciones técnicas, explica brevemente las diferencias y **recomienda una** sin introducir complejidad innecesaria.
- Antes de instalar una dependencia: justifícala y confirma que es **gratuita**. No añadas tecnologías "por añadirlas".
- Al terminar un paso, **propón un mensaje de commit** (estilo Conventional Commits en inglés: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`).
- Entorno del usuario: **Windows + PowerShell**. Da los comandos para PowerShell.
- **Verifica antes de afirmar.** Lección aprendida en este proyecto: una API externa puede ignorar filtros u órdenes sin avisar, y PowerShell puede dar cuentas falsas (`@($null).Count` vale 1). Comprueba los datos reales antes de dar algo por bueno, y dilo claramente cuando algo no esté verificado.
- Los avisos de seguridad (`npm audit`) se explican y se deciden con el usuario; **nunca** ejecutes `npm audit fix --force`.

---

## 3. Reglas inquebrantables

1. **Coste cero.** No usar ni proponer servicios, apps o planes de pago. Solo opciones gratuitas, sin tarjeta. La IA se implementará únicamente si el usuario decide asumir ese coste. (Los planes gratuitos de terceros pueden cambiar: comprobar sus condiciones vigentes antes de depender de ellos.)
2. **El desbloqueo lo decide el backend**, nunca el frontend. Invariante: *un personaje está desbloqueado para un usuario si y solo si existe al menos un cómic marcado como Leído por él en el que aparece.*
3. **Spoilers: por defecto no se revela nada.** Los DTO nunca incluyen nombres, imágenes ni datos de personajes bloqueados; solo contadores. Esconder algo con CSS no cuenta: si llega al navegador, ya se ha filtrado.
4. **El usuario sale siempre de la sesión del servidor.** Ningún endpoint acepta un `userId` enviado por el cliente.
5. **Toda entrada se valida en el servidor con Zod** (query, body, params). No confiar en datos del frontend.
6. **Secretos solo en variables de entorno** validadas en `src/lib/env.ts`. Nunca `NEXT_PUBLIC_` para claves. La clave de Comic Vine solo la usa el servidor. `.env` nunca se sube a Git; `.env.example` sí (sin secretos reales).
7. **Texto externo → texto plano.** Las descripciones de Comic Vine vienen en HTML editable por cualquiera: se convierten con `htmlToText` al importarlas. Nunca usar `dangerouslySetInnerHTML` con datos externos.
8. **Capas separadas.** Nada de `src/server/**` se importa desde componentes cliente. La lógica de negocio no vive en componentes visuales.
9. **Fuentes externas solo detrás de `ComicSourceProvider`** (carpeta `integrations/comic-sources`). Los ids externos nunca son claves primarias; cada fila guarda `source` + `externalId`.
10. **La lógica de desbloqueo debe tener tests**, incluidos de integración contra PostgreSQL real.
11. **Versiones fijadas:** `prisma@7` y `@prisma/client@7` (la etiqueta `latest` de `prisma` apuntó a una RC de la 8; no actualizar sin acuerdo) y `@types/node@24`.
12. **Atribución y licencia:** mostrar enlace a Comic Vine donde se muestren sus datos (ya está en el footer del layout privado). Su API es de **uso no comercial**: documentarlo en el README.

---

## 4. Stack y versiones

| Capa | Elección | Notas |
|---|---|---|
| Framework | Next.js **16.3.7** (App Router, Turbopack), React, TypeScript **5.9** estricto | Monolito modular; carpeta `src/`, alias `@/*` |
| Estilos | Tailwind CSS **v4** (configuración en CSS, sin `tailwind.config`) | Variables de la plantilla: `bg-foreground`, `text-background`, `border-foreground/20` (modo claro/oscuro) |
| Validación | Zod **4** (`z.uuid()`, `z.url()` a nivel raíz) | Compartida cliente/servidor |
| BD | PostgreSQL **17** en Docker Compose (local) | Producción prevista: Neon o Supabase (planes gratuitos) |
| ORM | Prisma **7.10.0** + `@prisma/adapter-pg` + `pg` | Cliente generado en `generated/prisma` (ignorado por Git) |
| Autenticación | Better Auth **1.7.x** con adaptador Prisma | Email + contraseña; sesiones en BD con cookie; **sin verificación de email** (requeriría servicio de correo) |
| Tests | Vitest **5** (`tests/unit` y `tests/integration`) | Integración contra PostgreSQL real (`comicverse_test`) |
| Scripts | `tsx` (con `--env-file=.env`) | Importadores y utilidades de consola |
| Node / npm | Node **24** LTS, npm **11** | Gestor: **npm** (no pnpm/yarn) |
| Grafo | React Flow (`@xyflow/react` **12.12**, MIT) + `d3-force` **3** (ISC) para el layout, instalados en el Paso 35 | Plan B si hay miles de nodos: Sigma.js |
| Estado cliente (cuando haga falta) | TanStack Query | Aún no instalado |
| UI (cuando haga falta) | shadcn/ui (Radix) copiado al repo; Motion solo para la animación de desbloqueo | Aún no instalado |
| Despliegue previsto | Vercel (plan gratuito, dominio `*.vercel.app`) + Neon/Supabase | Verificar condiciones vigentes de los planes gratuitos |

Datos externos: **Comic Vine** (clave gratuita). La API oficial de Marvel ya no existe; la API no oficial `marvel.emreparker.com` solo tiene issues/series/creadores (sin personajes ni eventos) y se descartó como fuente principal.

---

## 5. Entorno y comandos

Requisitos locales: Node 24, npm, Git, **Docker Desktop abierto** (los comandos `docker` no funcionan si no está en marcha).

```powershell
docker compose up -d                 # arranca PostgreSQL (contenedor comicverse-db, puerto 5432)
npm install
npx prisma generate                  # genera el cliente (obligatorio tras clonar o cambiar el schema)
npx prisma migrate dev --name xxx    # crea y aplica una migración
npx prisma studio                    # explorador de datos
npm run dev                          # http://localhost:3000
npm test                             # Vitest (una vez)
npm run test:watch
npm run test:integration             # tests contra PostgreSQL real (BD comicverse_test; Docker en marcha)
npm run typecheck                    # tsc --noEmit
npm run lint
npm run universe:resolve             # resuelve candidatos -> data/universe.resolved.json (no versionado)
npm run universe:import              # importa el universo semilla a PostgreSQL (repetible)
npm run relationships:suggest        # aliados/enemigos de Comic Vine dentro del universo -> data/relationships.suggested.json (no versionado)
npm run relationships:import         # carga data/relationships.json (curado) en la BD; repetible, sin Comic Vine
npm run releases:sync -- 3           # novedades de Marvel/DC de los últimos 3 días (lo mismo que el cron diario)
```

Variables de entorno (en `.env`; plantilla en `.env.example`):

| Variable | Uso |
|---|---|
| `DATABASE_URL` | `postgresql://comicverse:comicverse_dev@localhost:5432/comicverse?schema=public` (credenciales **solo de desarrollo**) |
| `BETTER_AUTH_SECRET` | ≥ 32 caracteres; generar con `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`; distinto en producción |
| `BETTER_AUTH_URL` | `http://localhost:3000`. En Vercel se omite: `env.ts` usa `https://${VERCEL_PROJECT_PRODUCTION_URL}` (por eso el acceso solo funciona en producción, no en las vistas previas) |
| `COMIC_VINE_API_KEY` | Clave gratuita de comicvine.gamespot.com/api; opcional en la app (`env.ts`): sin ella no hay búsqueda ni importación desde la web; **necesaria en Vercel** para la búsqueda en Comic Vine |

Particularidades que ya han dado problemas:

- Los archivos de configuración de Prisma se llaman **`prisma7.config.ts`** (así lo generó `prisma init`); no renombrar sin motivo.
- Prisma 7 **no genera el cliente al migrar**: ejecutar `npx prisma generate`.
- Si `prisma migrate dev` falla con «non-interactive» (pasa al añadir un `@unique`, porque pide confirmación): generar el SQL con `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` en una carpeta `prisma/migrations/<fecha>_<nombre>/migration.sql` y aplicarlo con `npx prisma migrate deploy` (no pregunta).
- `prisma migrate dev --create-only` **aplica antes las migraciones pendientes** (y si no hay cambios crea una vacía): para añadir SQL a mano (p. ej. un `CHECK`), crear la migración con `--create-only` **una sola vez**, editarla y luego `prisma migrate dev`. No editar migraciones ya aplicadas (obliga a reiniciar la BD).
- Tras `prisma generate`, **reiniciar `npm run dev`**: `src/lib/db.ts` guarda el cliente en `globalThis` y el servidor sigue usando el antiguo (síntoma: `Cannot read properties of undefined (reading 'findUnique')` en un modelo nuevo).
- `npm run build` y `npm run dev` comparten la carpeta `.next`: parar el servidor de desarrollo antes de compilar.
- Solo puede haber un `next dev` por carpeta: si ya hay uno abierto, otro no arranca (sale en el 3001 y se cierra). Si el usuario tiene el suyo abierto, probar contra ese y **no cerrarlo**.
- Rutas con corchetes o paréntesis (`[id]`, `(app)`, `[...all]`): crearlas desde el explorador de VS Code o con `-LiteralPath`; PowerShell las interpreta como comodines.
- Los scripts de consola no pueden usar `src/lib/db.ts` (lleva `import "server-only"`); crean su propio `PrismaClient` con `PrismaPg`.
- Avisos `LF will be replaced by CRLF` de Git en Windows: inofensivos.
- En Next 16 `params`, `searchParams` y `headers()` son **asíncronos** (`await`).

---

## 6. Arquitectura

Monolito modular en una sola app Next.js. El código de servidor vive en `src/server/` y **no importa nada de React**.

```
Cliente (React)
   │  HTTP JSON  /api/v1/...   (las páginas de servidor llaman a los servicios directamente)
Route Handlers ── sesión · validación Zod · códigos HTTP
   │
Services ── reglas de negocio + transacciones
   │                  │
Domain (puro,         Repositories (Prisma) ──► PostgreSQL
sin BD ni HTTP)
   │
Integrations ── ComicSourceProvider (Comic Vine) · AIProvider (futuro)
```

Convenciones de capas:

- **Route handlers** (`src/app/api/v1/**/route.ts`): solo HTTP (sesión, validación, llamar al servicio, traducir a 200/400/401/404).
- **Servicios** (`server/services`): reciben `db: PrismaClient` **como parámetro** (no lo importan); abren `db.$transaction(...)` cuando varias escrituras deben ser atómicas.
- **Repositorios** (`server/repositories`): lo único que conoce Prisma; aceptan `PrismaClient | Prisma.TransactionClient` para poder usarse dentro de transacciones. Los `select` compartidos se exportan como constantes (`comicListSelect`).
- **Dominio** (`server/domain`): funciones puras y testeables (`getCardState`, `applyStatusChange`).
- **DTO** (`server/dto`): único sitio que decide qué datos salen hacia el navegador (aquí se aplican los spoilers). Fechas como texto ISO.
- **Validación** (`server/validation`): esquemas Zod.
- **Sesión:** `server/auth/session.ts` (`getSession`, `requireUser` para páginas) y `server/auth/api.ts` (`getApiUser`, `unauthorized`, `badRequest` para rutas). Cada página privada llama a `requireUser()`; el layout **no** es suficiente (Next no vuelve a ejecutarlo al navegar). La protección real es filtrar siempre por el `userId` de la sesión en cada consulta.
- **Eventos de dominio** (previstos, aún no implementados): `ComicMarkedRead`, `CharacterUnlocked`, `RelationshipDiscovered`, para alimentar después logros, actividad e IA.
- Nombres: archivos en `kebab-case`; componentes en `PascalCase`; tablas/modelos Prisma en `PascalCase` **sin** `@@map` (en SQL a mano hay que citarlos: `"Character"`, `"comicId"`).
- Los contadores que se muestran al usuario se **calculan con consultas indexadas sobre nuestros datos** (no se guardan en caché por ahora). Los contadores de Comic Vine (`appearancesCount`) son informativos y cambian.

---

## 7. Estructura de carpetas (actual)

```
comicverse/
├─ CLAUDE.md · PRODUCT.md (verdad de producto para el diseño) · DESIGN.md (sistema de diseño «Atlas estelar», generado por impeccable) · README.md (pendiente) · docker-compose.yml · vitest.config.mts · vitest.integration.config.mts
├─ prisma/ ............ schema.prisma · migrations/        prisma7.config.ts
├─ data/ .............. universe-candidates.json · universe.json · relationships.json   (universe.resolved.json y relationships.suggested.json no se versionan)
├─ scripts/ ........... resolve-universe.ts · import-universe.ts · suggest-relationships.ts · import-relationships.ts
├─ tests/unit/ ........ *.test.ts
├─ tests/integration/ . global-setup · test-db (cliente, resetDb, createUser, createComic) · *.test.ts
└─ src/
   ├─ app/
   │  ├─ page.tsx                      portada
   │  ├─ (auth)/  layout · sign-in · sign-up        (redirige al dashboard si ya hay sesión)
   │  ├─ (app)/   layout (cabecera + footer) · dashboard · profile · catalog · comics/[id] · library · collection · characters/[id] · graph · discoveries
   │  └─ api/  auth/[...all] · health · v1/comics · v1/library · v1/library/comics/[comicId] (+ /review) · v1/collection · v1/characters/[id] · v1/graph · v1/dashboard · v1/discoveries
   ├─ components/  layout/app-shell · layout/app-nav · ui/icons · auth/sign-out-button · comics/comic-card · library/library-controls · library/unlock-panel · characters/character-card · characters/favorite-button · graph/universe-graph · graph/relationship-list · characters/discovery-item
   ├─ lib/  auth · auth-client · db (server-only) · env · format · catalog-url · search-params · reading-status · relationship-types · graph-layout · activity
   └─ server/
      ├─ auth/ session · api
      ├─ domain/ card-state · library-status · unlock · relationships
      ├─ dto/ comic · library · character
      ├─ repositories/ comics · library · characters · discoveries
      ├─ services/ catalog · library · discovery · dashboard
      ├─ validation/ catalog · library · collection · graph · discoveries
      ├─ integrations/comic-sources/comicvine/ client · mappers · types · character-matching
      └─ jobs/ import-universe · import-relationships
```

Carpetas previstas más adelante: `server/integrations/ai/` (AIProvider/AIGateway, sin implementación), `components/layout`, `features/` (hooks y queries del cliente), `docs/` (arquitectura, ER, ADR).

---

## 8. Modelo de datos

**Existentes** (migradas): `User`, `Session`, `Account`, `Verification` (Better Auth) · `Publisher`, `Series`, `Comic`, `Character`, `ComicCharacter`, `Creator`, `ComicCreator`, `Event`, `ComicEvent` (catálogo global) · `UserComic`, `ReadingHistory`, `Review` (biblioteca) · `CharacterRelationship` (relaciones curadas) · `CharacterFavorite` (favoritos de personajes) · `Discovery` (registro de desbloqueos) · enums `DataSource` (`COMICVINE`) y `ReadingStatus` (`PENDING | READING | READ | DROPPED`).

Decisiones de diseño:

- Ids propios (`uuid()`); en catálogo, `@@unique([source, externalId])` para que los importadores sean **idempotentes** (`upsert`).
- `Comic.title` se construye como `serie #número`; `storyTitle` conserva el título de las historias de la API. `issueNumber` es texto (`1AU`, `-1`).
- La editorial de un cómic se obtiene vía su serie (no se duplica).
- `Character.isCollectible` marca el universo curado: se guardan todos los personajes que aparezcan, pero **solo los coleccionables se pueden desbloquear** (y cuentan en el "X / N").
- `ComicCharacter` (PK compuesta) es la tabla clave del desbloqueo. `UserComic` (PK `userId+comicId`) guarda estado, favorito, puntuación y fechas. `ReadingHistory` es un log append-only (`fromStatus` vacío = añadido; `toStatus` vacío = quitado).
- **No existe tabla `UserFavorite`**: se usan flags `isFavorite` en `UserComic` y `UserCharacter`.
- `Creator`, `ComicCreator`, `Event` y `ComicEvent` existen pero **el importador aún no los rellena** (se descargarán bajo demanda al abrir un cómic, y se guardan).
- El estado de la carta (LOCKED / DISCOVERED / COLLECTED) **no se almacena**: lo deriva `getCardState` del nº de cómics leídos (`COLLECTED_THRESHOLD = 5`).

**Previstos (Fase 5 en adelante):** favoritos de personajes (sin `UserCharacter` ni `UserRelationship`: los desbloqueos se calculan, ver sección 9; sin `RelationshipType` ni `RelationshipEvidence`: el tipo es texto validado y las derivadas no se guardan), `Achievement` / `UserAchievement` (solo esquema), y más adelante tablas de IA (`AiUsage`, caché) y `pgvector`.

---

## 9. Reglas de dominio y decisiones aprobadas

**Desbloqueo (Fase 5)** — **decisión aprobada (2026-10-06): los desbloqueos se CALCULAN, no se guardan.**
- "Personajes desbloqueados" = consulta: personajes coleccionables de `ComicCharacter` cuyos cómics estén en `UserComic` con estado `READ` para ese usuario. El invariante de la regla 2 se cumple por construcción: no hay `UserCharacter` de desbloqueos, ni `reconcile`, ni carreras entre peticiones simultáneas.
- Igual con las relaciones: "descubierta" = ambos extremos desbloqueados, calculado (sin `UserRelationship`).
- **Relaciones "aparecen juntos" (Paso 31):** derivadas de `ComicCharacter`. Una pareja es relación si comparte ≥ `MIN_SHARED_COMICS` (5) cómics **y** su coeficiente de Ochiai (compartidos / √(cómicsA·cómicsB)) es ≥ `MIN_SCORE` (0,2), en `domain/relationships.ts`. Motivo, medido con datos reales: con solo "≥ 5 cómics" salían 409 de 496 parejas (todos con todos, por los personajes omnipresentes); con Ochiai ≥ 0,2 salen 169 y ningún personaje queda aislado (Venom → Eddie Brock 0,73 primero). Reajustar los umbrales al ampliar el universo. Se calculan en cada petición (~30–70 ms de código en dev).
- **Relaciones curadas (Paso 32b):** `data/relationships.json` (ids de Comic Vine, `type`, `label`/`note` solo para leer), revisado a mano; `npm run relationships:import` lo valida con Zod y sustituye la tabla `CharacterRelationship` en una transacción (si un id no existe o una pareja se repite, falla sin tocar nada). Una fila por pareja con `CHECK (characterAId COLLATE "C" < characterBId COLLATE "C")` ("C" = mismo orden que JavaScript). `type` es texto validado contra `lib/relationship-types.ts` (ALLY, ENEMY, FAMILY, PARTNER, COMPANION, RIVAL): añadir un tipo no necesita migración. Una curada cuenta siempre, aunque no llegue a los umbrales (179 relaciones en total con las 59 curadas). Las sugerencias de Comic Vine (`relationships:suggest`) solo sirven de pista: traen ruido (p. ej. Spider-Man–Green Goblin "en conflicto") y no distinguen familia ni pareja.
- Al pasar a Leído (o salir de Leído), `setComicStatus`/`removeFromLibrary` comparan dentro de la transacción los desbloqueados antes y después y devuelven un `UnlockResult` (`newCharacters`, después `newRelationships`, progreso) que el frontend solo **anima**; no decide nada.
- Solo **Leído** desbloquea (Pendiente/Leyendo/Abandonado no). Desmarcar retira automáticamente los personajes sin otro cómic leído.
- Solo se guarda lo no calculable: `CharacterFavorite` y el registro `Discovery` (Paso 38): una fila por personaje desbloqueado (`userId`, `characterId`, `viaComicId`, `createdAt`), escrita en la misma transacción de `setComicStatus` cuando `unlock.newCharacters` no está vacío. Es **historia** (solo crece): desmarcar no la borra y redescubrir añade otra fila; el estado actual se sigue calculando aparte. Por ahora solo registra personajes (relaciones y series se cuentan al vuelo).
- Motivo (descartada la opción materializada con `UserCharacter` + `ON CONFLICT` + `reconcile`): una segunda copia del estado puede desincronizarse; con 32 personajes y miles de enlaces la consulta indexada es inmediata. Revisar solo si el volumen crece mucho (entonces, materializar con caché).
- Tests obligatorios, mínimo: A desbloquea Spider-Man y Venom; releer A no duplica; B (Spider-Man + Green Goblin) solo añade Green Goblin; marcar Leído dos veces; peticiones concurrentes; desmarcar con personajes compartidos y no compartidos; cómic sin personajes; relaciones que solo se revelan con ambos extremos desbloqueados.

**Biblioteca** (reglas aprobadas):
- Añadir a la biblioteca = entrada en **Pendiente**. Estados: Pendiente, Leyendo, Leído, Abandonado. Quitar = borrar la entrada.
- Pasar a Leyendo guarda `startedAt` (se conserva si ya existía). Pasar a Leído guarda `readAt`; salir de Leído lo borra. Repetir el mismo estado no hace nada (`changed: false`).
- **Puntuar (1–5) solo cómics en Leído** (si no, 409 `RATING_REQUIRES_READ`). Decidido (opción A): al salir de Leído la puntuación **se conserva pero no se muestra** (el DTO la devuelve como `null` fuera de Leído) y reaparece al volver a Leído. Quitarla (`rating: null`) se permite siempre.
- Favorito: cualquier cómic de la biblioteca, en cualquier estado.
- **Reseñas:** privadas (las públicas llegarán con las funciones sociales y deberán respetar los spoilers). Una por usuario y cómic; `Review` cuelga de `UserComic` con FK compuesta y `onDelete: Cascade` (quitar el cómic de la biblioteca la borra). Solo en Leído (409 `REVIEW_REQUIRES_READ`); fuera de Leído se conserva pero no se muestra. Texto plano, 1–5000 caracteres, recortado.
- Cada cambio se anota en `ReadingHistory`.

**Cartas:** `LOCKED` (silueta y `?`, sin nombre ni parcial), `DISCOVERED`, `COLLECTED` (≥ 5 cómics leídos). Datos de una carta: imagen, nombre, nombre real, editorial, primera aparición, cómics en tu biblioteca donde aparece, cómics leídos donde aparece, relaciones descubiertas.

**Definiciones aprobadas:**
- "X / N personajes" cuenta solo personajes **coleccionables curados**, no todos los de la API.
- "Cómics descubiertos" de un personaje = cómics **de la biblioteca del usuario** donde aparece; "leídos" = el subconjunto en estado Leído.
- **Relación descubierta** = ambos personajes desbloqueados. Se materializa en `UserRelationship` en el momento del desbloqueo. Relaciones semánticas curadas (aliado, enemigo, familia, equipo, mentor, aprendiz, pareja, compañero, rival; ampliables) + relaciones derivadas "aparece con" a partir de coapariciones. Comic Vine ofrece `character_friends` / `character_enemies` (miles de entradas por personaje): solo se guardan las relaciones **entre personajes de nuestro universo**.
- Progreso del universo (dashboard): personajes X/N y %, cómics leídos, relaciones descubiertas, series y eventos descubiertos (calculados de nuestros datos).
- Descripciones de cómics: visibles, con un **ajuste de usuario para ocultarlas** (pueden mencionar personajes bloqueados). Pendiente de implementar.
- **Nombres para mostrar:** `Character.displayName` (opcional) = `label` curado de `data/universe.json` (p. ej. `Green Goblin` para `Norman Osborn`, `Hobgoblin` para `Hobgoblin (Kingsley)`); si falta, usar `name`. Lo rellena el importador; para cambiar un nombre, editar el `label`.

---

## 10. Integración con Comic Vine

- Base: `https://comicvine.gamespot.com/api`. Parámetros `api_key`, `format=json`, y cabecera **`User-Agent` obligatoria**. Prefijos de recurso: personaje `4005`, cómic (issue) `4000`, serie (volume) `4050`, editorial `4010`. **Marvel = editorial `31`.**
- Límite oficial: **~200 peticiones por recurso y hora**, y bloqueos temporales si hay ráfagas. `ComicVineClient` espera ≥ 1,1 s entre peticiones y reintenta ante 420/429/5xx o mensajes de límite. Máximo 100 resultados por página (`paginate`).
- Los errores del cliente nunca incluyen la URL completa (contiene la clave); hay test.
- Hallazgos verificados con datos reales:
  - La **lista** de issues (`/issues`) **no** incluye `character_credits`; solo el detalle de un issue. Por eso el importador va **al revés**: por personaje, `issue_credits` trae todos sus cómics (la lista llega completa), y se cruza con los cómics importados.
  - `/issues` con `filter=volume:ID` y `sort=cover_date:asc` **sí** funcionan. `/characters` con `filter=publisher:31` y `sort=count_of_issue_appearances:desc` los **ignora en silencio**: nunca confiar en un filtro sin mirar el resultado. La búsqueda (`/search`, `resources=character`) funciona y puede devolver personajes de otras editoriales con el mismo nombre (dos "Venom").
  - Ruido en los datos: `real_name` puede ser el texto `None`, con espacios sobrantes; los contadores cambian entre días; hay muchas variantes por personaje.
- Mappers puros con tests (`mappers.ts`): `cleanRealName` (descarta `None` y un nombre real igual al nombre, p. ej. Carnage), `htmlToText`, `buildComicTitle`, `pickReleaseDate` (usa `store_date`, si falta `cover_date`), `pickImageUrls` (guarda grande + mediana, solo URLs), `slugify`.
- Las imágenes se **enlazan** (hotlinking) con `next/image` + `unoptimized`; no se descargan ni se usa el optimizador de Next (cuotas del hosting gratuito).
- **Universo semilla v0** (`data/universe.json`, solo ids verificados): 4 series (Amazing Fantasy 5533; The Amazing Spider-Man 2127 [1963], 112161 [2018], 142577 [2022]) y 32 personajes del mundo de Spider-Man (Spider-Man 1443, Venom 1486, Mary Jane 13380, Norman Osborn 58812, Hobgoblin Kingsley 7605, Miles Morales 79420…). Resultado: 833 cómics, 4.403 enlaces, solo 2 cómics sin personajes coleccionables (la interfaz debe decirlo). Todo personaje tiene ≥ 25 cómics.
- Para ampliar el universo: añadir ids a `data/universe.json` (verificándolos primero con `universe:resolve`; el emparejado `FUZZY` sugirió Deadpool para "Hobgoblin": **el importador solo lee ids verificados, nunca nombres**) y volver a ejecutar `universe:import`.

---

## 11. API REST (`/api/v1`, todo requiere sesión)

Existentes:

| Ruta | Descripción |
|---|---|
| `GET /comics?q=&seriesId=&publisher=&sort=&page=&pageSize=` | Catálogo. `publisher`: `marvel` o `dc` (zona). `sort`: `release_desc` (por defecto), `release_asc`, `title`. `pageSize` ≤ 60. Solo devuelve `characterCount` |
| `GET /library?status=&page=&pageSize=` | Biblioteca propia + contadores por estado. `pageSize` ≤ 60 |
| `GET/PUT/DELETE /library/comics/:comicId` | Estado de un cómic / añadir o cambiar estado (`{status}`; 404 `COMIC_NOT_FOUND`) / quitar |
| `PATCH /library/comics/:comicId` | `{rating?: 1-5 \| null, isFavorite?: boolean}` (al menos uno). 404 `NOT_IN_LIBRARY`, 409 `RATING_REQUIRES_READ` |
| `GET/PUT/DELETE /library/comics/:comicId/review` | Reseña propia (`{body}`). 404 `NOT_IN_LIBRARY`, 409 `REVIEW_REQUIRES_READ`; borrar inexistente → `removed: false` |
| `GET /collection?filter=&sort=` | Cartas desbloqueadas (`number`, `state`, `comicsRead`, `isFavorite`, `isNew`) + `locked` (cuántos) y `lockedNumbers` (solo sus números de catálogo; vacíos si hay filtro) + `constellations` (relaciones descubiertas) + `counts` por filtro + `progress` + `relationships: {discovered, total}`. `filter`: `all`, `favorites`, `discovered`, `collected`; `sort`: `number` (por defecto), `name`, `comics` |
| `POST /collection/seen` | Marca la colección como vista (lo descubierto hasta ahora deja de ser «nuevo»). 204 |
| `PATCH /collection/characters/:id/favorite` | `{isFavorite: boolean}`. Bloqueado o inexistente → 404 `CHARACTER_NOT_FOUND` |
| `GET /characters/:id` | Ficha de un personaje desbloqueado (datos, estado, `comicsRead`, primera aparición, cómics de tu biblioteca con tu estado, `relationships` solo con personajes desbloqueados + `hiddenRelationships` (número)). **Bloqueado o inexistente → el mismo 404 `CHARACTER_NOT_FOUND`** |
| `GET /graph?focus=` | (La página `/graph` acepta además `view=graph|list`.) Grafo del universo descubierto. Con `focus` (uuid): ego-graph a un salto (el personaje y sus vecinos), `locked: 0` y `hiddenRelationships` (número); focus bloqueado o inexistente → 404 `CHARACTER_NOT_FOUND`. Sin focus: `nodes` (cartas desbloqueadas), `edges` (`source`, `target`, `type`, `shared`; solo relaciones descubiertas), `locked` (solo el número: siluetas sin enlaces), `progress` |
| `POST /series/import` | `{externalId, publisher: marvel\|dc}`: añade una serie de Comic Vine con todos sus cómics. 422 `WRONG_PUBLISHER`, 404 `SERIES_NOT_FOUND`, 502 `COMIC_VINE_UNAVAILABLE`, 503 `COMIC_VINE_DISABLED` (sin clave) |
| `GET /dashboard` | `stats` (biblioteca por estado + total, personajes, relaciones, series), `recentComics` (6 últimos de la biblioteca), `recentDiscoveries` (6: personaje, `viaComic`, `discoveredAt`; uno por personaje y **solo si sigue desbloqueado**), `activity` (8 últimos cambios del historial: `comic`, `fromStatus`, `toStatus`, `at`) |
| `GET /discoveries?page=&pageSize=` | Registro completo paginado (con redescubrimientos), solo personajes que siguen desbloqueados; `pageSize` ≤ 60 |
| `GET /api/health` | Comprobación de vida (sin versión) |

Previstos: `POST /admin/sync/*` (protegido).

Convenciones: errores `{ error: "CODIGO", issues? }`; `401 UNAUTHORIZED`, `400 INVALID_*`, `404`, `409` (regla de negocio incumplida). Borrar algo inexistente no es error (`removed: false`). Paginación: `{ items, page, pageSize, total, totalPages }`.

---

## 12. Seguridad

Variables de entorno validadas; clave de Comic Vine solo en servidor; Zod en toda entrada; `pageSize` acotado; `userId` siempre de sesión; DTO explícitos; HTML externo convertido a texto; `rel="noopener noreferrer"` en enlaces externos; contraseñas cifradas por Better Auth (nunca texto plano); cookies `SameSite=Lax` (PUT/DELETE no se pueden enviar entre sitios sin permiso previo del navegador). **Fase 8, bloque de seguridad (hecho):**
- **Límite de peticiones** (Better Auth, `src/lib/auth.ts`): `storage: "database"` (tabla `RateLimit`; la memoria no sirve con varias instancias en Vercel), activo salvo en tests. Reglas propias de Better Auth: 100 peticiones / 10 s por IP y **3 / 10 s** en entrar, registrarse y cambiar contraseña o email (verificado: el 4.º intento da 429). La IP sale de `X-Forwarded-For`; en local sin cabecera todas las peticiones comparten clave. **Al desplegar: comprobar que Vercel pone la IP real** (y si hace falta, `advanced.ipAddress.trustedProxies`). Las rutas `/api/v1` no tienen límite propio (requieren sesión y solo afectan a la cuenta propia); añadir si se ven abusos.
- **`src/proxy.ts`** (en Next 16 `middleware` se llama `proxy`), reglas puras con tests en `src/lib/security.ts`:
  - **CSRF:** escrituras (`PUT`/`PATCH`/`DELETE`/`POST`) a `/api/*` con `Origin` de otra web o `Sec-Fetch-Site: cross-site` → 403 `CROSS_SITE_REQUEST` (segunda capa tras `SameSite=Lax` y el control de origen de Better Auth). Sin `Origin` (curl) se permite: no lleva la cookie de una víctima.
  - **CSP con nonce** en las páginas: `script-src 'self' 'nonce-…' 'strict-dynamic'` (+ `'unsafe-eval'` solo en desarrollo), `style-src 'self' 'unsafe-inline'` (React Flow y `next/image` usan `style=""`), `img-src` con `https://comicvine.gamespot.com`, `frame-ancestors 'none'`, `object-src 'none'`, `upgrade-insecure-requests` solo si la petición llega por HTTPS. El layout raíz llama a `await connection()` para que todas las páginas (también la 404) se rendericen por petición y lleven el nonce. Verificado: todos los `<script>` llevan el nonce, en desarrollo y en producción (`npm start`). **Si se añade un dominio externo (imágenes, fuentes, analítica), hay que añadirlo a la CSP.**
- **Cabeceras** (`next.config.ts`, todas las respuestas): `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` (sin cámara, micrófono ni ubicación), `Strict-Transport-Security` (2 años) y sin `X-Powered-By`.

Hecho: sección de seguridad en el README (incluido el aviso conocido de `npm audit`: `deepmerge-ts` y `mysql2` cuelgan de la CLI de Prisma 7, no del código de la app; MySQL no se usa; revisar cuando Prisma publique corrección).

---

## 13. Testing

- Unitarios: Vitest, `tests/unit/*.test.ts` (`npm test`), alias `@` → `src`. Funciones puras, DTO, validación, mappers, cliente de Comic Vine (con `fetch`, `sleep` y `now` **inyectados**: sin red ni esperas reales).
- Estado: **124 unitarios + 62 de integración** pasando (Fase 8, tras traducir los errores de acceso) (los de desbloqueo están en `tests/integration/unlock.test.ts`).
- Prueba cada capa con su propio test; los DTO tienen un test que garantiza que **no exponen personajes**, solo su número.
- **Integración** (`npm run test:integration`, `vitest.integration.config.mts`): BD `comicverse_test` en el mismo contenedor. URL por defecto en `tests/integration/test-db.ts` (credenciales de desarrollo; se puede cambiar con `TEST_DATABASE_URL`), sin `.env.test`. Por seguridad, se niega a ejecutarse si el nombre de la BD no termina en `_test`. El setup global ejecuta `prisma migrate deploy`, que también crea la BD si no existe. Cada test empieza con `resetDb` (`TRUNCATE ... CASCADE`). Los archivos se ejecutan de uno en uno (`fileParallelism: false`). Los servicios reciben el cliente de pruebas como parámetro. Aquí van los tests de desbloqueo y concurrencia.
- E2E con Playwright más adelante (opcional).
- Antes de cada commit: `npm test`, `npm run typecheck`, `npm run lint` (y `npm run test:integration` si se toca BD, repositorios o servicios).

---

## 14. Diseño, UI y UX

- **Responsive real**, no escritorio reducido: mobile-first con Tailwind.
  - **Desktop:** sidebar completa, dashboard amplio, grafo grande, varias columnas.
  - **Tablet:** sidebar colapsada a iconos (rail).
  - **Móvil:** barra de navegación inferior de 5 pestañas (Inicio, Catálogo, Colección, Grafo, Biblioteca); perfil en un menú superior.
  - Un `AppShell` cambia entre Sidebar, Rail y BottomNav. Las cartas usan container queries y sirven como rejilla, lista o nodo de grafo.
- **Estilo:** moderno, profesional, **no infantil**. Inspiración: interfaces de videojuegos/RPG, apps de coleccionismo, streaming, Goodreads, Letterboxd, MyAnimeList. Usar cards, animaciones sutiles, estados de desbloqueo, progreso, badges, grafos y transiciones. **Evitar** exceso de colores, de sombras, de animaciones y diseño sobrecargado.
- **Dirección visual (2026-10-07): «Página de arte original»** (con la skill impeccable; sustituye al «Atlas estelar», que el usuario rechazó por genérico, «de IA»). Sistema completo en **`DESIGN.md`** y `.impeccable/design.json`; contrato en `.impeccable/surfaces/src-app-app-layout-tsx.md`; producto en `PRODUCT.md`. Cada pantalla es una página de cómic a lápiz y tinta, **solo tema claro** (decisión del usuario):
  - Tokens (`globals.css`): `paper` #F4F1EA (cartulina **lisa**: nada de cuadrícula de fondo, es una seña de UI generada), `sheet`/`sheet-raised`, `ink` #141414, `ink-soft`, `line`/`line-strong`, `blue` (lápiz azul, solo líneas) y `blue-ink` (texto en lápiz), `danger`.
  - **Color por editorial = «lápiz del editor»**: `editor`/`editor-ink`, rojo inspirado en Marvel por defecto y azul inspirado en DC bajo `[data-publisher="dc"]` (requisito del usuario; solo color, nunca logos ni tipografías). Reservado a identidad, sección activa, **nuevo** y **coleccionado** (no favoritos ni decoración).
  - El color pleno solo vive **dentro de las viñetas** (portadas e imágenes). Filetes de tinta de 2 px, sin sombras, sin esquinas redondeadas (salvo el avatar), sin degradados. **Tinta llena = seleccionado** en toda la app (filtros y navegación).
  - Fuentes: **Geist** (interfaz y títulos en peso 800) y **Caveat** (`font-hand`: números de catálogo y notas del editor a mano). Iconos SVG propios (`components/ui/icons.tsx`), **nunca emojis ni símbolos Unicode**.
  - «Mi colección»: cajetín entintado con el total a mano, pestañas entintadas, ordenación subrayada en el color del editor, cartas como viñetas entintadas con su número «001/032» a mano, «¡nuevo!» (recuadro y nota del editor) y «coleccionado»; los bloqueados son **viñetas por dibujar** en lápiz azul con aspa y solo su número.
- **Hecho:** sistema, `AppShell` y «Mi colección» en el nuevo mundo, con revisión final de impeccable (*ship*) y `DESIGN.md` reescrito. El «cielo» del mundo anterior se eliminó (`sky.tsx`, `sky-layout.ts`).
- **Migración completa (2026-10-07):** todas las pantallas usan el sistema; las piezas comunes están en `src/components/ui/page-parts.tsx` (cajetín `PageHeader`, `SectionHeading`, `Pagination`, `inkTab`, `inkButton`, `inkField`…). **Pendiente:** replantear a fondo el Universo/grafo (al usuario no le convence; hoy solo está adaptado al sistema, con etiquetas de 10 px y un aviso de hidratación interno de React Flow) y su versión móvil.
- **Capturas para revisar:** Chrome DevTools MCP (`npx chrome-devtools-mcp@latest`, configurado en `~/.claude.json`); iniciar sesión con un usuario de prueba desde `/sign-in` en un contexto aislado. Las capturas van a `.impeccable/review/` (no versionado).
- **Animación de desbloqueo** (rápida, no molesta): al marcar Leído aparece "COMPLETADO" → "N NUEVOS DESCUBRIMIENTOS" → aparecen las cartas desbloqueadas → se actualiza el grafo.
- **Grafo:** React Flow con nodos que son componentes (misma `CharacterCard`), zoom/pan/pinch táctil, minimapa. Un grafo **por usuario** ("Universo descubierto"); endpoint de **ego-graph** (subgrafo alrededor de un personaje, `depth=1`, expandible al tocar un nodo). Nodos bloqueados: silueta con `?`, **sin nombre ni imagen**. En móvil: pantalla completa, foco en un personaje y *bottom sheet* para el detalle. Vista alternativa en lista (accesibilidad).
- **Pantallas del MVP:** dashboard (progreso, actividad, últimos cómics y personajes), catálogo, ficha de cómic ("Personajes que descubrirás": solo un contador, p. ej. "contiene 5 personajes que aún no has descubierto"), biblioteca por estados, "Mi colección" (filtros: todos, desbloqueados, bloqueados, favoritos, editorial, tipo, popularidad, apariciones), página de personaje (info, tus estadísticas, relaciones descubiertas, cómics relacionados), descubrimientos recientes, perfil.
- **Accesibilidad:** etiquetas en todos los campos, `role="alert"` en errores, `aria-label` en navegación y controles, objetivos táctiles ≥ 44 px, `lang="es"`.
- **Textos de interfaz en español**, con i18n preparado; contenido de cómics en inglés. Fechas con `formatDate` (siempre `timeZone: "UTC"`; las fechas de cómics no tienen hora). Errores de Better Auth traducidos con `authErrorMessage` (`lib/auth-errors.ts`); un código nuevo cae en el mensaje genérico. Mostrar estados de carga, error y vacío (p. ej. cómic sin personajes: "leerlo no desbloqueará nada").

---

## 15. IA (futura; NO implementar en el MVP)

- Todo pasa por el **backend**; nunca desde componentes cliente. Capa prevista: `server/integrations/ai/` con `AIProvider` (`generateText`, `generateStructured`, `embed`) y `AIGateway` (control de uso/coste por usuario, caché, registro `AiUsage`, cambio de proveedor por configuración). Interruptor `AI_ENABLED=false`.
- **Spoiler-safe por construcción:** el contexto enviado a un modelo se construye con los mismos servicios y DTO que la interfaz (solo lo desbloqueado).
- Búsqueda en lenguaje natural: el catálogo ya se consulta con un objeto tipado y validado (`comicSearchSchema`); la IA solo tendría que traducir texto a ese objeto.
- Funciones futuras: asistente, recomendaciones, rutas de lectura, descubrimiento, búsqueda en lenguaje natural, explicaciones con nivel de spoilers, resumen personalizado, embeddings (`pgvector` en la misma BD). Sin coste por defecto; una opción gratuita a estudiar son modelos locales (Ollama).

---

## 16. Despliegue y documentación

- Separar Development y Production con variables de entorno; sin secretos en Git; Vercel (gratis) + Neon/Supabase (gratis), verificando condiciones vigentes. La BD de producción se llena ejecutando el importador contra ella (no se llama a Comic Vine en tiempo de ejecución).
- **Zonas Marvel / DC (2026-10-08, paso 1 del plan «cualquier cómic»):** `lib/zones.ts` (`ZONES`: slug de editorial `marvel` / `dc-comics`, cookie `cv-zone`, `parseZone`), `server/zone.ts` (`getZone()`), `ZoneSwitch` (cliente: escribe la cookie y `router.refresh()`) en el menú lateral (escritorio) y la barra del móvil. `(app)/layout` pone `data-publisher={zone}` en el `AppShell`: todo el color pasa a azul en DC. El catálogo y la lista de series filtran por la editorial de la zona (test `catalog-zones`). Aún sin filtrar por zona: inicio, colección y universo (llegará con los personajes de DC).
- **Plan acordado con el usuario («buscar cualquier cómic de Marvel o DC y que salga»):** 1) zonas ✔; 2a) ✔ búsqueda de series en Comic Vine desde el catálogo (`RemoteSeriesResults` en un `Suspense`, `searchRemoteSeries` filtra por `ZONES[zone].comicVineId`: Marvel 31, DC 10) y «Añadir al catálogo» (`POST /api/v1/series/import`, `importVolume` en `server/jobs/import-volume.ts`, compartido con `universe:import`; `maxDuration = 300`); 2b) ✔ personajes de cada cómic: `Comic.charactersSyncedAt`; `ensureComicCharacters` (`server/jobs/sync-comic-characters.ts`) hace **una** petición `issue/4000-{id}` (`character_credits`) al abrir la ficha y antes de marcar Leído; crea los personajes nuevos solo con nombre (`isCollectible: false`, sin imagen) y los enlaza; si Comic Vine falla, se reintenta la próxima vez. Ojo: el contador «contiene N personajes» cuenta todos los enlazados, también los no coleccionables, hasta el paso 4; 3) ✔ novedades diarias: `vercel.json` (cron `0 6 * * *` → `GET /api/cron/new-releases`, exige `Authorization: Bearer $CRON_SECRET`; sin `CRON_SECRET` no se ejecuta) → `syncNewReleases` (`server/jobs/sync-new-releases.ts`): issues con `store_date` de los últimos 3 días; de series conocidas de Marvel/DC guarda esos números (`upsertComic`); las series desconocidas se consultan **en bloque** (`volumes?filter=id:a|b|…`, 100 por petición) y las de Marvel/DC se importan enteras. Medido en real: primera pasada de 1 día 108 s (15 series nuevas, p. ej. Midnight Spider-Man), después 3 s. A mano: `npm run releases:sync -- <días>`; 4) personajes: **4a ✔** todo personaje enlazado desde Comic Vine es coleccionable (`syncComicCharacters` lo marca; migración de datos `collectible_synced_characters` para los anteriores) y al marcar Leído `ensureCharacterDetails` completa la ficha (imagen, nombre real, resumen, editorial) de hasta 12 personajes del cómic; **4b ✔** colección = **álbum por serie** en cada zona (decisión del usuario 2026-10-08): `findAlbumRows` (SQL: series de la editorial con algún cómic en la biblioteca, sus personajes coleccionables y la primera aparición en la serie), `toAlbums` (numera por primera aparición; un bloqueado es solo `{kind: "locked", number}`), `getZoneCollection`; «Todos» = álbumes, los filtros = rejilla de cartas de la zona. Ojo: una serie larga ya sincronizada da álbumes grandes (ASM 1963: 121 cromos); **4c ✔** Inicio, Universo, Biblioteca y Descubrimientos por zona: `comicInZone(zone)` (repositorio de cómics) filtra contadores, biblioteca, historial y descubrimientos; `getUniverse(db, userId, zone?)` da personajes/relaciones de la zona con el mismo criterio que los álbumes; la zona es un último parámetro **opcional** (sin zona = todo, como antes) y las páginas y la API la toman de la cookie.
- **Portada y acceso alternan editorial (idea del usuario, hecho):** primera visita Marvel, segunda DC, después al azar (`brandZoneForVisit`). El `proxy` cuenta las cargas completas (`sec-fetch-dest: document`) de `/`, `/sign-in` y `/sign-up` en la cookie `cv-brand-visits`; ojo: la página ya ve el valor incrementado en la misma petición (1 = primera visita). El bloque usa `data-publisher` y 4 grupos de portadas de esa editorial repartidos por su catálogo.
- **Portada y acceso (2026-10-08, petición del usuario: «más llamativo»):** `components/auth/brand-panel.tsx`: bloque rojo de la editorial con titular grande y mosaico de 6 portadas reales giradas que rota cada 4,5 s entre 4 épocas (`cover-shuffle.tsx`, cliente; quieto con «reducir movimiento»); en el acceso, a la izquierda del formulario (apilado en el móvil). Se quitó la tira de viñetas «001 002 003» (no se entendía).
- **Desplegado (2026-10-08): https://comicverse-eight.vercel.app.** Verificado en producción: salud y conexión a Neon, cabeceras y CSP, registro, catálogo, desbloqueo (Spider-Man #568: 24 personajes), colección sin nombres de bloqueados (comprobados los 8 en HTML y API), CSRF 403 y límite de intentos 429 con la **IP real** del cliente (clave `RateLimit` = IP pública, no la de Vercel). El conector MCP de Vercel solo tiene acceso al listado de proyectos (403 en el ámbito `marioguerra71s-projects`): reautorizar con ese ámbito para ver despliegues y logs.
- **Regla de despliegue: si cambia `schema.prisma`, aplicar la migración a Neon ANTES del push** (Vercel despliega al subir y el código nuevo fallaría sin la columna): `DATABASE_URL=<URL directa de .env.production.local, sin -pooler> npx prisma migrate deploy`.
- **Producción (2026-10-08):** BD en **Neon** (proyecto `comicverse`, Frankfurt, PostgreSQL 17). Tablas con `prisma migrate deploy` usando la URL **directa** (sin `-pooler`); catálogo copiado desde la BD local con `pg_dump --data-only` de las tablas de catálogo (sin usuarios) → `psql --single-transaction`; verificado: 833 cómics, 32 coleccionables, 4.403 enlaces, 59 curadas. La app usa la URL **pooled**. Credenciales en `.env.production.local` (ignorado por Git). Proyecto de Vercel `comicverse` (ámbito `marioguerra71s-projects`); variables: `DATABASE_URL` (pooled) y `BETTER_AUTH_SECRET`.
- **Preparado para desplegar (2026-10-08):** `postinstall: prisma generate` (el cliente generado no se versiona) y `COMIC_VINE_API_KEY` fuera del esquema de entorno de la app.
- **README profesional** (hecho 2026-10-08, capturas en `docs/capturas/`; añadir la URL de la demo al desplegar) pensado para entrevistas: qué es, características, stack, arquitectura, instalación, variables de entorno, base de datos (migraciones y seed), API, capturas, roadmap, futuras funciones de IA, licencia/atribución de Comic Vine y apartado de seguridad. Documentar también `docs/` (ER, ADR).

---

## 17. Estado y pendientes  *(actualizar al cerrar cada paso)*

**Hecho:**
- Fase 0: arquitectura aprobada. Fase 1: proyecto, Docker/PostgreSQL, Prisma 7, validación de entorno, Vitest.
- Fase 2: Better Auth (registro, login, cierre de sesión), dashboard protegido, perfil básico, layouts, portada.
- Fase 3: catálogo (búsqueda, filtro por serie, orden, paginación) y ficha de cómic con datos reales de Comic Vine; importador del universo semilla.
- Fase 4 (**terminada**): modelos `UserComic`/`ReadingHistory` y reglas de estado (`applyStatusChange`) (Paso 21); servicio y API de biblioteca con validación, DTO, repositorio, transacciones con historial y rutas `api/v1/library` (Paso 22, commit `e20aa1f`); tests de integración contra PostgreSQL real con tests del servicio de biblioteca (Paso 23); botones de estado en la ficha del cómic (Paso 24a: componente cliente que llama a la API con `fetch` y luego `router.refresh()`; se descartaron las Server Actions para mantener una sola puerta de entrada y porque la Fase 5 necesitará el resultado del desbloqueo en el cliente). Página "Mi biblioteca" (`/library`, pestañas por estado con contadores como enlaces `?status=`, paginación y enlace en la cabecera; Paso 24b). Los nombres de los estados viven en `lib/reading-status.ts` y se comparten entre cliente y servidor. Puntuación y favorito (Paso 25a: `PATCH` en la API, `updateLibraryEntry`, panel `LibraryControls` en la ficha y marcas en la biblioteca). Reseñas privadas (Paso 25b: tabla `Review`, API `/review`, formulario en la ficha). `parseBody` compartido en `server/auth/api.ts`.

- Fase 5 (**terminada**): `displayName` de personajes y regla de `cleanRealName` (Paso 26). Núcleo del desbloqueo (Paso 27): `findUnlockedCharacters` (repositorio `characters`), `diffById` (dominio `unlock`), `snapshotUnlocked`/`buildUnlockResult` (servicio `discovery`); `setComicStatus` y `removeFromLibrary` devuelven `unlock: UnlockResult | null` (null si el cómic no entra ni sale de Leído), y la API lo devuelve tal cual. "Mi colección" (Paso 28): página `/collection` y `GET /api/v1/collection`; `toCollection` envía solo las cartas desbloqueadas y, de las bloqueadas, **solo el número** (`locked`), así que ni su id, ni su nombre, ni su posición llegan al navegador; verificado buscando los 32 personajes en el HTML. Página de personaje (Paso 29): `/characters/[id]` y `GET /api/v1/characters/:id`; una sola consulta (`findCharacterWithLibrary`) y `toCharacterDetail` devuelve `null` si no hay ningún cómic leído; las cartas de la colección enlazan a ella. El resumen del personaje (de Comic Vine) puede nombrar a otros personajes, igual que las descripciones de cómics: entra en el ajuste futuro de ocultar descripciones. Animación de desbloqueo (Paso 30): `UnlockPanel` dentro de `LibraryControls` muestra el `unlock` de la respuesta ("¡Completado!", "N nuevos descubrimientos" con miniaturas enlazadas, o los que vuelven a estar por descubrir), con `role="status"`; animación CSS `animate-pop-in` (definida en `globals.css` con `@theme`) solo con `motion-safe:`; sin dependencias (Motion no hizo falta). Relaciones "aparecen juntos" (Paso 31): `getRelationships` (servicio `discovery`), sección "Relaciones descubiertas" en la ficha de personaje, contador X / N en la colección y `newRelationships` en el `UnlockResult` y el panel.

- Fase 5, relaciones con significado:
  - **Paso 32a:** script `relationships:suggest` + `buildRelationshipSuggestions` (pura, con tests). Resultado real: 248 parejas (88 aliados, 104 enemigos, 56 en conflicto) con ruido evidente (Spider-Man–Green Goblin en conflicto; familia y pareja salen como "aliado"): **no importar tal cual**.
  - **Paso 32b:** relaciones curadas (59) con tipo, tabla `CharacterRelationship`, importador y tipo visible en la ficha de personaje. **Pendiente: que el usuario revise `data/relationships.json`** (curado con conocimiento general, no verificado una a una).
- Fase 5, Paso 33: personajes favoritos (`CharacterFavorite`, solo desbloqueados; `setCharacterFavorite`, `FavoriteButton` en la ficha, ♥ en las cartas) y filtros/orden de "Mi colección" (`collectionSearchSchema`, `filterCards`, pestañas con contadores como enlaces).

- **Decisiones del usuario (2026-10-08):** no se implementa el ajuste de ocultar descripciones; el grafo se deja como está y solo se replanteará cuando todo lo demás esté hecho.
- **Opinión del usuario (2026-10-06): el aspecto del grafo "no me gusta nada"; hay que replantear todo lo relacionado con el grafo más adelante** (lo decidirá él). Mientras, no invertir en pulirlo: solo la funcionalidad prevista.
- Fase 6 (**terminada**, salvo móvil: ver abajo): `GET /api/v1/graph` (Paso 34). Página `/graph` "Universo descubierto" (Paso 35): `UniverseGraph` (cliente, React Flow con zoom/arrastre, controles y minimapa, `colorMode="system"`); posiciones con `layoutGraph` (`lib/graph-layout.ts`, `d3-force`, 300 pasos de golpe, con tests); siluetas bloqueadas en un anillo exterior sin enlaces; relaciones curadas en línea continua con su tipo y derivadas en discontinua; enlace "Grafo" en la cabecera. Ego-graph (Paso 36): `/graph?focus=<id>` ("Universo de X", personaje resaltado con un anillo), tocar un nodo abre su ficha (`onNodeClick`), y la ficha enlaza "Ver en el grafo". Vista en lista (Paso 37): `/graph?view=list` (también con `focus`), `RelationshipList` (componente de servidor, sin JS: títulos y listas con enlaces, tipo y cómics juntos), conmutador Grafo/Lista que conserva el foco.
- **Aplazado al rediseño del grafo (decisión del usuario):** grafo a pantalla completa en móvil y *bottom sheet* al tocar un nodo; no tiene sentido hacerlo antes de decidir el nuevo diseño.

- Fase 7 (**terminada**): registro `Discovery` y `getDashboardStats` (servicio `dashboard`: biblioteca por estado + total, personajes X/N, relaciones X/N, series con algún cómic leído X/N; `toStatusCounts` compartido con `listLibrary`) (Paso 38). Dashboard (Paso 39): `getDashboard` + `getRecentDiscoveries` (lee las últimas 100 filas de `Discovery`, se queda con una por personaje y descarta los que han vuelto a bloquearse: el registro es historia, pero un bloqueado no sale al navegador), página `/dashboard` con tarjetas de progreso (enlazan a biblioteca, colección, grafo y catálogo), bienvenida para usuarios nuevos, últimos descubrimientos y últimos movimientos de la biblioteca; `GET /api/v1/dashboard`. Paso 40: `unlockedBy(userId)` en `repositories/characters` es **la única definición de "desbloqueado"** (la usan todas las consultas, también el registro: `findRecentDiscoveries` con `distinct` y `findDiscoveriesPage` filtran en la BD, así la paginación es correcta); actividad reciente en el dashboard (`getRecentActivity` sobre `ReadingHistory`, frases de `lib/activity.ts` con test); página `/discoveries` paginada y `GET /api/v1/discoveries`; componente `DiscoveryItem` compartido.

**Después:**
- **Fase 8 — Pulido** (seguridad hecha, ver sección 12): diseño visual definitivo con un sistema de diseño (usar las skills **ui-ux-pro-max** e **impeccable**) y `AppShell` responsive, rediseño del grafo, animaciones, accesibilidad, rendimiento, ajuste de ocultar descripciones. **Hecho:** `error.tsx` en `(app)` (no muestra el mensaje interno), errores de Better Auth en español (`lib/auth-errors.ts`, por `code` y 429) y títulos de pestaña en las fichas de cómic y personaje (`generateMetadata` + `cache` de React; un bloqueado se titula solo «ComicVerse»). **No añadir `loading.tsx`:** hace que la respuesta empiece en *streaming* y `notFound()` devuelva **200** (con `noindex`) en vez de 404; comprobado en producción. Auditoría Lighthouse (2026-10-08, build de producción, móvil): accesibilidad 100 en todas las pantallas; buenas prácticas 77 donde hay imágenes, solo por la cookie `__cf_bm` que pone Cloudflare en las imágenes de Comic Vine (aceptado: evitarla exigiría servir las imágenes desde nuestro servidor); catálogo con 4G y CPU ×4: LCP 0,69 s, CLS 0.
- **Fase 9 — IA** (solo si el usuario decide asumir costes).
- Despliegue, README, ampliar el universo (más series y personajes, DC), logros, funciones sociales (seguir usuarios, listas públicas, comparar colecciones; la arquitectura debe permitirlas).
- **No implementar todavía:** IA, sistema social completo, logros avanzados, DC, recomendaciones con IA.

---

## 18. Limitaciones y deuda técnica conocidas

- `npm audit` (9 altas a 2026-10-06): `deepmerge-ts` y `mysql2` (CLI de Prisma 7; aceptado, revisar al actualizar Prisma) y `braces` (vía `eslint-config-next` → `fast-glob`). Todos son herramientas de desarrollo/compilación, no código que reciba datos de usuarios. `source-map-js` se arregló con `npm audit fix` sin `--force` (1.2.1 → 1.2.2; verificado con tests y `npm run build`).
- Búsqueda de cómics con `ILIKE` (`contains` + `insensitive`); con miles de cómics, añadir `pg_trgm`.
- Orden por título alfabético (`#10` antes que `#2`); para leer en orden usar fecha.
- El importador no borra enlaces que Comic Vine retire y vuelve a descargarlo todo en cada ejecución; hacerlo incremental y reconciliar cuando haya desbloqueos de usuarios.
- Las relaciones se recalculan en cada petición (autounión de `ComicCharacter`); si el universo crece mucho, materializarlas al importar.
- Posible doble anotación en el historial si dos cambios a Leído llegan exactamente a la vez. Igualmente, dos lecturas simultáneas con un personaje en común pueden anunciar ese personaje como nuevo en ambas respuestas y apuntarlo dos veces en `Discovery` (solo afecta a la animación y al registro histórico; el estado calculado siempre es correcto).
- Verificación de email no implementada (requeriría un servicio de correo).

---

## 19. Git

- Rama `main`. Commits pequeños en estilo Conventional Commits (en inglés). Nunca subir `.env`, `node_modules`, `generated/` ni `data/universe.resolved.json`.
- Antes de `git add .`, revisar `git status` (que `.env` no aparezca).
- Los avisos CRLF/LF no requieren acción.

---

## 20. Plugins, skills y servidores MCP

- **Regla de coste:** no instalar ni activar plugins, skills o servidores MCP que requieran pago o tarjeta. Cualquier uno nuevo debe justificarse y ser gratuito.
- Un plugin o skill **no puede relajar** las reglas de la sección 3 (coste cero, spoilers, seguridad, versiones fijadas ni ritmo paso a paso). Si una instrucción de un plugin choca con este archivo, **prevalece este archivo**; avisa al usuario.
- `npx prisma init` instaló automáticamente skills de asistentes en `.claude/skills/`, `.agents/skills/`, `.windsurf/skills/` y `skills-lock.json`; se ignoraron en `.gitignore` porque no son necesarios (pueden volver a aparecer en disco; no se versionan). Si Claude Code necesita `.claude/` en el proyecto, comprobar `.gitignore` y no versionar solo lo personal (`.claude/settings.local.json`).
- Plugins/skills/MCP activos (de **usuario**, no del proyecto):
  - **impeccable**: diseño y revisión de interfaces. Tiene un *hook* que revisa automáticamente cada archivo de interfaz que se escribe.
  - **ui-ux-pro-max** (`ui-ux-pro-max`, `ui-styling`, `design-system`…): guías de estilos, paletas, tipografías y componentes.
  - **ponytail**: empuja hacia la solución más simple (sin abstracciones innecesarias).
  - Uso previsto: los de diseño se usan a propósito en la **Fase 8** (sistema de diseño y pulido de pantallas); antes, la UI es provisional y funcional. Nunca prevalecen sobre este archivo.

---

## 21. Fuente de verdad de los requisitos

El documento original de requisitos del usuario ("Prompt maestro — ComicVerse") es la referencia de producto (MVP, no-objetivos, roadmap). Este archivo resume y fija las decisiones tomadas después. Ante duda de producto, **pregunta al usuario** antes de asumir.
