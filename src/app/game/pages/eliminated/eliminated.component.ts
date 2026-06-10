import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { DraftService } from '../../services/draft.service';
import { PageNavComponent } from '../../components/page-nav/page-nav.component';
import { TournamentAwardsComponent } from '../../components/tournament-awards/tournament-awards.component';

@Component({
  selector: 'app-eliminated',
  imports: [PageNavComponent, TournamentAwardsComponent],
  templateUrl: './eliminated.component.html',
  styleUrl: './eliminated.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EliminatedComponent {
  private readonly tournament = inject(TournamentService);
  private readonly draft = inject(DraftService);
  private readonly router = inject(Router);

  readonly eliminatedAt = this.tournament.eliminatedAt;
  readonly userTeam = this.tournament.userTeam;
  readonly champion = this.tournament.champion;

  readonly stageLabel = computed(() => {
    switch (this.eliminatedAt()) {
      case 'group':
        return 'fase de grupos';
      case 'R16':
        return 'octavos de final';
      case 'QF':
        return 'cuartos de final';
      case 'SF':
        return 'semifinales';
      case 'F':
        return 'la final';
      default:
        return '';
    }
  });

  playAgain(): void {
    this.tournament.reset();
    this.draft.reset();
    this.router.navigate(['/draft/formation']);
  }
}
