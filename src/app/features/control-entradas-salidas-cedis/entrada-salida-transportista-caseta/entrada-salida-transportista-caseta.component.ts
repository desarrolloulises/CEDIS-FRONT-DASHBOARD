import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import QRCode from 'qrcode';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { SelectComponent, ISelectOption } from '../../../shared/components/select/select.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { CurpInputComponent } from '../../../shared/curp-input/curp-input.component';

import { TransportistaService } from './services/entrada-salida-transportista-caseta.service';
import { DatosService } from '../../../service/servicio.service';

import {
  ITransportista,
  ITipoIngreso,
  ITipoUnidad,
  IApiErrorResponse,
} from './models/entrada-salida-transportista-caseta.model';

// ── Tipo interno del formulario ──────────────────────────────────────────────

export interface FormTransportista {
  tipoIngresoId: number | null;
  empresa: string;
  idProveedor: string;
  idEmpresa: number;
  nombre: string;
  paterno: string;
  materno: string;
  curp: string;
  placas: string;
  marca: string;
  modelo: string;
  tipoUnidadId: number | null;
}

function emptyForm(): FormTransportista {
  return {
    tipoIngresoId: null,
    empresa: '',
    idProveedor: '',
    idEmpresa: 0,
    nombre: '',
    paterno: '',
    materno: '',
    curp: '',
    placas: '',
    marca: '',
    modelo: '',
    tipoUnidadId: null,
  };
}


@Component({
  selector: 'app-entrada-salida-transportista-caseta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    IconButtonComponent,
    ModalComponent,
    InputComponent,
    SelectComponent,
    LoadingSpinnerComponent,
    ToastComponent,
    CurpInputComponent,
  ],
  templateUrl: './entrada-salida-transportista-caseta.component.html',
  styleUrls: ['./entrada-salida-transportista-caseta.component.css'],
})
export class EntradaSalidaTransportistaCasetaComponent implements OnInit, OnDestroy {

  // ── Estado principal ────────────────────────────────────────────────────
  transportistas: ITransportista[] = [];
  filtro = '';

  // Catálogos cargados al inicio
  tiposIngreso: ITipoIngreso[] = [];
  tiposUnidad: ITipoUnidad[] = [];

  // ── Modal alta / edición ────────────────────────────────────────────────
  showAlta = false;
  editandoId: number | null = null;
  form: FormTransportista = emptyForm();
  curpBloqueado = false;

  // ── Modal CURP ──────────────────────────────────────────────────────────
  showCURP = false;
  consultaCURP = '';
  cargandoCURP = false;

  // ── Modal salida ────────────────────────────────────────────────────────
  showSalida = false;
  salidaTarget: ITransportista | null = null;
  salidaConCaja: boolean | null = null;

  // ── Modal QR ────────────────────────────────────────────────────────────
  showQR = false;
  qrInput = '';

  // ── Spinner global ──────────────────────────────────────────────────────
  cargando = false;

  // ── Toast ───────────────────────────────────────────────────────────────
  toastVisible = false;
  toastTipo: 'success' | 'error' = 'success';
  toastTitulo = '';
  toastMensaje = '';

  // ── Imprimir ────────────────────────────────────────────────────────────
  imprimirAlGuardar = false;

  // ── Recursos impresión ──────────────────────────────────────────────────
  readonly imagenReverso = './logo.png';
  readonly logoFrontal = './logo_sm.png';
  readonly visitorBarImage = '/visitor_bar.png';

  // ── Constructor / lifecycle ─────────────────────────────────────────────

  constructor(
    private router: Router,
    private svc: TransportistaService,
    public datosService: DatosService,
  ) { }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  ngOnDestroy(): void { }

  // ── Carga inicial ───────────────────────────────────────────────────────

  private cargarDatosIniciales(): void {
    this.cargando = true;
    forkJoin({
      entradas: this.svc.getEntradas(),
      tiposIngreso: this.svc.obtenerTiposIngreso(),
      tiposUnidad: this.svc.obtenerTiposUnidad(),
    }).subscribe({
      next: ({ entradas, tiposIngreso, tiposUnidad }) => {
        this.transportistas = entradas;
        this.tiposIngreso = tiposIngreso;
        this.tiposUnidad = tiposUnidad;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        const { titulo, mensaje } = this.extraerMensajeError(err);
        this.mostrarToast('error', titulo, mensaje);
      },
    });
  }

  recargarLista(): void {
    this.cargando = true;
    this.svc.getEntradas().subscribe({
      next: (data) => { this.transportistas = data; this.cargando = false; },
      error: (err) => {
        this.cargando = false;
        const { titulo, mensaje } = this.extraerMensajeError(err);
        this.mostrarToast('error', titulo, mensaje);
      },
    });
  }

  // ── Procesar errores de la API ──────────────────────────────────────────

  private extraerMensajeError(err: any, fallback = 'No se pudo contactar el servidor.'): { titulo: string; mensaje: string } {
    const apiError = err?.error;
    if (apiError?.error_id != null && apiError?.error_msg) {
      return { titulo: `Error ${apiError.error_id}`, mensaje: apiError.error_msg };
    }
    return { titulo: 'Error de red', mensaje: fallback };
  }

  // ── Catálogos — opciones para select ───────────────────────────────────

  get tiposIngresoOptions(): ISelectOption[] {
    return this.tiposIngreso.map(t => ({ label: t.tipo, value: String(t.id) }));
  }

  get tiposUnidadOptions(): ISelectOption[] {
    return this.tiposUnidad.map(t => ({ label: t.tipo_unidad, value: String(t.id) }));
  }

  // ── Helpers internos ────────────────────────────────────────────────────

  private mostrarToast(tipo: 'success' | 'error', titulo: string, mensaje: string): void {
    this.toastTipo = tipo;
    this.toastTitulo = titulo;
    this.toastMensaje = mensaje;
    this.toastVisible = true;
  }

  private manejarRespuestaAPI(respuesta: { error_id: number; error_msg: string | null }, mensajeExito: string): boolean {
    if (respuesta.error_id !== 0) {
      const msg = respuesta.error_msg?.trim()
        ? respuesta.error_msg
        : `Ocurrió un error inesperado (código ${respuesta.error_id}).`;
      this.mostrarToast('error', `Error ${respuesta.error_id}`, msg);
      return false;
    }
    const msgExito = respuesta.error_msg?.trim() ? respuesta.error_msg : mensajeExito;
    this.mostrarToast('success', 'Éxito', msgExito);
    return true;
  }

  // ── Atajos de teclado ───────────────────────────────────────────────────

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'F1') {
      event.preventDefault();
      if (!this.showAlta && !this.showCURP && !this.showQR && !this.showSalida) {
        this.openAlta();
      }
    }
    if (event.key === 'F2') {
      event.preventDefault();
      document.querySelector<HTMLInputElement>('.etc-search-container input')?.focus();
    }
  }

  // ── Tabla ───────────────────────────────────────────────────────────────

  get transportistasFiltrados(): ITransportista[] {
    const q = this.filtro.toLowerCase();
    if (!q) return this.transportistas;
    return this.transportistas.filter(t =>
      [t.tipo_ingreso, t.nombre, t.paterno, t.materno, t.empresa, t.curp_operador, t.placas, t.desc_unidad]
        .some(f => (f || '').toLowerCase().includes(q))
    );
  }

  nombreCompleto(t: ITransportista): string {
    return [t.nombre, t.paterno, t.materno].filter(Boolean).join(' ');
  }

  labelTipoIngreso(t: ITransportista): string {
    return t.tipo_ingreso ?? '—';
  }

  badgeClass(idTipo: number): string {
    return idTipo === 1
      ? 'etc-badge etc-badge--entrega'
      : 'etc-badge etc-badge--carga';
  }

  // ── Imprimir ────────────────────────────────────────────────────────────

  async imprimir(t: ITransportista): Promise<void> {
    try {
      const curp = t.curp_operador;
      const nombre = [t.nombre, t.paterno, t.materno].filter(Boolean).join(' ');
      const qrBase64 = await QRCode.toDataURL(curp, { width: 320, margin: 1 });

      const ventana = window.open('', '_blank', 'width=700,height=1000');
      if (!ventana) return;

      ventana.document.write(`
        <html>
          <head>
            <title>Etiqueta transportista</title>
            <style>
              @page { size: 75mm 100mm; margin: 0; }
              html, body {
                margin: 0; padding: 0;
                width: 75mm; height: 100mm;
                overflow: hidden;
                font-family: Arial, sans-serif;
                background: #fff;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              body { display: flex; flex-direction: column; }
              .card-side {
                position: relative;
                width: 75mm; height: 50mm;
                display: flex; overflow: hidden;
                box-sizing: border-box;
              }
              .visitor-bar {
                position: relative;
                width: 12mm; flex-shrink: 0;
                overflow: hidden;
              }
              .visitor-bar img {
                position: absolute;
                inset: 0; width: 100%; height: 100%;
                object-fit: cover;
              }
              .visitor-text {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%) rotate(-90deg);
                color: #fff; font-size: 10pt; font-weight: 900;
                letter-spacing: 2px; white-space: nowrap;
                text-transform: uppercase;
                font-family: Arial, sans-serif; z-index: 2;
              }
              .content {
                flex: 1; display: flex;
                flex-direction: column;
                align-items: center; justify-content: center;
                box-sizing: border-box;
              }
              .front { border-bottom: 1px dashed #000; }
              .front .content {
                position: relative;
                gap: 2mm; padding: 5mm 4mm 4mm;
                transform: rotate(180deg);
              }
              .front-logo {
                position: absolute;
                top: 2mm; left: 2mm;
                width: 10mm; height: 10mm;
                object-fit: contain;
              }
              .qr { width: 30mm; height: 30mm; object-fit: contain; }
              .curp {
                font-size: 10pt; font-weight: 700;
                letter-spacing: .5px; text-align: center;
              }
              .operador {
                font-size: 8pt; text-align: center; max-width: 90%;
              }
              .back .content {
                display: flex; align-items: center; justify-content: center;
              }
              .back-logo {
                width: 70%; height: 70%;
                object-fit: contain;
                image-rendering: crisp-edges;
              }
            </style>
          </head>
          <body>
            <div class="card-side front">
              <div class="visitor-bar">
                <img src="${this.visitorBarImage}" />
                <div class="visitor-text">TRANSPORTISTA</div>
              </div>
              <div class="content">
                <img class="front-logo" src="${this.logoFrontal}" />
                <img class="qr" src="${qrBase64}" />
                <div class="curp">${curp}</div>
                <div class="operador">${nombre}</div>
              </div>
            </div>
            <div class="card-side back">
              <div class="visitor-bar">
                <img src="${this.visitorBarImage}" />
                <div class="visitor-text">TRANSPORTISTA</div>
              </div>
              <div class="content">
                <img class="back-logo" src="${this.imagenReverso}" />
              </div>
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

  // ── Dar entrada ─────────────────────────────────────────────────────────

  darEntrada(t: ITransportista): void {
    this.cargando = true;
    this.svc.registrarEntrada({
      registro: t.id_cita,
      caja: 0,
      usuario: this.datosService.usuarioSignal(),
    }).subscribe({
      next: (res) => {
        this.cargando = false;
        if (this.manejarRespuestaAPI(res, 'Entrada registrada correctamente.')) {
          this.recargarLista();
        }
      },
      error: (err) => {
        this.cargando = false;
        const { titulo, mensaje } = this.extraerMensajeError(err);
        this.mostrarToast('error', titulo, mensaje);
      },
    });
  }

  // ── Dar salida ──────────────────────────────────────────────────────────

  openSalida(t: ITransportista): void {
    this.salidaTarget = t;
    this.salidaConCaja = null;
    this.showSalida = true;
  }

  confirmarSalida(): void {
    if (!this.salidaTarget) return;
    if (this.salidaTarget.remolque === 1 && this.salidaConCaja === null) return;

    const target = this.salidaTarget;
    this.showSalida = false;
    this.cargando = true;

    this.svc.registrarSalida({
      registro: target.id_cita,
      caja: this.salidaConCaja === true ? 1 : 0,
      usuario: this.datosService.usuarioSignal(),
    }).subscribe({
      next: (res) => {
        this.cargando = false;
        if (this.manejarRespuestaAPI(res, 'Salida registrada correctamente.')) {
          this.recargarLista();
        }
        this.salidaTarget = null;
        this.salidaConCaja = null;
      },
      error: (err) => {
        this.cargando = false;
        const { titulo, mensaje } = this.extraerMensajeError(err);
        this.mostrarToast('error', titulo, mensaje);
      },
    });
  }

  // ── Modal alta / edición ────────────────────────────────────────────────

  openAlta(): void {
    this.editandoId = null;
    this.form = emptyForm();
    this.curpBloqueado = false;
    this.imprimirAlGuardar = false;
    this.showAlta = true;
  }

  openEditar(t: ITransportista): void {
    this.editandoId = t.id_cita;
    this.form = {
      tipoIngresoId: t.id_tipo_ingreso,
      empresa: t.empresa,
      idProveedor: t.id_empresa > 0 ? String(t.id_empresa) : '',
      idEmpresa: t.id_empresa,
      nombre: t.nombre,
      paterno: t.paterno,
      materno: t.materno,
      curp: t.curp_operador,
      placas: t.placas,
      marca: t.marca,
      modelo: t.modelo,
      tipoUnidadId: t.tipo_unidad,
    };
    this.curpBloqueado = false;
    this.imprimirAlGuardar = false;
    this.showAlta = true;
  }

  get modalTitulo(): string {
    return this.editandoId !== null ? 'Editar transportista' : 'Alta de transportista';
  }

  get modalBotonPrimario(): string {
    return this.editandoId !== null ? 'Guardar cambios' : 'Registrar entrada';
  }

  // ── Getter principal: controla visibilidad del campo ID EMPRESA ─────────

  get validaEmpresa(): boolean {
    if (!this.form.tipoIngresoId) return false;
    const tipo = this.tiposIngreso.find(t => t.id === this.form.tipoIngresoId);
    return tipo?.valida_empresa === 1;
  }

  get tieneRemolque(): boolean {
    if (this.form.tipoUnidadId === null) return false;
    const unidad = this.tiposUnidad.find(u => u.id === this.form.tipoUnidadId);
    return unidad?.usa_remolque === 1;
  }

  onChangeTipoIngreso(): void {
    if (!this.validaEmpresa) {
      this.form.idProveedor = '';
      this.form.idEmpresa = 0;
    }
  }

  // Reemplaza el getter formValido existente
  get formValido(): boolean {
    if (!this.form.tipoIngresoId) return false;
    if (!this.form.empresa.trim()) return false;
    if (!this.form.nombre.trim() || !this.form.paterno.trim() || !this.form.materno) return false;
    if (!this.form.placas.trim() || !this.form.tipoUnidadId) return false;

    // Validación específica de CURP (18 caracteres alfanuméricos)
    const curpRegex = /^[A-Z0-9]{18}$/;
    if (!this.form.curp.trim() || !curpRegex.test(this.form.curp.trim().toUpperCase())) {
      return false;
    }

    if (this.validaEmpresa && this.editandoId === null && !this.form.idProveedor.trim()) return false;
    return true;
  }

  // ── Consultar empresa por ID ────────────────────────────────────────────

  onChangeIdEmpresa(): void {
    const id = parseInt(this.form.idProveedor.trim(), 10);
    if (isNaN(id) || id <= 0) {
      this.form.empresa = '';
      this.form.idEmpresa = 0;
      return;
    }

    this.svc.getProveedor(id).subscribe({
      next: (res) => {
        if ('error_id' in res) {
          this.form.empresa = '';
          this.form.idEmpresa = 0;
          const msg = (res.error_msg as string)?.trim()
            ? res.error_msg as string
            : `Ocurrió un error inesperado (código ${res.error_id}).`;
          this.mostrarToast('error', `Error ${res.error_id}`, msg);
          return;
        }
        this.form.empresa = res.razon_social;
        this.form.idEmpresa = id;
      },
      error: (err) => {
        this.form.empresa = '';
        this.form.idEmpresa = 0;
        const { titulo, mensaje } = this.extraerMensajeError(err, 'No se pudo obtener la empresa.');
        this.mostrarToast('error', titulo, mensaje);
      },
    });
  }

  // ── Registrar ───────────────────────────────────────────────────────────

  registrar(): void {
    if (!this.formValido) return;

    if (this.form.curp.trim() && this.form.nombre.trim() && this.form.paterno.trim()) {
      this.cargando = true;
      this.svc.validarCurp({
        curp_operador: this.form.curp.trim().toUpperCase(),
        nombre: this.form.nombre.trim().toUpperCase(),
        paterno: this.form.paterno.trim().toUpperCase(),
        materno: this.form.materno.trim().toUpperCase(),
        usuario: this.datosService.usuarioSignal(),
      }).subscribe({
        next: (res) => {
          if (res.error_id !== 0) {
            this.cargando = false;
            const msg = res.error_msg?.trim()
              ? res.error_msg
              : `Ocurrió un error inesperado (código ${res.error_id}).`;
            this.mostrarToast('error', `Error ${res.error_id}`, msg);
            return;
          }
          this._ejecutarGuardado();
        },
        error: (err) => {
          this.cargando = false;
          const { titulo, mensaje } = this.extraerMensajeError(err);
          this.mostrarToast('error', titulo, mensaje);
        },
      });
    } else {
      this.cargando = true;
      this._ejecutarGuardado();
    }
  }

  private _ejecutarGuardado(): void {
    if (this.editandoId !== null) {
      this.svc.modificarTransportista({
        tipo_ingreso: this.form.tipoIngresoId!,
        registro: this.editandoId,
        empresa: this.form.empresa,
        curp_operador: this.form.curp,
        nombre: this.form.nombre,
        paterno: this.form.paterno,
        materno: this.form.materno,
        placas: this.form.placas,
        marca: this.form.marca,
        modelo: this.form.modelo,
        unidad: this.form.tipoUnidadId!,
        usuario: this.datosService.usuarioSignal(),
        id_empresa: this.form.idEmpresa,
      }).subscribe({
        next: (res) => {
          this.cargando = false;
          if (this.manejarRespuestaAPI(res, 'Transportista actualizado correctamente.')) {
            this.showAlta = false;
            this.editandoId = null;
            this.recargarLista();
          }
        },
        error: (err) => {
          this.cargando = false;
          const { titulo, mensaje } = this.extraerMensajeError(err);
          this.mostrarToast('error', titulo, mensaje);
        },
      });
    } else {
      this.svc.altaTransportista({
        tipo_ingreso: this.form.tipoIngresoId!,
        empresa: this.form.empresa,
        curp_operador: this.form.curp,
        nombre: this.form.nombre,
        paterno: this.form.paterno,
        materno: this.form.materno,
        placas: this.form.placas,
        marca: this.form.marca,
        modelo: this.form.modelo,
        usuario: this.datosService.usuarioSignal(),
        unidad: this.form.tipoUnidadId!,
        id_empresa: this.form.idEmpresa,
      }).subscribe({
        next: (res) => {
          this.cargando = false;
          if (this.manejarRespuestaAPI(res, 'Entrada registrada correctamente.')) {
            if (this.imprimirAlGuardar) {
              this.imprimir({
                curp_operador: this.form.curp,
                nombre: this.form.nombre,
                paterno: this.form.paterno,
                materno: this.form.materno,
              } as ITransportista);
            }
            this.imprimirAlGuardar = false;
            this.showAlta = false;
            this.recargarLista();
          }
        },
        error: (err) => {
          this.cargando = false;
          const { titulo, mensaje } = this.extraerMensajeError(err);
          this.mostrarToast('error', titulo, mensaje);
        },
      });
    }
  }

  // ── Consulta CURP ───────────────────────────────────────────────────────

  abrirConsultaCURP(): void {
    this.consultaCURP = '';
    this.showCURP = true;
  }

  consultarCURP(): void {
    const curp = this.consultaCURP.trim();
    if (curp.length !== 18) {
      this.mostrarToast('error', 'CURP inválida', 'La CURP debe tener exactamente 18 caracteres.');
      return;
    }

    this.cargandoCURP = true;

    this.svc.getOperadorPorCurp(curp).subscribe({
      next: (res) => {
        this.cargandoCURP = false;
        if ('error_id' in res) {
          const msg = (res.error_msg as string)?.trim()
            ? res.error_msg as string
            : `Ocurrió un error inesperado (código ${res.error_id}).`;
          this.mostrarToast('error', `Error ${res.error_id}`, msg);
          return;
        }
        this.form.curp = res.curp;
        this.form.nombre = res.nombre;
        this.form.paterno = res.paterno;
        this.form.materno = res.materno;
        this.curpBloqueado = true;
        this.showCURP = false;
        this.consultaCURP = '';
        this.mostrarToast('success', 'CURP encontrada', `Datos cargados para ${res.nombre} ${res.paterno}.`);
      },
      error: (err) => {
        this.cargandoCURP = false;
        const { titulo, mensaje } = this.extraerMensajeError(err);
        this.mostrarToast('error', titulo, mensaje);
      },
    });
  }

  desbloquearCURP(): void {
    this.curpBloqueado = false;
    this.form.nombre = '';
    this.form.paterno = '';
    this.form.materno = '';
    this.form.curp = '';
  }

  onCurpChange(curp: string): void {
    this.form.curp = curp;

    // Si la CURP está bloqueada (fue consultada), no permitir edición manual
    if (this.curpBloqueado) {
      return;
    }

    // Validación adicional si es necesario
    if (curp.length === 18) {
      // CURP completa, puedes agregar lógica adicional aquí si lo requieres
      console.log('CURP completa:', curp);
    }
  }
  // ── QR ──────────────────────────────────────────────────────────────────

  submitQR(): void {
    if (!this.qrInput.trim()) return;
    if (this.qrInput.length !== 18) {
      this.mostrarToast('error', 'CURP inválida', 'La CURP debe tener exactamente 18 caracteres.');
      return;
    }
    this.cargando = true;
    this.svc.registrarQr({ curp: this.qrInput.trim().toUpperCase() }).subscribe({
      next: (res) => {
        this.cargando = false;
        if (this.manejarRespuestaAPI(res, 'Registro por QR completado.')) {
          this.qrInput = '';
          this.showQR = false;
          this.recargarLista();
        }
      },
      error: (err) => {
        this.cargando = false;
        const { titulo, mensaje } = this.extraerMensajeError(err);
        this.mostrarToast('error', titulo, mensaje);
      },
    });
  }

  // ── Navegación ──────────────────────────────────────────────────────────

  irConsultar(): void { this.router.navigate(['/control-visita']); }

  trackById(_: number, t: ITransportista): number { return t.id_cita; }
}