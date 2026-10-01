import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PermissionService } from '../../core/permission.service';
import { DatosService } from '../../service/servicio.service';
import { ProcesosCedisService } from '../../service/procesos-cedis.service';
import { IMenuSidebar } from '../../interfaces/ibahia';
import { ReportService } from '../../services/ReportService';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {

  public modulos = signal<any[]>([]);
  private permissionService = inject(PermissionService);
  private reporteService = inject(ReportService);

  constructor(
    private datosService: DatosService,
    private service: ProcesosCedisService,
  ) { }

  ngOnInit() {
    const body: IMenuSidebar = {
      Usuario: this.datosService.usuarioSignal(),
      Nivel: 1,
      SubNivel: 0,
      SubAcceso: 0
    };
    this.cargarMenu(body);
  }

  cargarMenu(body: any) {
    this.service.getVerMenu(body).subscribe({

      next: (res) => {
        const menuFiltrado = res.filter((item: any) => item.Opcion < 1000);
        this.modulos.set(menuFiltrado);
      }
    });
  }

  // ── Íconos Tabler por módulo (requiere tabler-icons en index.html) ──
  public readonly ICONO_MODULO: Record<number, string> = {
    1: 'ti-clipboard-check',
    2: 'ti-package',
    3: 'ti-truck-delivery',
    4: 'ti-layout-dashboard',
    5: 'ti-scan',
    13: 'ti-chart-bar',
    14: 'ti-map-pin',
    15: 'ti-shield-check',
    16: 'ti-layout-columns',
    17: 'ti-truck',
    18: 'ti-archive',
    19: 'ti-calculator',
    20: 'ti-shield-lock',
    30: 'ti-camera',
    40: 'ti-id-badge',
    43: 'ti-inbox',
    44: 'ti-file-report',
    50: 'ti ti-clipboard-check',
    60: 'ti ti-report-search',
    70: 'tu ti-calendar-week'
  };

  public readonly MAPEO_RUTAS_HIJOS: Record<string, string> = {
    '3-1': 'menu-embarque/inventario-por-ruta',
    '3-2': 'menu-embarque/inventario-por-tienda',
    '3-3': 'menu-embarque/programacion-embarque',
    '5-1': 'menu-embarque/marbetes-mantenimiento',
    '13-1': 'reporte/reporte-primerReporte',
    '13-2': 'reporte/Recibo-sin-primer-o-segundo-escaneo',
    '13-3': 'reporte/Resumen-Recibo-por-Orden',
    '14-1': 'panel/Ubicacion-provedores',
    '14-2': 'panel/Ubicacion-colores',
    '15-1': 'reporte/Consulta-ASN-por-orden-de-compra',
    '16-1': 'reporte/Control-de-Bahías',
    '17-1': 'reporte/Cajas-Escaneadas-no-Embarcadas',
    '17-2': 'reporte/Embarques-por-día',
    '17-3': 'reporte/Errores-sin-1er-o-2do-Escaneo',
    '17-4': 'reporte/Inventario-pendiente-para-embarque',
    '17-5': 'reporte/Resumen-embarque-por-tienda',
    '18-1': 'reporte/Historial-de-caja',
    '18-2': 'reporte/Inventario-Antiguedad',
    '18-3': 'reporte/Inventario-por-Proveedor-Estilo',
    '18-4': 'reporte/Inventario-por-Ruta',
    '19-1': 'reporte/Inventario-Físico-vs-Teórico',
    '19-2': 'reporte/Inventario-Físico-vs-Teórico-Resumido-por-Estilo',
    '19-3': 'reporte/Log-de-Errores-Toma-de-Inventario',
    '19-4': 'reporte/Toma-de-inventario-físico',
    '20-1': 'accesos/Accesos',
    '20-2': 'accesos/Perfiles',
    '20-3': 'accesos/Accesos-perfil',
    '20-4': 'accesos/Accesos-Usuarios',
    '30-1': 'camaraQr/camaraQr',
    '40-1': 'registro-ingreso-transportista-caseta',
    '40-2': 'control-visita',
    '40-3': 'registro-personal',
    '40-4': 'consulta-entrega-devolucion',
    '40-5': 'consulta-registro-devolucion',
    '40-6': 'consulta-seguridad',
    '40-7': 'reporte-incidencias',
    '44-1': 'ver-reporte/44-1',
    '50-1': 'registro-arribo-asn',
    '60-1': 'reasignacion/resumen-detalle-por-folio',
    '60-2': 'reasignacion/detalle-por-pallet',
    '70-1': 'cancelaciones/reagendar-cita',
    '70-2': 'cancelaciones/reagendar-citas'
  };

  obtenerSubmenus(modulo: any) {
    if ((modulo.sub && modulo.sub.length > 0) || modulo.intentado) {
      if (modulo.sub && modulo.sub.length > 0) {
        this.modulos.update(lista => lista.map(m =>
          m.Opcion === modulo.Opcion ? { ...m, abierto: !m.abierto } : m
        ));
      }
      return;
    }

    const body: IMenuSidebar = {
      Usuario: this.datosService.usuarioSignal(),
      Nivel: 2,
      SubNivel: modulo.Opcion,
      SubAcceso: 0
    };

    this.actualizarEstado(modulo.Opcion, { cargando: true });

    this.service.getVerMenu(body).subscribe({
      next: (dataHijos) => {
        const subProcesados = dataHijos.map(sub => {
          const llaveUnica = `${modulo.Opcion}-${sub.Opcion}`;
          const rutaOriginal = this.MAPEO_RUTAS_HIJOS[llaveUnica] || 'inicio';
          const esReporte = String(rutaOriginal).includes('reporte/');
          const urlFinal = esReporte ? rutaOriginal.split('/').pop() || rutaOriginal : rutaOriginal;
          return { ...sub, URL: urlFinal, tipo: esReporte ? 'reporte' : 'modulo' };
        });

        this.modulos.update(lista => lista.map(m =>
          m.Opcion === modulo.Opcion
            ? { ...m, sub: subProcesados, abierto: true, cargando: false, intentado: true }
            : m
        ));
      },
      error: (err) => {
        console.error('Error al traer submenús', err);
        this.actualizarEstado(modulo.Opcion, { cargando: false, intentado: true, abierto: false });
      }
    });
  }

  actualizarEstado(opcionId: number, cambios: any) {
    this.modulos.update(lista => lista.map(m =>
      m.Opcion === opcionId ? { ...m, ...cambios } : m
    ));
  }

  notificarReporte(url: string) {
    this.reporteService.actualizarSeleccion(url);
  }
}