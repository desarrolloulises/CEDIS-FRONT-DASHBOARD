import { Component, signal, computed, OnInit, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { InputComponent } from "../../../shared/components/input/input.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { ToastComponent } from "../../../shared/components/toast/toast.component";
import { LoadingSpinnerComponent } from "../../../shared/components/loading-spinner/loading-spinner.component";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { finalize } from "rxjs/operators";

// Interfaces para tipar las respuestas
interface ResumenReasignacion {
    fecha: string;
    numero_lote: number;
    tiendas: number;
    cajas_por_reasignar: number;
    cajas_reasignadas: number;
}

interface DetalleReasignacion {
    fecha: string;
    numero_lote: number;
    caja_a_reasignar: string;
    numero_de_ordenes: number;
    caja_nueva: string;
    codigo_transferencia: number;
    estatus: string;
    clave_tienda_origen: string;
    destino_anterior: number;
    destino_nuevo: number;
    fecha_reasignacion: string | null;
    usuario_que_reasigno: string;
}

interface ApiResponse<T> {
    success: boolean;
    error: string;
    code: string;
    data: T[];
}

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
    // URLs de los endpoints
    private readonly API_URL_RESUMEN = 'http://192.168.102.81:5242/cedis/consulta-reasignacion/obtener-resumen-reasignaciones';
    private readonly API_URL_DETALLE = 'http://192.168.102.81:5242/cedis/consulta-reasignacion/obtener-detalle-reasignaciones';
    private readonly USUARIO = '406991';

    // Estado de carga y toast
    cargando = signal<boolean>(false);
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

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.cargarResumen();
    }

    // Computed para filtrar los datos del resumen
    get reasignacionesFiltradas() {
        const filtro = this.filtro().toLowerCase().trim();
        const datos = this.reasignaciones();

        if (!filtro) return datos;

        return datos.filter(item => {
            const fechaStr = new Date(item.fecha).toLocaleDateString('es-MX');
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

    // Método para cargar el resumen
    cargarResumen(): void {
        this.cargando.set(true);
        this.toastVisible.set(false);

        const body = {
            numero_lote: this.numeroLote() ? parseInt(this.numeroLote()) : null,
            fecha_inicio: this.fechaInicio() || null,
            fecha_fin: this.fechaFin() || null,
            usuario: this.USUARIO
        };

        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': '*/*'
        });

        this.http.post<ApiResponse<ResumenReasignacion>>(this.API_URL_RESUMEN, body, { headers })
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

        const body = {
            numero_lote: numeroLote,
            usuario: this.USUARIO
        };

        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': '*/*'
        });

        this.http.post<ApiResponse<DetalleReasignacion>>(this.API_URL_DETALLE, body, { headers })
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
                        this.filtroEstatus.set(''); // Limpiar filtro de estatus al cargar nuevo lote

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
        this.filtroEstatus.set(''); // Limpiar filtro de estatus al volver
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

    // Método helper para mostrar toast
    private mostrarToast(tipo: 'success' | 'error' | 'info', titulo: string, mensaje: string): void {
        this.toastTipo.set(tipo === 'info' ? 'success' : tipo);
        this.toastTitulo.set(titulo);
        this.toastMensaje.set(mensaje);
        this.toastVisible.set(true);
    }

    // Método para formatear fecha
    formatearFecha(fecha: string): string {
        if (!fecha) return '';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    // Método para formatear fecha y hora
    formatearFechaHora(fecha: string | null): string {
        if (!fecha) return '—';
        const date = new Date(fecha);
        return date.toLocaleString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // Método para obtener la descripción completa del estatus
    obtenerDescripcionEstatus(estatus: string): string {
        switch (estatus) {
            case 'RA':
                return 'Reasignada';
            case 'PR':
                return 'Por Reasignar';
            default:
                return estatus;
        }
    }

    // ── Atajos de teclado ───────────────────────────────────────────────────

    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'F2') {
            event.preventDefault();
            document.querySelector<HTMLInputElement>('.search-container input')?.focus();
        }
    }
}