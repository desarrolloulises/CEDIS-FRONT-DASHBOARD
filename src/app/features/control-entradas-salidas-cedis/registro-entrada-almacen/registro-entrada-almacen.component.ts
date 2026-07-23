import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SelectComponent, ISelectOption } from '../../../shared/components/select/select.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

import {
  AplicarVetoPayload,
  ElementoAdicional,
  ImagenInfo,
  Incidencia,
  NivelIncidenciaCatalogo,
  TipoVeto,
  ValidacionSeguridad,
  VetoExistente
} from './models/registro-entrada-almacen.models';
import { RegistroEntradaAlmacenService } from './services/registro-entrada-almacen.service';

interface Apartado {
  id: string;
  titulo: string;
}

interface DatosForm {
  curp: string;
  nombre: string;
  apellidoP: string;
  apellidoM: string;
  motivo: string;
  noProveedor: string;
  razonSocial: string;
}

interface NuevoVetoForm {
  tipoVeto: string;
  fechaInicio: string;
  fechaTermino: string;
}

interface NuevaIncidenciaForm {
  nivel: string;
  descripcion: string;
}

interface EdicionIncidenciaForm {
  nivel: string;
  descripcion: string;
}

interface NuevoElementoForm {
  tipoElemento: string;
  descripcionElemento: string;
  cantidad: string;
}

interface EdicionElementoForm {
  tipoElemento: string;
  descripcionElemento: string;
  cantidad: string;
}

interface ToastState {
  visible: boolean;
  tipo: 'success' | 'error';
  titulo: string;
  mensaje: string;
}

@Component({
  selector: 'app-registro-entrada-almacen',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    IconButtonComponent,
    InputComponent,
    SelectComponent,
    LoadingSpinnerComponent,
    ToastComponent,
    ModalComponent
  ],
  templateUrl: './registro-entrada-almacen.component.html',
  styleUrls: ['./registro-entrada-almacen.component.css']
})
export class RegistroEntradaAlmacenComponent implements OnInit, OnDestroy {

  // Lista de apartados
  apartados: Apartado[] = [
    { id: 'datos', titulo: 'Datos' },
    { id: 'vehiculo', titulo: 'Vehículo' },
    { id: 'validaciones', titulo: 'Validaciones' },
    { id: 'incidencias', titulo: 'Incidencias' },
    { id: 'otros', titulo: 'Otros' }
  ];

  // Apartado activo (por defecto, el primero)
  apartadoActivo: string = this.apartados[0].id;

  // Spinner único compartido por todos los apartados
  cargando = false;

  // TODO: obtener del servicio de sesión/autenticación real
  private usuarioActual = '406991';

  constructor(private cedisService: RegistroEntradaAlmacenService) { }

  ngOnInit(): void {
    this.cargarCatalogoTiposVeto();
    this.cargarCatalogoNiveles();
  }

  ngOnDestroy(): void {
    this.liberarImagenUrl();
  }

  //////////////////////////////////////////
  // Toast: instancia única compartida por todo el componente.
  //////////////////////////////////////////
  toast: ToastState = {
    visible: false,
    tipo: 'success',
    titulo: '',
    mensaje: ''
  };

  mostrarToast(tipo: 'success' | 'error', titulo: string, mensaje: string): void {
    this.toast = { visible: true, tipo, titulo, mensaje };
  }

  cerrarToast(): void {
    this.toast.visible = false;
  }

  //////////////////////////////////////////
  // Apartado "Datos": formulario principal
  //////////////////////////////////////////
  motivoOptions: ISelectOption[] = [
    { label: 'Visita', value: 'Visita' },
    { label: 'Maniobra', value: 'Maniobra' },
    { label: 'Encargado', value: 'Encargado' }
  ];

  private datosFormInicial: DatosForm = {
    curp: '',
    nombre: '',
    apellidoP: '',
    apellidoM: '',
    motivo: '',
    noProveedor: '',
    razonSocial: ''
  };

  datosForm: DatosForm = { ...this.datosFormInicial };

  /**
   * Se dispara al perder el foco el campo CURP. A partir de aquí
   * se consultan validaciones, veto e incidencias para ese CURP.
   */
  onCurpBlur(): void {
    const curp = this.obtenerCurpNormalizado();
    if (!curp) {
      return;
    }
    this.consultarValidaciones(curp);
    this.consultarVeto(curp);
    this.consultarIncidencias(curp);
    this.consultarElementosAdicionales(curp);
    this.consultarImagen(curp);
  }

  private obtenerCurpNormalizado(): string {
    return (this.datosForm.curp || '').trim().toLowerCase();
  }


  //////////////////////////////////////////
  //          Imagen
  //////////////////////////////////////////

  /** Metadatos devueltos por /obtener-imagen/{CURP} o tras subir/actualizar */
  imagenInfo: ImagenInfo | null = null;

  /** Blob URL usado para mostrar la imagen en el <img> */
  imagenUrl: string | null = null;
  imagenNombre = '';
  imagenAmpliada = false;

  get imagenExiste(): boolean {
    return !!this.imagenInfo;
  }

  /**
   * Consulta los metadatos de la imagen y después
   * descarga el binario para poder mostrarla.
   */
  consultarImagen(curp: string): void {
    this.cargando = true;

    this.cedisService.obtenerImagenInfo(curp).subscribe({
      next: (info) => {
        this.imagenInfo = info;
        this.cargarImagenBinario(curp, info.nombreArchivo);
      },
      error: () => {
        this.cargando = false;
        this.imagenInfo = null;
        this.liberarImagenUrl();
        this.imagenUrl = null;
        this.imagenNombre = '';
        // Sin imagen asociada para este CURP; no se muestra error, es un estado válido.
      }
    });
  }

  /**
 * Dispara la selección/captura de imagen. Requiere que el CURP ya
 * esté capturado en el apartado de Datos.
 */
  abrirCapturaImagen(inputImagen: HTMLInputElement): void {
    if (!this.obtenerCurpNormalizado()) {
      this.mostrarToast('error', 'CURP requerido', 'Captura el CURP en el apartado de Datos antes de subir una imagen.');
      return;
    }
    inputImagen.click();
  }


  /** Descarga el binario de la imagen y arma el blob URL */
  private cargarImagenBinario(curp: string, nombreArchivo: string): void {
    this.cedisService.obtenerImagenBinario(curp).subscribe({
      next: (blob) => {
        this.liberarImagenUrl();
        this.imagenUrl = URL.createObjectURL(blob);
        this.imagenNombre = nombreArchivo;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.mostrarToast('error', 'Error al cargar imagen', 'No se pudo descargar el archivo de la imagen.');
      }
    });
  }

  /**
   * Dispara la selección de archivo. Si ya hay una imagen cargada
   * el archivo seleccionado actualiza esa imagen;
   * si no, se sube como una imagen nueva.
   */

  onSeleccionarImagen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];

    if (!file) {
      return;
    }

    const curp = this.obtenerCurpNormalizado();

    if (!curp) {
      this.mostrarToast('error', 'CURP requerido', 'Captura el CURP en el apartado de Datos antes de subir una imagen.');
      input.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.mostrarToast('error', 'Archivo inválido', 'El archivo seleccionado no es una imagen.');
      input.value = '';
      return;
    }

    if (this.imagenExiste) {
      this.actualizarImagenApi(curp, file);
    } else {
      this.subirImagenApi(curp, file);
    }

    input.value = '';
  }


  /** Sube una imagen nueva */
  private subirImagenApi(curp: string, file: File): void {
    this.cargando = true;

    this.cedisService.subirImagen(curp, file).subscribe({
      next: (info) => {
        this.imagenInfo = info;
        this.cargarImagenBinario(curp, info.nombreArchivo);
        this.mostrarToast('success', 'Imagen subida', `Se subió "${file.name}" correctamente.`);
      },
      error: () => {
        this.cargando = false;
        this.mostrarToast('error', 'Error al subir', 'No se pudo subir la imagen.');
      }
    });
  }

  /** Actualiza (reemplaza) el archivo de la imagen ya asociada */
  private actualizarImagenApi(curp: string, file: File): void {
    this.cargando = true;

    this.cedisService.actualizarImagen(curp, file).subscribe({
      next: (info) => {
        this.imagenInfo = info;
        this.cargarImagenBinario(curp, info.nombreArchivo);
        this.mostrarToast('success', 'Imagen actualizada', 'La imagen se reemplazó correctamente.');
      },
      error: () => {
        this.cargando = false;
        this.mostrarToast('error', 'Error al actualizar', 'No se pudo actualizar la imagen.');
      }
    });
  }

  /** Elimina la imagen actualmente cargada */
  eliminarImagen(): void {
    const curp = this.obtenerCurpNormalizado();

    if (!curp || !this.imagenExiste) {
      return;
    }

    this.cargando = true;

    this.cedisService.eliminarImagenPorCurp(curp).subscribe({
      next: (resp) => {
        this.liberarImagenUrl();
        this.imagenUrl = null;
        this.imagenNombre = '';
        this.imagenAmpliada = false;
        this.imagenInfo = null;
        this.cargando = false;
        this.mostrarToast('success', 'Imagen eliminada', resp.mensaje || 'La imagen fue eliminada correctamente.');
      },
      error: () => {
        this.cargando = false;
        this.mostrarToast('error', 'Error al eliminar', 'No se pudo eliminar la imagen.');
      }
    });
  }

  verImagenAmpliada(): void {
    if (this.imagenUrl) {
      this.imagenAmpliada = true;
    }
  }

  cerrarImagenAmpliada(): void {
    this.imagenAmpliada = false;
  }


  /** Libera el blob URL anterior para evitar fugas de memoria */
  private liberarImagenUrl(): void {
    if (this.imagenUrl && this.imagenUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagenUrl);
    }
  }

  //////////////////////////////////////////
  //      Validaciones de seguridad
  //////////////////////////////////////////
  validaciones: ValidacionSeguridad[] = [];
  validacionesCargadas = false;

  consultarValidaciones(curp: string): void {
    this.cargando = true;

    this.cedisService.obtenerValidaciones(curp).subscribe({
      next: (data) => {
        this.validaciones = data ?? [];
        this.validacionesCargadas = true;
        this.cargando = false;
      },
      error: () => {
        this.validaciones = [];
        this.validacionesCargadas = true;
        this.cargando = false;
        this.mostrarToast(
          'error',
          'Validaciones no disponibles',
          'No se pudieron obtener las validaciones de seguridad para este CURP.'
        );
      }
    });
  }

  toggleValidacion(item: ValidacionSeguridad, activa: boolean): void {
    const curp = this.obtenerCurpNormalizado();

    if (!curp) {
      this.mostrarToast('error', 'CURP requerido', 'Captura el CURP en el apartado de Datos.');
      return;
    }

    const estadoAnterior = item.estadoValidacion;
    // Actualización optimista de la UI
    item.estadoValidacion = activa ? 1 : 0;

    this.cedisService
      .actualizarValidacion({
        curp,
        clave: item.lblClaveValidacion,
        activa,
        usuario: this.usuarioActual
      })
      .subscribe({
        next: () => {
          this.mostrarToast(
            'success',
            'Validación actualizada',
            `"${item.lblDescripcionValidacion}" se actualizó correctamente.`
          );
        },
        error: () => {
          // Se revierte el cambio si la API falla
          item.estadoValidacion = estadoAnterior;
          this.mostrarToast(
            'error',
            'Error al actualizar',
            `No se pudo actualizar "${item.lblDescripcionValidacion}".`
          );
        }
      });
  }

  //////////////////////////////////////////
  //          Veto
  //////////////////////////////////////////
  catalogoTiposVeto: TipoVeto[] = [];
  tipoVetoOptions: ISelectOption[] = [];

  /** null = sin veto registrado; se llena tras consultarVeto() */
  vetoExistente: VetoExistente | null = null;
  /** indica si ya se realizó la consulta para el CURP actual */
  vetoConsultado = false;
  /** true cuando el usuario presiona "Modificar" para reemplazar un veto existente */
  editandoVeto = false;

  private nuevoVetoInicial: NuevoVetoForm = {
    tipoVeto: '',
    fechaInicio: '',
    fechaTermino: ''
  };

  nuevoVeto: NuevoVetoForm = { ...this.nuevoVetoInicial };

  private cargarCatalogoTiposVeto(): void {
    this.cedisService.obtenerCatalogoTiposVeto().subscribe({
      next: (catalogo) => {
        this.catalogoTiposVeto = catalogo ?? [];
        this.tipoVetoOptions = this.catalogoTiposVeto.map((t) => ({
          label: t.lblDescripcionTipoVeto,
          value: t.lblTipoVeto
        }));
      },
      error: () => {
        this.mostrarToast(
          'error',
          'Catálogo no disponible',
          'No se pudo cargar el catálogo de tipos de veto.'
        );
      }
    });
  }

  consultarVeto(curp: string): void {
    this.cargando = true;

    this.cedisService.obtenerVetoPorCurp(curp).subscribe({
      next: (veto) => {
        // Si el CURP no tiene veto, algunas APIs regresan un objeto vacío
        // en lugar de un 404; por eso se valida que traiga tipo de veto.
        this.vetoExistente = veto && veto.lblTipoVeto ? veto : null;
        this.vetoConsultado = true;
        this.editandoVeto = false;
        this.cargando = false;
      },
      error: () => {
        // Sin veto registrado para este CURP
        this.vetoExistente = null;
        this.vetoConsultado = true;
        this.editandoVeto = false;
        this.cargando = false;
      }
    });
  }

  /** true si el tipo de veto seleccionado en el formulario es "Definitivo" */
  get tipoVetoSeleccionadoEsDefinitivo(): boolean {
    const tipo = this.catalogoTiposVeto.find(
      (t) => t.lblTipoVeto === this.nuevoVeto.tipoVeto
    );
    return !!tipo && tipo.lblDescripcionTipoVeto.trim().toLowerCase() === 'definitivo';
  }

  onTipoVetoChange(valor: string): void {
    this.nuevoVeto.tipoVeto = valor;

    // Si es Definitivo no se le pide fecha de término al usuario
    if (this.tipoVetoSeleccionadoEsDefinitivo) {
      this.nuevoVeto.fechaTermino = '';
    }
  }

  /** Habilita el formulario para reemplazar el veto ya existente */
  iniciarEdicionVeto(): void {
    if (!this.vetoExistente) {
      return;
    }
    this.editandoVeto = true;
    this.nuevoVeto = {
      tipoVeto: this.vetoExistente.lblTipoVeto,
      fechaInicio: '',
      fechaTermino: ''
    };
  }

  cancelarEdicionVeto(): void {
    this.editandoVeto = false;
    this.nuevoVeto = { ...this.nuevoVetoInicial };
  }

  aplicarVeto(): void {
    const curp = this.obtenerCurpNormalizado();

    if (!curp) {
      this.mostrarToast('error', 'CURP requerido', 'Captura el CURP en el apartado de Datos antes de aplicar un veto.');
      return;
    }

    if (!this.nuevoVeto.tipoVeto || !this.nuevoVeto.fechaInicio) {
      this.mostrarToast('error', 'Datos incompletos', 'Selecciona el tipo de veto y la fecha de inicio.');
      return;
    }

    let fechaTermino = this.nuevoVeto.fechaTermino;

    if (this.tipoVetoSeleccionadoEsDefinitivo) {
      // El endpoint exige fechaTermino aunque el veto sea Definitivo,
      // así que se envía automáticamente fechaInicio + 1 día.
      fechaTermino = this.sumarUnDia(this.nuevoVeto.fechaInicio);
    } else if (!fechaTermino) {
      this.mostrarToast('error', 'Datos incompletos', 'Captura la fecha de término del veto.');
      return;
    }

    const payload: AplicarVetoPayload = {
      curp,
      tipoVeto: this.nuevoVeto.tipoVeto,
      fechaInicio: this.nuevoVeto.fechaInicio,
      fechaTermino,
      usuario: this.usuarioActual
    };

    this.cargando = true;

    // El mismo endpoint POST se usa para crear o reemplazar el veto:
    // si el CURP ya tenía uno, el backend simplemente lo sustituye.
    this.cedisService.aplicarVeto(payload).subscribe({
      next: () => {
        this.cargando = false;
        this.mostrarToast('success', 'Veto aplicado', 'El veto se registró correctamente.');
        this.nuevoVeto = { ...this.nuevoVetoInicial };
        this.consultarVeto(curp); // refresca el estado con el veto recién creado/reemplazado
      },
      error: () => {
        this.cargando = false;
        this.mostrarToast('error', 'Error al aplicar veto', 'No se pudo registrar el veto.');
      }
    });
  }

  private sumarUnDia(fechaIso: string): string {
    const fecha = new Date(`${fechaIso}T00:00:00`);
    fecha.setDate(fecha.getDate() + 1);

    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }

  //////////////////////////////////////////
  //          Incidencias
  //////////////////////////////////////////
  incidencias: Incidencia[] = [];
  incidenciasCargadas = false;

  catalogoNiveles: NivelIncidenciaCatalogo[] = [];
  nivelOptions: ISelectOption[] = [];

  private nuevaIncidenciaInicial: NuevaIncidenciaForm = {
    nivel: '',
    descripcion: ''
  };

  nuevaIncidencia: NuevaIncidenciaForm = { ...this.nuevaIncidenciaInicial };

  private cargarCatalogoNiveles(): void {
    this.cedisService.obtenerCatalogoNiveles().subscribe({
      next: (catalogo) => {
        this.catalogoNiveles = catalogo ?? [];
        // OJO: en este catálogo lblDescripcionNivel trae la clave ("1","2","3")
        // y lblDescripcion trae la etiqueta ("Bajo","Medio","Alto").
        this.nivelOptions = this.catalogoNiveles.map((n) => ({
          label: n.lblDescripcion,
          value: n.lblDescripcionNivel
        }));
      },
      error: () => {
        this.mostrarToast(
          'error',
          'Catálogo no disponible',
          'No se pudo cargar el catálogo de niveles de incidencia.'
        );
      }
    });
  }

  consultarIncidencias(curp: string): void {
    this.cargando = true;

    this.cedisService.obtenerIncidencias(curp).subscribe({
      next: (data) => {
        this.incidencias = data ?? [];
        this.incidenciasCargadas = true;
        this.cargando = false;
      },
      error: () => {
        this.incidencias = [];
        this.incidenciasCargadas = true;
        this.cargando = false;
        this.mostrarToast(
          'error',
          'Incidencias no disponibles',
          'No se pudieron obtener las incidencias para este CURP.'
        );
      }
    });
  }

  crearIncidencia(): void {
    const curp = this.obtenerCurpNormalizado();

    if (!curp) {
      this.mostrarToast('error', 'CURP requerido', 'Captura el CURP en el apartado de Datos.');
      return;
    }

    if (!this.nuevaIncidencia.nivel || !this.nuevaIncidencia.descripcion.trim()) {
      this.mostrarToast('error', 'Datos incompletos', 'Selecciona un nivel y describe la incidencia.');
      return;
    }

    this.cargando = true;

    this.cedisService
      .crearIncidencia({
        curp,
        nivel: this.nuevaIncidencia.nivel,
        descripcion: this.nuevaIncidencia.descripcion.trim(),
        usuario: this.usuarioActual
      })
      .subscribe({
        next: () => {
          this.cargando = false;
          this.mostrarToast('success', 'Incidencia registrada', 'La incidencia se agregó correctamente.');
          this.nuevaIncidencia = { ...this.nuevaIncidenciaInicial };
          this.consultarIncidencias(curp);
        },
        error: () => {
          this.cargando = false;
          this.mostrarToast('error', 'Error al registrar', 'No se pudo registrar la incidencia.');
        }
      });
  }

  /** MM/DD/YYYY HH:mm:ss -> DD/MM/YYYY */
  formatearFechaIncidencia(fechaApi: string): string {
    const soloFecha = (fechaApi || '').split(' ')[0];
    const partes = soloFecha.split('/');

    if (partes.length !== 3) {
      return fechaApi;
    }

    const [mm, dd, yyyy] = partes;
    return `${dd}/${mm}/${yyyy}`;
  }

  // Modal incidencias
  modalEdicionIncidenciaVisible = false;
  incidenciaEnEdicion: Incidencia | null = null;
  edicionIncidenciaForm: EdicionIncidenciaForm = { nivel: '', descripcion: '' };

  abrirEdicionIncidencia(item: Incidencia): void {
    this.incidenciaEnEdicion = item;
    this.edicionIncidenciaForm = {
      nivel: item.lblClaveNivel,
      descripcion: item.lblDescripcion
    };
    this.modalEdicionIncidenciaVisible = true;
  }

  cerrarEdicionIncidencia(): void {
    this.modalEdicionIncidenciaVisible = false;
    this.incidenciaEnEdicion = null;
    this.edicionIncidenciaForm = { nivel: '', descripcion: '' };
  }

  guardarEdicionIncidencia(): void {
    const curp = this.obtenerCurpNormalizado();

    if (!this.incidenciaEnEdicion || !curp) {
      return;
    }

    if (!this.edicionIncidenciaForm.nivel || !this.edicionIncidenciaForm.descripcion.trim()) {
      this.mostrarToast('error', 'Datos incompletos', 'Selecciona un nivel y describe la incidencia.');
      return;
    }

    this.cargando = true;

    this.cedisService
      .actualizarIncidencia({
        id: Number(this.incidenciaEnEdicion.lblId),
        curp,
        nivel: this.edicionIncidenciaForm.nivel,
        descripcion: this.edicionIncidenciaForm.descripcion.trim()
      })
      .subscribe({
        next: () => {
          this.cargando = false;
          this.mostrarToast('success', 'Incidencia actualizada', 'Los cambios se guardaron correctamente.');
          this.cerrarEdicionIncidencia();
          this.consultarIncidencias(curp);
        },
        error: () => {
          this.cargando = false;
          this.mostrarToast('error', 'Error al actualizar', 'No se pudo actualizar la incidencia.');
        }
      });
  }

  //////////////////////////////////////////
  //    Otros: elementos adicionales
  //////////////////////////////////////////
  elementosAdicionales: ElementoAdicional[] = [];
  elementosAdicionalesCargados = false;

  private nuevoElementoInicial: NuevoElementoForm = {
    tipoElemento: '',
    descripcionElemento: '',
    cantidad: ''
  };

  nuevoElemento: NuevoElementoForm = { ...this.nuevoElementoInicial };

  consultarElementosAdicionales(curp: string): void {
    this.cargando = true;

    this.cedisService.obtenerElementosAdicionales(curp).subscribe({
      next: (data) => {
        this.elementosAdicionales = data ?? [];
        this.elementosAdicionalesCargados = true;
        this.cargando = false;
      },
      error: () => {
        this.elementosAdicionales = [];
        this.elementosAdicionalesCargados = true;
        this.cargando = false;
        this.mostrarToast(
          'error',
          'Elementos no disponibles',
          'No se pudieron obtener los elementos adicionales para este CURP.'
        );
      }
    });
  }

  crearElementoAdicional(): void {
    const curp = this.obtenerCurpNormalizado();

    if (!curp) {
      this.mostrarToast('error', 'CURP requerido', 'Captura el CURP en el apartado de Datos.');
      return;
    }

    if (!this.nuevoElemento.tipoElemento.trim() || !this.nuevoElemento.descripcionElemento.trim()) {
      this.mostrarToast('error', 'Datos incompletos', 'Captura el tipo y la descripción del elemento.');
      return;
    }

    this.cargando = true;

    this.cedisService
      .crearElementoAdicional({
        tipoElemento: this.nuevoElemento.tipoElemento.trim(),
        descripcionElemento: this.nuevoElemento.descripcionElemento.trim(),
        cantidad: this.nuevoElemento.cantidad || '0',
        curp,
        usuario: this.usuarioActual
      })
      .subscribe({
        next: () => {
          this.cargando = false;
          this.mostrarToast('success', 'Elemento registrado', 'El elemento se agregó correctamente.');
          this.nuevoElemento = { ...this.nuevoElementoInicial };
          this.consultarElementosAdicionales(curp);
        },
        error: () => {
          this.cargando = false;
          this.mostrarToast('error', 'Error al registrar', 'No se pudo registrar el elemento.');
        }
      });
  }

  // Modal elementos adicionales
  modalEdicionElementoVisible = false;
  elementoEnEdicion: ElementoAdicional | null = null;
  edicionElementoForm: EdicionElementoForm = {
    tipoElemento: '',
    descripcionElemento: '',
    cantidad: ''
  };

  abrirEdicionElemento(item: ElementoAdicional): void {
    this.elementoEnEdicion = item;
    this.edicionElementoForm = {
      tipoElemento: item.lblClasifica,
      descripcionElemento: item.lblDescripcion,
      cantidad: item.lblCantidad
    };
    this.modalEdicionElementoVisible = true;
  }

  cerrarEdicionElemento(): void {
    this.modalEdicionElementoVisible = false;
    this.elementoEnEdicion = null;
    this.edicionElementoForm = { tipoElemento: '', descripcionElemento: '', cantidad: '' };
  }

  guardarEdicionElemento(): void {
    const curp = this.obtenerCurpNormalizado();

    if (!this.elementoEnEdicion || !curp) {
      return;
    }

    if (!this.edicionElementoForm.tipoElemento.trim() || !this.edicionElementoForm.descripcionElemento.trim()) {
      this.mostrarToast('error', 'Datos incompletos', 'Captura el tipo y la descripción del elemento.');
      return;
    }

    this.cargando = true;

    this.cedisService
      .actualizarElementoAdicional({
        idElemento: this.elementoEnEdicion.lblId,
        tipoElemento: this.edicionElementoForm.tipoElemento.trim(),
        descripcionElemento: this.edicionElementoForm.descripcionElemento.trim(),
        cantidad: this.edicionElementoForm.cantidad || '0',
        curp,
        usuario: this.usuarioActual
      })
      .subscribe({
        next: () => {
          this.cargando = false;
          this.mostrarToast('success', 'Elemento actualizado', 'Los cambios se guardaron correctamente.');
          this.cerrarEdicionElemento();
          this.consultarElementosAdicionales(curp);
        },
        error: () => {
          this.cargando = false;
          this.mostrarToast('error', 'Error al actualizar', 'No se pudo actualizar el elemento.');
        }
      });
  }

  //////////////////////////////////////////
  //          Navegacion entre apartados
  //////////////////////////////////////////
  seleccionarApartado(id: string): void {
    this.apartadoActivo = id;

    const curp = this.obtenerCurpNormalizado();

    if (id === 'validaciones' && curp && !this.validacionesCargadas) {
      this.consultarValidaciones(curp);
    }

    if (id === 'incidencias' && curp && !this.incidenciasCargadas) {
      this.consultarIncidencias(curp);
    }

    if (id === 'otros' && curp && !this.elementosAdicionalesCargados) {
      this.consultarElementosAdicionales(curp);
    }
  }

  //////////////////////////////////////////
  //      Reset global del componente
  //////////////////////////////////////////
  resetFormulario(): void {
    this.datosForm = { ...this.datosFormInicial };

    this.liberarImagenUrl();
    this.imagenInfo = null;
    this.imagenUrl = null;
    this.imagenNombre = '';
    this.imagenAmpliada = false;

    this.validaciones = [];
    this.validacionesCargadas = false;

    this.vetoExistente = null;
    this.vetoConsultado = false;
    this.editandoVeto = false;
    this.nuevoVeto = { ...this.nuevoVetoInicial };

    this.incidencias = [];
    this.incidenciasCargadas = false;
    this.nuevaIncidencia = { ...this.nuevaIncidenciaInicial };
    this.cerrarEdicionIncidencia();

    this.elementosAdicionales = [];
    this.elementosAdicionalesCargados = false;
    this.nuevoElemento = { ...this.nuevoElementoInicial };
    this.cerrarEdicionElemento();

    this.mostrarToast('success', 'Formulario reiniciado', 'Todos los campos fueron restablecidos.');
  }
}