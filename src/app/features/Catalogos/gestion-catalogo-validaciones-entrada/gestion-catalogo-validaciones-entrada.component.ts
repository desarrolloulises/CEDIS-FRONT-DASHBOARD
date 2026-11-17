import {
    Component, OnInit, signal, computed, inject, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
    TipoEntrada, TipoIngreso, Validacion, ModoModalTipoIngreso,
    DataDinamica
} from './Interfaces/gestion-catalogo-validaciones-entrada.interface';
import {
    GestionCatalogoValidacionesEntradaService
} from './Services/gestion-catalogo-validaciones-entrada.service';

import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

import { DatosService } from '../../../service/servicio.service';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';

type ToastTipo = 'success' | 'error';

@Component({
    selector: 'app-gestion-catalogo-validaciones-entrada',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        LoadingSpinnerComponent, ToastComponent, ButtonComponent,
        ModalComponent,
        IconButtonComponent
    ],
    templateUrl: './gestion-catalogo-validaciones-entrada.component.html',
    styleUrls: ['./gestion-catalogo-validaciones-entrada.component.scss']
})
export class GestionCatalogoValidacionesEntradaComponent implements OnInit {

    private catalogoService = inject(GestionCatalogoValidacionesEntradaService);
    private datoService = inject(DatosService);

    // Spinner / Toast 
    cargando = signal(false);
    toastVisible = signal(false);
    toastTipo = signal<ToastTipo>('success');
    toastTitulo = signal('');
    toastMensaje = signal('');

    // Nivel 1: Tipos de entrada (select)
    tiposEntrada = signal<TipoEntrada[]>([]);
    idTipoSeleccionado = signal<number | null>(null);
    seleccionTipo = computed<TipoEntrada | null>(() => {
        const id = this.idTipoSeleccionado();
        if (id == null) return null;
        return this.tiposEntrada().find(t => t.idTipoEntrada === id) ?? null;
    });

    /** El tipo seleccionado permite edición (1) o solo lectura (0). */
    esEditable = computed(() => this.seleccionTipo()?.tipoEntrada === 1);

    // Nivel 2: motivos de ingreso 
    tiposIngreso = signal<TipoIngreso[]>([]);
    seleccionTipoIngreso = signal<TipoIngreso | null>(null);

    // Nivel 3: validaciones 
    validaciones = signal<Validacion[]>([]);

    // Modal crear/editar tipo de ingreso 
    modalVisible = signal(false);
    modoModal = signal<ModoModalTipoIngreso>('crear');
    tipoIngresoEnEdicion = signal<TipoIngreso | null>(null);
    formDescripcion = signal('');
    guardando = signal(false);

    // Ciclo de vida  
    ngOnInit(): void {
        this.cargarTiposEntrada();
    }

    // 1. Tipos de entrada 
    private cargarTiposEntrada(): void {
        this.cargando.set(true);
        this.catalogoService.obtenerTiposEntrada({
            usuario: this.usuario()
        }).subscribe({
            next: res => {
                this.cargando.set(false);
                if (res.success && res.data) {
                    this.tiposEntrada.set(this.mapearTiposEntrada(res.data));
                } else {
                    this.tiposEntrada.set([]);
                    this.mostrarToast('error', 'Tipos de entrada', res.error || 'No se pudo obtener el catálogo');
                }
            },
            error: () => {
                this.cargando.set(false);
                this.tiposEntrada.set([]);
                this.mostrarToast('error', 'Tipos de entrada', 'Error de comunicación con el servidor');
            }
        });
    }

    private mapearTiposEntrada(data: DataDinamica): TipoEntrada[] {
        return data.filas.map(f => {
            const bandera = Number(f['Bandera']);
            return {
                idTipoEntrada: Number(f['Clave']),
                descripcionTipoEntrada: String(f['Descripcion'] ?? '').trim(),
                tipoEntrada: bandera === 1 ? 1 : 0
            };
        });
    }

    // 2. Cambio de tipo (select) 
    onCambioTipo(event: Event): void {
        const raw = (event.target as HTMLSelectElement).value;
        const id = raw === '' ? null : Number(raw);
        this.idTipoSeleccionado.set(isNaN(id as number) ? null : id);

        // Resetear niveles inferiores
        this.seleccionTipoIngreso.set(null);
        this.validaciones.set([]);
        this.tiposIngreso.set([]);

        if (id != null) {
            this.cargarTiposIngreso(id);
        }
    }

    // 3. Tipos de ingreso (motivos) 
    private cargarTiposIngreso(idTipoEntrada: number): void {
        this.cargando.set(true);
        this.catalogoService.obtenerMotivosIngreso({
            clvTipoEntrada: idTipoEntrada,
            usuario: this.usuario()
        }).subscribe({
            next: res => {
                this.cargando.set(false);
                if (res.success && res.data) {
                    this.tiposIngreso.set(this.mapearTiposIngreso(res.data));
                } else {
                    this.tiposIngreso.set([]);
                    this.mostrarToast('error', 'Tipos de ingreso', res.error || 'No se pudieron obtener los motivos');
                }
            },
            error: () => {
                this.cargando.set(false);
                this.tiposIngreso.set([]);
                this.mostrarToast('error', 'Tipos de ingreso', 'Error de comunicación con el servidor');
            }
        });
    }

    private mapearTiposIngreso(data: DataDinamica): TipoIngreso[] {
        return data.filas.map(f => ({
            clave: Number( String(f['Clave'] ?? '').trim()),
            descripcion: String(f['Descripcion'] ?? '').trim(),
            estatus: Number(f['Bandera']) === 1
        }));
    }

    // 4. Selección nivel 2 -> carga validaciones 
    seleccionarTipoIngreso(ti: TipoIngreso): void {
        this.seleccionTipoIngreso.set(ti);
        this.cargarValidaciones(ti.clave);
    }

    private cargarValidaciones(claveMotivo: number): void {
        const idTipo = this.idTipoSeleccionado();
        if (idTipo == null) return;

        this.cargando.set(true);
        this.catalogoService.obtenerValidacionesMotivoIngreso({
            clvTipoEntrada: idTipo,
            clvMotivoIngreso: claveMotivo,
            usuario: this.usuario()
        }).subscribe({
            next: res => {
                this.cargando.set(false);
                if (res.success && res.data) {
                    this.validaciones.set(this.mapearValidaciones(res.data));
                } else {
                    this.validaciones.set([]);
                    this.mostrarToast('error', 'Validaciones', res.error || 'No se pudieron obtener las validaciones');
                }
            },
            error: () => {
                this.cargando.set(false);
                this.validaciones.set([]);
                this.mostrarToast('error', 'Validaciones', 'Error de comunicación con el servidor');
            }
        });
    }

    private mapearValidaciones(data: DataDinamica): Validacion[] {
        return data.filas.map(f => ({
            clave: Number(f['lbl_claveV']),
            descripcion: String(f['lbl_DescripcionV'] ?? '').trim(),
            estatus: Number(f['EstatusV']) === 1
        }));
    }

    // 5. Estatus inline en nivel 2 (checkbox) 
    toggleEstatusTipoIngreso(ti: TipoIngreso, event: Event): void {
        if (!this.esEditable()) {
            (event.target as HTMLInputElement).checked = ti.estatus;
            return;
        }

        const nuevo = (event.target as HTMLInputElement).checked;
        const estatusPrevio = ti.estatus;

        ti.estatus = nuevo;
        this.tiposIngreso.update(list =>
            list.map(v => v.clave === ti.clave ? { ...v, estatus: nuevo } : v)
        );

        this.catalogoService.actualizarMotivoIngreso({
            clv: ti.clave,
            descripcion: ti.descripcion,
            estatus: nuevo,
            usuario: this.usuario()
        }).subscribe({
            next: res => {
                if (res.success && res.data?.actualizado) {
                    // this.mostrarToast('success', 'Estatus', 'Estatus actualizado');
                    this.recargarTiposIngreso();
                } else {
                    this.revertirEstatusTipoIngreso(ti.clave, estatusPrevio);
                    this.mostrarToast('error', 'Estatus', res.error || 'No se pudo actualizar');
                }
            },
            error: () => {
                this.revertirEstatusTipoIngreso(ti.clave, estatusPrevio);
                this.mostrarToast('error', 'Estatus', 'Error de comunicación con el servidor');
            }
        });
    }

    private revertirEstatusTipoIngreso(clave: number, estatusPrevio: boolean): void {
        this.tiposIngreso.update(list =>
            list.map(v => v.clave === clave ? { ...v, estatus: estatusPrevio } : v)
        );
    }

    // 6. Modal crear / editar tipo de ingreso
    abrirModalCrear(): void {
        if (!this.esEditable()) return;
        this.modoModal.set('crear');
        this.tipoIngresoEnEdicion.set(null);
        this.formDescripcion.set('');
        this.modalVisible.set(true);
    }

    abrirModalEditar(ti: TipoIngreso): void {
        if (!this.esEditable()) return;
        this.modoModal.set('editar');
        this.tipoIngresoEnEdicion.set(ti);
        this.formDescripcion.set(ti.descripcion);
        this.modalVisible.set(true);
    }

    cerrarModal(): void {
        if (this.guardando()) return;
        this.modalVisible.set(false);
        this.tipoIngresoEnEdicion.set(null);
        this.formDescripcion.set('');
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

        const idTipo = this.idTipoSeleccionado();
        if (idTipo == null) {
            this.mostrarToast('error', 'Tipo de ingreso', 'Selecciona un tipo de entrada');
            return;
        }

        if (this.modoModal() === 'editar') {
            this.actualizarTipoIngreso(desc);
        } else {
            this.crearTipoIngreso(idTipo, desc);
        }
    }

    private crearTipoIngreso(idTipoEntrada: number, descripcion: string): void {
        this.guardando.set(true);

        this.catalogoService.agregarMotivoIngreso({
            clvTipoEntrada: idTipoEntrada,
            descripcion,
            usuario: this.usuario()
        }).subscribe({
            next: res => {
                this.guardando.set(false);
                if (res.success && res.data?.creado) {
                    this.cerrarModal();
                    // this.mostrarToast('success', 'Alta', 'Tipo de ingreso agregado');
                    this.recargarTiposIngreso();
                } else {
                    this.mostrarToast('error', 'Alta', res.error || 'No se pudo agregar');
                }
            },
            error: () => {
                this.guardando.set(false);
                this.mostrarToast('error', 'Alta', 'Error de comunicación con el servidor');
            }
        });
    }

    private actualizarTipoIngreso(nuevaDescripcion: string): void {
        const enEdicion = this.tipoIngresoEnEdicion();
        if (!enEdicion) {
            this.cerrarModal();
            return;
        }

        this.guardando.set(true);

        this.catalogoService.actualizarMotivoIngreso({
            clv: enEdicion.clave,
            descripcion: nuevaDescripcion,
            estatus: enEdicion.estatus,
            usuario: this.usuario()
        }).subscribe({
            next: res => {
                this.guardando.set(false);
                if (res.success && res.data?.actualizado) {
                    this.cerrarModal();
                    // this.mostrarToast('success', 'Edición', 'Tipo de ingreso actualizado');
                    this.recargarTiposIngreso();
                } else {
                    this.mostrarToast('error', 'Edición', res.error || 'No se pudo actualizar');
                }
            },
            error: () => {
                this.guardando.set(false);
                this.mostrarToast('error', 'Edición', 'Error de comunicación con el servidor');
            }
        });
    }

    // Recarga la lista de motivos conservando la selección por clave. 
    private recargarTiposIngreso(): void {
        const idTipo = this.idTipoSeleccionado();
        if (idTipo == null) return;

        const claveSeleccionada = this.seleccionTipoIngreso()?.clave ?? null;

        this.catalogoService.obtenerMotivosIngreso({
            clvTipoEntrada: idTipo,
            usuario: this.usuario()
        }).subscribe({
            next: res => {
                if (!res.success || !res.data) return;
                const nuevos = this.mapearTiposIngreso(res.data);
                this.tiposIngreso.set(nuevos);

                if (claveSeleccionada != null) {
                    const reencontrado = nuevos.find(v => v.clave === claveSeleccionada) ?? null;
                    this.seleccionTipoIngreso.set(reencontrado);
                    if (reencontrado) {
                        this.cargarValidaciones(reencontrado.clave);
                    } else {
                        this.validaciones.set([]);
                    }
                }
            }
        });
    }

    // 7. Estatus de validaciones (nivel 3) 
    toggleEstatusValidacion(v: Validacion, event: Event): void {
        const nuevo = (event.target as HTMLInputElement).checked;
        const previo = v.estatus;
        const idTipo = this.idTipoSeleccionado();
        const motivo = this.seleccionTipoIngreso();

        if (idTipo == null || motivo == null) {
            (event.target as HTMLInputElement).checked = previo;
            return;
        }

        v.estatus = nuevo;
        this.validaciones.update(list =>
            list.map(item => item.clave === v.clave ? { ...item, estatus: nuevo } : item)
        );

        this.catalogoService.actualizarEstatusValidacion({
            clvTipoEntrada: idTipo,
            clvMotivoIngreso: motivo.clave,
            clvValidacion: v.clave,
            estatus: nuevo,
            usuario: this.usuario()
        }).subscribe({
            next: res => {
                if (res.success && res.data?.actualizado) {
                    // this.mostrarToast('success', 'Validación', 'Estatus actualizado');
                } else {
                    this.revertirEstatusValidacion(v.clave, previo);
                    this.mostrarToast('error', 'Validación', res.error || 'No se pudo actualizar');
                }
            },
            error: () => {
                this.revertirEstatusValidacion(v.clave, previo);
                this.mostrarToast('error', 'Validación', 'Error de comunicación con el servidor');
            }
        });
    }

    private revertirEstatusValidacion(clave: number, estatusPrevio: boolean): void {
        this.validaciones.update(list =>
            list.map(item => item.clave === clave ? { ...item, estatus: estatusPrevio } : item)
        );
    }

    // Utilidades
    esTipoIngresoSeleccionado(ti: TipoIngreso): boolean {
        return this.seleccionTipoIngreso()?.clave === ti.clave;
    }

    private usuario(): number {
        return Number(this.datoService.usuarioSignal());
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
        if (e.key === 'Escape' && this.modalVisible() && !this.guardando()) {
            this.cerrarModal();
        }
    }
}