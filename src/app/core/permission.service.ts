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
  // 1. Usamos sessionStorage (se borra al cerrar la pestaña/navegador)
  const token = sessionStorage.getItem('userToken');
  
  // 2. Recuperamos también el objeto usuario (si lo guardaste)
  const userStr = sessionStorage.getItem('userData'); 

  // 3. Solo está logueado si hay token Y hay datos de usuario
  const validSession = !!token && token !== 'undefined' && !!userStr;
  
  this.isLogged.set(validSession);

  if (validSession) {
    this.iniciarVigilancia();
  } else {
    // Si falta algo, limpiamos por si acaso quedaron restos
    this.logout(); 
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
  // 1. Limpiamos el almacenamiento de la pestaña (sessionStorage)
  // Usamos el nombre exacto de la llave que definimos antes
  sessionStorage.removeItem('userToken');
  sessionStorage.removeItem('userData');
  
  // Opcional: Limpia todo por si quedó algo de versiones anteriores
  sessionStorage.clear();
  localStorage.removeItem('userToken'); 

  // 2. Actualizamos la señal (Signal) para que el Guard bloquee el paso
  this.isLogged.set(false);

  // 3. Detenemos la vigilancia (si tienes el método creado)
  // this.detenerVigilancia(); 

  // 4. Redirección inmediata al login
  this.router.navigate(['/login'] , { replaceUrl: true });
  //window.location.reload(); //recarga la pagina para perder el token y seccion
  
  //console.log("Sesión cerrada correctamente");
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