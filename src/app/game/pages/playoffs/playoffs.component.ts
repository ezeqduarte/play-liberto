import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { KnockoutTie } from '../../models';

@Component({
  selector: 'app-playoffs',
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
  readonly eliminatedAt = this.tournament.eliminatedAt;
  readonly won = this.tournament.won;

  /**
   * Whether the current round has been played already. If yes, the
   * action button should advance to the next round (or show victory /
   * elimination).
   */
  readonly currentRoundPlayed = computed(() => this.currentRound()?.completed ?? false);

  /** Round to render in the bracket — the currently active one. */
  readonly activeRound = computed(() => this.currentRound());

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
    });
  }

  isUserTie(tie: KnockoutTie): boolean {
    const u = this.userTeam();
    return !!u && (tie.teamA.id === u.id || tie.teamB.id === u.id);
  }

  simulateRound(): void {
    this.tournament.simulateCurrentRound();
  }
}
