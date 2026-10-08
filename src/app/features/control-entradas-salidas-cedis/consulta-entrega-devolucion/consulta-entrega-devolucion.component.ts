import {
    Component, signal, HostListener, OnInit, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { finalize } from 'rxjs/operators';

import { DatosService } from '../../../service/servicio.service';
import { ConsultaEntregaDevolucionService } from './services/consulta-entrega-devolucion.service';
import {
    ColumnaDinamica,
    ConsultaEntregaDevolucionRequest
} from './interfaces/consulta-entrega-devolucion.interface';
import { formatearCelda } from '../../cancelaciones/reagenda-citas/utils/formato-celda.util';
import {
    exportarConsultaEntregaDevolucionExcel,
    construirNombreArchivo
} from '../../cancelaciones/reagenda-citas/utils/excel-export';

@Component({
    standalone: true,
    selector: 'consulta-entrega-devolucion-component',
    templateUrl: './consulta-entrega-devolucion.component.html',
    styleUrl: './consulta-entrega-devolucion.component.css',
    imports: [
        CommonModule,
        FormsModule,
        InputComponent,
        ButtonComponent,
        ToastComponent,
        LoadingSpinnerComponent
    ]
})
export class ConsultaEntregaDevolucionComponent implements OnInit {

    // ── Estado UI ───────────────────────────────────────────────
    cargando = signal<boolean>(false);
    exportando = signal<boolean>(false);
    toastVisible = signal<boolean>(false);
    toastTipo = signal<'success' | 'error'>('success');
    toastTitulo = signal<string>('');
    toastMensaje = signal<string>('');

    // ── Datos dinámicos ─────────────────────────────────────────
    columnas = signal<ColumnaDinamica[]>([]);
    filas = signal<Record<string, any>[]>([]);

    // ── Filtros del formulario ──────────────────────────────────
    idProveedorInput = signal<number | null>(null);
    fechaInicioInput = signal<string>('');
    fechaFinInput = signal<string>('');

    // ── Filtro de búsqueda en tabla ─────────────────────────────
    filtro = signal<string>('');

    // ── Control de estado ───────────────────────────────────────
    cargadoInicialmente = signal<boolean>(false);

    // Guardamos los filtros con los que se hizo la última consulta
    // exitosa, para pasarlos a la exportación.
    private ultimosFiltros: {
        idProveedor: number | null;
        fechaInicio: string | null;
        fechaFin: string | null;
        usuario: string | null;
    } = { idProveedor: null, fechaInicio: null, fechaFin: null, usuario: null };

    private consultaService = inject(ConsultaEntregaDevolucionService);
    private datosService = inject(DatosService);

    ngOnInit(): void {
        this.consultar(true);
    }

    // ── Computed: filas filtradas ───────────────────────────────
    get filasFiltradas(): Record<string, any>[] {
        const filtro = this.filtro().toLowerCase().trim();
        const datos = this.filas();
        const cols = this.columnas();

        if (!filtro) return datos;

        return datos.filter(fila =>
            cols.some(col => {
                const valor = formatearCelda(fila[col.nombre], col.tipo);
                return valor.toLowerCase().includes(filtro);
            })
        );
    }

    consultar(esCargaInicial = false): void {
        const usuario = this.datosService.usuarioSignal();
        if (!usuario) {
            this.mostrarToast('error', 'Validación',
                'No se encontró el usuario en sesión');
            this.cargadoInicialmente.set(true);
            return;
        }

        let idProveedor: number | null = null;
        let fechaInicio: string | null = null;
        let fechaFin: string | null = null;

        if (!esCargaInicial) {
            // id_proveedor opcional
            const idProv = this.idProveedorInput();
            if (idProv !== null && idProv !== undefined) {
                if (typeof idProv !== 'number' || isNaN(idProv)) {
                    this.mostrarToast('error', 'Validación',
                        'El ID de proveedor debe ser numérico');
                    return;
                }
                idProveedor = idProv;
            }
            fechaInicio = this.fechaInicioInput()
                ? new Date(this.fechaInicioInput()).toISOString()
                : null;
            fechaFin = this.fechaFinInput()
                ? new Date(this.fechaFinInput()).toISOString()
                : null;
        }

        const request: ConsultaEntregaDevolucionRequest = {
            id_proveedor: idProveedor,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            usuario: String(usuario)
        };

        this.ultimosFiltros = {
            idProveedor,
            fechaInicio: esCargaInicial ? null : this.fechaInicioInput() || null,
            fechaFin: esCargaInicial ? null : this.fechaFinInput() || null,
            usuario: String(usuario)
        };

        this.cargando.set(true);
        this.toastVisible.set(false);

        this.consultaService.obtenerResumen(request)
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: (response) => {
                    this.cargadoInicialmente.set(true);

                    if (response.success && response.data) {
                        this.columnas.set(response.data.columnas ?? []);
                        this.filas.set(response.data.filas ?? []);
                        this.filtro.set('');

                        if (response.data.filas.length === 0 && !esCargaInicial) {
                            this.mostrarToast('info', 'Información',
                                'No se encontraron registros con los filtros proporcionados');
                        }
                    } else {
                        this.columnas.set([]);
                        this.filas.set([]);
                        this.mostrarToast('error', 'Error',
                            response.error || 'Ocurrió un error al consultar el resumen');
                    }
                },
                error: (error) => {
                    console.error('Error al consultar entrega/devolución:', error);
                    this.cargadoInicialmente.set(true);
                    this.columnas.set([]);
                    this.filas.set([]);
                    this.mostrarToast('error', 'Error',
                        'No se pudo conectar con el servidor');
                }
            });
    }

    // ── Exportación a Excel ─────────────────────────────────────
    async exportarExcel(): Promise<void> {
        if (this.exportando()) return;

        const filas = this.filasFiltradas;
        const columnas = this.columnas();

        if (!filas.length || !columnas.length) {
            this.mostrarToast('error', 'Error', 'No hay datos para exportar');
            return;
        }

        this.exportando.set(true);

        try {
            await new Promise(r => setTimeout(r, 50));

            const nombreArchivo = construirNombreArchivo(
                this.ultimosFiltros.usuario,
                this.ultimosFiltros.fechaInicio,
                this.ultimosFiltros.fechaFin
            );

            exportarConsultaEntregaDevolucionExcel({
                columnas,
                filas,
                nombreArchivo,
                filtrosAplicados: this.ultimosFiltros
            });

            // this.mostrarToast('success', 'Exportación',
            //     'El archivo se descargó correctamente');
        } catch (error) {
            console.error('Error al exportar:', error);
            this.mostrarToast('error', 'Error',
                'Ocurrió un error al exportar los datos');
        } finally {
            await new Promise(r => setTimeout(r, 200));
            this.exportando.set(false);
        }
    }

    // ── Helpers de template ─────────────────────────────────────
    valorCelda(fila: Record<string, any>, col: ColumnaDinamica): string {
        return formatearCelda(fila[col.nombre], col.tipo);
    }

    // ── Limpieza ────────────────────────────────────────────────
    limpiarFormulario(): void {
        this.idProveedorInput.set(null);
        this.fechaInicioInput.set('');
        this.fechaFinInput.set('');
        this.filtro.set('');
        this.toastVisible.set(false);
        this.consultar(true);
    }

    limpiarFiltro(): void {
        this.filtro.set('');
    }

    // ── Toast ───────────────────────────────────────────────────
    private mostrarToast(
        tipo: 'success' | 'error' | 'info',
        titulo: string,
        mensaje: string
    ): void {
        this.toastTipo.set(tipo === 'info' ? 'success' : tipo);
        this.toastTitulo.set(titulo);
        this.toastMensaje.set(mensaje);
        this.toastVisible.set(true);
    }

    // ── Atajos de teclado ───────────────────────────────────────
    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'F2') {
            event.preventDefault();
            document.querySelector<HTMLInputElement>('.search-container input')?.focus();
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
            event.preventDefault();
            this.exportarExcel();
        }
    }
}