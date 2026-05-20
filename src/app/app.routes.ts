import { Routes } from '@angular/router';
import { LayoutComponent } from './containers/layout/layout.component';

export const routes: Routes = [
  { path: '', component: LayoutComponent },
  {
    path: 'saved',
    loadComponent: () =>
      import('./containers/saved-calculations/saved-calculations.component').then(
        (module) => module.SavedCalculationsComponent,
      ),
  },
];
