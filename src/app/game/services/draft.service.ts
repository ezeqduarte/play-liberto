import { Injectable, computed, signal } from '@angular/core';
import { TEAMS } from '../data';
import { FORMATIONS, getFormationById } from '../formations';
import {
  Coach,
  Formation,
  FormationSlot,
  Player,
  Position,
  Team,
} from '../models';

const ROLLS_PER_PICK = 5;

export interface SquadEntry {
  slot: FormationSlot;
  player: Player | null;
  fromTeam: Team | null;
}

export interface CoachEntry {
  coach: Coach | null;
  fromTeam: Team | null;
}

export interface SquadStrength {
  defense: number | null;
  midfield: number | null;
  attack: number | null;
  overall: number | null;
}

function avg(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

@Injectable({ providedIn: 'root' })
export class DraftService {
  private readonly _formation = signal<Formation | null>(null);
  private readonly _squad = signal<SquadEntry[]>([]);
  private readonly _coachEntry = signal<CoachEntry>({ coach: null, fromTeam: null });
  private readonly _currentTeam = signal<Team | null>(null);
  private readonly _rollsLeft = signal(ROLLS_PER_PICK);
  private readonly _pickedNames = signal<Set<string>>(new Set());
  private readonly _selectedPlayer = signal<Player | null>(null);
  private readonly _selectedCoach = signal<Coach | null>(null);

  readonly formation = this._formation.asReadonly();
  readonly squad = this._squad.asReadonly();
  readonly coachEntry = this._coachEntry.asReadonly();
  readonly currentTeam = this._currentTeam.asReadonly();
  readonly rollsLeft = this._rollsLeft.asReadonly();
  readonly selectedPlayer = this._selectedPlayer.asReadonly();
  readonly selectedCoach = this._selectedCoach.asReadonly();
  readonly availableFormations = FORMATIONS;

  /** Total slots = 11 player slots + 1 coach slot. */
  readonly totalSlots = computed(() => this._squad().length + 1);

  /** How many slots are still empty (players + coach). */
  readonly slotsRemaining = computed(
    () =>
      this._squad().filter((e) => e.player === null).length +
      (this._coachEntry().coach === null ? 1 : 0),
  );

  /** All filled-slot counts (players + coach). */
  readonly slotsFilled = computed(
    () =>
      this._squad().filter((e) => e.player !== null).length +
      (this._coachEntry().coach !== null ? 1 : 0),
  );

  readonly isComplete = computed(() => {
    const squad = this._squad();
    return (
      squad.length > 0 &&
      squad.every((entry) => entry.player !== null) &&
      this._coachEntry().coach !== null
    );
  });

  /**
   * Rolling strength of the squad as it's being assembled. Returns
   * null for any line with zero players yet. Defense/midfield/attack
   * are derived from the slot.y bucket of each filled entry; formation
   * modifiers are added on top, mirroring MatchService.buildUserTeam.
   *
   * Overall = (attack + midfield + defense) / 3 rounded — only when
   * all three lines have at least one player. Otherwise null.
   */
  readonly squadStrength = computed<SquadStrength>(() => {
    const formation = this._formation();
    const squad = this._squad();
    if (!formation || squad.length === 0) {
      return { defense: null, midfield: null, attack: null, overall: null };
    }
    const defs: number[] = [];
    const mids: number[] = [];
    const atks: number[] = [];
    for (const entry of squad) {
      if (!entry.player) continue;
      if (entry.slot.y <= 35) defs.push(entry.player.rating);
      else if (entry.slot.y <= 65) mids.push(entry.player.rating);
      else atks.push(entry.player.rating);
    }
    const m = formation.modifiers;
    const def = defs.length ? avg(defs) + m.defense : null;
    const mid = mids.length ? avg(mids) + m.midfield : null;
    const atk = atks.length ? avg(atks) + m.attack : null;
    const overall =
      def !== null && mid !== null && atk !== null
        ? Math.round(atk * 0.33 + mid * 0.34 + def * 0.33)
        : null;
    return {
      defense: def === null ? null : Math.round(def),
      midfield: mid === null ? null : Math.round(mid),
      attack: atk === null ? null : Math.round(atk),
      overall,
    };
  });

  /** Whether the user is currently in slot-selection mode for a chosen player. */
  readonly isSelectingSlot = computed(() => this._selectedPlayer() !== null);

  /** Whether the user is currently confirming a coach into the DT slot. */
  readonly isSelectingCoachSlot = computed(() => this._selectedCoach() !== null);

  /**
   * Slots that the selected player could fill (must be empty AND match
   * one of the player's positions). Returns an empty array when no
   * player is selected.
   */
  readonly eligibleSlotIdsForSelection = computed<Set<string>>(() => {
    const player = this._selectedPlayer();
    if (!player) return new Set();
    const slots = this._squad()
      .filter((entry) => entry.player === null && this.matchesSlot(player, entry.slot))
      .map((entry) => entry.slot.id);
    return new Set(slots);
  });

  /**
   * Sets the chosen formation and initialises the draft with the first
   * team-year roll. Resets any in-progress state.
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
    this._coachEntry.set({ coach: null, fromTeam: null });
    this._pickedNames.set(new Set());
    this._selectedPlayer.set(null);
    this._selectedCoach.set(null);
    this._rollsLeft.set(ROLLS_PER_PICK);
    this._currentTeam.set(this.randomTeam());
  }

  /**
   * Rolls a brand-new team-year (different club). Costs one roll.
   * Cancels any pending slot selection so the user re-evaluates.
   */
  rollTeam(): void {
    if (this._rollsLeft() <= 0) return;
    const current = this._currentTeam();
    const candidates = TEAMS.filter(
      (t) => !current || t.name !== current.name || t.year !== current.year,
    );
    this._currentTeam.set(this.pickRandom(candidates));
    this._selectedPlayer.set(null);
    this._selectedCoach.set(null);
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
    this._selectedPlayer.set(null);
    this._selectedCoach.set(null);
    this._rollsLeft.update((r) => r - 1);
  }

  /** Whether the same-club roll-year action would actually have candidates. */
  canRollYear(): boolean {
    const current = this._currentTeam();
    if (!current) return false;
    return TEAMS.some((t) => t.name === current.name && t.year !== current.year);
  }

  /** Returns the full lineup of the currently-rolled team. */
  rosterOfCurrentTeam(): Player[] {
    const team = this._currentTeam();
    return team ? team.players : [];
  }

  /** Returns the coach of the currently-rolled team. */
  coachOfCurrentTeam(): Coach | null {
    const team = this._currentTeam();
    return team ? team.coach : null;
  }

  /** Whether a coach has already been picked into the squad. */
  isCoachPicked(): boolean {
    return this._coachEntry().coach !== null;
  }

  /**
   * Step 1 of the coach pick: marks the rolled team's coach as the
   * pending candidate. Cannot pick a coach whose name is already in
   * the squad as a player.
   */
  selectCoach(): void {
    const team = this._currentTeam();
    if (!team) return;
    if (this.isCoachPicked()) return;
    if (this._pickedNames().has(team.coach.name)) return;
    this._selectedCoach.set(team.coach);
    this._selectedPlayer.set(null);
  }

  /**
   * Step 2: confirms the pending coach candidate into the DT slot and
   * advances the draft cycle (fresh team + refilled rolls).
   */
  confirmCoachToSlot(): void {
    const coach = this._selectedCoach();
    const team = this._currentTeam();
    if (!coach || !team) return;
    if (this.isCoachPicked()) return;
    this._coachEntry.set({ coach, fromTeam: team });
    this._selectedCoach.set(null);
    if (!this.isComplete()) {
      this._rollsLeft.set(ROLLS_PER_PICK);
      this._currentTeam.set(this.randomTeam());
    }
  }

  /** Drops the pending coach candidate without picking. */
  cancelCoachSelection(): void {
    this._selectedCoach.set(null);
  }

  /**
   * Highlights a player as the candidate the user wants to draft.
   * Player must not already be picked AND must not share a name with
   * the already-chosen coach. UI also disables the button accordingly.
   */
  selectPlayer(player: Player): void {
    if (this._pickedNames().has(player.name)) return;
    if (this._coachEntry().coach?.name === player.name) return;
    if (!this.hasEligibleSlot(player)) return;
    this._selectedPlayer.set(player);
    // Selecting a player cancels any pending coach candidate.
    this._selectedCoach.set(null);
  }

  cancelSelection(): void {
    this._selectedPlayer.set(null);
  }

  /**
   * Confirms the selected player into the given slot. Advances the
   * pick cycle: refills the rolls, fetches a new random team, clears
   * the selection.
   */
  assignSelectedToSlot(slotId: string): void {
    const player = this._selectedPlayer();
    const team = this._currentTeam();
    if (!player || !team) return;
    const squad = this._squad();
    const idx = squad.findIndex((e) => e.slot.id === slotId);
    if (idx < 0) return;
    const entry = squad[idx];
    if (entry.player !== null) return;
    if (!this.matchesSlot(player, entry.slot)) return;

    const next = [...squad];
    next[idx] = { ...entry, player, fromTeam: team };
    this._squad.set(next);

    const picked = new Set(this._pickedNames());
    picked.add(player.name);
    this._pickedNames.set(picked);

    this._selectedPlayer.set(null);

    if (!this.isComplete()) {
      // Reset for the next pick cycle.
      this._rollsLeft.set(ROLLS_PER_PICK);
      this._currentTeam.set(this.randomTeam());
    }
  }

  /**
   * True if a player has at least one eligible empty slot in the current
   * squad. UI uses this to grey-out un-pickable players.
   */
  hasEligibleSlot(player: Player): boolean {
    return this._squad().some(
      (entry) => entry.player === null && this.matchesSlot(player, entry.slot),
    );
  }

  isAlreadyPicked(player: Player): boolean {
    return this._pickedNames().has(player.name);
  }

  /** True if the rolled coach shares a name with a player already in
   *  the squad — used to disable the coach card so the same person
   *  can't appear in both roles. */
  isCoachNameTakenByPlayer(): boolean {
    const team = this._currentTeam();
    if (!team) return false;
    return this._pickedNames().has(team.coach.name);
  }

  /** True if a player shares a name with the picked coach — used to
   *  disable that player's card. */
  isPlayerNameTakenByCoach(player: Player): boolean {
    return this._coachEntry().coach?.name === player.name;
  }

  reset(): void {
    this._formation.set(null);
    this._squad.set([]);
    this._coachEntry.set({ coach: null, fromTeam: null });
    this._currentTeam.set(null);
    this._rollsLeft.set(ROLLS_PER_PICK);
    this._pickedNames.set(new Set());
    this._selectedPlayer.set(null);
    this._selectedCoach.set(null);
  }

  /**
   * Admin shortcut for debugging end-to-end flows (especially the
   * victory screen). Bypasses the draft by filling every slot with a
   * synthetic 99-rated player matching the slot's primary allowed
   * position, plus a 99-rated coach. Sets the draft to a complete
   * state so the tournament can start immediately.
   */
  fillAdminSquad(formationId: string): void {
    const formation = getFormationById(formationId);
    if (!formation) {
      throw new Error(`Unknown formation: ${formationId}`);
    }
    const adminCoach: Coach = {
      name: 'Admin DT',
      rating: 99,
      rarity: 'legendary',
    };
    const adminTeam: Team = {
      name: 'Admin XI',
      year: 2099,
      players: [],
      coach: adminCoach,
    };

    this._formation.set(formation);
    const squad: SquadEntry[] = formation.slots.map((slot, i) => {
      const primary = slot.allowed[0];
      const player: Player = {
        name: `Admin ${slot.label} ${i + 1}`,
        rating: 99,
        rarity: 'legendary',
        positions: [primary],
      };
      return { slot, player, fromTeam: adminTeam };
    });
    this._squad.set(squad);
    this._coachEntry.set({ coach: adminCoach, fromTeam: adminTeam });
    this._pickedNames.set(new Set(squad.map((e) => e.player!.name)));
    this._selectedPlayer.set(null);
    this._currentTeam.set(null);
    this._rollsLeft.set(0);
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
