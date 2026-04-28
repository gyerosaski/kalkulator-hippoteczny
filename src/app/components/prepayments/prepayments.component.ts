import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormService } from '../../services/form/form';
import { FormatMonthPlPipe } from '../../pipes/format-month-pl.pipe';
import { PrepaymentFrequency, PrepaymentEffect } from '../../model/mortgage.model';

@Component({
  selector: 'app-prepayments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormatMonthPlPipe],
  templateUrl: './prepayments.component.html',
  styleUrl: './prepayments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrepaymentsComponent {
  readonly formService = inject(FormService);

  readonly prepaymentFrequencyOptions: PrepaymentFrequency[] = ['jednorazowo', 'co miesiąc', 'co kwartał', 'co rok'];
  readonly prepaymentEffectOptions: PrepaymentEffect[] = ['niższa rata', 'skrócenie okresu'];

  get form() { return this.formService.form; }
  get nadplatyRegulyArray() { return this.formService.nadplatyRegulyArray; }

  addNadplataRegula() { this.formService.addNadplataRegula(); }
  removeNadplataRegula(index: number) { this.formService.removeNadplataRegula(index); }
  onNadplataFrequencyChanged(index: number) { this.formService.onNadplataFrequencyChanged(index); }
  onNadplataFromChanged(index: number) { this.formService.onNadplataFromChanged(index); }
}
