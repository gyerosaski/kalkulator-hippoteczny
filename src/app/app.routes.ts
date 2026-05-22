import { Routes } from '@angular/router';
import { AppRoute } from './model';

export const routes: Routes = [
  {
    path: AppRoute.CALCULATOR,
    loadComponent: () =>
      import('./views/calculator/calculator.component').then(
        (module) => module.CalculatorComponent,
      ),
  },
  {
    path: AppRoute.CALCULATOR_MANAGER,
    loadComponent: () =>
      import('./views/calculations-manager/calculations-manager.component').then(
        (module) => module.CalculationsManagerComponent,
      ),
  },
  {
    path: AppRoute.CALCULATIONS_COMPARE,
    loadComponent: () =>
      import('./views/calculations-compare/calculations-compare.component').then(
        (module) => module.CalculationsCompareComponent,
      ),
  },
  { path: '', redirectTo: AppRoute.CALCULATOR, pathMatch: 'full' },
];
