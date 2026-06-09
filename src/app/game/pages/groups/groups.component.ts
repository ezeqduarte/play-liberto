import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { DraftService } from '../../services/draft.service';
import { PageNavComponent } from '../../components/page-nav/page-nav.component';

@Component({
  selector: 'app-groups',
  imports: [PageNavComponent],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupsComponent {
  readonly tournament = inject(TournamentService);
  private readonly draft = inject(DraftService);
  private readonly router = inject(Router);

  readonly groups = this.tournament.groups;
  readonly userGroup = this.tournament.userGroup;
  readonly userTeam = this.tournament.userTeam;
  readonly completed = this.tournament.groupsCompleted;
  readonly eliminatedAt = this.tournament.eliminatedAt;

  readonly userAdvanced = computed(() => {
    const group = this.userGroup();
    const user = this.userTeam();
    if (!group || !user || !this.completed()) return false;
    const pos = group.standings.findIndex((s) => s.team.id === user.id);
    return pos >= 0 && pos < 2;
  });

  constructor() {
    // Bootstrap the tournament if it hasn't been initialised yet.
    effect(() => {
      if (this.tournament.userTeam() === null) {
        if (!this.draft.isComplete()) {
          this.router.navigate(['/draft/formation']);
          return;
        }
        this.tournament.start();
      }
    });
  }

  simulate(): void {
    this.tournament.simulateGroupStage();
  }

  goToBracket(): void {
    this.tournament.drawBracket();
    this.router.navigate(['/tournament/playoffs']);
  }

  goToEliminated(): void {
    this.router.navigate(['/tournament/eliminated']);
  }
}
