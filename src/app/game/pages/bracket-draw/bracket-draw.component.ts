import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { KnockoutTie, MatchTeam } from '../../models';
import { PageNavComponent } from '../../components/page-nav/page-nav.component';

const REVEAL_INTERVAL_MS = 850;

@Component({
  selector: 'app-bracket-draw',
  imports: [PageNavComponent],
  templateUrl: './bracket-draw.component.html',
  styleUrl: './bracket-draw.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BracketDrawComponent {
  private readonly tournament = inject(TournamentService);
  private readonly router = inject(Router);

  readonly userTeam = this.tournament.userTeam;
  readonly currentRound = this.tournament.currentRound;

  /** Ties of the R16 round being revealed. Driven by tournament state. */
  readonly ties = computed<KnockoutTie[]>(() => this.currentRound()?.ties ?? []);

  /** Which card index has been flipped open so far. */
  readonly revealedCount = signal(0);
  readonly drawStarted = signal(false);

  readonly allRevealed = computed(() => this.revealedCount() >= this.ties().length);

  constructor() {
    effect(() => {
      if (!this.tournament.bracketDrawn() || this.ties().length === 0) {
        // Bracket hasn't been drawn (or state was reset). Bounce home.
        this.router.navigate(['/']);
      }
    });
  }

  isUserTie(tie: KnockoutTie): boolean {
    const u = this.userTeam();
    return !!u && (tie.teamA.id === u.id || tie.teamB.id === u.id);
  }

  isRevealed(index: number): boolean {
    return index < this.revealedCount();
  }

  startDraw(): void {
    if (this.drawStarted()) return;
    this.drawStarted.set(true);
    this.revealNext();
  }

  goToPlayoffs(): void {
    this.router.navigate(['/tournament/playoffs']);
  }

  trackTie(_: number, t: KnockoutTie): string {
    return t.id;
  }

  trackTeam(_: number, t: MatchTeam): string {
    return t.id;
  }

  private revealNext(): void {
    const idx = this.revealedCount();
    const total = this.ties().length;
    if (idx >= total) return;
    setTimeout(() => {
      this.revealedCount.update((c) => c + 1);
      if (this.revealedCount() < total) {
        this.revealNext();
      }
    }, REVEAL_INTERVAL_MS);
  }
}
