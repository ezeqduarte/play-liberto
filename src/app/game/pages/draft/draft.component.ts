import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DraftService, SquadEntry } from '../../services/draft.service';
import { Player } from '../../models';

@Component({
  selector: 'app-draft',
  templateUrl: './draft.component.html',
  styleUrl: './draft.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftComponent {
  readonly draft = inject(DraftService);
  private readonly router = inject(Router);

  readonly formation = this.draft.formation;
  readonly squad = this.draft.squad;
  readonly currentTeam = this.draft.currentTeam;
  readonly rollsLeft = this.draft.rollsLeft;
  readonly isComplete = this.draft.isComplete;
  readonly slotsFilled = this.draft.slotsFilled;
  readonly selectedPlayer = this.draft.selectedPlayer;
  readonly isSelectingSlot = this.draft.isSelectingSlot;
  readonly eligibleSlotIds = this.draft.eligibleSlotIdsForSelection;

  readonly roster = computed<Player[]>(() => {
    this.draft.currentTeam();
    return this.draft.rosterOfCurrentTeam();
  });

  readonly canRollYear = computed(
    () => this.rollsLeft() > 0 && this.draft.canRollYear(),
  );

  constructor() {
    effect(() => {
      if (!this.formation()) {
        this.router.navigate(['/draft/formation']);
      }
    });
  }

  rollTeam(): void {
    this.draft.rollTeam();
  }

  rollYear(): void {
    this.draft.rollYear();
  }

  selectPlayer(player: Player): void {
    this.draft.selectPlayer(player);
  }

  cancelSelection(): void {
    this.draft.cancelSelection();
  }

  assignToSlot(entry: SquadEntry): void {
    if (!this.isSelectingSlot()) return;
    if (entry.player !== null) return;
    if (!this.eligibleSlotIds().has(entry.slot.id)) return;
    this.draft.assignSelectedToSlot(entry.slot.id);
  }

  startTournament(): void {
    this.router.navigate(['/tournament/groups']);
  }

  resetDraft(): void {
    this.draft.reset();
    this.router.navigate(['/draft/formation']);
  }

  isAlreadyPicked(player: Player): boolean {
    return this.draft.isAlreadyPicked(player);
  }

  hasEligibleSlot(player: Player): boolean {
    return this.draft.hasEligibleSlot(player);
  }

  isPlayerSelected(player: Player): boolean {
    return this.selectedPlayer()?.name === player.name;
  }
}
