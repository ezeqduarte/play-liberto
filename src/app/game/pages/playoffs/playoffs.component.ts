import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { KnockoutTie, MatchResult, MatchTeam } from '../../models';
import { PageNavComponent } from '../../components/page-nav/page-nav.component';
import { LiveMatchComponent } from '../../components/live-match/live-match.component';

type PlayoffsViewState =
  | 'idle'             // round started, user can play their leg
  | 'playing-leg1'     // live leg 1
  | 'between-legs'     // leg 1 done, user can play leg 2
  | 'playing-leg2'     // live leg 2
  | 'user-tie-done'    // user's tie complete, other ties not yet sim'd
  | 'round-resolved';  // every tie in the round resolved, ready to advance

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
      // Sync view state when the round changes (or first enters page).
      const round = this.currentRound();
      if (round && this.syncedRoundName !== round.name) {
        this.syncedRoundName = round.name;
        this.viewState.set(round.completed ? 'round-resolved' : 'idle');
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
   * the current leg. For finals we resolve the tie immediately (no other
   * ties to wait for). For non-finals, we wait for the user to play
   * both legs and then press "Simular el resto".
   */
  onMatchFinished(result: MatchResult): void {
    if (this.isFinalRound()) {
      this.tournament.applyUserLeg(1, result);
      // The final has only one tie. Resolve it so the won / eliminated
      // signal fires and the page can route to victory or eliminated.
      this.tournament.simulateRemainingTies();
      this.viewState.set('round-resolved');
      return;
    }
    if (this.viewState() === 'playing-leg1') {
      this.tournament.applyUserLeg(1, result);
      this.viewState.set('between-legs');
    } else if (this.viewState() === 'playing-leg2') {
      this.tournament.applyUserLeg(2, result);
      this.viewState.set('user-tie-done');
    }
  }

  /**
   * Step 1 of resolving the round: simulate every non-user tie. The user
   * stays on the same page so they can scan all the results before
   * pressing "Siguiente ronda".
   */
  simulateRest(): void {
    this.tournament.simulateRemainingTies();
    this.viewState.set('round-resolved');
  }

  /**
   * Step 2: build the next round from the winners and switch into it.
   * The effect picks up the new round and resets viewState to 'idle'.
   */
  advanceToNextRound(): void {
    this.tournament.advanceToNextRound();
  }
}
