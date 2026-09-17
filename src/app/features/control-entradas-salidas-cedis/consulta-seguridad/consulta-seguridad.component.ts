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
import { ConsultaSeguridadService } from './services/consulta-seguridad.service';
import {
    ColumnaDinamica,
    ConsultaSeguridadRequest
} from './interfaces/consulta-seguridad.interface';
import { formatearCelda } from './utils/formato-celda.util';
import {
    exportarConsultaSeguridadExcel,
    construirNombreArchivo
} from './utils/excel-export';

@Component({
    standalone: true,
    selector: 'consulta-seguridad-component',
    templateUrl: './consulta-seguridad.component.html',
    styleUrl: './consulta-seguridad.component.css',
    imports: [
        CommonModule,
        FormsModule,
        InputComponent,
        ButtonComponent,
        ToastComponent,
        LoadingSpinnerComponent
    ]
})
export class ConsultaSeguridadComponent implements OnInit {

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
    fechaInicioInput = signal<string | null>(null);
    fechaFinInput = signal<string | null>(null);

    // ── Filtro de búsqueda en tabla ─────────────────────────────
    filtro = signal<string>('');

    // ── Control de estado ───────────────────────────────────────
    cargadoInicialmente = signal<boolean>(false);

    private ultimosFiltros: {
        fechaInicio: string | null;
        fechaFin: string | null;
        usuario: string | null;
    } = { fechaInicio: null, fechaFin: null, usuario: null };

    private consultaService = inject(ConsultaSeguridadService);
    private datosService = inject(DatosService);

    // ── Ciclo de vida ───────────────────────────────────────────
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

    // ── Consulta al endpoint ────────────────────────────────────
    consultar(esCargaInicial = false): void {
        const usuario = this.datosService.usuarioSignal();
        if (!usuario) {
            this.mostrarToast('error', 'Validación',
                'No se encontró el usuario en sesión');
            this.cargadoInicialmente.set(true);
            return;
        }

        let fechaInicio: string | null = null;
        let fechaFin: string | null = null;

        if (!esCargaInicial) {
            const fi = this.fechaInicioInput();
            const ff = this.fechaFinInput();

            fechaInicio = fi ? new Date(fi).toISOString() : null;
            fechaFin = ff ? new Date(ff).toISOString() : null;

            if (fi && ff && new Date(fi) > new Date(ff)) {
                this.mostrarToast('error', 'Validación',
                    'La fecha inicio no puede ser mayor que la fecha fin');
                return;
            }
        }

        const request: ConsultaSeguridadRequest = {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            usuario: String(usuario)
        };

        this.ultimosFiltros = {
            fechaInicio: esCargaInicial ? null : this.fechaInicioInput(),
            fechaFin: esCargaInicial ? null : this.fechaFinInput(),
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
                    console.error('Error al consultar seguridad:', error);
                    this.cargadoInicialmente.set(true);
                    this.columnas.set([]);
                    this.filas.set([]);
                    this.mostrarToast('error', 'Error',
                        'No se pudo conectar con el servidor');
                }
            });
    }

    // ── Helpers de template ─────────────────────────────────────
    valorCelda(fila: Record<string, any>, col: ColumnaDinamica): string {
        return formatearCelda(fila[col.nombre], col.tipo);
    }

    // ── Exportación ─────────────────────────────────────────────
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

            exportarConsultaSeguridadExcel({
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

    // ── Limpieza ────────────────────────────────────────────────
    limpiarFormulario(): void {
        this.fechaInicioInput.set(null);
        this.fechaFinInput.set(null);
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

    // ── Atajos ──────────────────────────────────────────────────
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