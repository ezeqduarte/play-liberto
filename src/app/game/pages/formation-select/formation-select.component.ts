import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DraftService } from '../../services/draft.service';
import {
  Formation,
  FormationShape,
  FormationStyle,
} from '../../models';
import { PageNavComponent } from '../../components/page-nav/page-nav.component';

/**
 * localStorage flag that gates the admin shortcut button. Defaults to
 * 'false' on first visit. To reveal the button, run in the browser
 * devtools console:
 *
 *   localStorage.setItem('liberto.adminEnabled', 'true')
 *
 * Reload the formation-select page and the dashed admin button will
 * appear under the main CTA.
 */
const ADMIN_FLAG_KEY = 'liberto.adminEnabled';

@Component({
  selector: 'app-formation-select',
  imports: [PageNavComponent],
  templateUrl: './formation-select.component.html',
  styleUrl: './formation-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormationSelectComponent {
  private readonly draft = inject(DraftService);
  private readonly router = inject(Router);

  readonly showAdminButton = signal(false);

  constructor() {
    if (typeof localStorage === 'undefined') return;
    // Seed the flag as 'false' on the very first visit so the user can
    // discover and toggle it manually in devtools.
    if (localStorage.getItem(ADMIN_FLAG_KEY) === null) {
      localStorage.setItem(ADMIN_FLAG_KEY, 'false');
    }
    this.showAdminButton.set(localStorage.getItem(ADMIN_FLAG_KEY) === 'true');
  }

  /** All 10 unique shapes, derived from the formation pool. */
  readonly shapes: FormationShape[] = Array.from(
    new Set(this.draft.availableFormations.map((f) => f.shape)),
  );

  readonly styles: FormationStyle[] = ['defensive', 'normal', 'offensive'];

  readonly selectedShape = signal<FormationShape>('4-3-3');
  readonly selectedStyle = signal<FormationStyle>('normal');

  readonly styleLabel: Record<FormationStyle, string> = {
    defensive: 'Defensivo',
    normal: 'Equilibrado',
    offensive: 'Ofensivo',
  };

  readonly selectedFormation = computed<Formation | undefined>(() =>
    this.draft.availableFormations.find(
      (f) => f.shape === this.selectedShape() && f.style === this.selectedStyle(),
    ),
  );

  selectShape(shape: FormationShape): void {
    this.selectedShape.set(shape);
  }

  selectStyle(style: FormationStyle): void {
    this.selectedStyle.set(style);
  }

  confirm(): void {
    const f = this.selectedFormation();
    if (!f) return;
    this.draft.startDraft(f.id);
    this.router.navigate(['/draft/squad']);
  }

  /**
   * Admin shortcut: skip the draft entirely with a synthetic 99-rated
   * squad and jump straight to the tournament. Useful for testing the
   * championship flow without grinding through 12 picks.
   */
  adminFill(): void {
    const f = this.selectedFormation();
    if (!f) return;
    this.draft.fillAdminSquad(f.id);
    this.router.navigate(['/tournament/groups']);
  }
}
