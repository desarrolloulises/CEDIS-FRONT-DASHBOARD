import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }),
  provideRouter(routes,
    withComponentInputBinding(), // 👈 Recomendado para Angular 18
    withRouterConfig({
      paramsInheritanceStrategy: 'always' // 👈 AQUÍ es donde se pone la estrategia
    })
  ),
  provideHttpClient(),
  provideHttpClient(
    withFetch()
  ),
  provideClientHydration(),
  provideAnimationsAsync(),
  provideNativeDateAdapter(),
  ]
};
