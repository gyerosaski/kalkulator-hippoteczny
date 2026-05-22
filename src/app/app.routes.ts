import { Routes } from '@angular/router';
import { CalculatorComponent } from './views/calculator/calculator.component';

export const routes: Routes = [
  { path: '', component: CalculatorComponent },
  {
    path: 'saved',
    loadComponent: () =>
      import('./views/calculations-manager/calculations-manager.component').then(
        (module) => module.CalculationsManagerComponent,
      ),
  },
];
