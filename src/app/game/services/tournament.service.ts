import { Injectable, computed, inject, signal } from '@angular/core';
import { TEAMS } from '../data';
import {
  Group,
  GroupFixture,
  GroupStanding,
  KnockoutRound,
  KnockoutRoundName,
  KnockoutTie,
  MatchTeam,
} from '../models';
import { DraftService } from './draft.service';
import { MatchService } from './match.service';

const GROUP_IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly draft = inject(DraftService);
  private readonly matches = inject(MatchService);

  private readonly _userTeam = signal<MatchTeam | null>(null);
  private readonly _groups = signal<Group[]>([]);
  private readonly _groupsCompleted = signal(false);
  private readonly _rounds = signal<KnockoutRound[]>([]);
  private readonly _bracketDrawn = signal(false);
  private readonly _eliminatedAt = signal<KnockoutRoundName | 'group' | null>(null);
  private readonly _won = signal(false);

  readonly userTeam = this._userTeam.asReadonly();
  readonly groups = this._groups.asReadonly();
  readonly groupsCompleted = this._groupsCompleted.asReadonly();
  readonly rounds = this._rounds.asReadonly();
  readonly bracketDrawn = this._bracketDrawn.asReadonly();
  readonly eliminatedAt = this._eliminatedAt.asReadonly();
  readonly won = this._won.asReadonly();

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
   * Initialises the tournament: builds the user MatchTeam from the draft,
   * adds 31 random historic teams, and distributes all 32 into 8 groups.
   */
  start(): void {
    const formation = this.draft.formation();
    const squad = this.draft.squad();
    if (!formation || squad.length === 0) {
      throw new Error('No squad available to start tournament.');
    }

    const userTeam = this.matches.buildUserTeam(squad, formation);
    this._userTeam.set(userTeam);

    // Pick 31 random historic teams.
    const shuffledTeams = shuffle([...TEAMS]).slice(0, 31);
    const opponents = shuffledTeams.map((t) => this.matches.buildHistoricTeam(t));

    // Distribute 32 teams into 8 groups of 4. User always in group A first.
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
    this._groupsCompleted.set(false);
    this._rounds.set([]);
    this._bracketDrawn.set(false);
    this._eliminatedAt.set(null);
    this._won.set(false);
  }

  /**
   * Simulates every fixture in every group. Updates standings and marks
   * the group stage as complete. Sets eliminatedAt='group' if the user
   * doesn't finish top 2 of their group.
   */
  simulateGroupStage(): void {
    const groups = this._groups().map((g) => this.simulateGroup(g));
    this._groups.set(groups);
    this._groupsCompleted.set(true);

    const user = this._userTeam();
    if (!user) return;
    const userGroup = groups.find((g) => g.teams.some((t) => t.id === user.id));
    if (!userGroup) return;
    const userPos = userGroup.standings.findIndex((s) => s.team.id === user.id);
    if (userPos > 1) {
      this._eliminatedAt.set('group');
    }
  }

  /**
   * Draws the R16 bracket from the group winners and runners-up.
   * Pairing: A1-B2, C1-D2, E1-F2, G1-H2, B1-A2, D1-C2, F1-E2, H1-G2.
   */
  drawBracket(): void {
    const groups = this._groups();
    const get = (id: string, pos: 0 | 1): MatchTeam => {
      const g = groups.find((x) => x.id === id)!;
      return g.standings[pos].team;
    };

    const pairings: [MatchTeam, MatchTeam][] = [
      [get('A', 0), get('B', 1)],
      [get('C', 0), get('D', 1)],
      [get('E', 0), get('F', 1)],
      [get('G', 0), get('H', 1)],
      [get('B', 0), get('A', 1)],
      [get('D', 0), get('C', 1)],
      [get('F', 0), get('E', 1)],
      [get('H', 0), get('G', 1)],
    ];

    const r16: KnockoutRound = {
      name: 'R16',
      label: 'Octavos de final',
      completed: false,
      ties: pairings.map(([a, b], i) => buildTie(`R16-${i + 1}`, a, b, false)),
    };
    this._rounds.set([r16]);
    this._bracketDrawn.set(true);
  }

  /**
   * Simulates the current (incomplete) round. If the user is in this
   * round and loses, marks them eliminated. Otherwise queues the next
   * round with the winners.
   */
  simulateCurrentRound(): void {
    const rounds = [...this._rounds()];
    const round = rounds.find((r) => !r.completed);
    if (!round) return;

    const playedTies = round.ties.map((tie) => this.playTie(tie));
    const completedRound: KnockoutRound = { ...round, ties: playedTies, completed: true };

    // Replace the in-progress round.
    const idx = rounds.indexOf(round);
    rounds[idx] = completedRound;

    // Check user elimination.
    const user = this._userTeam();
    const userTie = playedTies.find(
      (t) => t.teamA.id === user?.id || t.teamB.id === user?.id,
    );
    if (user && userTie && userTie.winner && userTie.winner.id !== user.id) {
      this._eliminatedAt.set(round.name);
      this._rounds.set(rounds);
      return;
    }

    // Build the next round, unless this was the final.
    const next = nextRoundFromWinners(playedTies, round.name);
    if (next) {
      rounds.push(next);
    } else {
      // It was the final — check winner.
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
    this._groupsCompleted.set(false);
    this._rounds.set([]);
    this._bracketDrawn.set(false);
    this._eliminatedAt.set(null);
    this._won.set(false);
  }

  // ─────────────────────────── internals ───────────────────────────

  private simulateGroup(group: Group): Group {
    const fixtures: GroupFixture[] = group.fixtures.map((f) => ({
      ...f,
      result: this.matches.simulate(f.home, f.away),
    }));
    const standings = computeStandings(group.teams, fixtures);
    return { ...group, fixtures, standings, completed: true };
  }

  private playTie(tie: KnockoutTie): KnockoutTie {
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
    const aggregateA = leg1.homeGoals + leg2.awayGoals;
    const aggregateB = leg1.awayGoals + leg2.homeGoals;

    let winner: MatchTeam;
    if (aggregateA > aggregateB) winner = tie.teamA;
    else if (aggregateB > aggregateA) winner = tie.teamB;
    else {
      // Aggregate tie → penalty shoot-out weighted by overall.
      const aRoll = tie.teamA.strength.overall + Math.random() * 8;
      const bRoll = tie.teamB.strength.overall + Math.random() * 8;
      winner = aRoll >= bRoll ? tie.teamA : tie.teamB;
    }

    return { ...tie, leg1, leg2, winner, aggregateA, aggregateB };
  }
}

// ─────────────────────────── module-level helpers ───────────────────────────

function buildGroupFixtures(teams: MatchTeam[]): GroupFixture[] {
  const fixtures: GroupFixture[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = 0; j < teams.length; j++) {
      if (i === j) continue;
      fixtures.push({ home: teams[i], away: teams[j], result: null });
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
  };
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
