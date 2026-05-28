import {
  Component,
  input,
  output,
  signal,
  inject,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ITransportista,
  ITipoUnidad,
  IModificarTransportistaRequest,
} from '../../models/entrada-salida-transportista-caseta.model';

import {
  SelectComponent,
  ISelectOption
} from '../../../../../shared/components/select/select.component';

import { ButtonComponent }
  from '../../../../../shared/components/button/button.component';

import { InputComponent }
  from '../../../../../shared/components/input/input.component';

import {
  LoadingSpinnerComponent
} from '../../../../../shared/components/loading-spinner/loading-spinner.component';

import { ToastComponent } from '../../../../../shared/components/toast/toast.component';

import { TransportistaService }
  from '../../services/entrada-salida-transportista-caseta.service';

import { DatosService } from '../../../../../service/servicio.service';

@Component({
  selector: 'app-tabla-transportistas',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,

    ButtonComponent,
    InputComponent,
    SelectComponent,
    ToastComponent,

    LoadingSpinnerComponent
  ],

  templateUrl:
    './tabla-transportista.component.html',

  styleUrls: [
    './tabla-transportista.component.css'
  ]
})
export class TablaTransportistasComponent
  implements OnInit {

  // ─────────────────────────────────────────────
  // Inyección
  // ─────────────────────────────────────────────

  private transportistaService =
    inject(TransportistaService);

  private datosService = inject(DatosService);

  // ─────────────────────────────────────────────
  // Toast
  // ─────────────────────────────────────────────
  toast: {
    tipo: 'success' | 'error';
    titulo: string;
    mensaje: string;
  } | null = null;

  mostrarToast(
    tipo: 'success' | 'error',
    titulo: string,
    mensaje: string
  ): void {

    this.toast = null;

    setTimeout(() => {

      this.toast = {
        tipo,
        titulo,
        mensaje
      };

    });
  }

  // ─────────────────────────────────────────────
  // Inputs
  // ─────────────────────────────────────────────

  datos =
    input.required<ITransportista[]>();

  isLoading =
    input<boolean>(false);

  errorMsg =
    input<string>('');

  // ─────────────────────────────────────────────
  // Outputs
  // ─────────────────────────────────────────────

  entrada =
    output<{
      fila: ITransportista;
      index: number;
    }>();

  salida =
    output<ITransportista>();

  filaEditada =
    output<{
      index: number;
      datos: Partial<ITransportista>;
    }>();

  // ─────────────────────────────────────────────
  // Estado edición inline
  // ─────────────────────────────────────────────

  editingIndex =
    signal<number | null>(null);

  loadingEditIndex =
    signal<number | null>(null);

  editCache:
    Partial<ITransportista> = {};

  // ─────────────────────────────────────────────
  // Catálogo tipos unidad
  // ─────────────────────────────────────────────

  tiposUnidad: ITipoUnidad[] = [];

  tiposUnidadOptions:
    ISelectOption[] = [];

  // ─────────────────────────────────────────────
  // Init
  // ─────────────────────────────────────────────

  ngOnInit(): void {

    this.obtenerTiposUnidad();
  }

  // ─────────────────────────────────────────────
  // Obtener catálogo
  // ─────────────────────────────────────────────

  obtenerTiposUnidad(): void {

    this.transportistaService
      .obtenerTiposUnidad()
      .subscribe({

        next: (response) => {

          this.tiposUnidad = response;

          this.tiposUnidadOptions =
            response.map(item => ({
              label: item.tipo_unidad,
              value: item.id.toString()
            }));
        },

        error: (error) => {

          console.error(
            'Error tipos unidad',
            error
          );

          const mensaje =
            error?.error?.error_msg ??
            'No se pudieron cargar los tipos de unidad.';

          this.mostrarToast(
            'error',
            'Error de catálogo',
            mensaje
          );
        }
      });
  }

  // ─────────────────────────────────────────────
  // Editar fila
  // ─────────────────────────────────────────────

  editarFila(
    fila: ITransportista,
    index: number
  ): void {

    this.editingIndex.set(index);

    this.editCache = {

      empresa:
        fila.empresa,

      nombre:
        fila.nombre,

      paterno:
        fila.paterno,

      materno:
        fila.materno,

      curp_operador:
        fila.curp_operador,

      placas:
        fila.placas,

      tipo_unidad:
        fila.tipo_unidad,

      remolque:
        fila.remolque
    };
  }

  // ─────────────────────────────────────────────
  // Cambio tipo unidad
  // ─────────────────────────────────────────────

  onTipoUnidadChange(value: string): void {
    const tipoUnidad = this.tiposUnidad.find(
      t => t.id === Number(value)
    );

    this.editCache.tipo_unidad = Number(value);

    this.editCache.remolque = tipoUnidad?.usa_remolque === 1 ? 1 : 0;
  }

  // ─────────────────────────────────────────────
  // Cancelar edición
  // ─────────────────────────────────────────────

  cancelarEdicion(): void {

    this.editingIndex.set(null);

    this.editCache = {};
  }

  // ─────────────────────────────────────────────
  // Guardar fila
  // ─────────────────────────────────────────────

  guardarFila(
    fila: ITransportista,   // <-- agregar parámetro fila
    index: number
  ): void {

    if (
      !this.editCache.empresa?.trim() ||
      !this.editCache.nombre?.trim() ||
      !this.editCache.paterno?.trim() ||
      !this.editCache.materno?.trim() ||
      !this.editCache.curp_operador?.trim() ||
      !this.editCache.placas?.trim() ||
      !this.editCache.tipo_unidad
    ) {
      this.mostrarToast(
        'error',
        'Campos incompletos',
        'Todos los campos son obligatorios.'
      );
      return;
    }

    const confirmar = confirm('¿Desea guardar los cambios?');
    if (!confirmar) return;

    this.loadingEditIndex.set(index);

    const body: IModificarTransportistaRequest = {
      tipo_ingreso: fila.tipo_ingreso_id,
      registro: fila.id_cita,
      empresa: this.editCache.empresa!.trim(),
      curp_operador: this.editCache.curp_operador!.trim().toUpperCase(),
      nombre: this.editCache.nombre!.trim(),
      paterno: this.editCache.paterno!.trim(),
      materno: this.editCache.materno.trim() ?? '',
      placas: this.editCache.placas!.trim().toUpperCase(),
      unidad: this.editCache.tipo_unidad!,
      usuario: this.datosService.usuarioSignal()
    };

    this.transportistaService
      .modificarTransportista(body)
      .subscribe({

        next: (response) => {

          this.loadingEditIndex.set(null);

          if (response.error_id !== 0) {
            this.mostrarToast(
              'error',
              'Error al modificar',
              response.error_msg ?? 'Ocurrió un error inesperado.'
            );
            return;
          }

          this.filaEditada.emit({
            index,
            datos: { ...this.editCache }
          });

          this.cancelarEdicion();

          this.mostrarToast(
            'success',
            'Registro actualizado',
            'Los datos del transportista fueron modificados.'
          );
        },

        error: (err) => {

          this.loadingEditIndex.set(null);

          console.error(err);

          const msg =
            err?.error?.error_msg ??
            'Error de conexión al servidor.';

          this.mostrarToast('error', 'Error', msg);
        }
      });
  }

  // ─────────────────────────────────────────────
  // Entrada
  // ─────────────────────────────────────────────

  onEntrada(
    fila: ITransportista,
    index: number
  ): void {

    const confirmar = confirm(
      '¿Confirmar entrada del transportista?'
    );

    if (!confirmar) {
      return;
    }

    this.entrada.emit({
      fila,
      index
    });
  }

  // ─────────────────────────────────────────────
  // Salida
  // ─────────────────────────────────────────────

  onSalida(
    fila: ITransportista
  ): void {

    this.salida.emit(fila);
  }

  // ─────────────────────────────────────────────
  // Fecha
  // ─────────────────────────────────────────────

  formatFecha(
    fecha: string
  ): string {

    if (!fecha) {
      return '—';
    }

    return new Date(fecha)
      .toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
  }

  // ─────────────────────────────────────────────
  // Texto tipo unidad
  // ─────────────────────────────────────────────

  obtenerTextoTipoUnidad(
    tipo: number | string
  ): string {

    const unidad =
      this.tiposUnidad.find(
        t => t.id === Number(tipo)
      );

    return unidad?.tipo_unidad ??
      'Desconocido';
  }
}