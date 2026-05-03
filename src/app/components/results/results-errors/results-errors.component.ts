import {Component, inject} from '@angular/core';
import {FormService} from '../../../services/form/form';

@Component({
  selector: 'app-results-errors',
  imports: [],
  templateUrl: './results-errors.component.html',
  styleUrl: './results-errors.component.scss',
})
export class ResultsErrorsComponent {
  private readonly formService = inject(FormService);

  get form() {
    return this.formService.form;
  }
}
