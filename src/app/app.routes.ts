import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './features/login/login.component';
import { authGuard } from './core/auth.guard';
import { CambioPassComponent } from './features/cambio-pass/cambio-pass.component';

/**********LISTA O DICCIONARIO QUE INDICA EL CODIGO DE LA api Y LO ASOCIA A miComponente */
export const MAPEO_RUTAS: { [key: number]: string } = {
  1: 'inventario',
  2: 'inventario-por-tienda',
  3: 'programacion-embarque'
};


export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent // El login va SOLO, sin Layout
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: MAPEO_RUTAS[1],
        loadComponent: () => import('./features/inventario/inventario1/inventario.component').then(m => m.InventarioComponent)
      },
      {
        path: MAPEO_RUTAS[2],
        loadComponent: () => import('./features/inventario/inventario2/inventario2.component').then(m => m.Inventario2Component)
      },      
      {
        path: MAPEO_RUTAS[3],
        loadComponent: () => import('./features/recibo/recibo/recibo.component').then(m => m.ReciboComponent)
      },
      {
        path: 'CambiaPass',
        loadComponent: () => import('./features/cambio-pass/cambio-pass.component').then(m => m.CambioPassComponent) // El login va SOLO, sin Layout
      },
      {
        path: 'inicio',
        loadComponent: () => import('./components/summary-cards/summary-cards.component').then(m => m.SummaryCardsComponent) // El login va SOLO, sin Layout
      },
      {
        path: 'inventario',
        loadComponent: () => import('./features/inventario/inventario1/inventario.component').then(m => m.InventarioComponent) // El login va SOLO, sin Layout
      },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' } //indica que pantalla mostrar al inicio de la carga
    ]
  },
  { path: '**', redirectTo: 'login' } // Si no existe la ruta, al login
];