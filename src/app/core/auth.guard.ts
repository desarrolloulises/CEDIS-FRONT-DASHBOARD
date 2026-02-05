import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
    
import { isPlatformBrowser } from '@angular/common';
import { PermissionService } from './permission.service'; // Ajusta la ruta si es necesario

export const authGuard: CanActivateFn = (route, state) => {
  // Asegúrate de que PermissionService esté dentro de los paréntesis
  const service = inject(PermissionService); 
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // Ahora TypeScript ya sabe que 'service' tiene la propiedad 'isLogged'
  if (service.isLogged()) {
    return true;
  }

  return router.parseUrl('/login');
};