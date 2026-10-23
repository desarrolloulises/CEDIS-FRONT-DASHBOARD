import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

import { DevolucionService } from './services/nota-devolucion.service';
import {
    ColumnaDinamica, FilaDevolucion
} from './interfaces/nota-devolucion.interface';

import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

import { DatosService } from '../../../service/servicio.service';

type ToastTipo = 'success' | 'error';

@Component({
    selector: 'app-asignacion-nota-devolucion',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        LoadingSpinnerComponent, ToastComponent, ButtonComponent
    ],
    templateUrl: './nota-devolucion.component.html',
    styleUrls: ['./nota-devolucion.component.scss']
})
export class AsignacionNotaDevolucionComponent implements OnInit {

    private devolucionService = inject(DevolucionService);
    private datoService = inject(DatosService);

    // Spinner / Toast 
    cargando = signal(false);
    toastVisible = signal(false);
    toastTipo = signal<ToastTipo>('success');
    toastTitulo = signal('');
    toastMensaje = signal('');

    //  Filtros 
    idProveedorInput = signal<number | null>(null);
    fechaInicioInput = signal<string>('');
    fechaFinInput = signal<string>('');

    //  Formulario inserción
    nuevoIdProveedor = signal<number | null>(null);
    nuevoFolioNota = signal<number | null>(null);

    // Datos tabla 
    columnas = signal<ColumnaDinamica[]>([]);
    filas = signal<FilaDevolucion[]>([]);
    filtro = signal('');
    cargadoInicialmente = signal(false);
    exportando = signal(false);

    //  Estatus en curso (folio → bool) 
    actualizandoFolio = signal<number | null>(null);

    //  Computed 
    filasFiltradas = computed(() => {
        const texto = this.filtro().trim().toLowerCase();
        const filas = this.filas();
        if (!texto) return filas;
        return filas.filter(fila =>
            this.columnas().some(col => {
                const v = fila[col.nombre];
                return v != null && String(v).toLowerCase().includes(texto);
            })
        );
    });

    /**
     * Nombre de la columna de estatus.
     * Se busca por nombre (case-insensitive) para no depender de la posición.
     */
    get columnaEstatus(): string {
        const cols = this.columnas();
        const estatus = cols.find(c => {
            const n = c.nombre.toLowerCase();
            return n === 'estatusnota' || n === 'estatus';
        });
        return estatus?.nombre ?? 'EstatusNota';
    }

    ngOnInit(): void {
        this.consultarInicial();
    }

    // 1. Consulta inicial (parámetros nulos) 
    private consultarInicial(): void {
        this.cargando.set(true);
        this.devolucionService.consultarDevoluciones({
            idProveedor: null,
            fechaInicio: null,
            fechaFin: null,
            usuario: this.datoService.usuarioSignal()
        }).subscribe({
            next: res => {
                this.cargando.set(false);
                this.cargadoInicialmente.set(true);
                if (res.success && res.data) {
                    this.columnas.set(res.data.columnas);
                    this.filas.set(res.data.filas);
                } else {
                    this.mostrarToast('error', 'Consulta', res.error || 'No se pudo consultar');
                }
            },
            error: () => {
                this.cargando.set(false);
                this.cargadoInicialmente.set(true);
                this.mostrarToast('error', 'Consulta', 'Error de comunicación con el servidor');
            }
        });
    }

    onFiltroInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.filtro.set(value);
    }

    // 2. Filtrar 
    consultar(): void {
        const inicio = this.fechaInicioInput();
        const fin = this.fechaFinInput();

        // Validación: ambas fechas o ninguna
        if ((inicio && !fin) || (!inicio && fin)) {
            this.mostrarToast('error', 'Filtro', 'Debes especificar fecha inicio y fecha fin');
            return;
        }
        if (inicio && fin && inicio > fin) {
            this.mostrarToast('error', 'Filtro', 'La fecha inicio no puede ser mayor que la fecha fin');
            return;
        }

        this.cargando.set(true);
        this.devolucionService.consultarDevoluciones({
            idProveedor: this.idProveedorInput(),
            fechaInicio: this.formatearFechaEnvio(inicio),
            fechaFin: this.formatearFechaEnvio(fin),
            usuario: this.datoService.usuarioSignal()
        }).subscribe({
            next: res => {
                this.cargando.set(false);
                if (res.success && res.data) {
                    this.columnas.set(res.data.columnas);
                    this.filas.set(res.data.filas);
                } else {
                    this.mostrarToast('error', 'Consulta', res.error || 'No se pudo consultar');
                }
            },
            error: () => {
                this.cargando.set(false);
                this.mostrarToast('error', 'Consulta', 'Error de comunicación con el servidor');
            }
        });
    }

    /**
     * Recarga el listado con los filtros actuales SIN re-validar ni mostrar
     * spinner global. Se usa tras actualizar el estatus, ya que ese endpoint
     * no devuelve el nuevo estado y el listado sí lo refleja.
     *
     * Devuelve un callback vía subscribe para que el llamador decida qué
     * hacer en éxito/error (p. ej. revertir el checkbox si falla).
     */
    private recargarListado(onSuccess: () => void, onError: () => void): void {
        const inicio = this.fechaInicioInput();
        const fin = this.fechaFinInput();

        this.devolucionService.consultarDevoluciones({
            idProveedor: this.idProveedorInput(),
            fechaInicio: this.formatearFechaEnvio(inicio),
            fechaFin: this.formatearFechaEnvio(fin),
            usuario: this.datoService.usuarioSignal()
        }).subscribe({
            next: res => {
                if (res.success && res.data) {
                    this.columnas.set(res.data.columnas);
                    this.filas.set(res.data.filas);
                    onSuccess();
                } else {
                    this.mostrarToast('error', 'Consulta', res.error || 'No se pudo consultar');
                    onError();
                }
            },
            error: () => {
                this.mostrarToast('error', 'Consulta', 'Error de comunicación con el servidor');
                onError();
            }
        });
    }

    limpiarFormulario(): void {
        this.idProveedorInput.set(null);
        this.fechaInicioInput.set('');
        this.fechaFinInput.set('');
        this.filtro.set('');
        this.consultarInicial();
    }

    // 3. Insertar registro (valida y luego agrega) 
    agregarRegistro(): void {
        const idProv = this.nuevoIdProveedor();
        const folio = this.nuevoFolioNota();

        if (idProv == null || folio == null || idProv <= 0 || folio <= 0) {
            this.mostrarToast('error', 'Registro', 'Captura un proveedor y folio válidos');
            return;
        }

        this.cargando.set(true);

        // 3.a Validación
        this.devolucionService.validarProveedorNota({
            idProveedor: idProv,
            folioNota: folio,
            usuario: this.datoService.usuarioSignal()
        }).subscribe({
            next: valRes => {
                if (!valRes.success || !valRes.data?.esValido) {
                    this.cargando.set(false);
                    this.mostrarToast('error', 'Validación', valRes.error || 'Nota no válida');
                    return;
                }
                // 3.b Agregar
                this.ejecutarAgregar(idProv, folio);
            },
            error: () => {
                this.cargando.set(false);
                this.mostrarToast('error', 'Validación', 'Error de comunicación con el servidor');
            }
        });
    }

    private ejecutarAgregar(idProv: number, folio: number): void {
        this.devolucionService.agregarDevolucion({
            idProveedor: idProv,
            folioNota: folio,
            usuario: this.datoService.usuarioSignal()
        }).subscribe({
            next: res => {
                this.cargando.set(false);

                if (!res.success || !res.data) {
                    this.mostrarToast('error', 'Registro', res.error || 'No se pudo agregar');
                    return;
                }

                const { columnas, filas } = res.data;

                if (columnas?.length) {
                    this.columnas.set(columnas);
                }
                if (filas?.length) {
                    this.filas.update(lista => [...lista, ...filas]);
                }

                this.nuevoIdProveedor.set(null);
                this.nuevoFolioNota.set(null);
                // this.mostrarToast('success', 'Registro', 'Devolución agregada correctamente');
            },
            error: () => {
                this.cargando.set(false);
                this.mostrarToast('error', 'Registro', 'Error de comunicación con el servidor');
            }
        });
    }

    // 4. Actualizar estatus con checkbox 
    onToggleEstatus(fila: FilaDevolucion, event: Event): void {
        const input = event.target as HTMLInputElement;
        const folio = this.obtenerFolio(fila);

        if (folio == null) {
            input.checked = false;
            return;
        }

        const colEst = this.columnaEstatus;
        const valorPrevio = Number(fila[colEst]) || 0;

        // Bloquea únicamente el checkbox de este folio
        this.actualizandoFolio.set(folio);

        this.devolucionService.actualizarEstatus({
            folioNota: folio,
            usuario: this.datoService.usuarioSignal()
        }).subscribe({
            next: res => {
                if (res.success && res.data?.esActualizado) {
                    // El endpoint de estatus NO devuelve el nuevo estado,
                    // pero el listado sí lo refleja: recargamos para obtenerlo.
                    this.recargarListado(
                        () => {
                            this.actualizandoFolio.set(null);
                            // this.mostrarToast('success', 'Estatus', `Folio ${folio} actualizado`);
                        },
                        () => {
                            // Recarga fallida: no sabemos el estado real.
                            // Revertimos el input al valor previo para mantener coherencia visual.
                            this.actualizandoFolio.set(null);
                            input.checked = valorPrevio === 1;
                        }
                    );
                } else {
                    // El backend no confirmó la actualización: revertimos el input nativo.
                    // (El modelo nunca cambió, así que [checked] sigue siendo válido.)
                    this.actualizandoFolio.set(null);
                    input.checked = valorPrevio === 1;
                    this.mostrarToast('error', 'Estatus', res.error || 'No se pudo actualizar');
                }
            },
            error: () => {
                this.actualizandoFolio.set(null);
                input.checked = valorPrevio === 1;
                this.mostrarToast('error', 'Estatus', 'Error de comunicación con el servidor');
            }
        });
    }

    estaActivo(fila: FilaDevolucion): boolean {
        const colEst = this.columnaEstatus;
        return Number(fila[colEst]) === 1;
    }

    estaActualizando(fila: FilaDevolucion): boolean {
        const folio = this.obtenerFolio(fila);
        return folio != null && this.actualizandoFolio() === folio;
    }

    // 5. Exportar 
    exportarExcel(): void {
        const filas = this.filasFiltradas();
        if (!filas.length) return;

        this.exportando.set(true);

        try {
            const cols = this.columnas();
            const colEst = this.columnaEstatus;

            const data = filas.map(fila => {
                const obj: Record<string, any> = {};
                cols.forEach(col => {
                    if (col.nombre === colEst) {
                        // Última columna (estatus): 0/1 → texto legible
                        obj[col.nombre] = Number(fila[col.nombre]) === 1
                            ? 'Generada'
                            : 'Sin generar';
                    } else {
                        obj[col.nombre] = this.valorCelda(fila, col);
                    }
                });
                return obj;
            });

            const ws = XLSX.utils.json_to_sheet(data);
            
            ws['!cols'] = cols.map(col => ({
                wch: col.nombre === colEst ? 16 : 14
            }));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Devoluciones');

            const fecha = new Date().toISOString().slice(0, 10);
            XLSX.writeFile(wb, `notas_devolucion_${fecha}.xlsx`);

            this.mostrarToast('success', 'Exportación', 'Archivo generado');
        } catch {
            this.mostrarToast('error', 'Exportación', 'No se pudo generar el archivo');
        } finally {
            this.exportando.set(false);
        }
    }

    // Utilidades 
    valorCelda(fila: FilaDevolucion, col: ColumnaDinamica): string {
        const v = fila[col.nombre];
        if (v == null) return '';

        if (col.tipo === 'DateTime' || col.tipo === 'Date') {
            return this.formatearFecha(v);
        }
        return String(v);
    }

    // Obtiene el folio de una fila sin importar el casing de la propiedad. 
    private obtenerFolio(fila: FilaDevolucion): number | null {
        const val = fila['Folio'] ?? fila['folioNota'] ?? fila['FolioNota'] ?? fila['folio'];
        const n = Number(val);
        return isNaN(n) ? null : n;
    }

    private formatearFecha(valor: any): string {
        if (!valor) return '';
        // Soporta "2026-10-22T00:00:00", "2026-10-22", Date
        const d = valor instanceof Date ? valor : new Date(valor);
        if (isNaN(d.getTime())) return String(valor);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    private formatearFechaEnvio(fechaISO: string): string | null {
        if (!fechaISO) return null;
        const [yyyy, mm, dd] = fechaISO.split('-');
        if (!yyyy || !mm || !dd) return null;
        return `${dd}-${mm}-${yyyy}`;
    }

    private mostrarToast(tipo: ToastTipo, titulo: string, mensaje: string): void {
        this.toastTipo.set(tipo);
        this.toastTitulo.set(titulo);
        this.toastMensaje.set(mensaje);
        this.toastVisible.set(true);
    }

    // Atajos 
    @HostListener('window:keydown', ['$event'])
    onKeydown(e: KeyboardEvent): void {
        if (e.key === 'F2') {
            e.preventDefault();
            document.querySelector<HTMLInputElement>('.filter-input')?.focus();
        }
        if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) {
            e.preventDefault();
            if (!this.exportando() && this.filasFiltradas().length) this.exportarExcel();
        }
    }
}