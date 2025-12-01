import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { uk_UA, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import uk from '@angular/common/locales/uk';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { xsrfInterceptor } from './interceptors/xsrf.interceptor';

registerLocaleData(uk);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNzI18n(uk_UA),
    provideAnimationsAsync(),
    // Disable Angular's default XSRF cookie-based header by pointing at a non-existent cookie,
    // so our interceptor-provided header is not overwritten.
    provideHttpClient(
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN-NONE', headerName: 'X-XSRF-TOKEN' }),
      withInterceptors([xsrfInterceptor])
    )
  ]
};
