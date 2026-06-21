import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DraftService, SquadEntry } from '../../services/draft.service';
import { Coach, FormationShape, Player } from '../../models';
import { PageNavComponent } from '../../components/page-nav/page-nav.component';

@Component({
  selector: 'app-draft',
  imports: [PageNavComponent],
  templateUrl: './draft.component.html',
  styleUrl: './draft.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftComponent {
  readonly draft = inject(DraftService);
  private readonly router = inject(Router);

  /** Refs used to auto-scroll between the pitch and the roster on
   *  narrow viewports (<=960px) so the user doesn't have to scroll
   *  manually after each player pick. */
  private readonly pitchArea = viewChild<ElementRef<HTMLElement>>('pitchArea');
  private readonly rosterAnchor = viewChild<ElementRef<HTMLElement>>('rosterAnchor');

  readonly formation = this.draft.formation;
  readonly squad = this.draft.squad;
  readonly squadStrength = this.draft.squadStrength;
  readonly coachEntry = this.draft.coachEntry;
  readonly currentTeam = this.draft.currentTeam;
  readonly rollsLeft = this.draft.rollsLeft;
  readonly isComplete = this.draft.isComplete;
  readonly slotsFilled = this.draft.slotsFilled;
  readonly totalSlots = this.draft.totalSlots;
  readonly selectedPlayer = this.draft.selectedPlayer;
  readonly selectedCoach = this.draft.selectedCoach;
  readonly isSelectingSlot = this.draft.isSelectingSlot;
  readonly isSelectingCoachSlot = this.draft.isSelectingCoachSlot;
  readonly eligibleSlotIds = this.draft.eligibleSlotIdsForSelection;

  readonly currentCoach = computed<Coach | null>(() => {
    this.draft.currentTeam();
    return this.draft.coachOfCurrentTeam();
  });

  readonly isCoachPicked = computed(() => this.draft.isCoachPicked());

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
    // If the service accepted the selection on a narrow screen, jump
    // to the pitch so the user can tap a slot without scrolling.
    if (this.draft.isSelectingSlot()) {
      this.scrollIfMobile(this.pitchArea());
    }
  }

  selectCoach(): void {
    this.draft.selectCoach();
    if (this.draft.isSelectingCoachSlot()) {
      this.scrollIfMobile(this.pitchArea());
    }
  }

  confirmCoachToSlot(): void {
    this.draft.confirmCoachToSlot();
  }

  cancelCoachSelection(): void {
    this.draft.cancelCoachSelection();
  }

  cancelSelection(): void {
    this.draft.cancelSelection();
  }

  /** Friendly label for shapes whose internal id needs a hint. */
  private readonly shapeLabel: Partial<Record<FormationShape, string>> = {
    '4-2-3-1-narrow': '4-2-3-1 · 3 MCO',
  };

  displayShape(shape: FormationShape): string {
    return this.shapeLabel[shape] ?? shape;
  }

  assignToSlot(entry: SquadEntry): void {
    if (!this.isSelectingSlot()) return;
    if (entry.player !== null) return;
    if (!this.eligibleSlotIds().has(entry.slot.id)) return;
    this.draft.assignSelectedToSlot(entry.slot.id);
    // Back to the roster so the user keeps picking without scrolling.
    this.scrollIfMobile(this.rosterAnchor());
  }

  confirmCoachAndScroll(): void {
    this.confirmCoachToSlot();
    this.scrollIfMobile(this.rosterAnchor());
  }

  /** Scroll an element into view, but only on narrow viewports where
   *  the pitch and the roster are stacked vertically. Desktop layout
   *  keeps both on screen so scrolling would be jarring. */
  private scrollIfMobile(ref?: ElementRef<HTMLElement>): void {
    if (!ref) return;
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 960px)').matches) return;
    requestAnimationFrame(() =>
      ref.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
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

  isPlayerNameTakenByCoach(player: Player): boolean {
    return this.draft.isPlayerNameTakenByCoach(player);
  }

  isCoachNameTakenByPlayer(): boolean {
    return this.draft.isCoachNameTakenByPlayer();
  }

  isPlayerSelected(player: Player): boolean {
    return this.selectedPlayer()?.name === player.name;
  }

  isCurrentCoachSelected(): boolean {
    const coach = this.currentCoach();
    const sel = this.selectedCoach();
    return !!coach && !!sel && coach.name === sel.name;
  }
}
