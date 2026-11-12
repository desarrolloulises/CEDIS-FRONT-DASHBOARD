import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DeshacerRechazoService } from './services/deshacer-rechazo.service';
import {
    ColumnaDinamica,
    FilaRechazoAsn,
    OpcionAutorizacion
} from './interfaces/deshacer-rechazo.interface';

import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';


import { DatosService } from '../../../service/servicio.service';

type ToastTipo = 'success' | 'error';

/**
 * Etiquetas amigables por POSICIÓN.
 * Se conocen las 5 columnas del endpoint; columnas nuevas usarán su `nombre`.
 */
const ETIQUETAS_POR_POSICION: string[] = [
    'ASN',
    'Proveedor',
    'Inspección',
    'Desrechazos',
    'Último rechazo'
];

@Component({
    selector: 'app-deshacer-rechazo',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        LoadingSpinnerComponent, ToastComponent, ButtonComponent, ModalComponent
    ],
    templateUrl: './deshacer-rechazo.component.html',
    styleUrls: ['./deshacer-rechazo.component.css']
})
export class DeshacerRechazoComponent implements OnInit {

    private rechazoService = inject(DeshacerRechazoService);
    private datoService = inject(DatosService);

    // ── Spinner / Toast ─────────────────────────────────────────────
    cargando = signal(false);
    toastVisible = signal(false);
    toastTipo = signal<ToastTipo>('success');
    toastTitulo = signal('');
    toastMensaje = signal('');

    // ── Filtros ─────────────────────────────────────────────────────
    fechaInicioInput = signal<string>('');
    fechaFinInput = signal<string>('');

    // ── Datos tabla ─────────────────────────────────────────────────
    columnas = signal<ColumnaDinamica[]>([]);
    filas = signal<FilaRechazoAsn[]>([]);
    filtro = signal('');
    /** Indica que ya se ejecutó al menos una consulta (aunque devolviera vacío). */
    consultado = signal(false);

    // ── Modal deshacer rechazo ─────────────────────────────────────
    modalVisible = signal(false);
    filaSeleccionada = signal<FilaRechazoAsn | null>(null);

    opcionesAutorizacion = signal<OpcionAutorizacion[]>([]);
    cargandoOpciones = signal(false);
    /** Cache: solo se carga el catálogo una vez por sesión del componente. */
    private opcionesCargadas = false;

    idAutorizacionSeleccionada = signal<number | null>(null);
    comentario = signal<string>('');
    enviando = signal(false);

    // ── Computed ────────────────────────────────────────────────────
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

    /** Fila seleccionada resumida para el header del modal. */
    asnSeleccionado = computed<number | null>(() => {
        const f = this.filaSeleccionada();
        if (!f) return null;
        const n = Number(f['ASN_Id']);
        return isNaN(n) ? null : n;
    });

    ngOnInit(): void {
        // No se consulta nada por defecto: la tabla inicia vacía.
    }

    // ── 1. Consultar lista de rechazos ─────────────────────────────
    consultar(): void {
        const inicio = this.fechaInicioInput();
        const fin = this.fechaFinInput();

        if (!inicio || !fin) {
            this.mostrarToast('error', 'Filtro', 'Debes especificar fecha inicial y fecha final');
            return;
        }
        if (inicio > fin) {
            this.mostrarToast('error', 'Filtro', 'La fecha inicial no puede ser mayor que la final');
            return;
        }

        this.cargando.set(true);

        this.rechazoService.consultarListaRechazosAsn({
            fechaInicial: inicio,
            fechaFinal: fin,
            usuario: Number(this.datoService.usuarioSignal())
        }).subscribe({
            next: res => {
                this.cargando.set(false);
                this.consultado.set(true);
                if (res.success && res.data) {
                    this.columnas.set(this.decorarColumnas(res.data.columnas));
                    this.filas.set(res.data.filas);
                } else {
                    this.columnas.set([]);
                    this.filas.set([]);
                    this.mostrarToast('error', 'Consulta', res.error || 'No se pudo consultar');
                }
            },
            error: () => {
                this.cargando.set(false);
                this.consultado.set(true);
                this.columnas.set([]);
                this.filas.set([]);
                this.mostrarToast('error', 'Consulta', 'Error de comunicación con el servidor');
            }
        });
    }

    limpiarFormulario(): void {
        this.fechaInicioInput.set('');
        this.fechaFinInput.set('');
        this.filtro.set('');
        this.columnas.set([]);
        this.filas.set([]);
        this.consultado.set(false);
    }

    onFiltroInput(event: Event): void {
        this.filtro.set((event.target as HTMLInputElement).value);
    }

    // ── 2. Selección de fila / modal ───────────────────────────────
    onRowClick(fila: FilaRechazoAsn): void {
        this.filaSeleccionada.set(fila);
        this.idAutorizacionSeleccionada.set(null);
        this.comentario.set('');
        this.modalVisible.set(true);

        if (!this.opcionesCargadas) {
            this.cargarOpcionesAutorizacion();
        }
    }

    onModalClose(): void {
        // No cerrar mientras se está enviando la petición
        if (this.enviando()) return;

        this.modalVisible.set(false);
        this.filaSeleccionada.set(null);
        this.idAutorizacionSeleccionada.set(null);
        this.comentario.set('');
    }

    cancelarModal(): void {
        this.onModalClose();
    }

    onComentarioChange(valor: string): void {
        this.comentario.set((valor ?? '').slice(0, 255));
    }

    private cargarOpcionesAutorizacion(): void {
        this.cargandoOpciones.set(true);
        this.rechazoService.obtenerCatalogoOpcionesAutorizacion({
            usuario: Number(this.datoService.usuarioSignal())
        }).subscribe({
            next: res => {
                this.cargandoOpciones.set(false);
                if (res.success && res.data) {
                    this.opcionesAutorizacion.set(res.data.opcionesAutorizacion);
                    this.opcionesCargadas = true;
                } else {
                    this.opcionesAutorizacion.set([]);
                    this.mostrarToast('error', 'Autorizaciones', res.error || 'No se pudo cargar el catálogo');
                }
            },
            error: () => {
                this.cargandoOpciones.set(false);
                this.opcionesAutorizacion.set([]);
                this.mostrarToast('error', 'Autorizaciones', 'Error de comunicación con el servidor');
            }
        });
    }

    // ── 3. Enviar deshacer rechazo ─────────────────────────────────
    enviarDeshacerRechazo(): void {
        const fila = this.filaSeleccionada();
        if (!fila) return;

        const asn = Number(fila['ASN_Id']);
        const idInspeccion = Number(fila['Inspeccion_Id']);
        const idAutorizacion = this.idAutorizacionSeleccionada();

        if (isNaN(asn) || isNaN(idInspeccion)) {
            this.mostrarToast('error', 'Deshacer rechazo', 'Datos de la fila incompletos');
            return;
        }
        if (idAutorizacion == null) {
            this.mostrarToast('error', 'Deshacer rechazo', 'Selecciona una autorización');
            return;
        }

        this.enviando.set(true);

        this.rechazoService.deshacerRechazoAsn({
            asn,
            idInspeccion,
            idAutorizacion,
            comentario: this.comentario().trim().slice(0, 255),
            usuario: Number(this.datoService.usuarioSignal())
        }).subscribe({
            next: res => {
                this.enviando.set(false);
                if (res.success && res.data?.seAplico) {
                    // Reset + cierre directo
                    this.modalVisible.set(false);
                    this.filaSeleccionada.set(null);
                    this.idAutorizacionSeleccionada.set(null);
                    this.comentario.set('');
                    // this.mostrarToast('success', 'Deshacer rechazo', `ASN ${asn} actualizado correctamente`);
                    this.consultar();
                } else {
                    this.mostrarToast('error', 'Deshacer rechazo', res.error || 'No se pudo aplicar');
                }
            },
            error: () => {
                this.enviando.set(false);
                this.mostrarToast('error', 'Deshacer rechazo', 'Error de comunicación con el servidor');
            }
        });
    }

    // ── Utilidades ────────────────────────────────────────────────
    etiquetaColumna(col: ColumnaDinamica): string {
        return col.etiqueta || col.nombre;
    }

    valorCelda(fila: FilaRechazoAsn, col: ColumnaDinamica): string {
        const v = fila[col.nombre];
        if (v == null) return '';

        if (col.tipo === 'DateTime' || col.tipo === 'Date') {
            return this.formatearFechaHora(v);
        }
        return String(v);
    }

    /** Marca la fila seleccionada actualmente. */
    esFilaSeleccionada(fila: FilaRechazoAsn): boolean {
        const sel = this.filaSeleccionada();
        if (!sel) return false;
        return sel === fila;
    }

    private decorarColumnas(columnas: ColumnaDinamica[]): ColumnaDinamica[] {
        return columnas.map((col, idx) => ({
            ...col,
            etiqueta: ETIQUETAS_POR_POSICION[idx] ?? col.nombre
        }));
    }

    private formatearFechaHora(valor: any): string {
        if (!valor) return '';
        const d = valor instanceof Date ? valor : new Date(valor);
        if (isNaN(d.getTime())) return String(valor);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        // return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
        return `${dd}/${mm}/${yyyy}`;
    }

    private mostrarToast(tipo: ToastTipo, titulo: string, mensaje: string): void {
        this.toastTipo.set(tipo);
        this.toastTitulo.set(titulo);
        this.toastMensaje.set(mensaje);
        this.toastVisible.set(true);
    }

    // ── Atajos ────────────────────────────────────────────────────
    @HostListener('window:keydown', ['$event'])
    onKeydown(e: KeyboardEvent): void {
        if (e.key === 'F2') {
            e.preventDefault();
            document.querySelector<HTMLInputElement>('.filter-input')?.focus();
        }
    }
}