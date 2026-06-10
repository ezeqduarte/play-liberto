import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Liberto • Home',
    pathMatch: 'full',
    loadComponent: () =>
      import('./game/pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'draft/formation',
    title: 'Liberto • Formation Select',
    loadComponent: () =>
      import('./game/pages/formation-select/formation-select.component').then(
        (m) => m.FormationSelectComponent,
      ),
  },
  {
    path: 'draft/squad',
    title: 'Liberto • Draft Squad',
    loadComponent: () =>
      import('./game/pages/draft/draft.component').then((m) => m.DraftComponent),
  },
  {
    path: 'tournament/groups',
    title: 'Liberto • Tournament Groups',
    loadComponent: () =>
      import('./game/pages/groups/groups.component').then((m) => m.GroupsComponent),
  },
  {
    path: 'tournament/draw',
    title: 'Liberto • Tournament Draw',
    loadComponent: () =>
      import('./game/pages/bracket-draw/bracket-draw.component').then(
        (m) => m.BracketDrawComponent,
      ),
  },
  {
    path: 'tournament/playoffs',
    title: 'Liberto • Tournament Playoffs',
    loadComponent: () =>
      import('./game/pages/playoffs/playoffs.component').then((m) => m.PlayoffsComponent),
  },
  {
    path: 'tournament/eliminated',
    title: 'Liberto • Tournament Eliminated',
    loadComponent: () =>
      import('./game/pages/eliminated/eliminated.component').then(
        (m) => m.EliminatedComponent,
      ),
  },
  {
    path: 'tournament/victory',
    title: 'Liberto • Tournament Victory',
    loadComponent: () =>
      import('./game/pages/victory/victory.component').then((m) => m.VictoryComponent),
  },
  {
    path: 'changelog',
    loadComponent: () =>
      import('./game/pages/changelog/changelog.component').then(
        (m) => m.ChangelogComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
