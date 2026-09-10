import { Component, signal, OnInit, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { InputComponent } from "../../../shared/components/input/input.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { ToastComponent } from "../../../shared/components/toast/toast.component";
import { LoadingSpinnerComponent } from "../../../shared/components/loading-spinner/loading-spinner.component";
import { finalize } from "rxjs/operators";
import { DatosService } from "../../../service/servicio.service";
import { ReasignacionService } from './services/resumen-detalle.interface';
import { 
    ResumenReasignacion, 
    DetalleReasignacion, 
    FiltrosReasignacion, 
    DetalleLoteRequest 
} from './interfaces/resumen-detalle.interface';
import { exportarResumenExcel, exportarDetalleExcel } from './utils/excel-export';
import { formatearFecha, formatearFechaHora, obtenerDescripcionEstatus } from './utils/formaters';

@Component({
    standalone: true,
    selector: 'resumen-detalle-folio-component',
    templateUrl: './resumen-detalle-folio.component.html',
    styleUrl: 'resumen-detalle-folio.component.css',
    imports: [
        CommonModule,
        FormsModule,
        InputComponent,
        ButtonComponent,
        ToastComponent,
        LoadingSpinnerComponent
    ]
})
export class ResumenDetalleFolioComponent implements OnInit {
    // Estado de carga y toast
    cargando = signal<boolean>(false);
    exportando = signal<boolean>(false);
    toastVisible = signal<boolean>(false);
    toastTipo = signal<'success' | 'error'>('success');
    toastTitulo = signal<string>('');
    toastMensaje = signal<string>('');

    // Datos principales
    reasignaciones = signal<ResumenReasignacion[]>([]);
    detalles = signal<DetalleReasignacion[]>([]);

    // Filtros
    filtro = signal<string>('');
    fechaInicio = signal<string>('');
    fechaFin = signal<string>('');
    numeroLote = signal<string>('');
    filtroEstatus = signal<string>('');

    // Estado de la vista
    vistaActual = signal<'resumen' | 'detalle'>('resumen');
    loteSeleccionado = signal<number | null>(null);

    constructor(
        private reasignacionService: ReasignacionService,
        private datosService: DatosService
    ) { }

    ngOnInit(): void {
        this.cargarResumen();
    }

    // Computed para filtrar los datos del resumen
    get reasignacionesFiltradas() {
        const filtro = this.filtro().toLowerCase().trim();
        const datos = this.reasignaciones();

        if (!filtro) return datos;

        return datos.filter(item => {
            const fechaStr = formatearFecha(item.fecha);
            return (
                item.numero_lote.toString().includes(filtro) ||
                fechaStr.includes(filtro)
            );
        });
    }

    // Computed para filtrar los datos del detalle
    get detallesFiltrados() {
        const filtro = this.filtro().toLowerCase().trim();
        const filtroEstatus = this.filtroEstatus().toUpperCase().trim();
        const datos = this.detalles();

        return datos.filter(item => {
            // Primero verificamos el filtro de estatus
            if (filtroEstatus) {
                const estatusCompleto = item.estatus === 'RA' ? 'REASIGNADA' :
                    item.estatus === 'PR' ? 'POR REASIGNAR' : item.estatus;

                // Verificar si el filtro coincide con el código o con la descripción
                const coincideEstatus = item.estatus === filtroEstatus ||
                    estatusCompleto.includes(filtroEstatus);

                if (!coincideEstatus) return false;
            }

            // Luego aplicamos el filtro de búsqueda general
            if (!filtro) return true;

            return (
                item.caja_a_reasignar.toLowerCase().includes(filtro) ||
                item.caja_nueva.toLowerCase().includes(filtro) ||
                item.codigo_transferencia.toString().includes(filtro) ||
                item.estatus.toLowerCase().includes(filtro) ||
                item.clave_tienda_origen.toLowerCase().includes(filtro) ||
                item.destino_anterior.toString().includes(filtro) ||
                item.destino_nuevo.toString().includes(filtro) ||
                item.usuario_que_reasigno.toLowerCase().includes(filtro)
            );
        });
    }

    // Método para exportar a Excel con control de concurrencia
    async exportarExcel(): Promise<void> {
        // Verificar si ya hay una exportación en progreso
        if (this.exportando()) {
            return; // Simplemente ignorar si ya está exportando
        }

        const datosResumen = this.reasignacionesFiltradas;
        const datosDetalle = this.detallesFiltrados;
        const datos = this.vistaActual() === 'resumen' ? datosResumen : datosDetalle;

        if (datos.length === 0) {
            this.mostrarToast('error', 'Error', 'No hay datos para exportar');
            return;
        }

        // Activar el estado de exportación
        this.exportando.set(true);

        try {
            // Dar tiempo al navegador para renderizar el spinner
            await new Promise(resolve => setTimeout(resolve, 50));

            // Exportar según la vista actual
            if (this.vistaActual() === 'resumen') {
                exportarResumenExcel(datosResumen);
            } else {
                exportarDetalleExcel(datosDetalle, this.loteSeleccionado());
            }

        } catch (error) {
            console.error('Error al exportar:', error);
            this.mostrarToast('error', 'Error', 'Ocurrió un error al exportar los datos');
        } finally {
            // Desactivar el estado de exportación después de un breve delay
            await new Promise(resolve => setTimeout(resolve, 200));
            this.exportando.set(false);
        }
    }

    // Método para cargar el resumen
    cargarResumen(): void {
        this.cargando.set(true);
        this.toastVisible.set(false);

        const filtros: FiltrosReasignacion = {
            numero_lote: this.numeroLote() ? parseInt(this.numeroLote()) : null,
            fecha_inicio: this.fechaInicio() || null,
            fecha_fin: this.fechaFin() || null,
            usuario: this.datosService.usuarioSignal()
        };

        this.reasignacionService.obtenerResumen(filtros)
            .pipe(
                finalize(() => this.cargando.set(false))
            )
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.reasignaciones.set(response.data);
                        this.vistaActual.set('resumen');
                        this.filtro.set('');

                        if (response.data.length === 0) {
                            this.mostrarToast('info', 'Información', 'No se encontraron registros con los filtros especificados');
                        }
                    } else {
                        this.reasignaciones.set([]);
                        this.mostrarToast('error', 'Error', response.error || 'Ocurrió un error al cargar los datos');
                    }
                },
                error: (error) => {
                    console.error('Error al cargar resumen:', error);
                    this.reasignaciones.set([]);
                    this.mostrarToast('error', 'Error', 'No se pudo conectar con el servidor');
                }
            });
    }

    // Método para cargar el detalle de un lote específico
    cargarDetalle(numeroLote: number): void {
        this.cargando.set(true);
        this.toastVisible.set(false);

        const request: DetalleLoteRequest = {
            numero_lote: numeroLote,
            usuario: this.datosService.usuarioSignal()
        };

        this.reasignacionService.obtenerDetalle(request)
            .pipe(
                finalize(() => this.cargando.set(false))
            )
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.detalles.set(response.data);
                        this.vistaActual.set('detalle');
                        this.loteSeleccionado.set(numeroLote);
                        this.filtro.set('');
                        this.filtroEstatus.set('');

                        if (response.data.length === 0) {
                            this.mostrarToast('info', 'Información', `No se encontraron detalles para el lote ${numeroLote}`);
                        }
                    } else {
                        this.detalles.set([]);
                        this.mostrarToast('error', 'Error', response.error || 'Ocurrió un error al cargar el detalle');
                    }
                },
                error: (error) => {
                    console.error('Error al cargar detalle:', error);
                    this.detalles.set([]);
                    this.mostrarToast('error', 'Error', 'No se pudo conectar con el servidor');
                }
            });
    }

    // Método para abrir detalles
    openDetalles(numeroLote: number): void {
        this.cargarDetalle(numeroLote);
    }

    // Método para volver al resumen
    volverAlResumen(): void {
        this.vistaActual.set('resumen');
        this.filtro.set('');
        this.filtroEstatus.set('');
    }

    // Método para aplicar filtros avanzados
    aplicarFiltros(): void {
        this.cargarResumen();
    }

    // Método para limpiar filtros
    limpiarFiltros(): void {
        this.fechaInicio.set('');
        this.fechaFin.set('');
        this.numeroLote.set('');
        this.filtro.set('');
        this.cargarResumen();
    }

    // Método para limpiar el filtro de estatus
    limpiarFiltroEstatus(): void {
        this.filtroEstatus.set('');
    }

    // Métodos de formateo (se mantienen como wrappers para el template)
    formatearFecha(fecha: string): string {
        return formatearFecha(fecha);
    }

    formatearFechaHora(fecha: string | null): string {
        return formatearFechaHora(fecha);
    }

    obtenerDescripcionEstatus(estatus: string): string {
        return obtenerDescripcionEstatus(estatus);
    }

    // Método helper para mostrar toast
    private mostrarToast(tipo: 'success' | 'error' | 'info', titulo: string, mensaje: string): void {
        this.toastTipo.set(tipo === 'info' ? 'success' : tipo);
        this.toastTitulo.set(titulo);
        this.toastMensaje.set(mensaje);
        this.toastVisible.set(true);
    }

    // ── Atajos de teclado ───────────────────────────────────────────────────

    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'F2') {
            event.preventDefault();
            document.querySelector<HTMLInputElement>('.search-container input')?.focus();
        }

        // Atajo Ctrl + E para exportar
        if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
            event.preventDefault();
            this.exportarExcel();
        }
    }
}