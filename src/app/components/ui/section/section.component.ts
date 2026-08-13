import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'ui-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section.component.html',
  styleUrl: './section.component.scss',
})
export class SectionComponent {
  /** Nadtytuł sekcji (eyebrow), np. „3.5 · STRUKTURA WSZYSTKICH PŁATNOŚCI”. */
  readonly tag = input<string>('');
  /** Tytuł sekcji renderowany jako nagłówek. */
  readonly heading = input<string>('');
}
