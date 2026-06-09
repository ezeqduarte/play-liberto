import { Injectable, computed, signal } from '@angular/core';
import { TEAMS } from '../data';
import { FORMATIONS, getFormationById } from '../formations';
import {
  Formation,
  FormationSlot,
  Player,
  Position,
  Team,
} from '../models';

const ROLLS_PER_SLOT = 5;

export interface SquadEntry {
  slot: FormationSlot;
  player: Player | null;
  fromTeam: Team | null;
}

@Injectable({ providedIn: 'root' })
export class DraftService {
  private readonly _formation = signal<Formation | null>(null);
  private readonly _squad = signal<SquadEntry[]>([]);
  private readonly _currentSlotIndex = signal(0);
  private readonly _currentTeam = signal<Team | null>(null);
  private readonly _rollsLeft = signal(ROLLS_PER_SLOT);
  private readonly _pickedNames = signal<Set<string>>(new Set());

  readonly formation = this._formation.asReadonly();
  readonly squad = this._squad.asReadonly();
  readonly currentSlotIndex = this._currentSlotIndex.asReadonly();
  readonly currentTeam = this._currentTeam.asReadonly();
  readonly rollsLeft = this._rollsLeft.asReadonly();

  readonly currentSlot = computed<FormationSlot | null>(() => {
    const squad = this._squad();
    const index = this._currentSlotIndex();
    return squad[index]?.slot ?? null;
  });

  readonly isComplete = computed(() => {
    const squad = this._squad();
    return squad.length > 0 && squad.every((entry) => entry.player !== null);
  });

  readonly availableFormations = FORMATIONS;

  /**
   * Sets the chosen formation and initialises the draft with the first
   * team-year roll for slot 0.
   */
  startDraft(formationId: string): void {
    const formation = getFormationById(formationId);
    if (!formation) {
      throw new Error(`Unknown formation: ${formationId}`);
    }
    this._formation.set(formation);
    this._squad.set(
      formation.slots.map((slot) => ({ slot, player: null, fromTeam: null })),
    );
    this._currentSlotIndex.set(0);
    this._pickedNames.set(new Set());
    this._rollsLeft.set(ROLLS_PER_SLOT);
    this._currentTeam.set(this.randomTeam());
  }

  /**
   * Rolls a completely new team-year (different club + year). Costs one roll.
   */
  rollTeam(): void {
    if (this._rollsLeft() <= 0) return;
    const current = this._currentTeam();
    const candidates = TEAMS.filter(
      (t) => !current || t.name !== current.name || t.year !== current.year,
    );
    this._currentTeam.set(this.pickRandom(candidates));
    this._rollsLeft.update((r) => r - 1);
  }

  /**
   * Rolls a different year for the *same* club. Costs one roll. If the club
   * has no other years in the pool, behaves as no-op (no roll consumed).
   */
  rollYear(): void {
    if (this._rollsLeft() <= 0) return;
    const current = this._currentTeam();
    if (!current) return;
    const candidates = TEAMS.filter(
      (t) => t.name === current.name && t.year !== current.year,
    );
    if (candidates.length === 0) return;
    this._currentTeam.set(this.pickRandom(candidates));
    this._rollsLeft.update((r) => r - 1);
  }

  /**
   * Returns the players from the current team that match the active slot's
   * allowed positions AND haven't been picked yet.
   */
  selectablePlayers(): Player[] {
    const team = this._currentTeam();
    const slot = this.currentSlot();
    if (!team || !slot) return [];
    const picked = this._pickedNames();
    return team.players.filter(
      (p) => !picked.has(p.name) && this.matchesSlot(p, slot),
    );
  }

  /**
   * Assigns a player to the current slot and advances to the next one
   * (re-rolling a fresh team-year and resetting the roll counter).
   */
  pickPlayer(player: Player): void {
    const team = this._currentTeam();
    const slot = this.currentSlot();
    if (!team || !slot) return;
    if (!this.matchesSlot(player, slot)) return;

    const picked = new Set(this._pickedNames());
    if (picked.has(player.name)) return;
    picked.add(player.name);
    this._pickedNames.set(picked);

    const index = this._currentSlotIndex();
    const next = [...this._squad()];
    next[index] = { ...next[index], player, fromTeam: team };
    this._squad.set(next);

    const nextIndex = index + 1;
    if (nextIndex < next.length) {
      this._currentSlotIndex.set(nextIndex);
      this._rollsLeft.set(ROLLS_PER_SLOT);
      this._currentTeam.set(this.randomTeam());
    }
  }

  reset(): void {
    this._formation.set(null);
    this._squad.set([]);
    this._currentSlotIndex.set(0);
    this._currentTeam.set(null);
    this._rollsLeft.set(ROLLS_PER_SLOT);
    this._pickedNames.set(new Set());
  }

  private matchesSlot(player: Player, slot: FormationSlot): boolean {
    return player.positions.some((p: Position) => slot.allowed.includes(p));
  }

  private randomTeam(): Team {
    return this.pickRandom(TEAMS);
  }

  private pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
