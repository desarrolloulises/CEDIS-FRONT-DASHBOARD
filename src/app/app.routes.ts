import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './features/login/login.component';
import { authGuard } from './core/auth.guard';
import { CambioPassComponent } from './features/cambio-pass/cambio-pass.component';
import { ReportesComponent } from './features/reportes/reportes.component';

/**********LISTA O DICCIONARIO QUE INDICA EL CODIGO DE LA api Y LO ASOCIA A miComponente */
/*export const MAPEO_RUTAS: { [key: number]: string } = {
  1: 'marbetes-mantenimiento',
  2: 'inventario-por-tienda',
  3: 'programacion-embarque',
  4: 'inventario',
  5: 'marbetes-mantenimiento'

};*/


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
        path: 'inicio',
        loadComponent: () => import('./features/Home/Home.component').then(m => m.HomeComponent)
      },
      // --- NIVEL 1 (Módulos Principales) ---


      // --- NIVEL 1 (Módulos Principales) ---

      //simulacion de embarque
      {
        path: 'menu-embarque/inventario-por-ruta',
        loadComponent: () => import('./features/inventario/inventario2/inventario2.component').then(m => m.Inventario2Component)
      },
      {
        path: 'menu-embarque/inventario-por-tienda',
        loadComponent: () => import('./features/recibo/recibo/recibo.component').then(m => m.ReciboComponent)
      },
      {
        path: 'menu-embarque/programacion-embarque',
        loadComponent: () => import('./features/inventario/inventario2/inventario2.component').then(m => m.Inventario2Component)
      },
      //toma inventario
      {
        path: 'menu-embarque/marbetes-mantenimiento',
        loadComponent: () => import('./features/inventario/inventario1/inventario.component').then(m => m.InventarioComponent)
      },

      //ACCESOS
      {
        path: 'accesos/Accesos',
        loadComponent: () => import('./features/Accesos/catalogo-acessos/catalogo-acessos.component').then(m => m.CatalogoAcessosComponent)
      },
      {
        path: 'accesos/Perfiles',
        loadComponent: () => import('./features/Accesos/catalogo-perfiles/catalogo-perfiles.component').then(m => m.CatalogoPerfilesComponent)
      },
      {
        path: 'accesos/Accesos-perfil',
        loadComponent: () => import('./features/Accesos/acceso-perfil/acceso-perfil.component').then(m => m.AccesoPerfilComponent)
      },
      {
        path: 'accesos/Accesos-Usuarios',
        loadComponent: () => import('./features/Accesos/catalogo-usuario/catalogo-usuario.component').then(m => m.CatalogoUsuarioComponent)
      },
      //reportes
      {
        path: 'reporte/reporte-primerReporte',
        loadComponent: () => import('./features/reportes/reportes.component').then(m => m.ReportesComponent)
      },

      //panel control provedores
      {
        path: 'panel/Ubicacion-provedores',
        loadComponent: () => import('./features/panelControl/ubicacion-provedores/ubicacion-provedores.component').then(m => m.UbicacionProvedoresComponent)
      },

      //panel control recibo
      {
        path: 'panel/Ubicacion-colores',
        loadComponent: () => import('./features/panelControl/catalogo-colores/catalogo-colores.component').then(m => m.CatalogoColoresComponent)
      },

      //camara y qr
      {
        path: 'camaraQr/camaraQr',
        loadComponent: () => import('./features/camara-qr/camara-qr.component').then(m => m.CamaraQrComponent)
      },

      //registro-transportista
      {
        path: 'registro-ingreso-transportista-caseta',
        loadComponent: () => import('./features/control-entradas-salidas-cedis/entrada-salida-transportista-caseta/entrada-salida-transportista-caseta.component').then(m => m.EntradaSalidaTransportistaCasetaComponent)
      },

      {
        path: 'registro-personal',
        loadComponent: () => import('./features/control-entradas-salidas-cedis/registro-entrada-almacen/registro-entrada-almacen.component').then(m => m.RegistroEntradaAlmacenComponent)
      },

      {
        path: 'control-visita',
        loadComponent: () => import('./features/control-entradas-salidas-cedis/entrada-salida-visitante/entrada-salida-visitante.component').then(m => m.EntradaSalidaVisitanteComponent)
      },
      {
        path: 'consulta-entrega-devolucion',
        loadComponent: () => import('./features/control-entradas-salidas-cedis/consulta-entrega-devolucion/consulta-entrega-devolucion.component').then(m => m.ConsultaEntregaDevolucionComponent)
      },
      {
        path: 'consulta-seguridad',
        loadComponent: () => import('./features/control-entradas-salidas-cedis/consulta-seguridad/consulta-seguridad.component').then(m => m.ConsultaSeguridadComponent)
      },
      {
        path: 'consulta-registro-devolucion',
        loadComponent: () => import('./features/control-entradas-salidas-cedis/consulta-registro-devolucion/consulta-registro-devolucion.component').then(m => m.ConsultaRegistroDevolucionComponent)
      },
      {
        path: 'reporte-incidencias',
        loadComponent: () => import('./features/control-entradas-salidas-cedis/reporte-incidencias/reporte-incidencias.component').then(m => m.ReporteIncidenciasComponent)
      },
      {
        path: 'registro-arribo-asn',
        loadComponent: () => import('./features/control-calidad/RegistroArribos/RegistroArribos.component').then(m => m.RegistroArribosComponent)
      },
      {
        path: 'control-calidad/consultar-estatus-proveedores',
        loadComponent: () => import('./features/control-calidad/Consultas/consulta-estatus-proveedores/consulta-estatus-proveedores.component').then(m => m.ConsultaEstatusProveedoresComponent)
      },
      {
        path: 'control-calidad/consulta-productividad-general',
        loadComponent: () => import('./features/control-calidad/Consultas/consulta-productividad-general/consulta-productividad-general.component').then(m => m.ConsultaProductividadGeneralComponent)
      },
      {
        path: 'control-calidad/consulta-productividad-detalle',
        loadComponent: () => import('./features/control-calidad/Consultas/consulta-productividad-detalle/consulta-productividad-detalle.component').then(m => m.ConsultaProductividadDetalleComponent)
      },
      {
        path: 'control-calidad/consulta-rechazo-general',
        loadComponent: () => import('./features/control-calidad/Consultas/consulta-rechazo-general/consulta-rechazo-general.component').then(m => m.ConsultaRechazoGeneralComponent)
      },
      {
        path: 'control-calidad/consulta-rechazo-detalle',
        loadComponent: () => import('./features/control-calidad/Consultas/consulta-rechazo-detalle/consulta-rechazo-detalle.component').then(m => m.ConsultaRechazoDetalleComponent)
      },
      {
        path: 'control-calidad/consulta-motivos-rechazo',
        loadComponent: () => import('./features/control-calidad/Consultas/consulta-motivos-rechazo-detalle/consulta-motivos-rechazo-detalle.component').then(m => m.ConsultaMotivosRechazoDetalleComponent)
      },
      {
        path: 'control-calidad/consulta-inasistencias-proveedor',
        loadComponent: () => import('./features/control-calidad/Consultas/consulta-inasistencias-proveedor/consulta-inasistencias-proveedor.component').then(m => m.ConsultaInasistenciasProveedorComponent)
      },
      {
        path: 'control-calidad/consulta-cambios-fecha-cita',
        loadComponent: () => import('./features/control-calidad/Consultas/consulta-cambios-fecha-cita/consulta-cambios-fecha-cita.component').then(m => m.ConsultaCambiosFechaCitaComponent)
      },
      {
        path: 'control-calidad/consulta-productividad-por-asn',
        loadComponent: () => import('./features/control-calidad/Consultas/consulta-productividad-por-asn/consulta-productividad-por-asn.component').then(m => m.ConsultaProductividadPorAsnComponent)
      },
      {
        path: 'control-calidad/consulta-nivel-inspeccion',
        loadComponent: () => import('./features/control-calidad/Consultas/consulta-nivel-inspeccion/consulta-nivel-inspeccion.component').then(m => m.ConsultaNivelInspeccionComponent)
      },
      {
        path: 'control-calidad/deshacer-rechazo-asn',
        loadComponent: () => import('./features/control-calidad/deshacer-rechazo/deshacer-rechazo.component').then(m => m.DeshacerRechazoComponent)
      },
      {
        path: 'CambiaPass',
        loadComponent: () => import('./features/cambio-pass/cambio-pass.component').then(m => m.CambioPassComponent) // El login va SOLO, sin Layout
      },
      {
        path: 'reasignacion/resumen-detalle-por-folio',
        loadComponent: () => import('./features/reasignacion/resumen-detalle-folio/resumen-detalle-folio.component').then(m => m.ResumenDetalleFolioComponent)
      },
      {
        path: 'reasignacion/detalle-por-pallet',
        loadComponent: () => import('./features/reasignacion/detalle-pallet/detalle-pallet.component').then(m => m.DetallePalletComponent)
      },
      {
        path: 'cancelaciones/reagendar-cita',
        loadComponent: () => import('./features/cancelaciones/reagenda-cita/reagenda-cita.component').then(m => m.ReagendaCitaComponent)
      },
      {
        path: 'cancelaciones/reagendar-citas',
        loadComponent: () => import('./features/cancelaciones/reagenda-citas/reagenda-citas.component').then(m => m.ReagendaCitasComponent)
      },
      {
        path: 'devoluciones/asigna-nota-devolucion',
        loadComponent: () => import('./features/devoluciones/nota-devolucion/nota-devolucion.component').then(m => m.AsignacionNotaDevolucionComponent)
      },
      {
        path: 'catalogos/gestion-catalogo-validaciones-entrada',
        loadComponent: () => import('./features/Catalogos/gestion-catalogo-validaciones-entrada/gestion-catalogo-validaciones-entrada.component').then(m => m.GestionCatalogoValidacionesEntradaComponent)
      },
      {
        path: 'develop/test-component',
        loadComponent: () => import('./features/test-component/test.component').then(m => m.TestComponent)
      },
      {
        path: 'ver-reporte/:id',
        component: ReportesComponent
        // ❌ QUITA EL GUARD AQUÍ. Si esta ruta no tiene guard, 
        // el iframe no te mandará al login de Angular.
      },

    ]
  },

  { path: '**', redirectTo: 'login' } // Si no existe la ruta, al login
]

/*{
      path: MAPEO_RUTAS[4],
      loadComponent: () => import('./features/inventario/inventario2/inventario2.component').then(m => m.Inventario2Component)
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
      path: MAPEO_RUTAS[5],
      loadComponent: () => import('./features/inventario/inventario1/inventario.component').then(m => m.InventarioComponent), 
        pathMatch: 'full'
      
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
{ path: '**', redirectTo: 'login' } // Si no existe la ruta, al login */