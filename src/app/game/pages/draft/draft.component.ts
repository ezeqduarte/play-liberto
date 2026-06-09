import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DraftService } from '../../services/draft.service';
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
  readonly currentSlot = this.draft.currentSlot;
  readonly currentSlotIndex = this.draft.currentSlotIndex;
  readonly currentTeam = this.draft.currentTeam;
  readonly rollsLeft = this.draft.rollsLeft;
  readonly isComplete = this.draft.isComplete;

  readonly selectablePlayers = computed<Player[]>(() => {
    // Re-read signal-dependent state to recompute when any of these change.
    this.draft.currentTeam();
    this.draft.currentSlotIndex();
    this.draft.squad();
    return this.draft.selectablePlayers();
  });

  readonly canRollYear = computed(() => {
    const team = this.currentTeam();
    if (!team || this.rollsLeft() <= 0) return false;
    // checked inside service too, but reflect it in the UI
    return true;
  });

  constructor() {
    // If no formation has been chosen, bounce back to the select screen.
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

  pickPlayer(player: Player): void {
    this.draft.pickPlayer(player);
  }

  startTournament(): void {
    this.router.navigate(['/tournament/groups']);
  }

  resetDraft(): void {
    this.draft.reset();
    this.router.navigate(['/draft/formation']);
  }
}
