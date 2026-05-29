import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Theme } from '../../model';
import { ThemeService } from '../../services/theme/theme.service';
import { SelectComponent } from '../../components/ui/select/select.component';
import { ThemeLabelPipe } from '../../pipes/theme-label/theme-label.pipe';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, SelectComponent, ThemeLabelPipe],
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.scss',
})
export class SettingsDialogComponent {
  private readonly themeService = inject(ThemeService);
  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  protected readonly themeOptions = Object.values(Theme);
  protected readonly themeControl = new FormControl<Theme>(this.themeService.theme(), {
    nonNullable: true,
  });

  private resolvePromise?: () => void;

  constructor() {
    this.themeControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((theme) => this.themeService.setTheme(theme));
  }

  open(): Promise<void> {
    this.themeControl.setValue(this.themeService.theme(), { emitEvent: false });
    this.dialogRef().nativeElement.showModal();
    return new Promise((resolve) => (this.resolvePromise = resolve));
  }

  protected cancel(): void {
    this.dialogRef().nativeElement.close();
  }

  protected onClose(): void {
    this.resolvePromise?.();
    this.resolvePromise = undefined;
  }
}
