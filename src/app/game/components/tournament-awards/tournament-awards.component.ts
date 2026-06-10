import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TournamentService } from '../../services/tournament.service';
import { TeamCrestComponent } from '../team-crest/team-crest.component';

/**
 * End-of-tournament awards card grid. Renders the 4 individual prizes:
 * goleador, asistidor, MVP and arquero. Reads everything from
 * TournamentService computed signals so it stays in sync.
 */
@Component({
  selector: 'app-tournament-awards',
  imports: [TeamCrestComponent],
  templateUrl: './tournament-awards.component.html',
  styleUrl: './tournament-awards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentAwardsComponent {
  private readonly tournament = inject(TournamentService);

  readonly topScorer = this.tournament.awardTopScorer;
  readonly topAssister = this.tournament.awardTopAssister;
  readonly mvp = this.tournament.awardMVP;
  readonly bestGK = this.tournament.awardBestGK;

  readonly hasAnyAward = computed(
    () => !!(this.topScorer() || this.topAssister() || this.mvp() || this.bestGK()),
  );
}
