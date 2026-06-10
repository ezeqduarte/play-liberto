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
  readonly champion = this.tournament.champion;

  readonly viewState = signal<PlayoffsViewState>('idle');

  /**
   * Whether the user is still alive in the bracket — i.e., they have
   * a tie in the current round. When false, the page enters "ghost
   * mode": the user watches subsequent rounds simulate without playing.
   */
  readonly userInCurrentRound = computed(() => {
    const user = this.userTeam();
    const round = this.currentRound();
    if (!user || !round) return false;
    return round.ties.some((t) => t.teamA.id === user.id || t.teamB.id === user.id);
  });

  /** True when the user has been eliminated from the bracket. */
  readonly userEliminated = computed(() => {
    const e = this.eliminatedAt();
    return e !== null && e !== 'group';
  });

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
      // Group-stage elimination shortcuts past the bracket entirely.
      if (this.eliminatedAt() === 'group') {
        this.router.navigate(['/tournament/eliminated']);
        return;
      }
      // Bracket-stage elimination keeps the user on this page in ghost
      // mode so they can watch the rest of the tournament play out and
      // see who lifted the cup. Navigation to /eliminated only happens
      // when the user explicitly presses "Ver resumen final".
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
   * Called by LiveMatchComponent.finished. Each tie (including the
   * final) is two legs — leg 1 records the result and moves to
   * between-legs; leg 2 records and moves to user-tie-done.
   */
  onMatchFinished(result: MatchResult): void {
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

  /**
   * Ghost-mode path: the user is already out, so they hit one button
   * per round to fast-forward the simulation until the final.
   */
  simulateThisRound(): void {
    this.simulateRest();
  }

  /**
   * From the eliminated final-state screen, navigate to the summary.
   */
  viewSummary(): void {
    this.router.navigate(['/tournament/eliminated']);
  }
}
