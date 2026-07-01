import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Density, Theme } from '../../model';
import { ThemeService } from '../../services/theme/theme.service';
import { DensityService } from '../../services/density/density.service';
import { AbstractDialog } from '../../components/ui/dialog/abstract-dialog';
import { DialogComponent } from '../../components/ui/dialog/dialog.component';
import { SelectComponent } from '../../components/ui/select/select.component';
import { ThemeLabelPipe } from '../../pipes/theme-label/theme-label.pipe';
import { DensityLabelPipe } from '../../pipes/density-label/density-label.pipe';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogComponent,
    ReactiveFormsModule,
    SelectComponent,
    ThemeLabelPipe,
    DensityLabelPipe,
  ],
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.scss',
})
export class SettingsDialogComponent extends AbstractDialog<void> {
  private readonly themeService = inject(ThemeService);
  private readonly densityService = inject(DensityService);
  protected readonly dialog = viewChild.required(DialogComponent);

  protected readonly themeOptions = Object.values(Theme);
  protected readonly themeControl = new FormControl<Theme>(this.themeService.theme(), {
    nonNullable: true,
  });

  protected readonly densityOptions = Object.values(Density);
  protected readonly densityControl = new FormControl<Density>(this.densityService.density(), {
    nonNullable: true,
  });

  constructor() {
    super();
    this.themeControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((theme) => this.themeService.setTheme(theme));
    this.densityControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((density) => this.densityService.setDensity(density));
  }

  open(): Promise<void> {
    this.themeControl.setValue(this.themeService.theme(), { emitEvent: false });
    this.densityControl.setValue(this.densityService.density(), { emitEvent: false });
    return this.beginInteraction(undefined);
  }
}
