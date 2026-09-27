import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastVariant } from '../../../model';
import { ToastService } from '../../../services/toast/toast.service';
import { IconCheckCircleComponent } from '../../icons/icon-check-circle/icon-check-circle.component';
import { IconWarningSmComponent } from '../../icons/icon-warning-sm/icon-warning-sm.component';
import { IconInfoComponent } from '../../icons/icon-info/icon-info.component';

@Component({
  selector: 'ui-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
  imports: [IconCheckCircleComponent, IconWarningSmComponent, IconInfoComponent],
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);
  protected readonly ToastVariant = ToastVariant;
}
