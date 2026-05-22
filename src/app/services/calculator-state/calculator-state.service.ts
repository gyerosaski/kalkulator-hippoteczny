import { Injectable, signal } from '@angular/core';
import { MortgageResults } from '../../model';

@Injectable({ providedIn: 'root' })
export class CalculatorStateService {
  readonly results = signal<MortgageResults | null>(null);
}
