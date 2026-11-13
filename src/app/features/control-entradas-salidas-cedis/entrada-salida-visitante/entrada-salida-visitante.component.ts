import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import QRCode from 'qrcode';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { SelectComponent, ISelectOption } from '../../../shared/components/select/select.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { url } from '../../../variables';
import { DatosService } from '../../../service/servicio.service';
import { CurpInputComponent } from "../../../shared/components/curp-input/curp-input.component";

//////////////////////////////////////////////
///         MODELOS 
//////////////////////////////////////////////

export interface VisitanteApi {
  idCita: number;
  tipoCita: string;
  idTipoIngreso: number;
  tipoIngreso: string;
  fechaCita: string;
  idEmpresaArea: number;
  empresaArea: string;
  CURP: string;
  nombre: string;
  tipoUnidad: number;
  descripcionUnidad: string;
  placas: string;
  marca: string;
  modelo: string;
  entrada: boolean;
  salida: boolean;
}

/** POST /cedis/visitante/motivos-visita */
export interface MotivoVisita {
  id: number;
  motivo: string;
  opcion: number; // 0 = ni empresa ni área, 1 = empresa, 2+ = catálogo de áreas
}

/** POST /cedis/visitante/areas */
export interface AreaCatalogo {
  idArea: number;
  descripcionArea: string;
}

/** POST /cedis/visitante/tipos-unidad */
export interface TipoUnidadCatalogo {
  id: number;
  tipoUnidad: string;
  usaRemolque: number;
}

/** Respuesta genérica de éxito/error de la API */
export interface ApiResult {
  errId: number;
  errMsg: string | null;
}

/** POST /cedis/visitante/datos-visitante (o null si no existe) */
export interface DatosVisitantePorCurp {
  curp: string;
  nombre: string;
  paterno: string;
  materno: string;
}

/** POST /cedis/visitante/razon-social-proveedor */
export interface RazonSocialResponse {
  razonSocial: string;
}

/** Formulario de alta/edición */
export interface FormVisita {
  idTipoIngreso: number | null;
  idEmpresaArea: number;
  empresaArea: string;
  curp: string;
  nombre: string;
  paterno: string;
  materno: string;
  tieneVehiculo: boolean;
  unidad: number;
  placas: string;
  marca: string;
  modelo: string;
}

function emptyForm(): FormVisita {
  return {
    idTipoIngreso: null,
    idEmpresaArea: 0,
    empresaArea: '',
    curp: '',
    nombre: '',
    paterno: '',
    materno: '',
    tieneVehiculo: false,
    unidad: 0,
    placas: '',
    marca: '',
    modelo: '',
  };
}

function formatFecha(fechaIso: string): string {
  if (!fechaIso) return '—';
  const d = new Date(fechaIso);
  if (isNaN(d.getTime())) return fechaIso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

@Component({
  selector: 'app-entrada-salida-visitante',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ButtonComponent,
    IconButtonComponent,
    ModalComponent,
    InputComponent,
    SelectComponent,
    LoadingSpinnerComponent,
    ToastComponent,
    CurpInputComponent
],
  templateUrl: './entrada-salida-visitante.component.html',
  styleUrls: ['./entrada-salida-visitante.component.css'],
})
export class EntradaSalidaVisitanteComponent implements OnInit {

  private readonly baseUrl = `${url}/cedis`;

  // ── Datos ───────────────────────────────────────────────────────────────
  visitas: VisitanteApi[] = [];
  motivos: MotivoVisita[] = [];
  areasCatalogo: AreaCatalogo[] = [];
  tiposUnidad: TipoUnidadCatalogo[] = [];

  filtro = '';

  // Modal alta / edición
  showAlta = false;
  editandoRegistro: number | null = null; // idCita cuando se edita, null cuando es alta
  form: FormVisita = emptyForm();
  curpBloqueado = false;
  cargandoArea = false;
  cargandoEmpresa = false;

  // Modal CURP (autocompletar datos de un visitante existente)
  showCURP = false;
  consultaCURP = '';
  errorCURP = '';

  // Modal QR
  showQR = false;
  qrInput = '';

  // Spinners
  cargando = false;
  cargandoCURP = false;

  // Toast
  toastVisible = false;
  toastTipo: 'success' | 'error' = 'success';
  toastTitulo = '';
  toastMensaje = '';

  // ── Imprimir ────────────────────────────────────────────────────────────
  imprimirAlGuardar = false;
  readonly imagenReverso = './logo.png';
  readonly logoFrontal = './logo_sm.png';
  readonly visitorBarImage = '/visitor_bar.png';

  constructor(private http: HttpClient, private router: Router, private datosService: DatosService) { }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'F1') {
      event.preventDefault();
      if (!this.showAlta && !this.showCURP && !this.showQR) {
        this.openAlta();
      }
    }
    if (event.key === 'F2') {
      event.preventDefault();
      document.querySelector<HTMLInputElement>('.ev-search-container input')?.focus();
    }
  }

  // ── Helpers de UI ───────────────────────────────────────────────────────
  private mostrarToast(tipo: 'success' | 'error', titulo: string, mensaje: string): void {
    this.toastTipo = tipo;
    this.toastTitulo = titulo;
    this.toastMensaje = mensaje;
    this.toastVisible = true;
  }

  /** Interpreta una respuesta { errId, errMsg } de la API. Devuelve true si fue éxito. */
  private esExito(respuesta: ApiResult | null | undefined): boolean {
    return !!respuesta && respuesta.errId === 0;
  }

  private manejarError(contexto: string, err: any): void {
    const msg = err?.error?.errMsg || err?.error?.message || 'Ocurrió un error al comunicarse con el servidor.';
    this.mostrarToast('error', contexto, msg);
  }

  formatFecha = formatFecha;

  // ── Carga inicial ───────────────────────────────────────────────────────
  private cargarDatosIniciales(): void {
    this.cargando = true;
    forkJoin({
      visitas: this.http.post<VisitanteApi[]>(`${this.baseUrl}/visitantes`, { usuario: this.datosService.usuarioSignal() })
        .pipe(catchError(err => { this.manejarError('Error al cargar visitantes', err); return of([] as VisitanteApi[]); })),
      motivos: this.http.post<MotivoVisita[]>(`${this.baseUrl}/visitante/motivos-visita`, { usuario: this.datosService.usuarioSignal() })
        .pipe(catchError(err => { this.manejarError('Error al cargar motivos de visita', err); return of([] as MotivoVisita[]); })),
      tiposUnidad: this.http.post<TipoUnidadCatalogo[]>(`${this.baseUrl}/visitante/tipos-unidad`, { usuario: this.datosService.usuarioSignal() })
        .pipe(catchError(err => { this.manejarError('Error al cargar tipos de unidad', err); return of([] as TipoUnidadCatalogo[]); })),
    }).pipe(finalize(() => (this.cargando = false)))
      .subscribe(({ visitas, motivos, tiposUnidad }) => {
        this.visitas = visitas;
        this.motivos = motivos;
        this.tiposUnidad = tiposUnidad;
      });
  }

  private recargarVisitas(onDone?: () => void): void {
    this.http.post<VisitanteApi[]>(`${this.baseUrl}/visitantes`, { usuario: this.datosService.usuarioSignal() })
      .pipe(catchError(err => { this.manejarError('Error al recargar visitantes', err); return of([] as VisitanteApi[]); }))
      .subscribe(visitas => {
        this.visitas = visitas;
        onDone?.();
      });
  }

  // ── Tabla ───────────────────────────────────────────────────────────────
  get visitasFiltradas(): VisitanteApi[] {
    const q = this.filtro.toLowerCase().trim();
    if (!q) return this.visitas;
    return this.visitas.filter(v =>
      [v.nombre, v.tipoIngreso, v.empresaArea, v.CURP]
        .some(f => (f || '').toLowerCase().includes(q))
    );
  }

  empresaOArea(v: VisitanteApi): string {
    return v.empresaArea || '—';
  }

  // ── Entrada / Salida ────────────────────────────────────────────────────
  marcarEntrada(v: VisitanteApi): void {
    if (!v.entrada) return;
    this.cargando = true;
    this.http.post<ApiResult>(`${this.baseUrl}/visitante/entrada`, { registro: v.idCita, usuario: this.datosService.usuarioSignal() })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: resp => {
          if (this.esExito(resp)) {
            // this.mostrarToast('success', 'Éxito', 'Entrada registrada correctamente.');
            this.recargarVisitas();
          } else {
            this.mostrarToast('error', `Error ${resp.errId}`, resp.errMsg || 'No se pudo registrar la entrada.');
          }
        },
        error: err => this.manejarError('Error al registrar entrada', err),
      });
  }

  marcarSalida(v: VisitanteApi): void {
    if (!v.salida) return;
    this.cargando = true;
    this.http.post<ApiResult>(`${this.baseUrl}/visitante/salida`, { registro: v.idCita, usuario: this.datosService.usuarioSignal() })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: resp => {
          if (this.esExito(resp)) {
            // this.mostrarToast('success', 'Éxito', 'Salida registrada correctamente.');
            this.recargarVisitas();
          } else {
            this.mostrarToast('error', `Error ${resp.errId}`, resp.errMsg || 'No se pudo registrar la salida.');
          }
        },
        error: err => this.manejarError('Error al registrar salida', err),
      });
  }

  // ── Imprimir etiqueta ───────────────────────────────────────────────────
  async imprimir(v: VisitanteApi): Promise<void> {
    try {
      const curp = v.CURP;
      const nombre = v.nombre;
      const qrBase64 = await QRCode.toDataURL(curp, { width: 320, margin: 1 });

      const ventana = window.open('', '_blank', 'width=700,height=1000');
      if (!ventana) return;

      ventana.document.write(`
        <html>
          <head>
            <title>Etiqueta visitante</title>
            <style>
              @page { size: 75mm 102mm; margin: 0; }
              html, body {
                margin: 0; padding: 0;
                width: 75mm; height: 102mm;
                overflow: hidden;
                font-family: Arial, sans-serif;
                background: #fff;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              body { display: flex; flex-direction: column; }
              .card-side {
                position: relative;
                width: 75mm; height: 51mm;
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
              .visitante {
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
                <div class="visitor-text">VISITANTE</div>
              </div>
              <div class="content">
                <img class="front-logo" src="${this.logoFrontal}" />
                <img class="qr" src="${qrBase64}" />
                <div class="curp">${curp}</div>
                <div class="visitante">${nombre}</div>
              </div>
            </div>
            <div class="card-side back">
              <div class="visitor-bar">
                <img src="${this.visitorBarImage}" />
                <div class="visitor-text">VISITANTE</div>
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

  // ── Formulario: alta ────────────────────────────────────────────────────
  openAlta(): void {
    this.editandoRegistro = null;
    this.form = emptyForm();
    this.curpBloqueado = false;
    this.areasCatalogo = [];
    this.imprimirAlGuardar = false;
    this.showAlta = true;
  }

  // ── Formulario: edición ─────────────────────────────────────────────────
  openEditar(v: VisitanteApi): void {
    this.editandoRegistro = v.idCita;
    this.curpBloqueado = true;
    this.cargando = true;

    this.form = {
      idTipoIngreso: v.idTipoIngreso,
      idEmpresaArea: v.idEmpresaArea,
      empresaArea: v.empresaArea,
      curp: v.CURP,
      nombre: '',
      paterno: '',
      materno: '',
      tieneVehiculo: v.tipoUnidad > 0,
      unidad: v.tipoUnidad,
      placas: v.placas,
      marca: v.marca,
      modelo: v.modelo,
    };

    // Si el motivo requiere catálogo de áreas, lo cargamos también
    const motivo = this.motivos.find(m => m.id === v.idTipoIngreso);
    if (motivo && motivo.opcion > 1) {
      this.cargarAreas(motivo.opcion);
    } else {
      this.areasCatalogo = [];
    }

    this.http.post<DatosVisitantePorCurp | null>(`${this.baseUrl}/visitante/datos-visitante`, { curp: v.CURP })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: datos => {
          if (datos) {
            this.form.nombre = datos.nombre;
            this.form.paterno = datos.paterno;
            this.form.materno = datos.materno;
          } else {
            this.mostrarToast('error', 'Aviso', 'No se encontraron los datos del visitante para esta CURP.');
          }
          this.showAlta = true;
        },
        error: err => {
          this.manejarError('Error al obtener datos del visitante', err);
          this.showAlta = true;
        },
      });
  }

  get modalTitulo(): string {
    return this.editandoRegistro !== null ? 'Editar visitante' : 'Alta de visitante';
  }

  get modalBotonPrimario(): string {
    return this.editandoRegistro !== null ? 'Guardar cambios' : 'Registrar entrada';
  }

  // ── Catálogos dependientes del motivo de visita ────────────────────────
  get motivosOptions(): ISelectOption[] {
    return this.motivos.map(m => ({ label: m.motivo, value: String(m.id) }));
  }

  get motivoSeleccionado(): MotivoVisita | undefined {
    return this.motivos.find(m => m.id === this.form.idTipoIngreso);
  }

  get mostrarCamposEmpresa(): boolean {
    return this.motivoSeleccionado?.opcion === 1;
  }

  get mostrarCatalogoArea(): boolean {
    return (this.motivoSeleccionado?.opcion ?? 0) > 1;
  }

  onChangeMotivo(idTipoIngresoStr: string): void {
    this.form.idTipoIngreso = idTipoIngresoStr ? Number(idTipoIngresoStr) : null;
    this.form.idEmpresaArea = 0;
    this.form.empresaArea = '';
    this.areasCatalogo = [];

    const motivo = this.motivoSeleccionado;
    if (motivo && motivo.opcion > 1) {
      this.cargarAreas(motivo.opcion);
    }
  }

  onChangeIdEmpresa(value: string): void {
    const nuevoId = value ? +value : 0;
    this.form.idEmpresaArea = nuevoId;

    // Si el ID cambió y es válido, buscar automáticamente
    if (nuevoId > 0) {
      this.onBuscarRazonSocial();
    } else {
      this.form.empresaArea = '';
    }
  }

  private cargarAreas(tipo: number): void {
    this.cargandoArea = true;
    this.http.post<AreaCatalogo[]>(`${this.baseUrl}/visitante/areas`, { tipo, usuario: this.datosService.usuarioSignal() })
      .pipe(
        catchError(err => { this.manejarError('Error al cargar áreas', err); return of([] as AreaCatalogo[]); }),
        finalize(() => (this.cargandoArea = false)),
      )
      .subscribe(areas => (this.areasCatalogo = areas));
  }

  get areasOptions(): ISelectOption[] {
    return this.areasCatalogo.map(a => ({ label: a.descripcionArea, value: String(a.idArea) }));
  }

  onChangeArea(idAreaStr: string): void {
    this.form.idEmpresaArea = idAreaStr ? Number(idAreaStr) : 0;
    const area = this.areasCatalogo.find(a => a.idArea === this.form.idEmpresaArea);
    this.form.empresaArea = area?.descripcionArea || '';
  }

  // ── Búsqueda de razón social con validación ─────────────────────────────
  onBuscarRazonSocial(): void {
    if (!this.mostrarCamposEmpresa || !this.form.idEmpresaArea) {
      this.form.empresaArea = '';
      return;
    }
    this.cargandoEmpresa = true;
    this.http.post<RazonSocialResponse>(`${this.baseUrl}/visitante/razon-social-proveedor`, {
      idProvedor: this.form.idEmpresaArea
    })
      .pipe(finalize(() => (this.cargandoEmpresa = false)))
      .subscribe({
        next: resp => {
          if (resp && resp.razonSocial) {
            this.form.empresaArea = resp.razonSocial;
          } else {
            this.form.empresaArea = '';
            this.mostrarToast('error', 'No encontrado', 'No se encontró la razón social para el ID proporcionado.');
          }
        },
        error: err => {
          this.form.empresaArea = '';
          this.manejarError('Error al obtener la razón social', err);
        },
      });
  }

  // ── Vehículo (marca y modelo opcionales si checkbox activado) ───────────
  get tiposUnidadOptions(): ISelectOption[] {
    return this.tiposUnidad.map(t => ({ label: t.tipoUnidad, value: String(t.id) }));
  }

  onChangeTipoUnidad(idStr: string): void {
    this.form.unidad = idStr ? Number(idStr) : 0;
  }

  onToggleVehiculo(): void {
    if (!this.form.tieneVehiculo) {
      this.form.unidad = 0;
      this.form.placas = '';
      this.form.marca = '';
      this.form.modelo = '';
    }
  }

  // ── Validación de formulario ────────────────────────────────────────────
  get formValido(): boolean {
    if (!this.form.idTipoIngreso) return false;
    if (!this.form.nombre.trim() || !this.form.paterno.trim()) return false;
    if (!this.form.curp.trim()) return false;

    // Validación unificada para empresa/área
    if (this.mostrarCamposEmpresa && !this.form.idEmpresaArea) return false;
    if (this.mostrarCatalogoArea && !this.form.idEmpresaArea) return false;

    // Validar que empresaArea no esté vacío cuando se requiere empresa
    if (this.mostrarCamposEmpresa && !this.form.empresaArea.trim()) return false;

    // Si tiene vehículo activado, el tipo de unidad y placas son requeridos
    // Marca y modelo son opcionales
    if (
      this.form.tieneVehiculo &&
      (!this.form.unidad || !this.form.placas.trim())
    ) {
      return false;
    }
    return true;
  }

  // ── Registrar (alta / edición) ──────────────────────────────────────────
  registrar(): void {
    if (!this.formValido || !this.form.idTipoIngreso) return;

    // Si la CURP fue capturada manualmente (no bloqueada por consulta previa)
    // la validamos antes de enviar el alta/edición.
    if (!this.curpBloqueado) {
      this.cargando = true;
      this.http.post<ApiResult>(`${this.baseUrl}/visitante/validar-curp`, {
        curp: this.form.curp,
        nombre: this.form.nombre,
        paterno: this.form.paterno,
        materno: this.form.materno,
        usuario: this.datosService.usuarioSignal(),
      }).pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: resp => {
            if (this.esExito(resp)) {
              this.enviarRegistro();
            } else {
              this.mostrarToast('error', `Error ${resp.errId}`, resp.errMsg || 'CURP inválida.');
            }
          },
          error: err => this.manejarError('Error al validar la CURP', err),
        });
    } else {
      this.enviarRegistro();
    }
  }

  private enviarRegistro(): void {
    this.cargando = true;

    if (this.editandoRegistro !== null) {
      // Payload de actualización
      const payload = {
        idCita: this.editandoRegistro,
        idTipoIngreso: this.form.idTipoIngreso,
        idEmpresaArea: this.form.idEmpresaArea,
        empresaArea: this.form.empresaArea,
        curp: this.form.curp,
        nombre: this.form.nombre,
        paterno: this.form.paterno,
        materno: this.form.materno,
        unidad: this.form.unidad,
        placas: this.form.placas,
        marca: this.form.marca,
        modelo: this.form.modelo,
        usuario: this.datosService.usuarioSignal(),
      };
      this.http.put<ApiResult>(`${this.baseUrl}/visitante`, payload)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: resp => this.finalizarRegistro(resp, 'Visita actualizada correctamente.'),
          error: err => this.manejarError('Error al actualizar la visita', err),
        });
    } else {
      // Payload de alta
      const payload = {
        idTipoIngreso: this.form.idTipoIngreso,
        idEmpresaArea: this.form.idEmpresaArea,
        empresaArea: this.form.empresaArea,
        curp: this.form.curp,
        nombre: this.form.nombre,
        paterno: this.form.paterno,
        materno: this.form.materno,
        unidad: this.form.unidad,
        placas: this.form.placas,
        marca: this.form.marca,
        modelo: this.form.modelo,
        usuario: this.datosService.usuarioSignal(),
      };
      this.http.post<ApiResult>(`${this.baseUrl}/visitantes/agregar`, payload)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: resp => this.finalizarRegistro(resp, 'Visita registrada correctamente.'),
          error: err => this.manejarError('Error al registrar la visita', err),
        });
    }
  }

  private finalizarRegistro(resp: ApiResult, mensajeExito: string): void {
    if (this.esExito(resp)) {
      // this.mostrarToast('success', 'Éxito', mensajeExito);

      // Imprimir etiqueta si el checkbox está activado
      if (this.imprimirAlGuardar && this.editandoRegistro === null) {
        this.imprimir({
          CURP: this.form.curp,
          nombre: `${this.form.nombre} ${this.form.paterno} ${this.form.materno}`.trim(),
        } as VisitanteApi);
      }

      this.imprimirAlGuardar = false;
      this.showAlta = false;
      this.editandoRegistro = null;
      this.recargarVisitas();
    } else {
      this.mostrarToast('error', `Error ${resp.errId}`, resp.errMsg || 'No se pudo guardar la visita.');
    }
  }

  // ── Consulta CURP (autocompletar datos de un visitante ya registrado) ──
  abrirConsultaCURP(): void {
    this.consultaCURP = '';
    this.errorCURP = '';
    this.showCURP = true;
  }

  consultarCURP(): void {
    const curp = this.consultaCURP.trim().toUpperCase();
    if (curp.length < 18) return;

    this.cargandoCURP = true;
    this.errorCURP = '';

    this.http.post<DatosVisitantePorCurp | null>(`${this.baseUrl}/visitante/datos-visitante`, { curp })
      .pipe(finalize(() => (this.cargandoCURP = false)))
      .subscribe({
        next: datos => {
          if (datos) {
            this.form.curp = datos.curp;
            this.form.nombre = datos.nombre;
            this.form.paterno = datos.paterno;
            this.form.materno = datos.materno;
            this.curpBloqueado = true;
            this.showCURP = false;
            this.consultaCURP = '';
            this.errorCURP = '';
            // this.mostrarToast('success', 'CURP encontrada', `Datos cargados para ${datos.nombre} ${datos.paterno}.`);
          } else {
            this.errorCURP = 'No se encontró ningún registro con esa CURP.';
          }
        },
        error: err => {
          this.errorCURP = 'Ocurrió un error al consultar la CURP.';
          this.manejarError('Error al consultar CURP', err);
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

  // ── QR ──────────────────────────────────────────────────────────────────
  submitQR(): void {
    if (!this.qrInput.trim()) return;

    this.cargando = true;
    this.http.post<ApiResult>(`${this.baseUrl}/visitante/registrar-por-rq`, { curp: this.qrInput.trim().toUpperCase() })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: resp => {
          if (this.esExito(resp)) {
            // this.mostrarToast('success', 'Éxito', 'Registro por QR completado.');
            this.qrInput = '';
            this.showQR = false;
            this.recargarVisitas();
          } else {
            this.mostrarToast('error', `Error ${resp.errId}`, resp.errMsg || 'No se pudo completar el registro por QR.');
          }
        },
        error: err => this.manejarError('Error al registrar por QR', err),
      });
  }

  irConsultar(): void { this.router.navigate(['/registro-ingreso-transportista-caseta']); }

  trackById(_: number, v: VisitanteApi): number { return v.idCita; }
}