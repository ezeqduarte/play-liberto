import { ChangeDetectionStrategy, Component, HostListener, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DraftService } from '../../services/draft.service';
import { TournamentService } from '../../services/tournament.service';

/**
 * Floating top-left back-to-Inicio chip rendered on every page except
 * home. Position is fixed so it doesn't push page content down — the
 * whole UI of each page stays inside the viewport.
 *
 * Behaviour depends on `requiresConfirmation`:
 * - true (default): opens a custom modal so the user can confirm before
 *   losing in-progress squad / tournament state.
 * - false: navigates straight home (no modal, no native alert). Used
 *   on pages where there's nothing to lose (formation select, end-game
 *   screens).
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

  readonly requiresConfirmation = input<boolean>(true);

  readonly showModal = signal(false);

  onBackClick(): void {
    if (this.requiresConfirmation()) {
      this.showModal.set(true);
    } else {
      this.goHomeImmediately();
    }
  }

  confirmGoHome(): void {
    this.showModal.set(false);
    this.goHomeImmediately();
  }

  cancel(): void {
    this.showModal.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showModal()) this.cancel();
  }

  private goHomeImmediately(): void {
    this.draft.reset();
    this.tournament.reset();
    this.router.navigate(['/']);
  }
}
