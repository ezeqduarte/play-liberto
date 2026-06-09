import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { KnockoutTie, MatchResult, MatchTeam } from '../../models';
import { PageNavComponent } from '../../components/page-nav/page-nav.component';
import { LiveMatchComponent } from '../../components/live-match/live-match.component';

type PlayoffsViewState =
  | 'idle'           // round started, ready to play leg 1
  | 'playing-leg1'   // live leg 1
  | 'between-legs'   // leg 1 done, wait for user to start leg 2
  | 'playing-leg2'   // live leg 2
  | 'round-done';    // round complete (waiting for user to advance)

@Component({
  selector: 'app-playoffs',
  imports: [PageNavComponent, LiveMatchComponent],
  templateUrl: './playoffs.component.html',
  styleUrl: './playoffs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayoffsComponent {
  readonly tournament = inject(TournamentService);
  private readonly router = inject(Router);

  readonly userTeam = this.tournament.userTeam;
  readonly rounds = this.tournament.rounds;
  readonly currentRound = this.tournament.currentRound;
  readonly userTie = this.tournament.userTie;
  readonly eliminatedAt = this.tournament.eliminatedAt;
  readonly won = this.tournament.won;

  readonly viewState = signal<PlayoffsViewState>('idle');

  /** Leg 1: user's tie home/away as-is. */
  readonly leg1Home = computed<MatchTeam | null>(() => this.userTie()?.teamA ?? null);
  readonly leg1Away = computed<MatchTeam | null>(() => this.userTie()?.teamB ?? null);
  /** Leg 2: swapped (away leg). */
  readonly leg2Home = computed<MatchTeam | null>(() => this.userTie()?.teamB ?? null);
  readonly leg2Away = computed<MatchTeam | null>(() => this.userTie()?.teamA ?? null);

  readonly isFinalRound = computed(() => this.currentRound()?.name === 'F');

  // When entering the page for a fresh, undrawn round, default to idle.
  // When returning after a round that's already completed (e.g. from an
  // earlier visit), default to round-done.
  private syncedRoundName: string | null = null;

  constructor() {
    effect(() => {
      if (this.tournament.userTeam() === null) {
        this.router.navigate(['/']);
        return;
      }
      if (!this.tournament.bracketDrawn()) {
        this.router.navigate(['/tournament/groups']);
        return;
      }
      if (this.won()) {
        this.router.navigate(['/tournament/victory']);
        return;
      }
      const elim = this.eliminatedAt();
      if (elim && elim !== 'group') {
        this.router.navigate(['/tournament/eliminated']);
        return;
      }
      // Sync view state when the round changes.
      const round = this.currentRound();
      if (round && this.syncedRoundName !== round.name) {
        this.syncedRoundName = round.name;
        this.viewState.set(round.completed ? 'round-done' : 'idle');
      }
    });
  }

  isUserTie(tie: KnockoutTie): boolean {
    const u = this.userTeam();
    return !!u && (tie.teamA.id === u.id || tie.teamB.id === u.id);
  }

  playLeg1(): void {
    this.viewState.set('playing-leg1');
  }

  playLeg2(): void {
    this.viewState.set('playing-leg2');
  }

  /**
   * Called by LiveMatchComponent.finished. The result minutes apply to
   * the current leg. For non-finals, we wait for the user to start leg 2.
   * For final, we auto-finish the round (which sets won/eliminated).
   */
  onMatchFinished(result: MatchResult): void {
    if (this.isFinalRound()) {
      this.tournament.applyUserLeg(1, result);
      this.tournament.finishCurrentRound();
      this.viewState.set('round-done');
      return;
    }
    if (this.viewState() === 'playing-leg1') {
      this.tournament.applyUserLeg(1, result);
      this.viewState.set('between-legs');
    } else if (this.viewState() === 'playing-leg2') {
      this.tournament.applyUserLeg(2, result);
      this.viewState.set('round-done');
    }
  }

  /**
   * After the user's tie is fully played, this triggers the simulation
   * of every other tie in the round and advances to the next round.
   */
  finishRound(): void {
    this.tournament.finishCurrentRound();
    // viewState will sync on the next round via the effect.
  }
}
