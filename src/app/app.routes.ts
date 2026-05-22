import { Routes } from '@angular/router';
import { LayoutComponent } from './containers/layout/layout.component';
import { CalculatorComponent } from './containers/calculator/calculator.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: CalculatorComponent },
      {
        path: 'saved',
        loadComponent: () =>
          import('./containers/saved-calculations/saved-calculations.component').then(
            (module) => module.SavedCalculationsComponent,
          ),
      },
    ],
  },
];
