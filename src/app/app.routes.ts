import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './features/login/login.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent // El login va SOLO, sin Layout
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'inventario',
        loadComponent: () => import('./features/inventario/inventario.component').then(m => m.InventarioComponent)
      },
      { path: '', redirectTo: 'inventario', pathMatch: 'full' } //indica que pantalla mostrar al inicio de la carga
    ]
  },
  { path: '**', redirectTo: 'login' } // Si no existe la ruta, al login
];