import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
    
import { isPlatformBrowser } from '@angular/common';
import { PermissionService } from './permission.service'; // Ajusta la ruta si es necesario

export const authGuard: CanActivateFn = (route, state) => {
  const service = inject(PermissionService);
  const router = inject(Router);

  // No solo preguntamos si hay sesión, sino si el valor es real
  const token = localStorage.getItem('userToken');
  
  if (service.isLogged() && token && token !== 'undefined') {
    return true;
  }

  console.warn("Guard: Intento de acceso sin token válido");
  return router.parseUrl('/login');
};