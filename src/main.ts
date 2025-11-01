import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideNzI18n, hu_HU } from 'ng-zorro-antd/i18n';
import { NZ_DATE_CONFIG } from 'ng-zorro-antd/i18n';

bootstrapApplication(App, {
  providers: [
    BrowserAnimationsModule,
    provideNzI18n(hu_HU),
    {
      provide: NZ_DATE_CONFIG,
      useValue: {
        firstDayOfWeek: 1  // 1 = Monday
      }
    }
  ]
}).catch(err => console.error(err));
