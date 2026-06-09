import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./game/pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'draft/formation',
    loadComponent: () =>
      import('./game/pages/formation-select/formation-select.component').then(
        (m) => m.FormationSelectComponent,
      ),
  },
  {
    path: 'draft/squad',
    loadComponent: () =>
      import('./game/pages/draft/draft.component').then((m) => m.DraftComponent),
  },
  {
    path: 'tournament/groups',
    // Placeholder — wired up in M4. For now redirects home.
    redirectTo: '',
  },
  { path: '**', redirectTo: '' },
];
