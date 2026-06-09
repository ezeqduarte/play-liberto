import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DraftService } from '../../services/draft.service';
import {
  Formation,
  FormationShape,
  FormationStyle,
} from '../../models';
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
}
