import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-calculations-compare',
  standalone: true,
  imports: [],
  templateUrl: './calculations-compare.component.html',
  styleUrls: ['./calculations-compare.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculationsCompareComponent {}
