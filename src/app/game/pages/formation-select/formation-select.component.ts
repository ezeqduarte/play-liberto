import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DraftService } from '../../services/draft.service';
import { Formation, FormationShape, FormationStyle } from '../../models';
import { PageNavComponent } from '../../components/page-nav/page-nav.component';

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

  readonly selectedStyle = signal<FormationStyle>('normal');
  readonly styles: FormationStyle[] = ['defensive', 'normal', 'offensive'];

  readonly shapesForStyle = computed<Formation[]>(() =>
    this.draft.availableFormations.filter((f) => f.style === this.selectedStyle()),
  );

  readonly styleLabel: Record<FormationStyle, string> = {
    defensive: 'Defensivo',
    normal: 'Equilibrado',
    offensive: 'Ofensivo',
  };

  selectStyle(style: FormationStyle): void {
    this.selectedStyle.set(style);
  }

  chooseFormation(formation: Formation): void {
    this.draft.startDraft(formation.id);
    this.router.navigate(['/draft/squad']);
  }

  trackByShape(_: number, f: Formation): FormationShape {
    return f.shape;
  }
}
