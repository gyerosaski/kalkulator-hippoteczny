import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'ui-pixel-hippo',
  standalone: true,
  templateUrl: './pixel-hippo.component.html',
  styleUrls: ['./pixel-hippo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PixelHippoComponent {
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly spriteElement = viewChild.required<ElementRef<HTMLElement>>('sprite');

  /** Dom spoczynkowy: wyśrodkowany za nawigacją (zgodny z transformacją w SCSS). */
  private readonly homeTransform = 'translate(-50%, -50%)';

  /** Czas biegu w jedną stronę oraz przerwa po wybiegnięciu (ms). */
  private readonly travelDurationMilliseconds = 4600;
  private readonly pauseAtPeakMilliseconds = 700;

  /** Zakres losowej przerwy między kolejnymi wybiegnięciami (ms). */
  private readonly minimumIdleMilliseconds = 6000;
  private readonly maximumIdleMilliseconds = 14000;

  private excursionTimeoutId: ReturnType<typeof setTimeout> | undefined;
  private activeAnimation: Animation | undefined;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => this.scheduleNextExcursion());

    destroyRef.onDestroy(() => {
      if (this.excursionTimeoutId !== undefined) {
        clearTimeout(this.excursionTimeoutId);
      }
      this.activeAnimation?.cancel();
    });
  }

  private scheduleNextExcursion(): void {
    const idleMilliseconds =
      this.minimumIdleMilliseconds +
      Math.random() * (this.maximumIdleMilliseconds - this.minimumIdleMilliseconds);
    this.excursionTimeoutId = setTimeout(() => this.runExcursion(), idleMilliseconds);
  }

  /** Hipopotam wybiega z losowej strony nawigacji, przystaje i chowa się z powrotem. */
  private runExcursion(): void {
    const sprite = this.spriteElement().nativeElement;
    const side = Math.random() < 0.5 ? -1 : 1; // -1 = lewa strona, 1 = prawa
    const peakOffsetPixels = side * this.computeClearOffsetPixels(sprite);
    const peakTransform = `${this.homeTransform} translateX(${peakOffsetPixels}px)`;

    const outboundAnimation = sprite.animate(
      [
        { transform: `${this.homeTransform} scaleX(${side})` },
        { transform: `${peakTransform} scaleX(${side})` },
      ],
      { duration: this.travelDurationMilliseconds, easing: 'ease-in-out', fill: 'forwards' },
    );
    this.activeAnimation = outboundAnimation;

    outboundAnimation.onfinish = () => {
      const inboundAnimation = sprite.animate(
        [
          { transform: `${peakTransform} scaleX(${-side})` },
          { transform: `${this.homeTransform} scaleX(${-side})` },
        ],
        {
          duration: this.travelDurationMilliseconds,
          delay: this.pauseAtPeakMilliseconds,
          easing: 'ease-in-out',
          fill: 'forwards',
        },
      );
      this.activeAnimation = inboundAnimation;

      inboundAnimation.onfinish = () => {
        // Powrót do domu spoczynkowego (transformacja z SCSS) i odliczanie do kolejnego wybiegnięcia.
        // Trzeba anulować obie animacje — wypełnienie `forwards` z fazy wybiegnięcia trzyma pozycję skrajną.
        inboundAnimation.cancel();
        outboundAnimation.cancel();
        this.activeAnimation = undefined;
        this.scheduleNextExcursion();
      };
    };
  }

  /** Dystans od środka nawigacji, po którym hipopotam w całości wychodzi spoza pigułki nawigacji. */
  private computeClearOffsetPixels(sprite: HTMLElement): number {
    const fallbackNavigationWidthPixels = 360;
    const navigation = this.hostElement.nativeElement.closest('.topbar')?.querySelector('.tabs');
    const navigationWidthPixels =
      navigation?.getBoundingClientRect().width ?? fallbackNavigationWidthPixels;
    const spriteWidthPixels = sprite.getBoundingClientRect().width;
    const clearanceMarginPixels = 370;
    return navigationWidthPixels / 2 + spriteWidthPixels / 2 + clearanceMarginPixels;
  }
}
