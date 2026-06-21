# CLAUDE.md

Guía para Claude Code cuando trabaja en este repositorio. Mantenelo
denso y actualizalo cuando algo importante cambie.

## Qué es Liberto

Juego web single-page que emula la Copa Libertadores:

1. Elegís formación + estilo (defensivo / equilibrado / ofensivo)
2. Hacés un draft de 11 jugadores + 1 DT rolleando team-years
3. Jugás un torneo completo (8 grupos × 4 + R16/QF/SF/F, ida y vuelta)
4. Match-by-match minuto a minuto, con eventos, hinchada, sonidos
5. Premios al final: goleador, asistidor, MVP, mejor arquero
6. Si ganás → trofeo Libertadores + confetti; si perdés → seguís
   mirando hasta saber quién campeonó

## Stack

- Angular 22 (standalone components, signals, lazy-loaded routes)
- TypeScript 6.x
- pnpm (no npm). El project usa `pnpm-workspace.yaml` con `allowBuilds`
  (pnpm 11+ — NO `onlyBuiltDependencies`).
- SCSS
- canvas-confetti para la pantalla de victoria
- HTMLAudioElement para todo el audio (no Web Audio API)
- Vitest está en deps pero **no hay tests escritos todavía**

Build / run:

```
pnpm install
pnpm start     # ng serve, http://localhost:4200
pnpm build     # ng build
```

## Estructura

```
public/
  libertadores-trophy.png   # imagen del trofeo (usuario provee)
  sounds/                   # mp3s (usuario provee, README.txt adentro)
scripts/
  expand-teams.mjs          # one-shot data ops auditables
  add-more-years.mjs
  add-ten-clubs.mjs
  add-more-iconic-clubs.mjs
  backfill-coaches.mjs
src/app/
  app.{ts,html,routes.ts}   # shell, anthem inicia acá
  game/
    models/                 # interfaces puras, sin lógica
    data/
      teams.json            # 100+ team-years con coach
      changelog.ts          # CHANGELOG + CURRENT_VERSION
      stadiums.ts           # mapa club → {name, capacity}
    formations/             # 10 shapes × 3 estilos = 30 forms
    services/               # estado vivo en signals
      draft.service.ts
      tournament.service.ts
      match.service.ts
      live-match.service.ts
      audio.service.ts
    pages/                  # 1 carpeta por ruta, todas standalone
    components/             # widgets reusables
    utils/                  # rarityFromRating
```

## Convenciones

### Angular 22 moderno — sin excepciones

- Componentes `standalone: true` (default ahora). Los imports van en
  `@Component({imports: [...]})`.
- Control flow nuevo: `@if` / `@for` / `@switch`. **Nunca** `*ngIf`
  / `*ngFor`.
- Inputs/outputs con `input()` / `input.required<T>()` /
  `output<T>()`. **Nunca** decoradores `@Input` / `@Output`.
- Estado con `signal()` / `computed()` / `effect()`. RxJS solo donde
  realmente hace falta (no es el caso hoy).
- `ChangeDetectionStrategy.OnPush` en todos los componentes.

### Rutas

- Todas lazy-loaded vía `loadComponent`.
- Patrón: `/draft/formation` → `/draft/squad` → `/tournament/groups`
  → `/tournament/draw` → `/tournament/playoffs` →
  `/tournament/{victory|eliminated}`.

### Git

- Una rama por milestone:
  `feature/<descripcion>`, `fix/<descripcion>`, `chore/<descripcion>`,
  `docs/<descripcion>`, `refactor/<descripcion>`.
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
  `test:`, `style:`.
- Mergeá con `--no-ff` para preservar la topología de la rama.
- Nunca commiteás directo a `main`.

### Mensajes de commit en PowerShell

Acordate: usar here-string `@'...'@`, evitar **comillas dobles
internas** en el mensaje (rompen el parser). Si necesitás citar algo,
usá comillas simples o reescribilo.

## Política de versiones (semver estricto)

Versión actual: **leer `CURRENT_VERSION` desde `src/app/game/data/changelog.ts`**.

Cada batch del usuario = un solo bump. La regla:

- **PATCH (1.2.0 → 1.2.1)**: fixes y ajustes que **no** agregan
  funcionalidad nueva. Bug fixes, typos de datos, fixes de spacing,
  ajustes responsive, retoques de copy. La UX existente no cambia
  conceptualmente.

- **MINOR (1.2.0 → 1.3.0)**: cualquier feature nueva visible para el
  usuario, aunque el resto del batch sea fixes. Ej: tabla de
  goleadores nueva, sistema de audio, premios al final, penales en
  vivo, nuevos equipos como mecánica. Si **al menos una** entrada del
  batch es feature nueva, es MINOR.

- **MAJOR (1.2.0 → 2.0.0)**: cambios disruptivos en la UX core o en
  el modelo de datos. Ej: rework completo del draft, cambiar el
  formato del torneo, romper la firma de un servicio público,
  remover una pantalla. Pedir confirmación al usuario antes de bumpear.

Borderlines: si dudás entre PATCH y MINOR, mirá las viñetas del batch.
Si describen "agregá X" o "ahora podés Y" sin matar nada → MINOR. Si
describen "arreglá X" o "ajustá Y" → PATCH.

## Release workflow

Al final de un batch, antes de pushear:

1. Cada milestone ya está en una rama propia mergeada a main.
2. Editar `src/app/game/data/changelog.ts`: **prepend** una entrada
   nueva con la versión bumpeada según semver y los bullets del batch
   (en castellano, parafraseando lo que pidió el usuario como features
   entregadas).
3. `pnpm build` para verificar.
4. `chore(release): cut vX.Y.Z` con un mensaje que liste lo grueso.
5. Merge a main + `git push origin main`.

Si el batch fue "no toca el changelog" (como este), saltar pasos 2 y
4 — commiteá el ajuste con un mensaje claro y pusheá.

## Invariantes críticos (no romper)

### Cobertura de posiciones por equipo

**Cada entrada de `teams.json`** debe tener al menos:
- GK
- CB
- LB (o LM como fallback en formaciones de 5)
- RB (o RM como fallback)
- Algún CDM / CM / CAM
- Algún LW o LM
- Algún RW o RM
- Algún ST o CF

Sin esta cobertura, el draft se rompe cuando al usuario le quedan
slots de un puesto que el equipo rolleado no cubre. Antes de mergear
cambios a `teams.json`, correr el audit:

```js
node -e "
const teams = require('./src/app/game/data/teams.json');
for (const team of teams) {
  const ps = new Set(team.players.flatMap(p => p.positions));
  const miss = [];
  if (!ps.has('GK')) miss.push('GK');
  if (!ps.has('CB')) miss.push('CB');
  if (!ps.has('LB')) miss.push('LB');
  if (!ps.has('RB')) miss.push('RB');
  if (!ps.has('LW') && !ps.has('LM')) miss.push('LW/LM');
  if (!ps.has('RW') && !ps.has('RM')) miss.push('RW/RM');
  if (!ps.has('ST') && !ps.has('CF')) miss.push('ST/CF');
  if (miss.length) console.log(team.name, team.year, miss.join(','));
}
"
```

### Sin dup de club en un torneo

`TournamentService.start` filtra por `seenClubs` para que un mismo
club no aparezca dos veces en la misma copa. Si tocás esa función
cuidar de mantener la dedup.

### Coach ≠ jugador del mismo nombre

`DraftService.selectPlayer` rechaza si el nombre matchea con el coach
ya elegido, y viceversa para `selectCoach`. Si agregás nuevas formas
de pickear coach/jugador, replicar el check (`isCoachNameTakenByPlayer`
/ `isPlayerNameTakenByCoach`).

### Rarity es derivada

`data/index.ts` recomputa la `rarity` de cada player y de cada coach
desde su `rating` al cargar el JSON (`rarityFromRating`). **No
confíes** en la `rarity` que figura en el JSON — siempre es la
derivada.

### Cuando agregás un club nuevo

Tres archivos a actualizar en paralelo:

1. `src/app/game/data/teams.json` — entries con al menos 1 año.
   Incluir `coach: { name, rating, rarity: 'common' }` (la rareza se
   recomputa).
2. `src/app/game/components/team-crest/team-crest.component.ts` —
   sumar el club al mapa `COUNTRY` para que su escudo tenga la
   bandera correcta.
3. `src/app/game/data/stadiums.ts` — sumar `{ name, capacity }`.

Si no actualizás los tres, el club queda con escudo gris fallback y
"Estadio del club / 30000".

## Activos provistos por el usuario

- `public/libertadores-trophy.png` — la imagen del trofeo. Si no
  está, en la pantalla de victoria sale el `alt` text.
- `public/sounds/*.mp3` — 6 archivos: `anthem`, `crowd`,
  `whistle-kickoff`, `whistle-half`, `whistle-end`, `goal`.
  `AudioService` los carga con `new Audio()` y traga errores si
  faltan. No commitear binarios — el usuario los pone manualmente.

## Admin shortcut

En la pantalla de selección de formación hay un botón oculto **⚡ Admin
· plantel 99**. Sólo aparece si en localStorage hay:

```
localStorage.setItem('liberto.adminEnabled', 'true')
```

Llena los 11 slots + DT con plantel rating 99 y manda directo a
`/tournament/groups`. Útil para testear el flujo de victoria.

## Antes de empezar a tocar algo

Preguntar al usuario si:

- Va a agregar una **dependencia nueva**. Las que están ya están
  curadas (Angular core, canvas-confetti, vitest, prettier).
- Va a cambiar el **formato del torneo** (groups → KO flow) o el
  **draft loop** — alta superficie de cambio downstream.
- Va a tocar **modelos públicos** (`Player`, `Team`, `MatchResult`,
  `KnockoutTie`) — si rompe firma → MAJOR bump.

## Gotchas que dolió aprender

- **pnpm autorun no corre sin `allowBuilds`**: si pnpm tira "ignored
  build scripts" para esbuild o @parcel/watcher, agregalos a
  `pnpm-workspace.yaml` bajo `allowBuilds: { esbuild: true, ... }`.
- **Commit messages en PowerShell**: las comillas dobles internas
  rompen el parser. Reescribir con simples o sin comillas.
- **`liberto-scaffold` en angular.json**: si scaffoldeás de cero,
  rename el project a `liberto` en `angular.json` (3 lugares).
- **Component style budget**: si un SCSS pasa el budget warning,
  bumpeá el límite en `angular.json` (`anyComponentStyle`). Ya está
  en 12kB warn / 20kB error.
- **El builder de Angular guarda `dist/<project>/`**: si renombraste
  el proyecto, el path de output también cambia.
- **`live-match.service` recibe el `MatchResult` ya simulado**: no
  re-simula. Si querés ajustar la lógica de goles, tocar
  `match.service.ts` (`MatchService.simulate` y `buildGoalEvents`).
- **Aggregate de penales**: `resolveTieFromLegs` simula la tanda
  cuando aggregate empata. La tanda detalle se almacena en
  `tie.penaltyShootout`. La display de la card lee de ahí.

## Reglas de oro

- **Una rama por milestone**. No mezclar features no relacionadas.
- **No tests todavía** = más cuidado al refactorizar. `pnpm build`
  como mínimo antes de cada commit.
- **No emojis en código** salvo que el usuario los pida explícitamente
  o sea UI copy que ya los usa (el changelog y los premios usan).
- **Castellano para copy de UI y changelog**, inglés para nombres
  técnicos y mensajes de commit.
- **No crear archivos `.md` salvo CLAUDE.md, README.md, este tipo**.
  Specs y planning van en chat o en el changelog, no en archivos
  sueltos.
