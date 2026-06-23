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
    version: '1.4.0',
    date: '2026-06-23',
    changes: [
      'Los rerolls del draft ahora se dividen en dos contadores independientes: hasta 5 cambios de equipo y hasta 5 cambios de año del mismo club por pick. Antes los dos pedían del mismo pool de 5.',
      'En mobile, los botones de reroll quedan fijos en la parte inferior de la pantalla — ya no hace falta scrollear el roster para cambiar de equipo o año.',
      'Repaso de accesibilidad en los botones de reroll: tap targets de 48px, focus ring visible al tabular, feedback al presionar, respeta prefers-reduced-motion y la safe-area inferior de iOS.',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-06-22',
    changes: [
      'Nueva formación 4-2-3-1 con 3 MCO (en vez de extremos), pensada para cuando te toca rolear muchos enganches.',
      'Barra de fortaleza del equipo en el draft: ataque, mediocampo, defensa y un global que se va llenando mientras armás el plantel.',
      'En mobile, al elegir un jugador la página scrollea sola a la cancha para que toques la posición sin scrollear, y vuelve al roster después de asignarlo.',
      'La tabla de grupos en mobile se simplifica para que la columna de puntos siempre se vea — ganados/empatados/perdidos se ocultan en pantallas chicas.',
      'Recalibrado el simulador para que la diferencia de rating pese más: equipos claramente superiores ya no se quedan en cero contra rivales muy inferiores, y la varianza de los marcadores bajó.',
      'Equipos campeones reales de la Libertadores ahora reciben un bonus de +2 en ataque/medio/defensa al simular, así Cobreloa-tier no compite a la par con Boca 2003 o Flamengo 2019.',
      'Revisión de ratings: River 2015 recupera figuras doradas (Barovero 88, Pity 87, Pisculichi 86), el Beto Alonso duplicado en River 86 se quitó y Norberto Alonso pasa a 88, varios planteles campeones (Estudiantes 2009, Santos 2011, Mineiro 2013, San Lorenzo 2014, Flamengo 2019, Botafogo 2024, Fluminense 2023) tienen sus íconos mejor calibrados, y clubes tipo Cobreloa o Sporting Cristal bajan 1-2 puntos para abrir la brecha.',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-06-10',
    changes: [
      'Ya no podés tener al mismo nombre como técnico y como jugador en tu equipo. El que esté primero bloquea al otro con un tag "Ya en tu 11" o "Ya es tu DT".',
      'Más espaciado entre la tabla de goleadores/asistidores y la grilla de grupos / cartas de playoffs.',
      'Tanda de penales simulada uno por uno con controles de velocidad (Lento/Normal/Rápido/Saltar). En cada llave que se define por penales ahora aparece el marcador final ej. "Penales 4-3".',
      'Nombres corregidos: Carlos Pisculichi → Leonardo Pisculichi.',
      'Pasada de responsive en mobile: chips de Inicio y Mute más chicos, headers, cancha del draft, scoreboard de partido, cartas de llave (cada ida/vuelta apila al equipo visitante debajo) y trofeo de victoria — todo se adapta a 320-640px sin romperse.',
    ],
  },
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
