import { Injectable } from '@angular/core';
import {
  Formation,
  GoalEvent,
  MatchResult,
  MatchTeam,
  Player,
  Position,
  Team,
  TeamStrength,
} from '../models';
import { SquadEntry } from './draft.service';

const DEFENSE_POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB'];
const MIDFIELD_POSITIONS: Position[] = ['CDM', 'CM', 'CAM', 'LM', 'RM'];
const ATTACK_POSITIONS: Position[] = ['LW', 'RW', 'ST', 'CF'];

const HOME_BOOST = 2;

@Injectable({ providedIn: 'root' })
export class MatchService {
  /**
   * Builds a MatchTeam for the user's drafted squad.
   * Strength is computed from where each player sits in the formation
   * (line is derived from slot.y), then formation modifiers are applied.
   */
  buildUserTeam(squad: SquadEntry[], formation: Formation, displayName = 'Mi equipo'): MatchTeam {
    const defs: Player[] = [];
    const mids: Player[] = [];
    const atks: Player[] = [];

    for (const entry of squad) {
      if (!entry.player) continue;
      if (entry.slot.y <= 35) defs.push(entry.player);
      else if (entry.slot.y <= 65) mids.push(entry.player);
      else atks.push(entry.player);
    }

    const baseDefense = avg(defs.map((p) => p.rating));
    const baseMidfield = avg(mids.map((p) => p.rating));
    const baseAttack = avg(atks.map((p) => p.rating));

    const strength: TeamStrength = {
      attack: baseAttack + formation.modifiers.attack,
      midfield: baseMidfield + formation.modifiers.midfield,
      defense: baseDefense + formation.modifiers.defense,
      overall: 0,
    };
    strength.overall = computeOverall(strength);

    return {
      id: 'user',
      displayName,
      clubName: displayName,
      isUser: true,
      strength,
      lineup: squad.map((e) => e.player!).filter(Boolean),
    };
  }

  /**
   * Builds a MatchTeam for a historic squad from teams.json.
   * Players are bucketed by their primary position and the strongest 11
   * are picked greedy-style; if a club lacks a position the line average
   * just uses whatever was available.
   */
  buildHistoricTeam(team: Team): MatchTeam {
    const defs = team.players.filter((p) => p.positions.some((pos) => DEFENSE_POSITIONS.includes(pos)));
    const mids = team.players.filter((p) => p.positions.some((pos) => MIDFIELD_POSITIONS.includes(pos)));
    const atks = team.players.filter((p) => p.positions.some((pos) => ATTACK_POSITIONS.includes(pos)));

    const strength: TeamStrength = {
      attack: avg(atks.map((p) => p.rating)),
      midfield: avg(mids.map((p) => p.rating)),
      defense: avg(defs.map((p) => p.rating)),
      overall: 0,
    };
    strength.overall = computeOverall(strength);

    return {
      id: `${slug(team.name)}-${team.year}`,
      displayName: `${team.name} ${team.year}`,
      clubName: team.name,
      isUser: false,
      strength,
      lineup: team.players,
    };
  }

  /**
   * Simulates a single match between two MatchTeams.
   * Goals are sampled per "minute" with a probability derived from
   * effective attack vs opponent's effective defense. Each goal is
   * decorated with a scorer (weighted by attacker ratings) and an
   * assister (weighted by midfield + attacker ratings), so the rest of
   * the app can show tournament-wide scorer / assist tables.
   */
  simulate(home: MatchTeam, away: MatchTeam): MatchResult {
    const homeAttack = effectiveAttack(home.strength) + HOME_BOOST;
    const homeDefense = effectiveDefense(home.strength) + HOME_BOOST;
    const awayAttack = effectiveAttack(away.strength);
    const awayDefense = effectiveDefense(away.strength);

    const homeGoals = simulateGoals(homeAttack, awayDefense);
    const awayGoals = simulateGoals(awayAttack, homeDefense);

    const winner: MatchResult['winner'] =
      homeGoals > awayGoals ? 'home' : awayGoals > homeGoals ? 'away' : 'draw';

    const goalEvents = buildGoalEvents(home, away, homeGoals, awayGoals);

    return { home, away, homeGoals, awayGoals, winner, goalEvents };
  }

  /**
   * Simulates a match that cannot end in a draw (knockout rounds).
   * Returns the regular result if there's a winner; otherwise simulates
   * a tiny extra-time round biased by overall strength.
   */
  simulateKnockout(home: MatchTeam, away: MatchTeam): MatchResult {
    let result = this.simulate(home, away);
    let safety = 0;
    while (result.winner === 'draw' && safety < 10) {
      const homeRoll = home.strength.overall + Math.random() * 8;
      const awayRoll = away.strength.overall + Math.random() * 8;
      if (homeRoll >= awayRoll) {
        result = {
          ...result,
          homeGoals: result.homeGoals + 1,
          winner: 'home',
          goalEvents: [
            ...result.goalEvents,
            buildExtraGoal(home, 'home', result.goalEvents.length),
          ],
        };
      } else {
        result = {
          ...result,
          awayGoals: result.awayGoals + 1,
          winner: 'away',
          goalEvents: [
            ...result.goalEvents,
            buildExtraGoal(away, 'away', result.goalEvents.length),
          ],
        };
      }
      safety++;
    }
    return result;
  }
}

function avg(values: number[]): number {
  if (values.length === 0) return 70;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function computeOverall({ attack, midfield, defense }: Pick<TeamStrength, 'attack' | 'midfield' | 'defense'>): number {
  return Math.round(attack * 0.33 + midfield * 0.34 + defense * 0.33);
}

function effectiveAttack(s: TeamStrength): number {
  return s.attack + s.midfield * 0.25;
}

function effectiveDefense(s: TeamStrength): number {
  return s.defense + s.midfield * 0.15;
}

/**
 * Simulates goals scored in 90 minutes given effective attack and defense.
 * Per-minute probability scales with the rating gap. Tightened constants
 * after calibration feedback: roughly ~1 expected goal per evenly-matched
 * side, ~2 with a clear +15 gap. Capped at 5 to avoid absurd scorelines.
 */
function simulateGoals(attack: number, defense: number): number {
  const gap = attack - defense;
  const expected = Math.max(0.1, 1.0 + gap / 16);
  const perMinute = expected / 90;
  let goals = 0;
  for (let m = 0; m < 90; m++) {
    if (Math.random() < perMinute) goals++;
  }
  return Math.min(goals, 5);
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const ATTACKER_POSITIONS: Position[] = ['ST', 'CF', 'LW', 'RW', 'CAM'];
const CREATOR_POSITIONS: Position[] = ['CAM', 'CM', 'LM', 'RM', 'LW', 'RW'];

function buildGoalEvents(
  home: MatchTeam,
  away: MatchTeam,
  homeGoals: number,
  awayGoals: number,
): GoalEvent[] {
  const events: GoalEvent[] = [];
  const used = new Set<number>();
  for (let i = 0; i < homeGoals; i++) {
    events.push(makeGoal(home, 'home', used));
  }
  for (let i = 0; i < awayGoals; i++) {
    events.push(makeGoal(away, 'away', used));
  }
  events.sort((a, b) => a.minute - b.minute);
  return events;
}

function makeGoal(
  team: MatchTeam,
  side: 'home' | 'away',
  usedMinutes: Set<number>,
): GoalEvent {
  let minute = randomMinute();
  let safety = 0;
  while (usedMinutes.has(minute) && safety < 12) {
    minute = randomMinute();
    safety++;
  }
  usedMinutes.add(minute);
  const scorer = pickScorer(team);
  const assister = Math.random() < 0.7 ? pickAssister(team, scorer) : null;
  return { minute, side, scorer, assister };
}

function buildExtraGoal(team: MatchTeam, side: 'home' | 'away', _offset: number): GoalEvent {
  const scorer = pickScorer(team);
  const assister = Math.random() < 0.5 ? pickAssister(team, scorer) : null;
  return { minute: 91 + Math.floor(Math.random() * 30), side, scorer, assister };
}

function pickScorer(team: MatchTeam): Player {
  const attackers = team.lineup.filter((p) =>
    p.positions.some((pos) => ATTACKER_POSITIONS.includes(pos)),
  );
  const pool = attackers.length > 0 ? attackers : team.lineup;
  return weightedPickByRating(pool);
}

function pickAssister(team: MatchTeam, exclude: Player): Player {
  const creators = team.lineup.filter(
    (p) =>
      p.name !== exclude.name &&
      p.positions.some((pos) => CREATOR_POSITIONS.includes(pos)),
  );
  const fallback = team.lineup.filter((p) => p.name !== exclude.name);
  const pool = creators.length > 0 ? creators : fallback;
  return weightedPickByRating(pool);
}

function weightedPickByRating(pool: Player[]): Player {
  if (pool.length === 0) {
    throw new Error('Empty pool for weighted pick.');
  }
  const weighted = pool.flatMap((p) => Array(Math.max(1, p.rating - 65)).fill(p));
  return weighted[Math.floor(Math.random() * weighted.length)];
}

function randomMinute(): number {
  let minute = 1 + Math.floor(Math.random() * 89);
  if (minute === 45) minute = 44;
  return minute;
}
