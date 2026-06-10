import { Player } from './player.model';

export interface TeamStrength {
  attack: number;
  midfield: number;
  defense: number;
  overall: number;
}

export interface MatchTeam {
  /** Stable identifier — used for keying in groups, brackets, etc. */
  id: string;
  /** Human-friendly label shown in the UI (e.g., "Boca Juniors 2001"). */
  displayName: string;
  /** Club name without the year suffix — used by the crest component
   *  to look up country colours and produce stable initials. */
  clubName: string;
  /** Whether this is the user's custom squad. */
  isUser: boolean;
  strength: TeamStrength;
  /** The actual 11 players this team fields. Useful for goal scorer events. */
  lineup: Player[];
}

export interface MatchResult {
  home: MatchTeam;
  away: MatchTeam;
  homeGoals: number;
  awayGoals: number;
  winner: 'home' | 'away' | 'draw';
}
