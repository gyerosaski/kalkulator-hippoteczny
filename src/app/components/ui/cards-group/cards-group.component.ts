import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'ui-cards-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cards-group.component.html',
  styleUrl: './cards-group.component.scss',
})
export class CardsGroupComponent {}
