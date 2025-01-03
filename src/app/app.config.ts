import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideToastr({
      closeButton: false,
      positionClass: 'toast-top-center',
      timeOut: 3000,
      preventDuplicates: true
    } as any),
    provideAnimations(),
  ]
};
