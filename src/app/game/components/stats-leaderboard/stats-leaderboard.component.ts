import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TournamentService } from '../../services/tournament.service';
import { TeamCrestComponent } from '../team-crest/team-crest.component';

/**
 * Side-by-side leaderboard for tournament goals and assists. Reads
 * live data from TournamentService so it stays in sync with whatever
 * was simulated. Renders nothing if no goals have been scored yet.
 */
@Component({
  selector: 'app-stats-leaderboard',
  imports: [TeamCrestComponent],
  templateUrl: './stats-leaderboard.component.html',
  styleUrl: './stats-leaderboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsLeaderboardComponent {
  private readonly tournament = inject(TournamentService);

  readonly limit = input<number>(10);

  readonly scorers = computed(() =>
    this.tournament.topScorers().slice(0, this.limit()),
  );
  readonly assisters = computed(() =>
    this.tournament.topAssisters().slice(0, this.limit()),
  );

  readonly hasData = computed(
    () => this.scorers().length > 0 || this.assisters().length > 0,
  );
}
