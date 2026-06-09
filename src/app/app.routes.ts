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
    loadComponent: () =>
      import('./game/pages/groups/groups.component').then((m) => m.GroupsComponent),
  },
  {
    path: 'tournament/playoffs',
    loadComponent: () =>
      import('./game/pages/playoffs/playoffs.component').then((m) => m.PlayoffsComponent),
  },
  {
    path: 'tournament/eliminated',
    loadComponent: () =>
      import('./game/pages/eliminated/eliminated.component').then(
        (m) => m.EliminatedComponent,
      ),
  },
  {
    path: 'tournament/victory',
    // Wired up in M5. Until then, redirects to home.
    redirectTo: '',
  },
  { path: '**', redirectTo: '' },
];
