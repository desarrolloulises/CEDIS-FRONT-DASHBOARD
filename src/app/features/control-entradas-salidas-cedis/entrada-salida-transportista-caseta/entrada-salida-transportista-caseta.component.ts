import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  HostListener,
  ViewChild,
  ElementRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ITransportista } from './models/entrada-salida-transportista-caseta.model';
import { TransportistaService } from './services/entrada-salida-transportista-caseta.service';
import { DatosService } from '../../../service/servicio.service';

import { AgregarCitaTransportistaComponent } from './components/agregar-cita-transportista/agregar-cita-transportista.component';
import { TablaTransportistasComponent } from './components/tabla-transportista/tabla-transportista.component';
import { RegistroQrComponent } from './components/registro-qr/registro-qr.component';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-registro-transportista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    AgregarCitaTransportistaComponent,
    TablaTransportistasComponent,
    RegistroQrComponent,

    ButtonComponent,
    InputComponent,
    ModalComponent,
    LoadingSpinnerComponent,
    ToastComponent,
  ],
  templateUrl: './entrada-salida-transportista-caseta.component.html',
  styleUrls: ['./entrada-salida-transportista-caseta.component.css']
})
export class EntradaSalidaTransportistaCasetaComponent implements OnInit {

  // ─────────────────────────────
  // Services
  // ─────────────────────────────

  private svc = inject(TransportistaService);
  private datosService = inject(DatosService);

  // ─────────────────────────────
  // ViewChild
  // ─────────────────────────────

  @ViewChild('searchInput', { read: ElementRef })
  searchInput!: ElementRef;

  @ViewChild(RegistroQrComponent)
  registroQr!: RegistroQrComponent;

  // ─────────────────────────────
  // Estado general
  // ─────────────────────────────

  isLoading = signal(false);
  errorMsg = signal('');
  filtroBusqueda = signal('');

  // ─────────────────────────────
  // Toast
  // ─────────────────────────────

  toastVisible = signal(false);
  toastTipo = signal<'success' | 'error'>('success');
  toastTitulo = signal('');
  toastMensaje = signal('');

  // ─────────────────────────────
  // Formulario
  // ─────────────────────────────

  mostrarFormulario = signal(false);

  // ─────────────────────────────
  // Modal salida
  // ─────────────────────────────

  modalSalidaVisible = false;
  salidaSeleccionada: ITransportista | null = null;
  salidaIndex: number | null = null;
  saleSinCaja = false;
  loadingSalida = signal(false);

  // ─────────────────────────────
  // Datos tabla
  // ─────────────────────────────

  private datosRaw = signal<ITransportista[]>([]);

  tablaDatos = computed(() => {
    const filtro = this.filtroBusqueda().toLowerCase().trim();
    if (!filtro) return this.datosRaw();
    return this.datosRaw().filter(d =>
      d.tipo_ingreso.toLowerCase().includes(filtro) ||
      d.empresa.toLowerCase().includes(filtro) ||
      d.nombre.toLowerCase().includes(filtro) ||
      d.placas.toLowerCase().includes(filtro) ||
      d.curp_operador.toLowerCase().includes(filtro)
    );
  });

  totalRegistros = computed(() => this.datosRaw().length);
  totalFiltrados = computed(() => this.tablaDatos().length);

  // ─────────────────────────────
  // Init
  // ─────────────────────────────

  ngOnInit(): void {
    this.cargarDatos();
  }

  // ─────────────────────────────
  // F2 → buscar
  // ─────────────────────────────

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'F2') return;
    event.preventDefault();
    this.searchInput?.nativeElement?.querySelector('input')?.focus();
  }

  // ─────────────────────────────
  // Formulario
  // ─────────────────────────────

  abrirFormulario(): void {
    this.mostrarFormulario.set(true);
  }

  onCerrarFormulario(recargo: boolean): void {
    this.mostrarFormulario.set(false);
    if (recargo) this.cargarDatos();
  }

  // ─────────────────────────────
  // Cargar datos
  // ─────────────────────────────

  cargarDatos(): void {
    this.isLoading.set(true);
    this.errorMsg.set('');

    this.svc.getEntradas().subscribe({
      next: (data) => {
        this.datosRaw.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        const mensaje =
          err?.error?.error_msg ??
          'No se pudo conectar con el servidor.';

        this.errorMsg.set(mensaje);

        this.mostrarToastError(
          'Error de conexión',
          mensaje
        );
        this.isLoading.set(false);
      }
    });
  }

  // ─────────────────────────────
  // Fila editada
  // ─────────────────────────────

  onFilaEditada(evento: { index: number; datos: Partial<ITransportista> }): void {
    const fila = this.tablaDatos()[evento.index];
    const index = this.datosRaw().indexOf(fila);
    if (index === -1) return;

    const copia = [...this.datosRaw()];
    copia[index] = { ...copia[index], ...evento.datos };
    this.datosRaw.set(copia);
  }

  // ─────────────────────────────
  // Entrada
  // ─────────────────────────────

  onEntradaDesdeTabla(evento: {
    fila: ITransportista;
    index: number;
  }): void {

    const { fila } = evento;

    const index =
      this.datosRaw().indexOf(fila);

    if (index === -1) {
      return;
    }

    const body = {

      registro:
        fila.id_cita,

      caja: 0,

      usuario:
        this.datosService.usuarioSignal()
    };

    this.loadingSalida.set(true);

    this.svc.registrarEntrada(body)
      .subscribe({

        next: (response) => {

          this.loadingSalida.set(false);

          if (response.error_id !== 0) {

            this.mostrarToastError(
              'Error al registrar entrada',
              response.error_msg ??
              'No se pudo registrar entrada.'
            );

            return;
          }

          const copia =
            [...this.datosRaw()];

          copia[index] = {

            ...copia[index],

            entrada:
              new Date().toISOString()
          };

          this.datosRaw.set(copia);
        },

        error: (err) => {

          console.error(err);

          this.loadingSalida.set(false);

          this.mostrarToastError(
            'Error de conexión',
            err?.error?.error_msg ??
            'Error al registrar entrada.'
          );
        }
      });
  }

  // ─────────────────────────────
  // Salida
  // ─────────────────────────────

  onSalidaDesdeTabla(fila: ITransportista): void {
    this.salidaSeleccionada = fila;
    this.salidaIndex = this.datosRaw().indexOf(fila);
    this.saleSinCaja = false;
    this.modalSalidaVisible = true;
  }

  // ─────────────────────────────
  // Confirmar salida
  // ─────────────────────────────

  confirmarSalida(): void {

    if (
      this.salidaSeleccionada === null ||
      this.salidaIndex === null
    ) {
      return;
    }

    this.loadingSalida.set(true);

    const body = {

      registro:
        this.salidaSeleccionada.id_cita,

      caja:
        this.saleSinCaja ? 1 : 0,

      usuario:
        this.datosService.usuarioSignal()
    };

    this.svc.registrarSalida(body)
      .subscribe({

        next: (response) => {

          this.loadingSalida.set(false);

          if (response.error_id !== 0) {

            this.mostrarToastError(
              'Error al registrar salida',
              response.error_msg ??
              'No se pudo registrar salida.'
            );

            return;
          }

          const copia =
            [...this.datosRaw()];

          copia.splice(
            this.salidaIndex!,
            1
          );

          this.datosRaw.set(copia);

          this.mostrarToastSuccess(
            'Salida registrada',
            'La salida fue registrada correctamente.'
          );

          this.cerrarModalSalida();
        },

        error: (err) => {

          console.error(err);

          this.loadingSalida.set(false);

          this.mostrarToastError(
            'Error de conexión',
            err?.error?.error_msg ??
            'Error al registrar salida.'
          );
        }
      });
  }

  // ─────────────────────────────
  // Cerrar modal salida
  // ─────────────────────────────

  cerrarModalSalida(): void {
    if (this.loadingSalida()) return;
    this.modalSalidaVisible = false;
    this.salidaSeleccionada = null;
    this.salidaIndex = null;
    this.saleSinCaja = false;
  }

  // ─────────────────────────────
  // Toast helpers
  // ─────────────────────────────

  mostrarToastSuccess(
    titulo: string,
    mensaje: string
  ): void {

    this.toastTipo.set('success');
    this.toastTitulo.set(titulo);
    this.toastMensaje.set(mensaje);
    this.toastVisible.set(true);
  }

  mostrarToastError(
    titulo: string,
    mensaje: string
  ): void {

    this.toastTipo.set('error');
    this.toastTitulo.set(titulo);
    this.toastMensaje.set(mensaje);
    this.toastVisible.set(true);
  }

  cerrarToast(): void {
    this.toastVisible.set(false);
  }
}