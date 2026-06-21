import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-calendar',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-calendar.component.html',
})
export class IconCalendarComponent {}
