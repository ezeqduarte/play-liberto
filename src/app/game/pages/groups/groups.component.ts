import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { DraftService } from '../../services/draft.service';
import { PageNavComponent } from '../../components/page-nav/page-nav.component';
import { LiveMatchComponent } from '../../components/live-match/live-match.component';
import { GroupFixture, MatchResult } from '../../models';

type GroupsViewState = 'idle' | 'playing' | 'done';

@Component({
  selector: 'app-groups',
  imports: [PageNavComponent, LiveMatchComponent],
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
  readonly currentMatchday = this.tournament.currentMatchday;
  readonly totalMatchdays = this.tournament.totalMatchdays;
  readonly completed = this.tournament.groupsCompleted;
  readonly eliminatedAt = this.tournament.eliminatedAt;

  readonly viewState = signal<GroupsViewState>('idle');
  readonly currentUserFixture = signal<GroupFixture | null>(null);

  readonly userAdvanced = computed(() => {
    const group = this.userGroup();
    const user = this.userTeam();
    if (!group || !user || !this.completed()) return false;
    const pos = group.standings.findIndex((s) => s.team.id === user.id);
    return pos >= 0 && pos < 2;
  });

  readonly userEliminated = computed(() => this.eliminatedAt() === 'group');

  constructor() {
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

  beginNextMatchday(): void {
    const fixture = this.tournament.beginNextMatchday();
    if (!fixture) {
      // No user fixture this matchday (shouldn't happen with our schedule).
      this.tournament.finishCurrentMatchday(null);
      return;
    }
    this.currentUserFixture.set(fixture);
    this.viewState.set('playing');
  }

  onMatchFinished(result: MatchResult): void {
    this.tournament.finishCurrentMatchday(result);
    this.currentUserFixture.set(null);
    if (this.completed()) {
      this.viewState.set('done');
    } else {
      this.viewState.set('idle');
    }
  }

  goToBracket(): void {
    this.tournament.drawBracket();
    this.router.navigate(['/tournament/playoffs']);
  }

  goToEliminated(): void {
    this.router.navigate(['/tournament/eliminated']);
  }
}
