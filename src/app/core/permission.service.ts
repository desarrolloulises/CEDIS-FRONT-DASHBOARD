import { Injectable, signal, PLATFORM_ID, inject, RendererFactory2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

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

  // Rutas que NO deben expirar por inactividad
  private readonly RUTAS_EXCLUIDAS: string[] = [
    '/control-calidad/consultar-estatus-proveedores'
  ];

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
        // Evaluamos la ruta actual al cargar la app
        this.verificarRutaYControlarVigilancia(this.router.url);
      } else {
        // Si falta algo, limpiamos por si acaso quedaron restos
        this.logout(); 
      }

      // Escuchamos cada vez que el usuario cambia de página mediante el Router
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        this.verificarRutaYControlarVigilancia(event.urlAfterRedirects);
      });
    }
  }

  // --- Lógica de Vigilancia y Control de Rutas ---

  private verificarRutaYControlarVigilancia(urlActual: string) {
    // Comprobamos si la ruta actual incluye alguna de las excluidas
    const estaExcluida = this.Rutas_Excluidas_Validar(urlActual);

    if (estaExcluida) {
      this.detenerVigilancia();
      console.log('Inactividad pausada en la ruta exenta:', urlActual);
    } else {
      // Si salimos de una ruta exenta y hay sesión, reactivamos la vigilancia
      if (this.isLogged()) {
        this.iniciarVigilancia();
      }
    }
  }

  private Rutas_Excluidas_Validar(url: string): boolean {
    return this.RUTAS_EXCLUIDAS.some(ruta => url.includes(ruta));
  }

  iniciarVigilancia() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Si ya estamos en una ruta excluida, no iniciamos la vigilancia
    if (this.Rutas_Excluidas_Validar(this.router.url)) return;

    // 1. Limpiamos cualquier cronómetro anterior
    this.reiniciarCronometro();

    // 2. Escuchamos eventos del usuario
    this.renderer.listen('window', 'mousemove', () => this.reiniciarCronometro());
    this.renderer.listen('window', 'keydown', () => this.reiniciarCronometro());
    this.renderer.listen('window', 'click', () => this.reiniciarCronometro());
  }

  private reiniciarCronometro() {
    // Si estamos en una ruta excluida, ignoramos el reinicio/conteo
    if (this.Rutas_Excluidas_Validar(this.router.url)) return;

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

  detenerVigilancia() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  // --- Login y Logout ---

  login(token: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('userToken', token);
      this.isLogged.set(true);
      
      // Validamos la ruta al hacer login para decidir si vigilamos o no
      this.verificarRutaYControlarVigilancia(this.router.url); 
    }
  }

  logout() {
    // 1. Limpiamos el almacenamiento de la pestaña (sessionStorage)
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('userData');
    
    // Opcional: Limpia todo por si quedó algo de versiones anteriores
    sessionStorage.clear();
    localStorage.removeItem('userToken'); 

    // 2. Actualizamos la señal (Signal) para que el Guard bloquee el paso
    this.isLogged.set(false);

    // 3. Detenemos la vigilancia
    this.detenerVigilancia(); 

    // 4. Redirección inmediata al login
    this.router.navigate(['/login'] , { replaceUrl: true });
  }

  // Comprobación opcional de token
  checkTokenValidity() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('userToken');
      
      if (token && this.tokenExpirado(token)) { 
        this.logout();
      }
    }
  }

  private tokenExpirado(token: string): boolean {
    return false; 
  }
}