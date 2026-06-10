import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { KnockoutRound, KnockoutTie, MatchResult, MatchTeam } from '../../models';
import { PageNavComponent } from '../../components/page-nav/page-nav.component';
import { LiveMatchComponent } from '../../components/live-match/live-match.component';
import { TeamCrestComponent } from '../../components/team-crest/team-crest.component';
import { StatsLeaderboardComponent } from '../../components/stats-leaderboard/stats-leaderboard.component';

type PlayoffsViewState =
  | 'idle'             // round started, user can play their leg
  | 'playing-leg1'     // live leg 1
  | 'between-legs'     // leg 1 done (user + others), wait for user to start leg 2
  | 'playing-leg2'     // live leg 2
  | 'round-resolved';  // every tie in the round resolved, ready to advance

@Component({
  selector: 'app-playoffs',
  imports: [
    PageNavComponent,
    LiveMatchComponent,
    TeamCrestComponent,
    StatsLeaderboardComponent,
  ],
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

  /** Index into `rounds()` the user is currently inspecting. Null
   *  means "follow the active round". Lets the user click a past
   *  round in the strip and review its ties. */
  readonly viewingRoundIndex = signal<number | null>(null);

  /** The round the page actually renders in the tie grid — defaults
   *  to the active round unless the user picked a past one. */
  readonly viewedRound = computed<KnockoutRound | null>(() => {
    const i = this.viewingRoundIndex();
    if (i === null) return this.currentRound();
    return this.rounds()[i] ?? this.currentRound();
  });

  /** True when the user is reviewing a past round (not the active one). */
  readonly isViewingPast = computed(() => {
    const viewing = this.viewedRound();
    return viewing !== null && viewing !== this.currentRound();
  });

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
   * Called by LiveMatchComponent.finished. After the user's leg, the
   * other ties' SAME leg is auto-simulated so the bracket shows a full
   * picture for that leg before moving on.
   */
  onMatchFinished(result: MatchResult): void {
    if (this.viewState() === 'playing-leg1') {
      this.tournament.applyUserLeg(1, result);
      this.tournament.simulateOthersLeg(1);
      this.viewState.set('between-legs');
    } else if (this.viewState() === 'playing-leg2') {
      this.tournament.applyUserLeg(2, result);
      this.tournament.simulateOthersLeg(2);
      this.tournament.finalizeRound();
      this.viewState.set('round-resolved');
    }
  }

  /**
   * Builds the next round from the winners and switches into it.
   * The effect picks up the new round and resets viewState to 'idle'.
   */
  advanceToNextRound(): void {
    this.tournament.advanceToNextRound();
  }

  /**
   * Ghost-mode path: the user is already out, so they hit one button
   * per round to fast-forward the entire round.
   */
  simulateThisRound(): void {
    this.tournament.simulateGhostRound();
    this.viewState.set('round-resolved');
  }

  /**
   * Final round done → tournament results. If the user won, the won()
   * effect already routes them to /tournament/victory; otherwise they
   * land on /tournament/eliminated where the awards live.
   */
  viewResults(): void {
    if (this.tournament.won()) {
      this.router.navigate(['/tournament/victory']);
    } else {
      this.router.navigate(['/tournament/eliminated']);
    }
  }

  viewRoundByIndex(index: number): void {
    this.viewingRoundIndex.set(index);
  }

  backToCurrentRound(): void {
    this.viewingRoundIndex.set(null);
  }
}
