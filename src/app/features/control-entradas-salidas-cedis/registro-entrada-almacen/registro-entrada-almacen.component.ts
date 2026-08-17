import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SelectComponent, ISelectOption } from '../../../shared/components/select/select.component';
import { DatosService } from '../../../service/servicio.service';

import { CapturaCurpComponent } from './components/captura-curp/captura-curp.component';
import { ApartadoDatosComponent } from './components/apartado-datos/apartado-datos.component';
import { ApartadoVehiculoComponent } from './components/apartado-vehiculo/apartado-vehiculo.component';
import { ApartadoValidacionesComponent } from './components/apartado-validaciones/apartado-validaciones.component';
import { ApartadoIncidenciasComponent } from './components/apartado-incidencias/apartado-incidencias.component';
import { ApartadoOtrosComponent } from './components/apartado-otros/apartado-otros.component';

import {
  AplicarVetoPayload,
  ElementoAdicional,
  ImagenInfo,
  Incidencia,
  NivelIncidenciaCatalogo,
  TipoVeto,
  ValidacionSeguridad,
  VetoExistente,
  Visitante,
  MotivoVisita,
  Area,
  DatosVisitante,
  TipoUnidad,
  ActualizarVisitantePayload,
  ValidarCurpResponse
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
  area: string;
  idEmpresaArea: number;
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

interface VehiculoForm {
  tipoUnidad: string;
  placas: string;
  marca: string;
  modelo: string;
}

@Component({
  selector: 'app-registro-entrada-almacen',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    LoadingSpinnerComponent,
    ToastComponent,
    ModalComponent,
    InputComponent,
    SelectComponent,
    CapturaCurpComponent,
    ApartadoDatosComponent,
    ApartadoVehiculoComponent,
    ApartadoValidacionesComponent,
    ApartadoIncidenciasComponent,
    ApartadoOtrosComponent
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

  apartadoActivo: string = 'curp';

  curpValidado: boolean = false;

  cargando = false;

  visitanteActual: Visitante | null = null;

  constructor(
    private cedisService: RegistroEntradaAlmacenService,
    private datosService: DatosService
  ) { }

  private proveedorSubject = new Subject<string>();


  ngOnInit(): void {
    this.cargarCatalogos();

    this.proveedorSubject.pipe(
      debounceTime(500), 
      distinctUntilChanged() 
    ).subscribe(valor => {
      this.procesarCambioProveedor(valor);
    });
  }

  ngOnDestroy(): void {
    this.liberarImagenUrl();
    if (this.proveedorSubject) {
      this.proveedorSubject.complete();
    }
  }

  private cargarCatalogos(): void {
    this.cargarMotivosVisita();
    this.cargarCatalogoTiposVeto();
    this.cargarCatalogoNiveles();
    this.cargarTiposUnidad();
  }


  //////////////////////////////////////////
  //              Toast
  //////////////////////////////////////////
  toast: ToastState = {
    visible: false,
    tipo: 'success',
    titulo: '',
    mensaje: ''
  };

  mostrarToast(tipo: 'success' | 'error', titulo: string, mensaje: string): void {
    this.toast = { visible: true, tipo, titulo, mensaje };

    setTimeout(() => {
      this.cerrarToast();
    }, 4000);
  }

  cerrarToast(): void {
    this.toast.visible = false;
  }

  //////////////////////////////////////////
  // Validación de CURP
  //////////////////////////////////////////

  onCurpChange(curp: string): void {
    this.datosForm.curp = curp.toUpperCase();
    this.curpValidado = false;
  }

  onCurpValidar(): void {
    const curp = this.obtenerCurpNormalizado();

    if (!curp || curp.length !== 18) {
      this.mostrarToast('error', 'CURP inválido', 'El CURP debe tener 18 caracteres.');
      return;
    }

    this.validarCurpEnListaVisitantes(curp);
  }

  private procesarCambioProveedor(valor: string): void {
    if (!valor || valor.trim() === '') {
      this.datosForm.razonSocial = '';
      this.datosForm.idEmpresaArea = 0;
      return;
    }

    const idProveedor = Number(valor);
    if (isNaN(idProveedor) || idProveedor <= 0) {
      this.datosForm.razonSocial = '';
      this.datosForm.idEmpresaArea = 0;
      return;
    }

    this.datosForm.idEmpresaArea = idProveedor;
    this.consultarRazonSocial(idProveedor);
  }

  private validarCurpEnListaVisitantes(curp: string): void {
    this.cargando = true;

    this.cedisService.consultarVisitantes({
      usuario: this.datosService.usuarioSignal()
    }).subscribe({
      next: (visitantes) => {
        this.cargando = false;

        const visitanteEncontrado = visitantes.find(v => v.CURP.toLowerCase() === curp.toLowerCase());

        if (visitanteEncontrado) {
          this.visitanteActual = visitanteEncontrado;
          this.curpValidado = true;
          this.procesarVisitanteEncontrado(visitanteEncontrado);
          this.seleccionarApartado('datos');

        } else {
          this.mostrarToast(
            'error',
            'CURP no encontrado',
            'El CURP no se encuentra en la lista de visitantes.'
          );
        }
      },
      error: () => {
        this.cargando = false;
        this.mostrarToast(
          'error',
          'Error de consulta',
          'No se pudo consultar la lista de visitantes.'
        );
      }
    });
  }

  private procesarVisitanteEncontrado(visitante: Visitante): void {

    // Llenar formulario con la información del visitante
    this.datosForm.curp = visitante.CURP;
    this.datosForm.motivo = visitante.idTipoIngreso.toString();

    // Llenar formulario de vehículo
    this.vehiculoForm.tipoUnidad = visitante.tipoUnidad?.toString() || '';
    this.vehiculoForm.placas = visitante.placas || '';
    this.vehiculoForm.marca = visitante.marca || '';
    this.vehiculoForm.modelo = visitante.modelo || '';

    // Consultar datos separados del visitante (nombre, apellidos)
    this.consultarDatosVisitante(visitante.CURP);

    // Procesar según la opción del motivo
    this.procesarMotivoSeleccionado(visitante.idTipoIngreso);

    // Consultar veto e imagen
    const curp = this.obtenerCurpNormalizado();
    if (curp) {
      this.consultarVeto(curp);
      this.consultarImagen(curp);
    }
  }

  private procesarMotivoSeleccionado(idTipoIngreso: number): void {
    const motivo = this.motivosVisita.find(m => m.id === idTipoIngreso);

    if (!motivo) {
      return;
    }


    const opcion = motivo.opcion;

    if (opcion === 1) {

      if (this.visitanteActual?.idEmpresaArea && this.visitanteActual.idEmpresaArea > 0) {
        this.datosForm.noProveedor = this.visitanteActual.idEmpresaArea.toString();
        this.datosForm.idEmpresaArea = this.visitanteActual.idEmpresaArea;
        this.consultarRazonSocial(this.visitanteActual.idEmpresaArea);
      }

    } else if (opcion > 1) {
      this.cargarAreasConSeleccion(opcion, this.visitanteActual?.idEmpresaArea);

    } else {
      this.datosForm.area = '';
      this.datosForm.noProveedor = '';
      this.datosForm.razonSocial = '';
      this.datosForm.idEmpresaArea = 0;
    }
  }

  private cargarAreasConSeleccion(opcion: number, idEmpresaAreaSeleccionado?: number): void {
    this.cargando = true;

    this.cedisService.obtenerAreas({
      tipo: opcion,
      usuario: this.datosService.usuarioSignal()
    }).subscribe({
      next: (areas) => {

        this.areas = areas ?? [];
        this.areaOptions = this.areas.map((a) => ({
          label: a.descripcionArea,
          value: a.idArea.toString()
        }));

        if (idEmpresaAreaSeleccionado && idEmpresaAreaSeleccionado > 0) {
          const areaExistente = this.areas.find(a => a.idArea === idEmpresaAreaSeleccionado);

          if (areaExistente) {
            this.datosForm.idEmpresaArea = idEmpresaAreaSeleccionado;
            this.datosForm.area = idEmpresaAreaSeleccionado.toString();
          } else {
            this.datosForm.area = '';
            this.datosForm.idEmpresaArea = 0;
          }
        } else {
          this.datosForm.area = '';
          this.datosForm.idEmpresaArea = 0;
        }

        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.areas = [];
        this.areaOptions = [];
        this.datosForm.area = '';
        this.datosForm.idEmpresaArea = 0;

        this.mostrarToast(
          'error',
          'Áreas no disponibles',
          'No se pudieron cargar las áreas para este tipo de visita.'
        );
      }
    });
  }

  private consultarDatosVisitante(curp: string): void {
    this.cedisService.obtenerDatosVisitante({
      curp: curp
    }).subscribe({
      next: (datos) => {
        this.datosForm.nombre = datos.nombre;
        this.datosForm.apellidoP = datos.paterno;
        this.datosForm.apellidoM = datos.materno;
      },
      error: () => {
      }
    });
  }

  //////////////////////////////////////////
  // Apartado Datos
  //////////////////////////////////////////
  motivosVisita: MotivoVisita[] = [];
  motivoOptions: ISelectOption[] = [];
  areas: Area[] = [];
  areaOptions: ISelectOption[] = [];
  tiposUnidad: TipoUnidad[] = [];
  tipoUnidadOptions: ISelectOption[] = [];

  private cargarMotivosVisita(): void {
    this.cedisService.obtenerMotivosVisita({
      usuario: this.datosService.usuarioSignal()
    }).subscribe({
      next: (motivos) => {
        this.motivosVisita = motivos ?? [];
        this.motivoOptions = this.motivosVisita.map((m) => ({
          label: m.motivo,
          value: m.id.toString()
        }));
      },
      error: () => {
        this.mostrarToast(
          'error',
          'Catálogo no disponible',
          'No se pudo cargar el catálogo de motivos de visita.'
        );
      }
    });
  }

  private cargarTiposUnidad(): void {
    this.cedisService.obtenerTiposUnidad({
      usuario: this.datosService.usuarioSignal()
    }).subscribe({
      next: (tipos) => {
        this.tiposUnidad = tipos ?? [];
        this.tipoUnidadOptions = this.tiposUnidad.map((t) => ({
          label: t.tipoUnidad,
          value: t.id.toString()
        }));
      },
      error: () => {
        this.mostrarToast(
          'error',
          'Catálogo no disponible',
          'No se pudo cargar el catálogo de tipos de unidad.'
        );
      }
    });
  }

  get opcionMotivoSeleccionado(): number {
    const motivo = this.motivosVisita.find(
      (m) => m.id.toString() === this.datosForm.motivo
    );
    return motivo ? motivo.opcion : 0;
  }

  onMotivoChange(valor: string): void {

    this.datosForm.motivo = valor;

    const opcion = this.opcionMotivoSeleccionado;

    // Resetear todos los campos relacionados al cambio de motivo
    this.datosForm.area = '';
    this.datosForm.noProveedor = '';
    this.datosForm.razonSocial = '';
    this.datosForm.idEmpresaArea = 0;

    // Limpiar lista de áreas
    this.areas = [];
    this.areaOptions = [];

    if (opcion > 1) {
      this.cargarAreas(opcion);

    } 
  }

  onNoProveedorChange(valor: string): void {

    this.datosForm.noProveedor = valor;

    if (!valor || valor.trim() === '') {
      this.datosForm.razonSocial = '';
      this.datosForm.idEmpresaArea = 0;
      return;
    }

    const idProveedor = Number(valor);
    if (isNaN(idProveedor) || idProveedor <= 0) {
      this.datosForm.razonSocial = '';
      this.datosForm.idEmpresaArea = 0;
      return;
    }

    this.datosForm.idEmpresaArea = idProveedor;
    this.consultarRazonSocial(idProveedor);
  }

  private consultarRazonSocial(idProveedor: number): void {

    if (!idProveedor || idProveedor <= 0) {
      this.datosForm.razonSocial = '';
      return;
    }

    this.cargando = true;

    this.cedisService.obtenerRazonSocialProveedor({
      idProvedor: idProveedor
    }).subscribe({
      next: (resp) => {
        this.cargando = false;

        if (resp && resp.razonSocial) {
          this.datosForm.razonSocial = resp.razonSocial;
          this.datosForm.noProveedor = idProveedor.toString();
          this.datosForm.idEmpresaArea = idProveedor;
        } else {
          this.datosForm.razonSocial = '';
        }
      },
      error: (error) => {
        this.cargando = false;
        this.datosForm.razonSocial = '';

        if (error.message.includes('tiempo de espera')) {
          this.mostrarToast(
            'error',
            'Tiempo de espera agotado',
            `La consulta del proveedor ${idProveedor} excedió el tiempo límite.`
          );
        } else {
          this.mostrarToast(
            'error',
            'Error de consulta',
            `No se pudo obtener la razón social del proveedor ${idProveedor}.`
          );
        }
      }
    });
  }

  private cargarAreas(opcion: number): void {
    this.cargando = true;

    this.cedisService.obtenerAreas({
      tipo: opcion,
      usuario: this.datosService.usuarioSignal()
    }).subscribe({
      next: (areas) => {

        this.areas = areas ?? [];
        this.areaOptions = this.areas.map((a) => ({
          label: a.descripcionArea,
          value: a.idArea.toString()
        }));

        this.datosForm.area = '';
        this.datosForm.idEmpresaArea = 0;

        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.areas = [];
        this.areaOptions = [];
        this.datosForm.area = '';
        this.datosForm.idEmpresaArea = 0;

        this.mostrarToast(
          'error',
          'Áreas no disponibles',
          'No se pudieron cargar las áreas para este tipo de visita.'
        );
      }
    });
  }


  onAreaChange(valor: string): void {

    this.datosForm.area = valor;

    if (valor && valor !== '') {
      this.datosForm.idEmpresaArea = Number(valor);
    } else {
      this.datosForm.idEmpresaArea = 0;
    }
  }



  //////////////////////////////////////////
  // Vehículo
  //////////////////////////////////////////
  vehiculoForm: VehiculoForm = {
    tipoUnidad: '',
    placas: '',
    marca: '',
    modelo: ''
  };

  actualizarVisitante(): void {
    if (!this.visitanteActual) {
      this.mostrarToast('error', 'Error', 'No hay un visitante seleccionado.');
      return;
    }

    if (!this.validarCamposSegunOpcion()) {
      return;
    }

    this.validarCurpAntesDeActualizar();
  }

  private validarCamposSegunOpcion(): boolean {
    const opcion = this.opcionMotivoSeleccionado;


    if (opcion === 1) {
      if (!this.datosForm.noProveedor || this.datosForm.noProveedor.trim() === '') {
        this.mostrarToast(
          'error',
          'Proveedor requerido',
          'Debe ingresar un número de proveedor válido para actualizar.'
        );
        return false;
      }

      const idProveedor = Number(this.datosForm.noProveedor);
      if (isNaN(idProveedor) || idProveedor <= 0) {
        this.mostrarToast(
          'error',
          'Proveedor inválido',
          'El número de proveedor debe ser un valor numérico mayor a 0.'
        );
        return false;
      }

      if (!this.datosForm.razonSocial || this.datosForm.razonSocial.trim() === '') {
        this.mostrarToast(
          'error',
          'Razón social requerida',
          'Debe consultar la razón social del proveedor antes de actualizar.'
        );
        return false;
      }

      return true;

    } else if (opcion > 1) {
      if (!this.datosForm.area || this.datosForm.area === '' || this.datosForm.idEmpresaArea === 0) {
        this.mostrarToast(
          'error',
          'Área requerida',
          'Debe seleccionar un área válida para actualizar.'
        );
        return false;
      }

      const areaSeleccionada = this.areas.find(a => a.idArea === this.datosForm.idEmpresaArea);
      if (!areaSeleccionada) {
        this.mostrarToast(
          'error',
          'Área inválida',
          'El área seleccionada no es válida. Por favor seleccione otra.'
        );
        return false;
      }

      return true;

    } else {
      return true;
    }
  }

  onVehiculoFormChange(vehiculoForm: VehiculoForm): void {
    this.vehiculoForm = vehiculoForm;
  }

  private validarCurpAntesDeActualizar(): void {
    const curp = this.obtenerCurpNormalizado();

    this.cargando = true;

    this.cedisService.validarCurp({
      curp: curp,
      nombre: this.datosForm.nombre,
      paterno: this.datosForm.apellidoP,
      materno: this.datosForm.apellidoM,
      usuario: this.datosService.usuarioSignal()
    }).subscribe({
      next: (resp: ValidarCurpResponse) => {

        if (resp.errId === 0) {
          this.procesarActualizacionVisitante();
        } else {
          this.cargando = false;
          this.mostrarToast(
            'error',
            'Error de validación',
            resp.errMsg || 'Los datos no coinciden con el CURP proporcionado.'
          );
        }
      },
      error: (error) => {
        this.cargando = false;
        this.mostrarToast(
          'error',
          'Error de validación',
          'No se pudo validar el CURP con los datos proporcionados.'
        );
      }
    });
  }

  private procesarActualizacionVisitante(): void {
    if (!this.visitanteActual) {
      return;
    }

    let idEmpresaArea = 0;
    let empresaArea = '';

    if (this.opcionMotivoSeleccionado === 1) {
      idEmpresaArea = this.datosForm.idEmpresaArea;
      empresaArea = this.datosForm.razonSocial;

      if (idEmpresaArea <= 0 || !empresaArea) {
        this.cargando = false;
        this.mostrarToast(
          'error',
          'Datos incompletos',
          'El proveedor o la razón social no son válidos.'
        );
        return;
      }

    } else if (this.opcionMotivoSeleccionado > 1) {
      idEmpresaArea = this.datosForm.idEmpresaArea;

      const area = this.areas.find(a => a.idArea === idEmpresaArea);

      if (!area || idEmpresaArea <= 0) {
        this.cargando = false;
        this.mostrarToast(
          'error',
          'Área inválida',
          'Debe seleccionar un área válida para actualizar.'
        );
        return;
      }

      empresaArea = area.descripcionArea;

    } else {
      idEmpresaArea = this.visitanteActual.idEmpresaArea;
      empresaArea = this.visitanteActual.empresaArea;
    }

    const payload: ActualizarVisitantePayload = {
      idCita: this.visitanteActual.idCita,
      idTipoIngreso: Number(this.datosForm.motivo),
      idEmpresaArea: idEmpresaArea,
      empresaArea: empresaArea,
      curp: this.visitanteActual.CURP,
      nombre: this.datosForm.nombre,
      paterno: this.datosForm.apellidoP,
      materno: this.datosForm.apellidoM,
      unidad: Number(this.vehiculoForm.tipoUnidad) || 0,
      placas: this.vehiculoForm.placas || '',
      marca: this.vehiculoForm.marca || '',
      modelo: this.vehiculoForm.modelo || '',
      usuario: this.datosService.usuarioSignal()
    };


    this.cedisService.actualizarVisitante(payload).subscribe({
      next: (respuesta) => {
        this.cargando = false;

        this.mostrarToast(
          'success',
          'Datos actualizados',
          'La información del visitante se actualizó.'
        );

        // Actualizar el visitante actual con los nuevos datos
        if (this.visitanteActual) {
          this.visitanteActual.idTipoIngreso = Number(this.datosForm.motivo);
          this.visitanteActual.idEmpresaArea = idEmpresaArea;
          this.visitanteActual.empresaArea = empresaArea;
          this.visitanteActual.nombre = `${this.datosForm.nombre} ${this.datosForm.apellidoP} ${this.datosForm.apellidoM}`.trim();
          this.visitanteActual.tipoUnidad = Number(this.vehiculoForm.tipoUnidad) || 0;
          this.visitanteActual.placas = this.vehiculoForm.placas || '';
          this.visitanteActual.marca = this.vehiculoForm.marca || '';
          this.visitanteActual.modelo = this.vehiculoForm.modelo || '';
        }

        // Recargar validaciones de seguridad después de actualizar
        this.recargarValidacionesDespuesDeActualizar();

        // Recargar otros datos relacionados
        const curp = this.obtenerCurpNormalizado();
        if (curp) {
          this.consultarVeto(curp);
          this.consultarIncidencias(curp);
          this.consultarElementosAdicionales(curp);
        }
      },
      error: (error) => {
        console.error('Error al actualizar visitante:', error);
        this.cargando = false;
        this.mostrarToast(
          'error',
          'Error al actualizar',
          'No se pudieron actualizar los datos del visitante.'
        );
      }
    });
  }


  private recargarValidacionesDespuesDeActualizar(): void {
    const curp = this.obtenerCurpNormalizado();

    if (!curp) {
      return;
    }

    this.validaciones = [];
    this.validacionesCargadas = false;

    this.consultarValidaciones(curp);
  }

  //////////////////////////////////////////
  // Apartado Datos
  //////////////////////////////////////////
  private datosFormInicial: DatosForm = {
    curp: '',
    nombre: '',
    apellidoP: '',
    apellidoM: '',
    motivo: '',
    noProveedor: '',
    razonSocial: '',
    area: '',
    idEmpresaArea: 0
  };

  datosForm: DatosForm = { ...this.datosFormInicial };

  onDatosFormChange(event: { campo: string, valor: any }): void {

    (this.datosForm as any)[event.campo] = event.valor;

    if (event.campo === 'curp') {
      this.datosForm.curp = event.valor.toUpperCase();
      this.curpValidado = this.datosForm.curp.length === 18;
    }

    if (event.campo === 'motivo') {
      this.onMotivoChange(event.valor);
    }

    if (event.campo === 'area') {
      this.onAreaChange(event.valor);
    }

    if (event.campo === 'noProveedor') {
      this.onNoProveedorChange(event.valor);
    }
  }

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

  imagenInfo: ImagenInfo | null = null;

  imagenUrl: string | null = null;
  imagenAmpliada = false;

  get imagenExiste(): boolean {
    return !!this.imagenInfo;
  }

  consultarImagen(curp: string): void {
    this.cargando = true;

    this.cedisService.obtenerImagenInfo(curp).subscribe({
      next: (info) => {
        this.imagenInfo = info;
        this.cargarImagenBinario(curp);
      },
      error: (error) => {
        this.cargando = false;
        this.imagenInfo = null;
        this.liberarImagenUrl();
        this.imagenUrl = null;
      }
    });
  }


  abrirCapturaImagen(inputImagen: HTMLInputElement): void {
    if (!this.obtenerCurpNormalizado()) {
      this.mostrarToast('error', 'CURP requerido', 'Captura el CURP en el apartado de Datos antes de subir una imagen.');
      return;
    }
    inputImagen.click();
  }

  private cargarImagenBinario(curp: string): void {

    this.cedisService.obtenerImagenBinario(curp).subscribe({
      next: (blob) => {
        this.liberarImagenUrl();
        this.imagenUrl = URL.createObjectURL(blob);
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.mostrarToast('error', 'Error al cargar imagen', 'No se pudo descargar el archivo de la imagen.');
      }
    });
  }

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

  private subirImagenApi(curp: string, file: File): void {
    this.cargando = true;

    this.cedisService.subirImagen(curp, file).subscribe({
      next: (info) => {
        this.imagenInfo = info;
        this.cargarImagenBinario(curp);
        this.mostrarToast('success', 'Imagen subida', `Se subió "${file.name}".`);
      },
      error: (error) => {
        this.cargando = false;
        this.mostrarToast('error', 'Error al subir', 'No se pudo subir la imagen.');
      }
    });
  }

  private actualizarImagenApi(curp: string, file: File): void {
    this.cargando = true;

    this.cedisService.actualizarImagen(curp, file).subscribe({
      next: (info) => {
        this.imagenInfo = info;
        this.cargarImagenBinario(curp);
        this.mostrarToast('success', 'Imagen actualizada', 'La imagen se reemplazó.');
      },
      error: (error) => {
        this.cargando = false;
        this.mostrarToast('error', 'Error al actualizar', 'No se pudo actualizar la imagen.');
      }
    });
  }

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
        this.imagenAmpliada = false;
        this.imagenInfo = null;
        this.cargando = false;
        this.mostrarToast('success', 'Imagen eliminada', resp.mensaje || 'La imagen fue eliminada.');
      },
      error: (error) => {
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
      error: (error) => {
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

  toggleValidacion(event: { item: ValidacionSeguridad, activa: boolean }): void {
    const curp = this.obtenerCurpNormalizado();

    if (!curp) {
      this.mostrarToast('error', 'CURP requerido', 'Captura el CURP en el apartado de Datos.');
      return;
    }

    const estadoAnterior = event.item.estadoValidacion;
    event.item.estadoValidacion = event.activa ? 1 : 0;

    this.cedisService
      .actualizarValidacion({
        curp,
        clave: event.item.lblClaveValidacion,
        activa: event.activa,
        usuario: this.datosService.usuarioSignal()
      })
      .subscribe({
        next: () => {
          this.mostrarToast(
            'success',
            'Validación actualizada',
            `"${event.item.lblDescripcionValidacion}" se actualizó.`
          );
        },
        error: () => {
          event.item.estadoValidacion = estadoAnterior;
          this.mostrarToast(
            'error',
            'Error al actualizar',
            `No se pudo actualizar "${event.item.lblDescripcionValidacion}".`
          );
        }
      });
  }

  //////////////////////////////////////////
  //          Veto
  //////////////////////////////////////////
  catalogoTiposVeto: TipoVeto[] = [];
  tipoVetoOptions: ISelectOption[] = [];

  vetoExistente: VetoExistente | null = null;
  vetoConsultado = false;
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
      error: (error) => {
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
        this.vetoExistente = veto && veto.lblTipoVeto ? veto : null;
        this.vetoConsultado = true;
        this.editandoVeto = false;
        this.cargando = false;
      },
      error: (error) => {
        this.vetoExistente = null;
        this.vetoConsultado = true;
        this.editandoVeto = false;
        this.cargando = false;
      }
    });
  }

  get tipoVetoSeleccionadoEsDefinitivo(): boolean {
    const tipo = this.catalogoTiposVeto.find(
      (t) => t.lblTipoVeto === this.nuevoVeto.tipoVeto
    );
    return !!tipo && tipo.lblDescripcionTipoVeto.trim().toLowerCase() === 'definitivo';
  }

  onTipoVetoChange(valor: string): void {
    this.nuevoVeto.tipoVeto = valor;

    if (this.tipoVetoSeleccionadoEsDefinitivo) {
      this.nuevoVeto.fechaTermino = '';
    }
  }

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
      usuario: this.datosService.usuarioSignal()
    };

    this.cargando = true;

    this.cedisService.aplicarVeto(payload).subscribe({
      next: (respuesta) => {
        this.cargando = false;
        this.mostrarToast('success', 'Veto aplicado', 'El veto se registró.');
        this.nuevoVeto = { ...this.nuevoVetoInicial };
        this.consultarVeto(curp);
      },
      error: (error) => {
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
        usuario: this.datosService.usuarioSignal()
      })
      .subscribe({
        next: () => {
          this.cargando = false;
          this.mostrarToast('success', 'Incidencia registrada', 'La incidencia se agregó.');
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
          this.mostrarToast('success', 'Incidencia actualizada', 'Los cambios se guardaron.');
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
        usuario: this.datosService.usuarioSignal()
      })
      .subscribe({
        next: () => {
          this.cargando = false;
          this.mostrarToast('success', 'Elemento registrado', 'El elemento se agregó.');
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
        usuario: this.datosService.usuarioSignal()
      })
      .subscribe({
        next: () => {
          this.cargando = false;
          this.mostrarToast('success', 'Elemento actualizado', 'Los cambios se guardaron.');
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
    if (id === 'curp') {
      return;
    }

    if (!this.curpValidado) {
      this.mostrarToast('error', 'CURP requerido', 'Debe validar el CURP antes de acceder a este apartado.');
      return;
    }

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
    this.curpValidado = false;
    this.apartadoActivo = 'curp';
    this.visitanteActual = null;
    this.datosForm = { ...this.datosFormInicial };
    this.vehiculoForm = {
      tipoUnidad: '',
      placas: '',
      marca: '',
      modelo: ''
    };
    this.areas = [];
    this.areaOptions = [];

    this.liberarImagenUrl();
    this.imagenInfo = null;
    this.imagenUrl = null;
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
  }
}