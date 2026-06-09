import { Injectable, computed, inject, signal } from '@angular/core';
import { TEAMS } from '../data';
import {
  Group,
  GroupFixture,
  GroupStanding,
  KnockoutRound,
  KnockoutRoundName,
  KnockoutTie,
  MatchResult,
  MatchTeam,
} from '../models';
import { DraftService } from './draft.service';
import { MatchService } from './match.service';

const GROUP_IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const TOTAL_MATCHDAYS = 6;

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly draft = inject(DraftService);
  private readonly matches = inject(MatchService);

  private readonly _userTeam = signal<MatchTeam | null>(null);
  private readonly _groups = signal<Group[]>([]);
  private readonly _currentMatchday = signal(0);
  private readonly _groupsCompleted = signal(false);
  private readonly _rounds = signal<KnockoutRound[]>([]);
  private readonly _bracketDrawn = signal(false);
  private readonly _eliminatedAt = signal<KnockoutRoundName | 'group' | null>(null);
  private readonly _won = signal(false);

  readonly userTeam = this._userTeam.asReadonly();
  readonly groups = this._groups.asReadonly();
  readonly currentMatchday = this._currentMatchday.asReadonly();
  readonly groupsCompleted = this._groupsCompleted.asReadonly();
  readonly rounds = this._rounds.asReadonly();
  readonly bracketDrawn = this._bracketDrawn.asReadonly();
  readonly eliminatedAt = this._eliminatedAt.asReadonly();
  readonly won = this._won.asReadonly();
  readonly totalMatchdays = TOTAL_MATCHDAYS;

  readonly userGroup = computed<Group | null>(() => {
    const user = this._userTeam();
    if (!user) return null;
    return this._groups().find((g) => g.teams.some((t) => t.id === user.id)) ?? null;
  });

  readonly currentRound = computed<KnockoutRound | null>(() => {
    const rounds = this._rounds();
    if (rounds.length === 0) return null;
    const incomplete = rounds.find((r) => !r.completed);
    return incomplete ?? rounds[rounds.length - 1];
  });

  /**
   * The user's next unplayed fixture for the active matchday, or null
   * if the matchday is already played out or the user isn't in any fixture.
   */
  readonly userFixtureForCurrentMatchday = computed<GroupFixture | null>(() => {
    const md = this._currentMatchday();
    const group = this.userGroup();
    const user = this._userTeam();
    if (!group || !user || md === 0) return null;
    return (
      group.fixtures.find(
        (f) =>
          f.matchday === md &&
          f.result === null &&
          (f.home.id === user.id || f.away.id === user.id),
      ) ?? null
    );
  });

  /** The user's current-round tie, with leg state, or null. */
  readonly userTie = computed<KnockoutTie | null>(() => {
    const round = this.currentRound();
    const user = this._userTeam();
    if (!round || !user) return null;
    return (
      round.ties.find((t) => t.teamA.id === user.id || t.teamB.id === user.id) ?? null
    );
  });

  /**
   * Initialises the tournament: builds the user MatchTeam from the draft,
   * picks 31 random historic teams, distributes all 32 into 8 groups,
   * and schedules round-robin matchdays.
   */
  start(): void {
    const formation = this.draft.formation();
    const squad = this.draft.squad();
    if (!formation || squad.length === 0) {
      throw new Error('No squad available to start tournament.');
    }

    const userTeam = this.matches.buildUserTeam(squad, formation);
    this._userTeam.set(userTeam);

    const shuffledTeams = shuffle([...TEAMS]).slice(0, 31);
    const opponents = shuffledTeams.map((t) => this.matches.buildHistoricTeam(t));

    const allTeams = shuffle([userTeam, ...opponents]);
    const groups: Group[] = GROUP_IDS.map((id, gi) => {
      const teams = allTeams.slice(gi * 4, gi * 4 + 4);
      return {
        id,
        teams,
        fixtures: buildGroupFixtures(teams),
        standings: emptyStandings(teams),
        completed: false,
      };
    });
    this._groups.set(groups);
    this._currentMatchday.set(0);
    this._groupsCompleted.set(false);
    this._rounds.set([]);
    this._bracketDrawn.set(false);
    this._eliminatedAt.set(null);
    this._won.set(false);
  }

  /**
   * Advances to the next matchday. Returns the user's fixture for that
   * matchday (or null if user is not playing this matchday).
   *
   * Does NOT simulate yet — the page calls applyUserMatchResult once the
   * live match finishes.
   */
  beginNextMatchday(): GroupFixture | null {
    const md = this._currentMatchday() + 1;
    if (md > TOTAL_MATCHDAYS) return null;
    this._currentMatchday.set(md);
    return this.userFixtureForCurrentMatchday();
  }

  /**
   * Apply the user's live-match result, then auto-simulate every other
   * fixture in the current matchday and rebuild standings.
   */
  finishCurrentMatchday(userResult: MatchResult | null): void {
    const md = this._currentMatchday();
    if (md === 0) return;
    const groups = this._groups().map((g) => {
      const fixtures = g.fixtures.map((f) => {
        if (f.matchday !== md) return f;
        if (f.result) return f;
        if (userResult && fixtureInvolves(f, userResult.home, userResult.away)) {
          return { ...f, result: userResult };
        }
        return { ...f, result: this.matches.simulate(f.home, f.away) };
      });
      return {
        ...g,
        fixtures,
        standings: computeStandings(g.teams, fixtures),
        completed: fixtures.every((f) => f.result !== null),
      };
    });
    this._groups.set(groups);

    if (md === TOTAL_MATCHDAYS) {
      this._groupsCompleted.set(true);
      const user = this._userTeam();
      if (user) {
        const userGroup = groups.find((g) => g.teams.some((t) => t.id === user.id));
        const pos = userGroup?.standings.findIndex((s) => s.team.id === user.id) ?? -1;
        if (pos > 1) this._eliminatedAt.set('group');
      }
    }
  }

  /**
   * Returns the 16 qualified teams from the group stage (winner +
   * runner-up of each of the 8 groups). The bracket-draw page uses
   * this list as the pool to randomly assign into ties.
   */
  getQualifiedTeams(): MatchTeam[] {
    return this._groups().flatMap((g) => [
      g.standings[0].team,
      g.standings[1].team,
    ]);
  }

  /**
   * Commits the R16 ties produced by the live draw and flips
   * bracketDrawn so the playoffs page can render them.
   */
  commitBracket(ties: KnockoutTie[]): void {
    const r16: KnockoutRound = {
      name: 'R16',
      label: 'Octavos de final',
      completed: false,
      ties,
    };
    this._rounds.set([r16]);
    this._bracketDrawn.set(true);
  }

  /**
   * Apply a finished leg of the user's tie. legNumber 1 or 2.
   * Returns the updated tie.
   */
  applyUserLeg(legNumber: 1 | 2, result: MatchResult): KnockoutTie | null {
    const rounds = [...this._rounds()];
    const round = rounds.find((r) => !r.completed);
    if (!round) return null;
    const user = this._userTeam();
    if (!user) return null;

    const updatedTies = round.ties.map((t) => {
      if (t.teamA.id !== user.id && t.teamB.id !== user.id) return t;
      if (legNumber === 1) {
        // Leg 1: team A is home, team B is away — running aggregate
        // already maps cleanly. For the final this is also the only leg.
        return {
          ...t,
          leg1: result,
          aggregateA: result.homeGoals,
          aggregateB: result.awayGoals,
        };
      }
      // Leg 2: team B is home, team A is away. Combine with leg1 to
      // get the full aggregate.
      const leg1 = t.leg1!;
      return {
        ...t,
        leg2: result,
        aggregateA: leg1.homeGoals + result.awayGoals,
        aggregateB: leg1.awayGoals + result.homeGoals,
      };
    });
    const updatedRound = { ...round, ties: updatedTies };
    const idx = rounds.indexOf(round);
    rounds[idx] = updatedRound;
    this._rounds.set(rounds);
    return updatedTies.find((t) => t.teamA.id === user.id || t.teamB.id === user.id) ?? null;
  }

  /**
   * Resolve the user's tie aggregate + simulate every other tie in the
   * current round. Sets up the next round (or victory / elimination).
   */
  finishCurrentRound(): void {
    const rounds = [...this._rounds()];
    const round = rounds.find((r) => !r.completed);
    if (!round) return;
    const user = this._userTeam();

    const playedTies = round.ties.map((tie) => {
      if (user && (tie.teamA.id === user.id || tie.teamB.id === user.id)) {
        return resolveUserTie(tie);
      }
      return this.simulateTie(tie);
    });
    const completedRound: KnockoutRound = { ...round, ties: playedTies, completed: true };
    const idx = rounds.indexOf(round);
    rounds[idx] = completedRound;

    const userTie = playedTies.find((t) => t.teamA.id === user?.id || t.teamB.id === user?.id);
    if (user && userTie && userTie.winner && userTie.winner.id !== user.id) {
      this._eliminatedAt.set(round.name);
      this._rounds.set(rounds);
      return;
    }

    const next = nextRoundFromWinners(playedTies, round.name);
    if (next) {
      rounds.push(next);
    } else {
      const finalTie = playedTies[0];
      if (user && finalTie.winner?.id === user.id) {
        this._won.set(true);
      } else if (user) {
        this._eliminatedAt.set('F');
      }
    }
    this._rounds.set(rounds);
  }

  reset(): void {
    this._userTeam.set(null);
    this._groups.set([]);
    this._currentMatchday.set(0);
    this._groupsCompleted.set(false);
    this._rounds.set([]);
    this._bracketDrawn.set(false);
    this._eliminatedAt.set(null);
    this._won.set(false);
  }

  // ─────────────────────────── internals ───────────────────────────

  private simulateTie(tie: KnockoutTie): KnockoutTie {
    if (tie.isFinal) {
      const result = this.matches.simulateKnockout(tie.teamA, tie.teamB);
      const winner = result.winner === 'home' ? tie.teamA : tie.teamB;
      return {
        ...tie,
        leg1: result,
        winner,
        aggregateA: result.homeGoals,
        aggregateB: result.awayGoals,
      };
    }
    const leg1 = this.matches.simulate(tie.teamA, tie.teamB);
    const leg2 = this.matches.simulate(tie.teamB, tie.teamA);
    return resolveTieFromLegs(tie, leg1, leg2);
  }
}

// ─────────────────────────── module-level helpers ───────────────────────────

function fixtureInvolves(f: GroupFixture, a: MatchTeam, b: MatchTeam): boolean {
  return (
    (f.home.id === a.id && f.away.id === b.id) ||
    (f.home.id === b.id && f.away.id === a.id)
  );
}

/**
 * Round-robin schedule for a group of 4: 6 matchdays total.
 * Days 1-3 first leg, days 4-6 reverse legs.
 */
const ROUND_ROBIN_PAIRINGS: [number, number][][] = [
  [
    [0, 1],
    [2, 3],
  ],
  [
    [0, 2],
    [3, 1],
  ],
  [
    [0, 3],
    [1, 2],
  ],
];

function buildGroupFixtures(teams: MatchTeam[]): GroupFixture[] {
  const fixtures: GroupFixture[] = [];
  for (let day = 0; day < 3; day++) {
    for (const [h, a] of ROUND_ROBIN_PAIRINGS[day]) {
      fixtures.push({ matchday: day + 1, home: teams[h], away: teams[a], result: null });
    }
  }
  for (let day = 0; day < 3; day++) {
    for (const [h, a] of ROUND_ROBIN_PAIRINGS[day]) {
      fixtures.push({ matchday: day + 4, home: teams[a], away: teams[h], result: null });
    }
  }
  return fixtures;
}

function emptyStandings(teams: MatchTeam[]): GroupStanding[] {
  return teams.map((team) => ({
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));
}

function computeStandings(teams: MatchTeam[], fixtures: GroupFixture[]): GroupStanding[] {
  const map = new Map<string, GroupStanding>();
  for (const team of teams) {
    map.set(team.id, {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }
  for (const fixture of fixtures) {
    if (!fixture.result) continue;
    const home = map.get(fixture.home.id)!;
    const away = map.get(fixture.away.id)!;
    home.played++;
    away.played++;
    home.goalsFor += fixture.result.homeGoals;
    home.goalsAgainst += fixture.result.awayGoals;
    away.goalsFor += fixture.result.awayGoals;
    away.goalsAgainst += fixture.result.homeGoals;
    if (fixture.result.winner === 'home') {
      home.won++;
      away.lost++;
      home.points += 3;
    } else if (fixture.result.winner === 'away') {
      away.won++;
      home.lost++;
      away.points += 3;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  }
  for (const s of map.values()) {
    s.goalDifference = s.goalsFor - s.goalsAgainst;
  }
  return [...map.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor,
  );
}

function buildTie(id: string, teamA: MatchTeam, teamB: MatchTeam, isFinal: boolean): KnockoutTie {
  return {
    id,
    teamA,
    teamB,
    leg1: null,
    leg2: null,
    isFinal,
    winner: null,
    aggregateA: 0,
    aggregateB: 0,
    tieBreaker: null,
  };
}

function resolveUserTie(tie: KnockoutTie): KnockoutTie {
  if (tie.isFinal) {
    const result = tie.leg1!;
    const winner = result.winner === 'home' ? tie.teamA : tie.teamB;
    return {
      ...tie,
      winner,
      aggregateA: result.homeGoals,
      aggregateB: result.awayGoals,
    };
  }
  return resolveTieFromLegs(tie, tie.leg1!, tie.leg2!);
}

function resolveTieFromLegs(tie: KnockoutTie, leg1: MatchResult, leg2: MatchResult): KnockoutTie {
  const aggregateA = leg1.homeGoals + leg2.awayGoals;
  const aggregateB = leg1.awayGoals + leg2.homeGoals;
  let winner: MatchTeam;
  let tieBreaker: KnockoutTie['tieBreaker'] = null;

  if (aggregateA > aggregateB) {
    winner = tie.teamA;
  } else if (aggregateB > aggregateA) {
    winner = tie.teamB;
  } else {
    // Aggregate level → away goals first (classic Libertadores rule).
    // teamA is away in leg 2; teamB is away in leg 1.
    const awayA = leg2.awayGoals;
    const awayB = leg1.awayGoals;
    if (awayA > awayB) {
      winner = tie.teamA;
      tieBreaker = 'away-goals';
    } else if (awayB > awayA) {
      winner = tie.teamB;
      tieBreaker = 'away-goals';
    } else {
      // Still level → penalties weighted by overall strength.
      const aRoll = tie.teamA.strength.overall + Math.random() * 8;
      const bRoll = tie.teamB.strength.overall + Math.random() * 8;
      winner = aRoll >= bRoll ? tie.teamA : tie.teamB;
      tieBreaker = 'penalties';
    }
  }

  return { ...tie, leg1, leg2, winner, aggregateA, aggregateB, tieBreaker };
}

function nextRoundFromWinners(
  ties: KnockoutTie[],
  prevName: KnockoutRoundName,
): KnockoutRound | null {
  const winners = ties.map((t) => t.winner!).filter(Boolean);
  if (winners.length < 2) return null;

  let name: KnockoutRoundName;
  let label: string;
  let isFinal = false;
  switch (prevName) {
    case 'R16':
      name = 'QF';
      label = 'Cuartos de final';
      break;
    case 'QF':
      name = 'SF';
      label = 'Semifinales';
      break;
    case 'SF':
      name = 'F';
      label = 'Final';
      isFinal = true;
      break;
    case 'F':
      return null;
  }

  const newTies: KnockoutTie[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    newTies.push(buildTie(`${name}-${i / 2 + 1}`, winners[i], winners[i + 1], isFinal));
  }
  return { name, label, ties: newTies, completed: false };
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
