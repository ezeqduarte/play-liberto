import { Injectable, computed, inject, signal } from '@angular/core';
import { MatchResult, MatchTeam, Player, Position } from '../models';
import { MatchService } from './match.service';

export type LiveMatchSpeed = 'slow' | 'normal' | 'fast' | 'instant';

export type LiveEventType =
  | 'kickoff'
  | 'goal'
  | 'shot'
  | 'yellow'
  | 'red'
  | 'half-time'
  | 'second-half'
  | 'full-time';

export interface LiveEvent {
  minute: number;
  type: LiveEventType;
  side: 'home' | 'away' | null;
  player: string | null;
  description: string;
}

const SPEED_MS: Record<LiveMatchSpeed, number> = {
  slow: 400,
  normal: 160,
  fast: 60,
  instant: 0,
};

const ATTACK_POSITIONS: Position[] = ['LW', 'RW', 'ST', 'CF', 'CAM'];

@Injectable({ providedIn: 'root' })
export class LiveMatchService {
  private readonly matches = inject(MatchService);

  private readonly _minute = signal(0);
  private readonly _homeGoals = signal(0);
  private readonly _awayGoals = signal(0);
  private readonly _events = signal<LiveEvent[]>([]);
  private readonly _displayedEvents = signal<LiveEvent[]>([]);
  private readonly _isRunning = signal(false);
  private readonly _isFinished = signal(false);
  private readonly _isPaused = signal(false);
  private readonly _speed = signal<LiveMatchSpeed>('normal');
  private readonly _home = signal<MatchTeam | null>(null);
  private readonly _away = signal<MatchTeam | null>(null);
  private readonly _result = signal<MatchResult | null>(null);

  readonly minute = this._minute.asReadonly();
  readonly homeGoals = this._homeGoals.asReadonly();
  readonly awayGoals = this._awayGoals.asReadonly();
  readonly displayedEvents = this._displayedEvents.asReadonly();
  readonly isRunning = this._isRunning.asReadonly();
  readonly isFinished = this._isFinished.asReadonly();
  readonly isPaused = this._isPaused.asReadonly();
  readonly speed = this._speed.asReadonly();
  readonly home = this._home.asReadonly();
  readonly away = this._away.asReadonly();
  readonly result = this._result.asReadonly();

  /** Latest event for the marquee flash. */
  readonly latestGoalEvent = computed(() => {
    const evts = this._displayedEvents();
    for (let i = evts.length - 1; i >= 0; i--) {
      if (evts[i].type === 'goal') return evts[i];
    }
    return null;
  });

  private timer: ReturnType<typeof setTimeout> | null = null;
  private cursor = 0;

  /**
   * Starts a fresh live match between two teams. Pre-computes the
   * outcome (delegating to the deterministic MatchService so the
   * scoreline is consistent with the silent simulation), then animates
   * minute-by-minute.
   *
   * Returns the final result through the `result` signal once finished.
   */
  start(home: MatchTeam, away: MatchTeam, isKnockout = false): void {
    this.stopTimer();
    const result = isKnockout
      ? this.matches.simulateKnockout(home, away)
      : this.matches.simulate(home, away);
    const events = generateEvents(result);

    this._home.set(home);
    this._away.set(away);
    this._minute.set(0);
    this._homeGoals.set(0);
    this._awayGoals.set(0);
    this._events.set(events);
    this._displayedEvents.set([]);
    this._isRunning.set(true);
    this._isFinished.set(false);
    this._isPaused.set(false);
    this._result.set(null);
    this.cursor = 0;

    if (this._speed() === 'instant') {
      this.skipToEnd(result);
    } else {
      this.tick();
    }
  }

  setSpeed(speed: LiveMatchSpeed): void {
    this._speed.set(speed);
    if (speed === 'instant' && this._isRunning() && !this._isFinished()) {
      const result = this.predictResult();
      this.skipToEnd(result);
    }
  }

  pause(): void {
    if (!this._isRunning() || this._isFinished()) return;
    this._isPaused.set(true);
    this.stopTimer();
  }

  resume(): void {
    if (!this._isRunning() || this._isFinished()) return;
    this._isPaused.set(false);
    this.tick();
  }

  reset(): void {
    this.stopTimer();
    this._minute.set(0);
    this._homeGoals.set(0);
    this._awayGoals.set(0);
    this._events.set([]);
    this._displayedEvents.set([]);
    this._isRunning.set(false);
    this._isFinished.set(false);
    this._isPaused.set(false);
    this._home.set(null);
    this._away.set(null);
    this._result.set(null);
    this.cursor = 0;
  }

  // ─────────────────────────── internals ───────────────────────────

  private tick = (): void => {
    if (!this._isRunning() || this._isPaused() || this._isFinished()) return;

    const events = this._events();
    const nextMinute = this._minute() + 1;
    this._minute.set(nextMinute);

    // Drain any events that landed on this minute (or earlier).
    while (this.cursor < events.length && events[this.cursor].minute <= nextMinute) {
      const evt = events[this.cursor];
      this._displayedEvents.update((prev) => [...prev, evt]);
      if (evt.type === 'goal') {
        if (evt.side === 'home') this._homeGoals.update((g) => g + 1);
        else if (evt.side === 'away') this._awayGoals.update((g) => g + 1);
      }
      if (evt.type === 'full-time') {
        this._isFinished.set(true);
        this._isRunning.set(false);
        this._result.set(this.predictResult());
        return;
      }
      this.cursor++;
    }

    const delay = SPEED_MS[this._speed()];
    this.timer = setTimeout(this.tick, delay);
  };

  private skipToEnd(result: MatchResult): void {
    this.stopTimer();
    const events = this._events();
    // Drain everything immediately.
    this._displayedEvents.set([...events]);
    this._minute.set(90);
    this._homeGoals.set(result.homeGoals);
    this._awayGoals.set(result.awayGoals);
    this._isFinished.set(true);
    this._isRunning.set(false);
    this._result.set(result);
  }

  private predictResult(): MatchResult {
    const home = this._home()!;
    const away = this._away()!;
    const events = this._events();
    const homeGoals = events.filter((e) => e.type === 'goal' && e.side === 'home').length;
    const awayGoals = events.filter((e) => e.type === 'goal' && e.side === 'away').length;
    const winner: MatchResult['winner'] =
      homeGoals > awayGoals ? 'home' : awayGoals > homeGoals ? 'away' : 'draw';
    return { home, away, homeGoals, awayGoals, winner };
  }

  private stopTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

// ─────────────────────────── event generation ───────────────────────────

function generateEvents(result: MatchResult): LiveEvent[] {
  const events: LiveEvent[] = [];
  events.push({
    minute: 0,
    type: 'kickoff',
    side: null,
    player: null,
    description: 'Pitazo inicial',
  });

  // Distribute goals across realistic minutes.
  pushGoals(events, result.home, result.homeGoals, 'home');
  pushGoals(events, result.away, result.awayGoals, 'away');

  // Flavour shots — between 6 and 14 total, biased by team strength.
  const totalShots = 6 + Math.floor(Math.random() * 9);
  for (let i = 0; i < totalShots; i++) {
    const minute = randomMinute();
    const side: 'home' | 'away' = Math.random() < 0.5 ? 'home' : 'away';
    const team = side === 'home' ? result.home : result.away;
    const player = pickAttacker(team)?.name ?? team.displayName;
    events.push({
      minute,
      type: 'shot',
      side,
      player,
      description: `Tiro al arco de ${player}`,
    });
  }

  // 2-4 yellow cards spread across both teams.
  const yellowCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < yellowCount; i++) {
    const minute = 15 + Math.floor(Math.random() * 70);
    const side: 'home' | 'away' = Math.random() < 0.5 ? 'home' : 'away';
    const team = side === 'home' ? result.home : result.away;
    const player = pickRandomPlayer(team)?.name ?? team.displayName;
    events.push({
      minute,
      type: 'yellow',
      side,
      player,
      description: `Amarilla para ${player}`,
    });
  }

  // ~8% chance of a red card per match.
  if (Math.random() < 0.08) {
    const minute = 30 + Math.floor(Math.random() * 55);
    const side: 'home' | 'away' = Math.random() < 0.5 ? 'home' : 'away';
    const team = side === 'home' ? result.home : result.away;
    const player = pickRandomPlayer(team)?.name ?? team.displayName;
    events.push({
      minute,
      type: 'red',
      side,
      player,
      description: `¡Roja directa para ${player}!`,
    });
  }

  // Half-time / second-half / full-time always present.
  events.push({
    minute: 45,
    type: 'half-time',
    side: null,
    player: null,
    description: 'Termina el primer tiempo',
  });
  events.push({
    minute: 46,
    type: 'second-half',
    side: null,
    player: null,
    description: 'Arranca el segundo tiempo',
  });
  events.push({
    minute: 90,
    type: 'full-time',
    side: null,
    player: null,
    description: 'Final del partido',
  });

  events.sort((a, b) => a.minute - b.minute);
  return events;
}

function pushGoals(
  events: LiveEvent[],
  team: MatchTeam,
  count: number,
  side: 'home' | 'away',
): void {
  const usedMinutes = new Set<number>();
  for (let i = 0; i < count; i++) {
    let minute = randomMinute();
    let safety = 0;
    while (usedMinutes.has(minute) && safety < 10) {
      minute = randomMinute();
      safety++;
    }
    usedMinutes.add(minute);
    const scorer = pickAttacker(team)?.name ?? team.displayName;
    events.push({
      minute,
      type: 'goal',
      side,
      player: scorer,
      description: `¡GOL de ${scorer}!`,
    });
  }
}

function randomMinute(): number {
  // Skip the 45-46 break and the 90' whistle.
  let minute = 1 + Math.floor(Math.random() * 88);
  if (minute === 45) minute = 44;
  if (minute === 46) minute = 47;
  return minute;
}

function pickAttacker(team: MatchTeam): Player | null {
  const attackers = team.lineup.filter((p) =>
    p.positions.some((pos) => ATTACK_POSITIONS.includes(pos)),
  );
  if (attackers.length === 0) return team.lineup[0] ?? null;
  // Bias to higher-rated attackers.
  const weighted = attackers.flatMap((p) => Array(Math.max(1, p.rating - 70)).fill(p));
  return weighted[Math.floor(Math.random() * weighted.length)];
}

function pickRandomPlayer(team: MatchTeam): Player | null {
  if (team.lineup.length === 0) return null;
  return team.lineup[Math.floor(Math.random() * team.lineup.length)];
}
