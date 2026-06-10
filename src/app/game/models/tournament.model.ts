import { MatchResult, MatchTeam } from './match.model';

export interface GroupFixture {
  matchday: number;
  home: MatchTeam;
  away: MatchTeam;
  result: MatchResult | null;
}

export interface GroupStanding {
  team: MatchTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface Group {
  id: string; // 'A', 'B', ... 'H'
  teams: MatchTeam[];
  fixtures: GroupFixture[];
  standings: GroupStanding[];
  completed: boolean;
}

export type KnockoutRoundName = 'R16' | 'QF' | 'SF' | 'F';

export type KnockoutTieBreaker = null | 'away-goals' | 'penalties';

export interface PenaltyKick {
  /** Which team took the kick. 'home' = tie.teamA, 'away' = tie.teamB. */
  side: 'home' | 'away';
  taker: import('./player.model').Player;
  scored: boolean;
  /** 1-5 standard, 6+ sudden death. */
  round: number;
}

export interface PenaltyShootout {
  homeScore: number;
  awayScore: number;
  kicks: PenaltyKick[];
}

export interface KnockoutTie {
  id: string;
  teamA: MatchTeam;
  teamB: MatchTeam;
  leg1: MatchResult | null;
  leg2: MatchResult | null;
  /** Final is a single match; everything else is two legs. */
  isFinal: boolean;
  winner: MatchTeam | null;
  aggregateA: number;
  aggregateB: number;
  /** How the winner was decided when the aggregate ended level. */
  tieBreaker: KnockoutTieBreaker;
  /** Kick-by-kick detail when tieBreaker === 'penalties'. */
  penaltyShootout: PenaltyShootout | null;
}

export interface KnockoutRound {
  name: KnockoutRoundName;
  label: string;
  ties: KnockoutTie[];
  completed: boolean;
}
