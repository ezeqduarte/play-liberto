import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Lookup of every club in the pool → country code. Used to colour the
 * crest with that country's national palette.
 */
const COUNTRY: Record<string, string> = {
  // Argentina
  'Boca Juniors': 'ARG',
  'River Plate': 'ARG',
  'Independiente': 'ARG',
  'Estudiantes': 'ARG',
  'Vélez Sarsfield': 'ARG',
  'San Lorenzo': 'ARG',
  'Racing Club': 'ARG',
  'Argentinos Juniors': 'ARG',
  "Newell's Old Boys": 'ARG',
  'Lanús': 'ARG',
  // Brazil
  'Santos': 'BRA',
  'Flamengo': 'BRA',
  'Grêmio': 'BRA',
  'São Paulo': 'BRA',
  'Cruzeiro': 'BRA',
  'Palmeiras': 'BRA',
  'Internacional': 'BRA',
  'Corinthians': 'BRA',
  'Atlético Mineiro': 'BRA',
  'Vasco da Gama': 'BRA',
  'Fluminense': 'BRA',
  'Botafogo': 'BRA',
  'Atlético Paranaense': 'BRA',
  // Uruguay
  'Peñarol': 'URU',
  'Nacional': 'URU',
  // Paraguay
  'Olimpia': 'PAR',
  'Cerro Porteño': 'PAR',
  // Colombia
  'Atlético Nacional': 'COL',
  'Once Caldas': 'COL',
  'América de Cali': 'COL',
  // Ecuador
  'LDU Quito': 'ECU',
  'Independiente del Valle': 'ECU',
  // Chile
  'Colo-Colo': 'CHI',
  'Universidad de Chile': 'CHI',
  'Universidad Católica': 'CHI',
  'Cobreloa': 'CHI',
  // Peru
  'Sporting Cristal': 'PER',
  'Universitario': 'PER',
  // Bolivia
  'Bolívar': 'BOL',
  // Mexico
  'Cruz Azul': 'MEX',
};

const GRADIENTS: Record<string, string> = {
  ARG: 'linear-gradient(135deg, #75AADB 0%, #FFFFFF 50%, #75AADB 100%)',
  BRA: 'linear-gradient(135deg, #009C3B 0%, #FFDF00 100%)',
  URU: 'linear-gradient(135deg, #6EAEDE 0%, #FFFFFF 100%)',
  PAR: 'linear-gradient(135deg, #D52B1E 0%, #FFFFFF 50%, #0038A8 100%)',
  CHI: 'linear-gradient(135deg, #D52B1E 0%, #FFFFFF 50%, #0039A6 100%)',
  COL: 'linear-gradient(135deg, #FCD116 0%, #003893 50%, #CE1126 100%)',
  PER: 'linear-gradient(135deg, #D91023 0%, #FFFFFF 100%)',
  ECU: 'linear-gradient(135deg, #FFDD00 0%, #0033A0 50%, #EF3340 100%)',
  BOL: 'linear-gradient(135deg, #D52B1E 0%, #F9E300 50%, #007934 100%)',
  MEX: 'linear-gradient(135deg, #006847 0%, #FFFFFF 50%, #CE1126 100%)',
  USER: 'linear-gradient(135deg, #00d165 0%, #ffb547 100%)',
  UNKNOWN: 'linear-gradient(135deg, #6f7a90 0%, #2a3656 100%)',
};

/**
 * Renders a circular badge with up to 3 club initials. Background is a
 * gradient derived from the club's country flag (USER for the player's
 * own custom squad). Pure placeholder — swap for real PNG crests later.
 */
@Component({
  selector: 'app-team-crest',
  template: `
    <span
      class="crest"
      [class.crest--sm]="size() === 'sm'"
      [class.crest--md]="size() === 'md'"
      [class.crest--lg]="size() === 'lg'"
      [style.background]="gradient()"
      [attr.aria-label]="clubName()"
    >
      <span class="crest__initials">{{ initials() }}</span>
    </span>
  `,
  styleUrl: './team-crest.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamCrestComponent {
  readonly clubName = input.required<string>();
  readonly isUser = input(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly initials = computed(() => extractInitials(this.clubName()));

  readonly gradient = computed(() => {
    if (this.isUser()) return GRADIENTS['USER'];
    const code = COUNTRY[this.clubName()] ?? 'UNKNOWN';
    return GRADIENTS[code] ?? GRADIENTS['UNKNOWN'];
  });
}

function extractInitials(name: string): string {
  if (!name) return '?';
  const cleaned = name.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '').trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);
  // Skip tiny connector words.
  const skip = new Set(['de', 'del', 'da', 'do', 'la', 'el']);
  const meaningful = words.filter((w) => !skip.has(w.toLowerCase()));
  const source = meaningful.length > 0 ? meaningful : words;
  return source
    .slice(0, 3)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}
