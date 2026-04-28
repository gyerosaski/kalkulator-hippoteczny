import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../services/form/form';
import { FormatMonthPlPipe } from '../../pipes/format-month-pl.pipe';

@Component({
  selector: 'app-tranches',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormatMonthPlPipe],
  templateUrl: './tranches.component.html',
  styleUrl: './tranches.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranchesComponent {
  readonly formService = inject(FormService);

  get form() { return this.formService.form; }
  get transzeArray() { return this.formService.transzeArray; }
  get transzeSuma() { return this.formService.transzeSuma; }

  addTransza() { this.formService.addTransza(); }
  removeTransza(index: number) { this.formService.removeTransza(index); }
  clearTransze() { this.formService.clearTransze(); }
}
