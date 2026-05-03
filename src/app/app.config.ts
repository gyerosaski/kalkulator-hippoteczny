import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { DecimalPipe } from '@angular/common';
import { FormatAmountPipe } from './pipes/format-amount/format-amount.pipe';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    DecimalPipe,
    FormatAmountPipe,
    { provide: LOCALE_ID, useValue: 'pl-PL' },
  ],
};
