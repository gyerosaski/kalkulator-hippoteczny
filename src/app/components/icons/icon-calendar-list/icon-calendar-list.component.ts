import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'icon-calendar-list',
  standalone: true,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-calendar-list.component.html',
})
export class IconCalendarListComponent {}
