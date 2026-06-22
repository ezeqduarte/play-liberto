# CLAUDE.md

Guía para Claude Code cuando trabaja en este repositorio. Densa por
diseño — leerlo entero al arrancar una sesión nueva. Actualizalo
cuando algo importante cambie.

**Última versión productiva: `v1.3.0`** (leer `CURRENT_VERSION` en
`src/app/game/data/changelog.ts` para la fuente de verdad).

---

## Qué es Liberto

Juego web single-page que emula la Copa Libertadores. El flow del
usuario:

1. Elige formación (10 dibujos × 3 estilos = 30 variantes, hay una
   variante extra `4-2-3-1-narrow` con 3 MCO en vez de extremos).
2. Drafteá 11 jugadores + 1 DT rolleando team-years con 5 rolls por
   pick. Cada team trae sus jugadores históricos y su técnico.
3. Jugás un torneo: 8 grupos de 4, R16/QF/SF/F con ida y vuelta. La
   final también es ida y vuelta.
4. Partido a partido minuto a minuto, con eventos (gol, tiro, tarjeta),
   hinchada como ambiente, silbatos, sonido de gol, y una barra de
   stats que avanza con el reloj.
5. Tu partido lo jugás en vivo; los del resto del cuadro se simulan
   automáticamente. Después de cada leg el bracket te muestra todos
   los resultados.
6. Llaves: dos patas + agregado. Si empata al global → tanda de
   penales kick-by-kick.
7. Si ganás la final → trofeo Libertadores + confetti. Si perdés →
   seguís en modo fantasma mirando hasta saber quién campeonó. La
   pantalla de fin muestra 4 premios (goleador, asistidor, MVP, mejor
   arquero) calculados desde los `goalEvents` y la progresión de cada
   equipo.

---

## Stack

- Angular 22 — standalone components, signals, lazy-loaded routes.
- TypeScript 6.x.
- pnpm 11.5.2 (pinned via `packageManager` en `package.json`).
  Requiere Node 22+. **`nvm use 24.16.0`** si nvm cambió de versión.
  Si pnpm falla con "Looks like pnpm CLI is missing", correr
  `npm install -g pnpm@11.5.2` con la versión correcta de Node.
- `pnpm-workspace.yaml` con `allowBuilds: { esbuild: true, ... }`.
  Pnpm 11+ NO usa `onlyBuiltDependencies`.
- SCSS, sin Tailwind.
- canvas-confetti en la pantalla de victoria.
- HTMLAudioElement para audio (no Web Audio API).
- Vitest está en devDeps pero **no hay tests escritos**. El build es
  la única red de seguridad. Siempre `pnpm build` antes de commit.

Build / run:

```
pnpm install
pnpm start     # ng serve, http://localhost:4200 (cambiá con --port=XXXX)
pnpm build     # ng build
```

Dev server alternativo para preview MCP en
`.claude/launch.json` apuntando a port 4318 si el 4200 está ocupado.

---

## Estructura del proyecto

```
.claude/
  launch.json                  # config para preview MCP
public/
  libertadores-trophy.png      # imagen del trofeo (usuario provee)
  sounds/                      # 6 mp3s (usuario provee, README adentro)
  favicon.ico
scripts/                       # one-shot data ops auditables
  expand-teams.mjs
  add-more-years.mjs
  add-ten-clubs.mjs
  add-more-iconic-clubs.mjs
  backfill-coaches.mjs
  rating-pass-v2.mjs
src/app/
  app.{ts,html,routes.ts}      # shell, anthem inicia en App.ngOnInit
  game/
    models/                    # interfaces puras (Player, Team, Formation,
                               #   MatchResult, KnockoutTie, GoalEvent,
                               #   PenaltyShootout, etc.)
    data/
      teams.json               # 108 team-years (40 clubes únicos)
      changelog.ts             # CHANGELOG + CURRENT_VERSION
      stadiums.ts              # club → {name, capacity} + MyTeam Stadium
    formations/
      formations.data.ts       # 11 shapes (10 + narrow) × 3 estilos
    services/                  # estado vivo en signals, providedIn root
      draft.service.ts
      tournament.service.ts
      match.service.ts
      live-match.service.ts
      audio.service.ts
    utils/
      rarity.ts                # rarityFromRating
    pages/                     # 1 carpeta por ruta, todas standalone
      home/
      formation-select/
      draft/
      groups/
      bracket-draw/
      playoffs/
      victory/
      eliminated/
      changelog/
    components/                # widgets reusables
      page-nav/                # chip flotante "Inicio"
      mute-button/             # chip flotante 🔊/🔇
      team-crest/              # escudo circular por país
      live-match/              # scoreboard + feed
      penalty-shootout/        # tanda kick-by-kick
      stats-leaderboard/       # goleadores + asistidores
      tournament-awards/       # 4 premios fin de copa
```

---

## Convenciones (no negociables)

### Angular 22 moderno

- `standalone: true` (default ahora). Imports en
  `@Component({imports: [...]})`.
- Control flow nuevo: `@if`, `@for`, `@switch`. **Nunca**
  `*ngIf`/`*ngFor`/`*ngSwitch`.
- Inputs con `input()` / `input.required<T>()`. Outputs con
  `output<T>()`. **Nunca** decoradores `@Input`/`@Output`.
- Estado con `signal()`/`computed()`/`effect()`. RxJS no se usa
  en este codebase.
- `ChangeDetectionStrategy.OnPush` en todos los componentes.
- `viewChild<ElementRef<HTMLElement>>('tagName')` para refs del
  template (signal-based).

### Rutas

Todas lazy via `loadComponent`. Patrón actual:

```
/                          → home
/changelog                 → changelog
/draft/formation           → formation-select
/draft/squad               → draft
/tournament/groups         → groups
/tournament/draw           → bracket-draw
/tournament/playoffs       → playoffs
/tournament/victory        → victory
/tournament/eliminated     → eliminated
```

### Git

- Una rama por milestone: `feature/<descripcion>`,
  `fix/<descripcion>`, `chore/<descripcion>`, `docs/<descripcion>`,
  `refactor/<descripcion>`.
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`,
  `refactor:`, `test:`, `style:`.
- Merge con `--no-ff` para preservar la topología.
- **Nunca commitear directo a `main`**.
- Co-author footer:
  ```
  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  ```

### Commits desde PowerShell

Acordate: usar here-string `@'...'@` y **evitar comillas dobles
internas** en el mensaje (rompen el parser). Si necesitás citar algo,
usá comillas simples o reescribilo sin comillas.

### Idioma

- Castellano para UI copy, changelog, mensajes al usuario.
- Inglés para nombres técnicos (identificadores, tipos, comentarios
  de código) y commit messages.

---

## Política de versiones (semver estricto)

Cada batch del usuario = un solo bump. La regla:

- **PATCH (1.3.0 → 1.3.1)**: fixes y ajustes que **no agregan
  funcionalidad**. Bug fixes, typos de datos, fixes de spacing,
  ajustes responsive sin cambiar UX, retoques de copy.

- **MINOR (1.3.0 → 1.4.0)**: cualquier feature nueva visible para el
  usuario, aunque el resto del batch sea fixes. Ej: tabla de
  goleadores nueva, sistema de audio, premios al final, penales en
  vivo, formación nueva, barra de stats del squad. Si **al menos una**
  entrada del batch es feature nueva, es MINOR.

- **MAJOR (1.3.0 → 2.0.0)**: cambios disruptivos en la UX core o en
  el modelo de datos. Ej: rework completo del draft, cambiar el
  formato del torneo, romper la firma de un servicio público, agregar
  multiplayer (rompe el modelo singleton actual), remover una
  pantalla. **Confirmar con el usuario antes de bumpear MAJOR**.

Borderlines: si dudás entre PATCH y MINOR, mirá las viñetas del batch.
Describe "agregá X" / "ahora podés Y" → MINOR. Describe "arreglá X"
/ "ajustá Y" → PATCH.

Histórico hasta hoy:
- v1.0.0: primer cut (todo lo acumulado hasta ese batch).
- v1.1.0: scorers/assisters + 4 awards + stadiums + playoff rework.
- v1.2.0: coach/player dedup + penales + Pisculichi + mobile pass.
- v1.3.0: formación narrow + barra de stats + auto-scroll mobile +
  tablas legibles + rebalance simulator + prestige bonus + rating
  pass de íconos.

---

## Release workflow

Al final de un batch, antes de pushear:

1. Cada milestone ya está en una rama propia mergeada a `main`.
2. Editar `src/app/game/data/changelog.ts`: **prepend** una entrada
   nueva con la versión bumpeada y los bullets del batch (castellano,
   parafraseando lo que pidió el usuario como features entregadas).
3. `pnpm build` para verificar.
4. `chore(release): cut vX.Y.Z` con un mensaje que liste lo grueso.
5. Merge a `main` con `--no-ff` + `git push origin main`.

Si el batch fue "no toca changelog" (refactors internos, docs,
configs), saltar los pasos 2 y 4 y commitear con un `docs(...)`,
`chore(...)` o `refactor(...)`.

---

## Critical invariants (no romper)

### Cobertura de posiciones por equipo

**Cada entrada de `teams.json`** debe tener al menos:
- GK
- CB
- LB (o LM como fallback en formaciones de 5 con `LB|LM`)
- RB (o RM como fallback)
- Algún CDM / CM / CAM
- Algún LW o LM
- Algún RW o RM
- Algún ST o CF

Sin esta cobertura el draft se rompe cuando al usuario le queda un
slot de un puesto que el equipo rolleado no cubre. Antes de mergear
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

### Sin duplicados de club en un torneo

`TournamentService.start` filtra con un `seenClubs` set para que un
mismo club no aparezca dos veces en la misma copa (ej. Boca '01 y
Boca '03 no coexisten). Si tocás esa función mantener la dedup.

### Coach ≠ jugador del mismo nombre

`DraftService.selectPlayer` rechaza si el nombre matchea al coach
ya elegido. `DraftService.selectCoach` rechaza si el nombre matchea
a un jugador ya en el squad. La UI muestra tags "Ya en tu 11" / "Ya
es tu DT" en las cards bloqueadas.

### Rarity es derivada

`data/index.ts` (cargador del JSON) recomputa la `rarity` de cada
player y de cada coach desde su `rating` con `rarityFromRating`
(`utils/rarity.ts`). Umbrales:

- `>= 88` → legendary
- `83-87` → epic
- `78-82` → rare
- `< 78` → common

**No confiar** en la `rarity` que figura en el JSON — siempre es la
derivada en runtime.

### Al agregar un club nuevo — tres archivos en paralelo

1. `src/app/game/data/teams.json` — entries con al menos 1 año.
   Cada entry necesita `coach: { name, rating, rarity: 'common' }`
   (la rarity se recomputa, da igual el valor).
2. `src/app/game/components/team-crest/team-crest.component.ts` —
   sumar el club al mapa `COUNTRY` para que su escudo tenga la
   bandera correcta.
3. `src/app/game/data/stadiums.ts` — sumar `{ name, capacity }` al
   mapa.

Si no actualizás los tres, el club queda con escudo gris fallback y
"Estadio del club / 30000".

Si el club que agregás es un **campeón real** de la Libertadores,
también sumarlo al set `CHAMPION_TEAM_YEARS` en
`src/app/game/services/match.service.ts` para que reciba el prestige
bonus de +2.

---

## Cómo funciona la simulación de partidos

### Construcción de strength

`MatchService.buildUserTeam(squad, formation)`:
- Bucketea los 11 slots por `slot.y`: `≤35` → defensa, `≤65` →
  medio, resto → ataque.
- Promedia los ratings de cada bucket.
- Aplica los modificadores tácticos (defensivo: +5 def / -3 atk;
  ofensivo: +5 atk / -3 def; equilibrado: 0).
- `overall = round(atk*0.33 + mid*0.34 + def*0.33)`.

`MatchService.buildHistoricTeam(team)`:
- Mismo agrupamiento pero filtrando por posiciones de cada player.
- **Prestige bonus**: si `${team.name}|${team.year}` está en
  `CHAMPION_TEAM_YEARS` (set hardcoded con ~50 campeones reales),
  suma `+2` a cada línea.

### `simulate(home, away)`

```
homeAttack  = home.attack  + home.midfield * 0.25 + HOME_BOOST(2)
homeDefense = home.defense + home.midfield * 0.15 + HOME_BOOST(2)
awayAttack  = away.attack  + away.midfield * 0.25
awayDefense = away.defense + away.midfield * 0.15
```

Goles del local: `simulateGoals(homeAttack, awayDefense)`.
Goles del visitante: `simulateGoals(awayAttack, homeDefense)`.

### `simulateGoals(attack, defense)` — fórmula actual (v1.3.0)

```ts
gap = attack - defense
expected = max(0.05, 0.8 + gap / 10)
if (gap < -7) expected *= 0.55          // castigo al underdog
baseline = floor(expected)              // determinístico
fractional = expected - baseline
perMinute = fractional / 90
goles = baseline
for (90 minutes) if (random() < perMinute) goles++
return min(goles, 6)
```

Clave: el `baseline` es **garantizado**. Esto eliminó el ~15% de
shutouts contra equipos elite. Tabla aproximada:

| Gap | Expected | Goles típicos |
|---|---|---|
| 0 | 0.80 | 0-1 |
| +10 | 1.80 | 1-2 |
| +15 | 2.30 | 2 (a veces 3) |
| +20 | 2.80 | 2-3 |
| -10 | 0.05 (× 0.55) | 0 casi seguro |

### Goal events — `buildGoalEvents`

Cada gol pre-computado lleva goleador + asistidor opcional.

- **Scorer**: weighted pick entre atacantes (ST/CF/LW/RW/CAM), peso
  `max(1, rating - 65)`. Un 96 entra 31 veces al sorteo; un 70, 5.
- **Assister**: 70% de chance. Si hay, weighted pick entre
  creadores (CAM/CM/LM/RM/LW/RW), excluyendo al scorer.
- Minuto: random 1-89, evitando 45.

Los events alimentan: feed en vivo, tabla de goleadores/asistidores,
4 premios.

### Llaves de playoffs (`resolveTieFromLegs`)

```
aggregateA = leg1.homeGoals + leg2.awayGoals
aggregateB = leg1.awayGoals + leg2.homeGoals
if aggregateA != aggregateB → gana el mayor
else → simulatePenaltyShootout()
```

**Sin gol de visitante** (regla moderna desde 2022).

### Tanda de penales — `simulatePenaltyShootout`

- 5 tiros por equipo alternando, kickers por descending rating
  (excluyendo GK).
- Probabilidad: `0.75 + (taker.rating - keeper.rating) * 0.005`,
  clampeada a `[0.55, 0.92]`.
- Corta cuando matemáticamente sea imposible empardar.
- Muerte súbita después de los 5 si siguen empatados.
- Todo el detalle queda en `tie.penaltyShootout.kicks` y se reproduce
  en el `PenaltyShootoutComponent`.

### Playback en vivo (`LiveMatchService`)

**El resultado se calcula upfront**. `live-match.service.start()`
llama a `MatchService.simulate()` y obtiene el `MatchResult`
completo. Después:

- Genera una timeline de eventos (kickoff, half-time, full-time,
  goles, tiros flavor, tarjetas)
- Recorre minuto a minuto disparando eventos al feed según la
  velocidad seleccionada
- Velocidades: Lento (400ms/min), Normal (160), Rápido (60),
  Saltar (12)
- Cambiar velocidad solo cambia el delay, no afecta el resultado
- Audio: `audio.playSfx('goal'|'kickoff'|'halftime'|'fulltime')`
  según el evento

**No podés influir en el resultado mirando el partido**. Es
playback de algo ya decidido.

### Knobs principales (todos viven en `match.service.ts`)

| Constante | Valor | Efecto |
|---|---|---|
| `HOME_BOOST` | 2 | Cuanto pesa la localía en ambas líneas |
| `PRESTIGE_BONUS` | 2 | Bonus a campeones del set hardcoded |
| `expected = 0.8 + gap/10` | — | Sensibilidad al rating gap |
| `* 0.55` cuando gap < -7 | — | Castigo al underdog |
| Cap final | 6 goles | Tope por equipo |
| Midfield → attack | × 0.25 | Influencia del medio |
| Midfield → defense | × 0.15 | — |
| Penalty base | 0.75 ± 0.005 × diff | Calibración de la tanda |
| Penalty clamp | [0.55, 0.92] | Pisos / techos por penal |

### CHAMPION_TEAM_YEARS (set hardcoded)

~50 entradas keyed por `"${club}|${year}"`. Cubre todos los
campeones de Libertadores en el pool actual: Peñarol 60/66/87, Santos
62/63/2011, Independiente 64/65/72/73/74/84, Estudiantes 68/2009,
Nacional 80/88, Olimpia 79/90/2002, Boca 2000/01/03/07, Flamengo
81/2019, Grêmio 83/2017, River 86/96/2015/2018, Atlético Nacional
89/2016, São Paulo 92/93/2005, Vélez 94, Cruzeiro 76/97, Palmeiras
99/2020/21, Once Caldas 04, Internacional 06/2010, Corinthians
2012, Atlético Mineiro 2013, LDU Quito 08, San Lorenzo 2014, Racing
67, Argentinos 85, Colo-Colo 91, Vasco 98, Botafogo 2024,
Fluminense 2023.

Si agregás un campeón nuevo a `teams.json` que califica como
ganador real, **también sumarlo a este set**.

---

## Layouts y mobile

### Breakpoints

- `> 960px` → desktop (pitch + panel side-by-side)
- `≤ 960px` → tablet/mobile (pitch arriba, panel abajo, scroll
  natural en `draft`)
- `≤ 640px` → mobile chico (chips más compactos, headers más chicos,
  group standings ocultan columnas G/E/P)
- `≤ 480px` → bracket cards a 1 columna

### Patrones mobile-aware

- **Page-nav chip** (`page-nav.component`): position fixed top-left,
  se achica en mobile. El requiresConfirmation se setea por página
  (true para draft/torneo, false para formation/eliminado/victoria).
- **Mute chip** (`mute-button.component`): position fixed top-right.
- **Auto-scroll en draft mobile** (`draft.component`): usa
  `viewChild('pitchArea')` y `viewChild('rosterAnchor')`. En
  viewports `<= 960px`, `selectPlayer`/`selectCoach` scrollea al
  pitch; `assignToSlot`/`confirmCoachAndScroll` vuelven al roster.
  Desktop no scrollea (`window.matchMedia('(max-width: 960px)')`
  guarda).
- **Group standings** (`groups.component.scss`): columnas G/E/P
  llevan clase `hide-on-mobile` (display none en `<= 640px`),
  table-layout fixed.
- **Strength bar** (`draft`): grid de 4 cards (Global / Atk / Mid /
  Def) que se compacta en `<= 480px`.

---

## Estado actual: features activas

### Draft
- Selector de formación con bullets (dibujo) + bullets (estilo).
- Cancha animada que refleja la selección.
- Botón Admin oculto detrás de localStorage flag.
- Roll team / Roll year con 5 rolls por pick.
- Pick: jugador primero → click en slot eligible (slots pulsan en
  verde). Para coach: mismo flow pero el slot del DT pulsa en oro.
- Validación de dup (mismo nombre coach + jugador).
- Strength bar (overall + 3 líneas).
- 12 selecciones totales (11 + DT).

### Tournament
- 32 equipos, top 2 grupos avanzan.
- 6 jornadas en grupos; cada jornada tu partido en vivo + resto
  auto-sim.
- R16/QF/SF/F a ida y vuelta. Tu llave en vivo, otras auto-sim por
  leg.
- Sorteo del bracket bola-por-bola con dramatic reveal.
- Click en rondas pasadas en el strip para revisar resultados.
- Tabla de goleadores + asistidores en grupos y playoffs.
- Tanda de penales en vivo cuando aplica.
- Ghost mode si te eliminan: seguís hasta saber el campeón.

### Premios (fin de copa)
- Goleador, asistidor, MVP (goles + asistencias + bonus por
  progresión del equipo), mejor arquero (vallas invictas + bonus).
- Visibles en `/tournament/victory` y `/tournament/eliminated`.

### Audio
- Música de menú (`anthem.mp3`) en loop fuera de partidos.
- Hinchada (`crowd.mp3`) en loop durante partidos.
- SFX: silbato kickoff, silbato medio tiempo, silbato final, sonido
  gol.
- Botón mute persistente. Bug del autoplay: hay un listener de click
  global que re-intenta el play en la primera interacción.

### Otros
- 4-2-3-1 narrow (3 MCO).
- Escudos circulares por país (placeholder con iniciales).
- Estadio del local visible en cada partido con capacidad.
- Changelog en `/changelog`.
- Confetti + trofeo SVG/PNG en victoria.
- 108 team-years en el pool, 40 clubes únicos.

---

## Activos provistos por el usuario (no commitear binarios)

- `public/libertadores-trophy.png` — trofeo en victoria. Si falta
  sale el alt text.
- `public/sounds/*.mp3` — 6 archivos:
  - `anthem.mp3` (loop menú)
  - `crowd.mp3` (loop partido)
  - `whistle-kickoff.mp3`
  - `whistle-half.mp3`
  - `whistle-end.mp3`
  - `goal.mp3`

`AudioService` los carga con `new Audio(...)` y traga errores si
faltan. El README adentro de `public/sounds/` explica el contrato.

---

## localStorage keys

| Key | Tipo | Quién la usa | Comportamiento si falta |
|---|---|---|---|
| `liberto.muted` | `'true'\|'false'` | AudioService | Default false |
| `liberto.adminEnabled` | `'true'\|'false'` | formation-select | Se autocrea como false. Toggle a `'true'` muestra el botón ⚡ Admin |

Para el admin shortcut:

```js
localStorage.setItem('liberto.adminEnabled', 'true')
// reload, aparece el botón. Llena 11 + DT con rating 99 y va directo
// a /tournament/groups.
```

---

## Antes de cambiar algo grande — preguntar al usuario

Confirmar antes de:

- Agregar una **dependencia** nueva.
- Cambiar el **formato del torneo** (groups → KO, número de equipos,
  cantidad de jornadas).
- Cambiar el **draft loop** (cantidad de slots, cantidad de rolls,
  número de selecciones totales).
- Tocar **modelos públicos** (`Player`, `Team`, `MatchResult`,
  `KnockoutTie`, `MatchTeam`). Si rompe firma → MAJOR bump.
- Implementar **multiplayer/backend** (ver plan archivado en
  `C:\Users\USER\.claude\plans\me-gustaria-agregar-la-hazy-pinwheel.md`).
- Cambios en `CHAMPION_TEAM_YEARS` o en el `PRESTIGE_BONUS` (afecta
  balance del juego, mejor confirmar).

---

## Gotchas (volverás a tropezarte si no leés esto)

- **pnpm "Looks like pnpm CLI is missing"**: nvm cambió a Node 20 y
  pnpm 11.5 quiere Node 22+. `nvm use 24.16.0` + `npm install -g
  pnpm@11.5.2`.
- **pnpm ignored build scripts**: agregalos a `pnpm-workspace.yaml`
  bajo `allowBuilds: { esbuild: true, ... }`. **No** uses
  `onlyBuiltDependencies` (es de pnpm < 11).
- **Commit messages en PowerShell**: las comillas dobles internas
  rompen el parser. Usar here-string `@'...'@` con simples o sin
  comillas.
- **`liberto-scaffold` en angular.json**: si scaffoldeás de cero,
  rename el project a `liberto` en `angular.json` (3 lugares).
- **Component style budget**: si un SCSS pasa el budget warning,
  bumpeá el límite en `angular.json` (`anyComponentStyle`). Ya está
  en 12kB warn / 20kB error.
- **Preview MCP port clash**: el port 4200 puede estar ocupado por
  otro proyecto local. Usar `--port=4318` en `.claude/launch.json`.
- **`live-match.service` no re-simula**: recibe el `MatchResult` ya
  hecho. Si querés cambiar la lógica de goles, tocar
  `match.service.ts` (`simulate` y `buildGoalEvents`).
- **El user team siempre tiene `id: 'user'`** y `isUser: true`. Hay
  checks hardcodeados con esa key (`buildUserTeam`, varios lugares
  de la UI). Si llegás a hacer multiplayer, vas a tener que
  generalizar.
- **El "Beto Alonso" duplicado** en River 86: se removió en
  v1.3.0. El verdadero "Beto" es Norberto Alonso (rating 88). No
  re-introducir el dup.
- **Pisculichi es Leonardo, no Carlos**. Se corrigió en v1.2.0.
- **Champion squads tienen prestige +2**. Si en testing notás que
  un campeón "no se siente fuerte", chequear que esté en
  `CHAMPION_TEAM_YEARS`.

---

## Plan archivado: multiplayer + perfil

`C:\Users\USER\.claude\plans\me-gustaria-agregar-la-hazy-pinwheel.md`

Resumen: el usuario quiere eventualmente

- **Perfil con stats persistentes**: cups won, formación mejor/peor,
  goleadores en contra, etc.
- **Multiplayer real-time con backend**: hasta 32 humanos en la
  misma copa, draftean en paralelo, partidos gateados por "faltan X
  jugadores".

Confirmado: backend (Firebase candidato), un solo perfil por device.

Staged en 5 phases:

| Phase | Alcance | Versión |
|---|---|---|
| 1 | Perfil local + stats | v1.4.0 (MINOR) |
| 2 | Backend foundation (Firebase auth + profile sync) | v1.5.0 (MINOR) |
| 3 | Lobby + draft sync (rompe el singleton) | v2.0.0 (MAJOR) |
| 4 | Matchdays paralelos con gating | v2.1.0 (MINOR) |
| 5 | Presence + reconexión + host migration | v2.x.0 |

No empezar Phase 3+ sin confirmación explícita — es el bump MAJOR.

---

## Reglas de oro

- **Una rama por milestone**. No mezclar features no relacionadas.
- **Build OK antes de cada commit**. `pnpm build` es la única red
  de seguridad mientras no haya tests.
- **No emojis en código** salvo que el usuario los pida o sea UI
  copy que ya los usa (changelog, premios, page-nav, mute-button,
  stats-leaderboard).
- **No crear archivos `.md` salvo CLAUDE.md, README.md, los del
  `public/sounds/`**. Planning y specs van en chat o en el changelog,
  no en archivos sueltos.
- **No commitear archivos binarios** (PNGs, MP3s, etc.). El usuario
  los pone manualmente en `public/`.
- **No tocar `live-match.service.ts` para cambiar el resultado** —
  ese es solo playback. Para tunear la simulación, ir a
  `match.service.ts`.
- **El plan file solo se toca en modo plan**. Fuera de modo plan, no
  hace falta editarlo para cada batch.
