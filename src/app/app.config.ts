import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
import { DecimalPipe } from '@angular/common';
import { FormatAmountPipe } from './pipes/format-amount/format-amount.pipe';
import { FormatRatePipe } from './pipes/format-rate/format-rate.pipe';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    DecimalPipe,
    FormatAmountPipe,
    FormatRatePipe,
    { provide: LOCALE_ID, useValue: 'pl-PL' },
  ],
};
