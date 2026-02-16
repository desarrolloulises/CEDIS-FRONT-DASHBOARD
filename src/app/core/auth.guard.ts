import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

import { isPlatformBrowser } from '@angular/common';
import { PermissionService } from './permission.service'; // Ajusta la ruta si es necesario

export const authGuard: CanActivateFn = (route, state) => {
  const service = inject(PermissionService);
  const router = inject(Router);

  const token = sessionStorage.getItem('userToken');

  // Solo verificamos si existen los datos. 
  // No ejecutamos logout() aquí para evitar cierres de sesión accidentales.
  if (service.isLogged() && token && token !== 'undefined') {
    return true;
  }

  console.warn("Guard: Bloqueado. Redirigiendo a login...");
  return router.parseUrl('/login');
};