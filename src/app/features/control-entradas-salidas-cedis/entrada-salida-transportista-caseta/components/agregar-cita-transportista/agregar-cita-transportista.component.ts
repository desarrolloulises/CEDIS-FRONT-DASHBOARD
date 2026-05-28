import {
  Component,
  EventEmitter,
  Output,
  signal,
  inject,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import QRCode from 'qrcode';

import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';

import {
  SelectComponent,
  ISelectOption
} from '../../../../../shared/components/select/select.component';

import { ToastComponent } from '../../../../../shared/components/toast/toast.component';

import {
  ITipoIngreso, ITipoUnidad
} from '../../models/entrada-salida-transportista-caseta.model';

import { TransportistaService } from '../../services/entrada-salida-transportista-caseta.service';

import { DatosService }
  from '../../../../../service/servicio.service';

@Component({
  selector: 'app-agregar-cita-transportista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    ButtonComponent,
    InputComponent,
    ModalComponent,
    LoadingSpinnerComponent,
    SelectComponent,
    ToastComponent,
  ],
  templateUrl:
    './agregar-cita-transportista.component.html',

  styleUrls: [
    './agregar-cita-transportista.component.css'
  ]
})
export class AgregarCitaTransportistaComponent
  implements OnInit {

  // ─────────────────────────────
  // Inyección
  // ─────────────────────────────

  private transportistaService =
    inject(TransportistaService);

  private datosService =
    inject(DatosService);

  @Output()
  cerrar =
    new EventEmitter<boolean>();

  // ─────────────────────────────
  // Loading
  // ─────────────────────────────

  loadingCurp =
    signal(false);

  loadingGuardar =
    signal(false);

  loadingProveedor =
    signal(false);

  // ─────────────────────────────
  // Bloqueo de campos al consultar por curp
  // ─────────────────────────────
  camposCurpBloqueados =
    signal(false);

  // ─────────────────────────────
  // Toast
  // ─────────────────────────────

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

    this.toast = {
      tipo,
      titulo,
      mensaje
    };
  }

  // ─────────────────────────────
  // Modal CURP
  // ─────────────────────────────

  curpBusqueda = '';

  modalCurpVisible = false;

  // ─────────────────────────────
  // Tipos ingreso
  // ─────────────────────────────

  tiposIngreso: ITipoIngreso[] = [];

  tiposIngresoOptions:
    ISelectOption[] = [];

  // ─────────────────────────────
  // Tipos unidad
  // ─────────────────────────────

  tiposUnidad: ITipoUnidad[] = [];

  tiposUnidadOptions:
    ISelectOption[] = [];

  // ─────────────────────────────
  // Recursos impresión
  // ─────────────────────────────

  readonly imagenReverso =
    './logo.png';

  readonly logoFrontal =
    './logo_sm.png';

  readonly visitorBarImage =
    '/visitor_bar.png';

  // ─────────────────────────────
  // Formulario
  // ─────────────────────────────

  form = {
    tipo: '',
    idProveedor: '',
    razonSocial: '',

    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',

    curp: '',
    placas: '',

    tipoUnidad: '',
    imprimir: false
  };

  // ─────────────────────────────
  // ¿Es proveedor?
  // ─────────────────────────────

  get esProveedor(): boolean {

    const tipo =
      this.tiposIngreso.find(
        t => t.tipo === this.form.tipo
      );

    return tipo?.id === 2;
  }

  // ─────────────────────────────
  // Init
  // ─────────────────────────────

  ngOnInit(): void {

    this.obtenerTiposIngreso();
    this.obtenerTiposUnidad();
  }

  // ─────────────────────────────
  // Nombre completo
  // ─────────────────────────────

  get nombreCompleto(): string {

    return [
      this.form.nombre,
      this.form.apellidoPaterno,
      this.form.apellidoMaterno
    ]
      .filter(Boolean)
      .join(' ');
  }

  // ─────────────────────────────
  // Obtener tipos ingreso
  // ─────────────────────────────

  obtenerTiposIngreso(): void {

    this.transportistaService
      .obtenerTiposIngreso()
      .subscribe({

        next: (response: any) => {

          if (!Array.isArray(response)) {

            this.mostrarToast(
              'error',
              'Error',
              response?.error_msg ??
              'No se pudieron cargar los tipos de ingreso.'
            );

            return;
          }

          this.tiposIngreso = response;

          this.tiposIngresoOptions =
            response.map(item => ({
              label: item.tipo,
              value: item.tipo
            }));
        },

        error: (error) => {

          console.error(error);

          this.mostrarToast(
            'error',
            'Error',
            'No se pudieron cargar los tipos de ingreso.'
          );
        }
      });
  }

  // ─────────────────────────────
  // Obtener tipos de unidad
  // ─────────────────────────────
  obtenerTiposUnidad(): void {

    this.transportistaService
      .obtenerTiposUnidad()
      .subscribe({

        next: (response: any) => {

          if (!Array.isArray(response)) {

            this.mostrarToast(
              'error',
              'Error',
              response?.error_msg ??
              'No se pudieron cargar los tipos de unidad.'
            );

            return;
          }

          this.tiposUnidad = response;

          this.tiposUnidadOptions =
            response.map(item => ({
              label: item.tipo_unidad,
              value: item.id.toString()
            }));
        },

        error: (error) => {

          console.error(error);


          const msg = error?.error?.error_msg ?? 'No se pudo establecer comunicación con el servidor.';


          this.mostrarToast(
            'error',
            'Error',
            msg
          );
        }
      });
  }

  // ─────────────────────────────
  // Cambio tipo ingreso
  // ─────────────────────────────

  onTipoChange(value: string): void {

    this.form.tipo = value;

    if (!this.esProveedor) {

      this.form.idProveedor = '';

      this.form.razonSocial = '';
    }
  }

  // ─────────────────────────────
  // Cambio tipo unidad
  // ─────────────────────────────

  onTipoUnidadChange(value: string): void {

    this.form.tipoUnidad = value;

    const tipoUnidad =
      this.tiposUnidad.find(
        t => t.id === Number(value)
      );
  }

  // ─────────────────────────────
  // Buscar proveedor
  // ─────────────────────────────

  buscarProveedor(): void {

    const id = this.form.idProveedor.trim();

    if (!id) return;

    this.form.razonSocial = '';

    this.loadingProveedor.set(true);

    this.transportistaService
      .getProveedor(Number(id))
      .subscribe({

        next: (response: any) => {

          this.loadingProveedor.set(false);

          // ERROR CONTROLADO
          if (response?.error_id && response.error_id !== 0) {

            this.mostrarToast(
              'error',
              'Proveedor no encontrado',
              response.error_msg
            );

            return;
          }

          // ÉXITO
          this.form.razonSocial =
            response.razon_social;

          this.mostrarToast(
            'success',
            'Proveedor encontrado',
            response.razon_social
          );
        },

        error: (err) => {

          this.loadingProveedor.set(false);

          const msg =
            err?.error?.error_msg ??
            'No se pudo establecer comunicación con el servidor.';

          this.mostrarToast(
            'error',
            'Error',
            msg
          );
        }
      });
  }

  // ─────────────────────────────
  // Consultar CURP
  // ─────────────────────────────

  consultarCurp(): void {

    if (!this.curpBusqueda.trim()) {

      this.mostrarToast(
        'error',
        'Campo requerido',
        'Ingrese una CURP.'
      );

      return;
    }

    this.loadingCurp.set(true);

    this.transportistaService
      .getOperadorPorCurp(
        this.curpBusqueda.trim().toUpperCase()
      )
      .subscribe({

        next: (response: any) => {

          this.loadingCurp.set(false);

          // ERROR CONTROLADO
          if (response?.error_id && response.error_id !== 0) {

            this.mostrarToast(
              'error',
              'CURP no encontrada',
              response.error_msg
            );

            return;
          }

          // ÉXITO
          this.form.nombre =
            response.nombre;

          this.form.apellidoPaterno =
            response.paterno;

          this.form.apellidoMaterno =
            response.materno;

          this.form.curp =
            response.curp;

          this.camposCurpBloqueados.set(true);

          this.modalCurpVisible = false;

          this.mostrarToast(
            'success',
            'Operador encontrado',
            `${response.nombre} ${response.paterno} ${response.materno}`
          );
        },

        error: (err) => {

          this.loadingCurp.set(false);

          const msg =
            err?.error?.error_msg ??
            'No se pudo establecer comunicación con el servidor.';

          this.mostrarToast(
            'error',
            'Error',
            msg
          );
        }
      });
  }

  desbloquearCamposCurp(): void {

    this.camposCurpBloqueados.set(false);
  }

  // ─────────────────────────────
  // Guardar
  // ─────────────────────────────
  guardar(): void {

    // ─────────────────────────────
    // Validación campos base
    // ─────────────────────────────

    const camposBase =
      !this.form.tipo.trim() ||
      !this.form.razonSocial.trim() ||
      !this.form.nombre.trim() ||
      !this.form.apellidoPaterno.trim() ||
      !this.form.apellidoMaterno.trim() ||
      !this.form.curp.trim() ||
      !this.form.placas.trim() ||
      !this.form.tipoUnidad.trim();

    // ─────────────────────────────
    // Validación proveedor
    // ─────────────────────────────

    const faltaIdProveedor =
      this.esProveedor &&
      !this.form.idProveedor.trim();

    // ─────────────────────────────
    // Validación general
    // ─────────────────────────────

    if (
      camposBase ||
      faltaIdProveedor
    ) {

      this.mostrarToast(
        'error',
        'Campos incompletos',
        'Todos los campos son obligatorios.'
      );

      return;
    }

    // ─────────────────────────────
    // Buscar tipo ingreso seleccionado
    // ─────────────────────────────

    const tipoSeleccionado =
      this.tiposIngreso.find(
        t => t.tipo === this.form.tipo
      );

    if (!tipoSeleccionado) {

      this.mostrarToast(
        'error',
        'Tipo inválido',
        'Seleccione un tipo de ingreso válido.'
      );

      return;
    }

    // ─────────────────────────────
    // Confirmación
    // ─────────────────────────────

    const confirmar = confirm(
      '¿Confirmar alta de cita transportista?'
    );

    if (!confirmar) {
      return;
    }

    // ─────────────────────────────
    // Activar loading
    // ─────────────────────────────

    this.loadingGuardar.set(true);

    // ─────────────────────────────
    // Body request
    // ─────────────────────────────

    const body = {

      tipo_ingreso:
        tipoSeleccionado.id,

      empresa:
        this.form.razonSocial.trim(),

      curp_operador:
        this.form.curp.trim().toUpperCase(),

      nombre:
        this.form.nombre.trim(),

      paterno:
        this.form.apellidoPaterno.trim(),

      materno:
        this.form.apellidoMaterno.trim(),

      placas:
        this.form.placas.trim().toUpperCase(),

      unidad:
        Number(this.form.tipoUnidad),

      usuario:
        this.datosService.usuarioSignal()
    };

    // ─────────────────────────────
    // Validar CURP antes del alta
    // ─────────────────────────────

    const validarBody = {

      curp_operador:
        this.form.curp.trim().toUpperCase(),

      nombre:
        this.form.nombre.trim(),

      paterno:
        this.form.apellidoPaterno.trim(),

      materno:
        this.form.apellidoMaterno.trim(),

      usuario:
        this.datosService.usuarioSignal()
    };

    this.transportistaService
      .validarCurp(validarBody)
      .subscribe({

        next: (validacion: any) => {

          // ERROR VALIDACIÓN CURP
          if (validacion.error_id !== 0) {

            this.loadingGuardar.set(false);

            this.mostrarToast(
              'error',
              'CURP inválida',
              validacion.error_msg ??
              'La CURP no coincide con el operador.'
            );

            return;
          }

          // CURP OK → CONTINUAR ALTA

          this.transportistaService
            .altaTransportista(body)
            .subscribe({

              next: async (response: any) => {

                if (response.error_id !== 0) {

                  this.loadingGuardar.set(false);

                  this.mostrarToast(
                    'error',
                    'No se pudo registrar',
                    response.error_msg ??
                    'Ocurrió un error.'
                  );

                  return;
                }

                try {

                  if (this.form.imprimir) {

                    await this.imprimirCita();
                  }

                } catch (e) {

                  console.error(e);

                  this.mostrarToast(
                    'error',
                    'Error de impresión',
                    'La cita se registró pero no se pudo imprimir.'
                  );
                }

                this.loadingGuardar.set(false);

                this.mostrarToast(
                  'success',
                  'Cita registrada',
                  response?.error_msg ??
                  'Registro exitoso.'
                );

                setTimeout(() => {

                  this.cerrar.emit(true);

                }, 2500);
              },

              error: (err) => {

                console.error(err);

                this.loadingGuardar.set(false);

                const msg =
                  err?.error?.error_msg ??
                  'No se pudo establecer comunicación con el servidor.';

                this.mostrarToast(
                  'error',
                  'Error',
                  msg
                );
              }
            });
        },

        error: (err) => {

          console.error(err);

          this.loadingGuardar.set(false);

          const msg =
            err?.error?.error_msg ??
            'No se pudo validar la CURP.';

          this.mostrarToast(
            'error',
            'Error validando CURP',
            msg
          );
        }
      });
  }

  // ─────────────────────────────
  // Cerrar modal
  // ─────────────────────────────

  cerrarModal(): void {

    if (this.loadingCurp()) {
      return;
    }

    this.modalCurpVisible = false;
  }

  // ─────────────────────────────
  // Impresión 
  // ─────────────────────────────

  async imprimirCita(): Promise<void> {
    try {
      const qrBase64 = await QRCode.toDataURL(this.form.curp, { width: 320, margin: 1 });
      const ventana = window.open('', '_blank', 'width=700,height=1000');
      if (!ventana) return;

      ventana.document.write(`
          <html>

            <head>
                <title>Etiqueta transportista</title>
                <style>
                    @page {
                        size: 75mm 100mm;
                        margin: 0;
                    }

                    html,
                    body {
                        margin: 0;
                        padding: 0;
                        width: 75mm;
                        height: 100mm;
                        overflow: hidden;
                        font-family: Arial, sans-serif;
                        background: #fff;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    body {
                        display: flex;
                        flex-direction: column;
                    }

                    .card-side {
                        position: relative;
                        width: 75mm;
                        height: 50mm;
                        display: flex;
                        overflow: hidden;
                        box-sizing: border-box;
                    }

                    .visitor-bar {
                        position: relative;
                        width: 12mm;
                        flex-shrink: 0;
                        overflow: hidden;
                    }

                    .visitor-bar img {
                        position: absolute;
                        inset: 0;
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }

                    .visitor-text {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(-90deg);
                        color: #fff;
                        font-size: 12pt;
                        font-weight: 900;
                        letter-spacing: 2px;
                        white-space: nowrap;
                        text-transform: uppercase;
                        font-family: Arial, sans-serif;
                        z-index: 2;
                    }

                    .content {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        box-sizing: border-box;
                    }

                    .front {
                        border-bottom: 1px dashed #000;
                    }

                    .front .content {
                        position: relative;
                        gap: 2mm;
                        padding: 5mm 4mm 4mm;
                        transform: rotate(180deg);
                    }

                    .front-logo {
                        position: absolute;
                        top: 2mm;
                        left: 2mm;
                        width: 10mm;
                        height: 10mm;
                        object-fit: contain;
                    }

                    .qr {
                        width: 30mm;
                        height: 30mm;
                        object-fit: contain;
                    }

                    .curp {
                        font-size: 10pt;
                        font-weight: 700;
                        letter-spacing: .5px;
                        text-align: center;
                    }

                    .operador {
                        font-size: 8pt;
                        text-align: center;
                        max-width: 90%;
                    }

                    .back .content {
                        padding: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .back-logo {
                        width: 70%;
                        height: 70%;
                        object-fit: contain;
                        image-rendering: crisp-edges;
                    }
                </style>
            </head>

            <body>
                <div class="card-side front">
                    <div class="visitor-bar"><img src="${this.visitorBarImage}" />
                        <div class="visitor-text">VISITANTE</div>
                    </div>
                    <div class="content">
                        <img class="front-logo" src="${this.logoFrontal}" />
                        <img class="qr" src="${qrBase64}" />
                        <div class="curp">${this.form.curp}</div>
                        <div class="operador">${this.nombreCompleto}</div>
                    </div>
                </div>
                <div class="card-side back">
                    <div class="visitor-bar"><img src="${this.visitorBarImage}" />
                        <div class="visitor-text">VISITANTE</div>
                    </div>
                    <div class="content"><img class="back-logo" src="${this.imagenReverso}" /></div>
                </div>
                <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 700); };</script>
            </body>
          </html>
      `);
      ventana.document.close();
    } catch (error) {
      console.error('Error impresión:', error);
      this.mostrarToast('error', 'Error de impresión', 'No se pudo imprimir la etiqueta.');
    }
  }
}