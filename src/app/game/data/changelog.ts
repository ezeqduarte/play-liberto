/**
 * Liberto changelog. The newest version sits at the top.
 *
 * Workflow: every time a batch of user-requested changes ships, bump
 * the version (semver) and add a new entry at the start of CHANGELOG.
 * `changes` is the bullet list the user originally sent, paraphrased
 * as a delivered feature.
 */
export interface ChangelogEntry {
  version: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  /** User-facing bullets. */
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.1.0',
    date: '2026-06-10',
    changes: [
      'Tabla de máximos goleadores y máximos asistidores visible en grupos y en playoffs, actualizada en tiempo real con cada gol simulado.',
      'Al terminar la copa aparecen 4 premios: goleador, asistidor, mejor jugador (G+A + bonus por avanzar) y mejor arquero (vallas invictas + bonus por avanzar).',
      'En cada partido en vivo se muestra el estadio anfitrión con su nombre y capacidad. Tu equipo juega en MyTeam Stadium (75.000).',
      'En playoffs, cuando termina tu ida se simulan automáticamente las idas del resto. Lo mismo con la vuelta. Desaparece el botón "Simular el resto" y queda "Avanzar a siguiente fase" directo.',
      'Las rondas pasadas en el strip ahora son clickeables: podés estar en semis y revisar octavos sin perder tu posición.',
      'En la final el botón ya no dice "Simular el resto" sino "Ver resultados", y lleva a la pantalla con los premios de la copa.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-06-10',
    changes: [
      'Los equipos no se duplican en la copa — un mismo club nunca aparece dos veces en la misma edición aunque sea de años distintos.',
      'UI de playoffs más clara: cada partido muestra explícitamente quién jugó de local y quién de visitante con un 🏠 sobre el anfitrión.',
      'En los empates de playoffs se va directo a penales — se quitó la regla de gol de visitante.',
      'La final ahora se juega ida y vuelta como las demás rondas.',
      'Escudos visibles para cada equipo en grupos, sorteo, playoffs y marcador del partido (placeholder con iniciales y colores del país).',
      'Recalibrado del simulador: menos goles por partido, marcadores más realistas (cap por equipo bajado a 5).',
      'Más equipos icónicos en el pool: Racing Club, Fluminense, Lanús, Botafogo, Atlético Paranaense, Bolívar, Universidad Católica y Cruz Azul (cada uno con 3 años). Plus años extra para LDU Quito y Olimpia.',
      'Sistema de audio: música de fondo en los menús, ambiente de hinchada durante los partidos, silbatos de inicio/medio tiempo/final, sonido de gol, y un botón 🔊/🔇 flotante en la esquina superior derecha para mutear.',
    ],
  },
];

/** Convenience export for the version chip on the home screen. */
export const CURRENT_VERSION = CHANGELOG[0].version;
