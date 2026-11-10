import {
    Component, OnInit, signal, computed, inject, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
    TipoEntrada, TipoIngreso, Validacion, ModoModalTipoIngreso
} from './Interfaces/gestion-catalogo-validaciones-entrada.interface';
import {
    MOCK_TIPOS_ENTRADA, MOCK_TIPOS_INGRESO, MOCK_VALIDACIONES
} from './Services/gestion-catalogo-validaciones-entrada.service';

import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

type ToastTipo = 'success' | 'error';

@Component({
    selector: 'app-gestion-catalogo-validaciones-entrada',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        LoadingSpinnerComponent, ToastComponent, ButtonComponent,
        ModalComponent
    ],
    templateUrl: './gestion-catalogo-validaciones-entrada.component.html',
    styleUrls: ['./gestion-catalogo-validaciones-entrada.component.scss']
})
export class GestionCatalogoValidacionesEntradaComponent implements OnInit {

    // ── Spinner / Toast ─────────────────────────────────────────────
    cargando = signal(false);
    toastVisible = signal(false);
    toastTipo = signal<ToastTipo>('success');
    toastTitulo = signal('');
    toastMensaje = signal('');

    // ── Nivel 1: tipos de entrada (select) ─────────────────────────
    tiposEntrada = signal<TipoEntrada[]>([]);
    idTipoSeleccionado = signal<number | null>(null);
    seleccionTipo = computed<TipoEntrada | null>(() => {
        const id = this.idTipoSeleccionado();
        if (id == null) return null;
        return this.tiposEntrada().find(t => t.idTipoEntrada === id) ?? null;
    });

    /** El tipo seleccionado permite edición (1) o solo lectura (0). */
    esEditable = computed(() => this.seleccionTipo()?.tipoEntrada === 1);

    // ── Nivel 2: tipos de ingreso ──────────────────────────────────
    tiposIngreso = signal<TipoIngreso[]>([]);
    seleccionTipoIngreso = signal<TipoIngreso | null>(null);

    // ── Nivel 3: validaciones del tipo de ingreso ─────────────────
    validaciones = signal<Validacion[]>([]);

    // ── Modal editar/crear tipo de ingreso ────────────────────────
    modalVisible = signal(false);
    modoModal = signal<ModoModalTipoIngreso>('crear');
    /** Fila que se está editando (solo en modo 'editar'). */
    tipoIngresoEnEdicion = signal<TipoIngreso | null>(null);

    formDescripcion = signal('');
    /** Solo se usa en modo 'crear'. En 'editar' el estatus se controla desde la fila. */
    formEstatus = signal(true);
    guardando = signal(false);

    // ── Ciclo de vida ─────────────────────────────────────────────
    ngOnInit(): void {
        this.cargarTiposEntrada();
    }

    // ── 1. Carga inicial (mock) ───────────────────────────────────
    // TODO: API → reemplazar por servicio HTTP.
    private cargarTiposEntrada(): void {
        this.cargando.set(true);
        setTimeout(() => {
            this.tiposEntrada.set([...MOCK_TIPOS_ENTRADA]);
            this.cargando.set(false);
        }, 200);
    }

    // ── 2. Cambio de tipo (select) ────────────────────────────────
    onCambioTipo(event: Event): void {
        const raw = (event.target as HTMLSelectElement).value;
        const id = raw === '' ? null : Number(raw);
        this.idTipoSeleccionado.set(isNaN(id as number) ? null : id);

        // Resetear niveles inferiores
        this.seleccionTipoIngreso.set(null);
        this.validaciones.set([]);

        if (id != null) {
            this.cargarTiposIngreso(id);
        } else {
            this.tiposIngreso.set([]);
        }
    }

    // TODO: API → reemplazar por servicio HTTP.
    private cargarTiposIngreso(idTipoEntrada: number): void {
        this.cargando.set(true);
        setTimeout(() => {
            const data = MOCK_TIPOS_INGRESO[idTipoEntrada] ?? [];
            this.tiposIngreso.set(data.map(v => ({ ...v })));
            this.cargando.set(false);
        }, 150);
    }

    // ── 3. Selección nivel 2 → carga validaciones ─────────────────
    seleccionarTipoIngreso(ti: TipoIngreso): void {
        this.seleccionTipoIngreso.set(ti);
        this.cargarValidaciones(ti.clave);
    }

    // TODO: API → reemplazar por servicio HTTP.
    private cargarValidaciones(claveTipoIngreso: number): void {
        this.cargando.set(true);
        setTimeout(() => {
            const data = MOCK_VALIDACIONES[claveTipoIngreso] ?? [];
            this.validaciones.set(data.map(v => ({ ...v })));
            this.cargando.set(false);
        }, 150);
    }

    // ── 4. Estatus inline en nivel 2 (checkbox) ───────────────────
    toggleEstatusTipoIngreso(ti: TipoIngreso, event: Event): void {
        if (!this.esEditable()) {
            const input = event.target as HTMLInputElement;
            input.checked = ti.estatus;
            return;
        }
        const nuevo = (event.target as HTMLInputElement).checked;
        ti.estatus = nuevo;
        this.tiposIngreso.update(list =>
            list.map(v => v.clave === ti.clave ? { ...v, estatus: nuevo } : v)
        );
        // TODO: API → persistir cambio de estatus
    }

    // ── 5. Modal crear / editar tipo de ingreso ───────────────────
    abrirModalCrear(): void {
        if (!this.esEditable()) return;
        this.modoModal.set('crear');
        this.tipoIngresoEnEdicion.set(null);
        this.formDescripcion.set('');
        this.formEstatus.set(true);          // ← nuevo tipo nace activo por defecto
        this.modalVisible.set(true);
    }

    abrirModalEditar(ti: TipoIngreso): void {
        if (!this.esEditable()) return;
        this.modoModal.set('editar');
        this.tipoIngresoEnEdicion.set(ti);
        this.formDescripcion.set(ti.descripcion);
        // formEstatus se ignora en modo 'editar'
        this.modalVisible.set(true);
    }

    cerrarModal(): void {
        if (this.guardando()) return;
        this.modalVisible.set(false);
        this.tipoIngresoEnEdicion.set(null);
        this.formDescripcion.set('');
        this.formEstatus.set(true);
    }

    onDescripcionChange(valor: string): void {
        this.formDescripcion.set((valor ?? '').slice(0, 150));
    }

    guardarTipoIngreso(): void {
        const desc = this.formDescripcion().trim();
        if (!desc) {
            this.mostrarToast('error', 'Tipo de ingreso', 'La descripción es obligatoria');
            return;
        }

        this.guardando.set(true);

        if (this.modoModal() === 'editar') {
            const enEdicion = this.tipoIngresoEnEdicion();
            if (!enEdicion) {
                this.guardando.set(false);
                this.cerrarModal();
                return;
            }
            // El estatus NO se toca al editar; se gestiona desde el checkbox de la fila.
            this.tiposIngreso.update(list =>
                list.map(v =>
                    v.clave === enEdicion.clave
                        ? { ...v, descripcion: desc }
                        : v
                )
            );
            // TODO: API → persistir edición (solo descripción)
            this.guardando.set(false);
            this.cerrarModal();
            this.mostrarToast('success', 'Edición', 'Tipo de ingreso actualizado');
        } else {
            const existentes = this.tiposIngreso();
            const nuevaClave = existentes.length
                ? Math.max(...existentes.map(v => v.clave)) + 1
                : 1;
            // Al crear, el estatus viene del formulario.
            const nuevo: TipoIngreso = {
                clave: nuevaClave,
                descripcion: desc,
                estatus: this.formEstatus()
            };
            this.tiposIngreso.update(list => [...list, nuevo]);
            // TODO: API → persistir alta (descripción + estatus)
            this.guardando.set(false);
            this.cerrarModal();
            this.mostrarToast('success', 'Alta', 'Tipo de ingreso agregado');
        }
    }

    // ── 6. Estatus de validaciones (nivel 3): solo checkbox ───────
    toggleEstatusValidacion(v: Validacion, event: Event): void {
        const nuevo = (event.target as HTMLInputElement).checked;
        v.estatus = nuevo;
        this.validaciones.update(list =>
            list.map(item => item.clave === v.clave ? { ...item, estatus: nuevo } : item)
        );
        // TODO: API → persistir cambio de estatus
    }

    // ── Utilidades ────────────────────────────────────────────────
    esTipoIngresoSeleccionado(ti: TipoIngreso): boolean {
        return this.seleccionTipoIngreso()?.clave === ti.clave;
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
        if (e.key === 'Escape' && this.modalVisible() && !this.guardando()) {
            this.cerrarModal();
        }
    }
}
