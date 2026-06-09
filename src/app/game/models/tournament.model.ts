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
}

export interface KnockoutRound {
  name: KnockoutRoundName;
  label: string;
  ties: KnockoutTie[];
  completed: boolean;
}
