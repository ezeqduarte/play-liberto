import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DraftService } from '../../services/draft.service';
import { TournamentService } from '../../services/tournament.service';

/**
 * Tiny top-left nav: a back-to-home link. Shown on every page except
 * the home itself. Always resets game state on click so the player
 * starts from a clean slate.
 */
@Component({
  selector: 'app-page-nav',
  templateUrl: './page-nav.component.html',
  styleUrl: './page-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageNavComponent {
  private readonly draft = inject(DraftService);
  private readonly tournament = inject(TournamentService);
  private readonly router = inject(Router);

  goHome(): void {
    if (
      confirm(
        'Volver al inicio reinicia el equipo y el torneo. ¿Querés continuar?',
      )
    ) {
      this.draft.reset();
      this.tournament.reset();
      this.router.navigate(['/']);
    }
  }
}
