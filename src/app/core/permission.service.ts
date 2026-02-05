import { Injectable, signal, PLATFORM_ID, inject, RendererFactory2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  
  // Para manejar eventos de forma limpia en Angular
  private renderer = inject(RendererFactory2).createRenderer(null, null);

  private timeoutId: any;
  private readonly MINUTOS_INACTIVIDAD = 10; // Configura el tiempo aquí

  public isLogged = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('userToken');
      this.isLogged.set(!!token);

      // Si al cargar ya está logueado, empezamos a vigilar
      if (this.isLogged()) {
        this.iniciarVigilancia();
      }
    }
  }

  // --- Lógica de Vigilancia ---

  iniciarVigilancia() {
    if (!isPlatformBrowser(this.platformId)) return;

    // 1. Limpiamos cualquier cronómetro anterior
    this.reiniciarCronometro();

    // 2. Escuchamos eventos del usuario
    this.renderer.listen('window', 'mousemove', () => this.reiniciarCronometro());
    this.renderer.listen('window', 'keydown', () => this.reiniciarCronometro());
    this.renderer.listen('window', 'click', () => this.reiniciarCronometro());
  }

  private reiniciarCronometro() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Convertimos minutos a milisegundos
    const tiempoMs = this.MINUTOS_INACTIVIDAD * 60 * 1000;

    this.timeoutId = setTimeout(() => {
      console.warn('Sesión expirada por inactividad');
      this.logout();
    }, tiempoMs);
  }

  // --- Login y Logout ---

  login(token: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('userToken', token);
      this.isLogged.set(true);
      this.iniciarVigilancia(); // Empezamos a vigilar al entrar
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.timeoutId) clearTimeout(this.timeoutId);
      localStorage.removeItem('userToken');
      this.isLogged.set(false);
      this.router.navigate(['/login']);
    }
  }
  // En tu PermissionService, añade esta lógica para mejorar la seguridad
checkTokenValidity() {
  if (isPlatformBrowser(this.platformId)) {
    const token = localStorage.getItem('userToken');
    
    // Aquí es donde en el futuro llamarás a tu API
    // Si el servidor dice que el token ya no vale, hacemos logout
    if (token && this.tokenExpirado(token)) { 
      this.logout();
    }
  }
}

private tokenExpirado(token: string): boolean {
  // Aquí iría la lógica para leer la fecha dentro de un JWT
  // Por ahora, es un recordatorio de que el token debe tener fecha de caducidad
  return false; 
}
}