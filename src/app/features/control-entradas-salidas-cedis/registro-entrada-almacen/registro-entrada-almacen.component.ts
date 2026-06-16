import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  IncidenciasService,
  IncidenciaResponse,
} from './services/incidencias.service';
import {
  ValidacionesSeguridadService,
  ValidacionSeguridad,
} from './services/validaciones-seguridad.service';
import {
  ElementosAdicionalesService,
  ElementoAdicionalResponse,
} from './services/elementos-adicionales.service';
import {
  VetoService,
  TipoVetoResponse,
} from './services/veto.service';

// ── Interfaces ────────────────────────────────────────────
export interface Incidencia {
  fecha: string;
  nivel: number | null;
  descripcion: string;
}

export interface OtroItem {
  tipo: string;
  descripcion: string;
  cantidad: number | null;
}

interface DatosCurp {
  nombre: string;
  motivo: string;
  noProveedor: string;
  razonSocial: string;
  vehiculo: {
    tipoVehiculo: string;
    placa: string;
    modelo: string;
    marca: string;
  } | null;
}

// ── Catálogo simulado ────────────────────────────────────
const CURP_DB: Record<string, DatosCurp> = {
  MEGA780615HDFLML08: {
    nombre: 'ALEJANDRO MERCADO GONZALES',
    motivo: 'Chofer',
    noProveedor: '',
    razonSocial: '',
    vehiculo: { tipoVehiculo: 'Camión', placa: 'ABC-123', modelo: '2020', marca: 'Kenworth' },
  },
  GOAM850515MDFNRL08: {
    nombre: 'María González Arce',
    motivo: 'Maniobra',
    noProveedor: 'PROV-0042',
    razonSocial: 'Transportes González S.A.',
    vehiculo: { tipoVehiculo: 'Camioneta', placa: 'XYZ-456', modelo: '2021', marca: 'Ford' },
  },
  RAHN780320HCSNVR05: {
    nombre: 'Hernán Ramos Nieto',
    motivo: 'Encargado',
    noProveedor: 'PROV-0099',
    razonSocial: 'Fletes Ramos S.C.',
    vehiculo: { tipoVehiculo: 'Camión', placa: 'PQR-789', modelo: '2019', marca: 'Freightliner' },
  },
  SALD920711MDFRRN09: {
    nombre: 'Daniela Salinas Reyes',
    motivo: 'Visita',
    noProveedor: '',
    razonSocial: '',
    vehiculo: null,
  },
};

// ── Motivos que muestran campos de proveedor ──────────────
const MOTIVOS_CON_PROVEEDOR = new Set(['Chofer', 'Maniobra', 'Encargado']);

@Component({
  selector: 'app-registro-visitante',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './registro-entrada-almacen.component.html',
  styleUrls: ['./registro-entrada-almacen.component.css'],
})
export class RegistroEntradaAlmacenComponent implements OnInit {

  // ── Formularios independientes por sección ─────────────
  formDatos!: FormGroup;
  formVehiculo!: FormGroup;
  formEquipo!: FormGroup;
  formIncidencias!: FormGroup;
  formOtros!: FormGroup;

  fotoPreview: string | null = null;
  seccionActiva = 'datos';

  curpEncontrado = false;
  editandoVeto = false;

  // Modal descripción
  modalDescripcion: string | null = null;
  // Modal confirmación reset
  modalResetVisible = false;
  // Modal edición de incidencia
  modalEditIncidencia: { index: number; form: FormGroup } | null = null;
  // Modal edición de otros
  modalEditOtro: { index: number; form: FormGroup } | null = null;

  motivosOpciones = ['Chofer', 'Maniobra', 'Encargado', 'Visita'];
  tiposVehiculo = ['Camión', 'Camioneta', 'Automóvil', 'Motocicleta', 'Otro'];

  // ── Niveles desde catálogo (tipo 4) ─────────────────────
  nivelesOpciones: { clave: string; etiqueta: string }[] = [];
  cargandoNiveles = false;

  // ── Tipos de veto desde API ─────────────────────────────
  tiposVetoOpciones: TipoVetoResponse[] = [];
  cargandoTiposVeto = false;
  guardandoVeto = false;
  diasRestantes = '';
  fechaMinima = new Date().toISOString().split('T')[0];

  // ── Validaciones de seguridad desde API ─────────────────
  validacionesSeguridad: ValidacionSeguridad[] = [];
  cargandoEquipo = false;

  // Usuario activo
  usuarioActual = '500011';

  secciones = [
    { id: 'datos', label: 'Datos', icon: 'ti ti-user' },
    { id: 'vehiculo', label: 'Vehículo', icon: 'ti ti-truck' },
    { id: 'equipo', label: 'Validaciones', icon: 'ti ti-shield-check' },
    { id: 'incidencias', label: 'Incidencias', icon: 'ti ti-alert-triangle' },
    { id: 'otros', label: 'Otros', icon: 'ti ti-package' },
  ];

  nuevaIncidenciaForm!: FormGroup;
  nuevoOtroForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private incidenciasService: IncidenciasService,
    private validacionesSeguridadService: ValidacionesSeguridadService,
    private elementosAdicionalesService: ElementosAdicionalesService,
    private vetoService: VetoService,
  ) { }

  ngOnInit(): void {
    this.buildForms();
    this.cargarCatalogoNiveles();
    this.cargarTiposVeto();
  }

  // ═══════════════════════════════════════════════════════
  //  CATÁLOGO DE NIVELES (tipo 4)
  // ═══════════════════════════════════════════════════════
  private cargarCatalogoNiveles(): void {
    this.cargandoNiveles = true;

    this.incidenciasService.obtenerNiveles().subscribe({
      next: (items: IncidenciaResponse[]) => {
        this.nivelesOpciones = items.map(i => ({
          clave: i.lblDescripcionNivel,
          etiqueta: i.lblDescripcion,
        }));
        this.cargandoNiveles = false;
      },
      error: () => {
        this.nivelesOpciones = Array.from({ length: 10 }, (_, i) => ({
          clave: String(i + 1),
          etiqueta: `Nivel ${i + 1}`,
        }));
        this.cargandoNiveles = false;
      },
    });
  }

  // ═══════════════════════════════════════════════════════
  //  CATÁLOGO DE TIPOS DE VETO
  // ═══════════════════════════════════════════════════════
  private cargarTiposVeto(): void {
    this.cargandoTiposVeto = true;

    this.vetoService.obtenerTiposVeto().subscribe({
      next: (items) => {
        this.tiposVetoOpciones = items;
        this.cargandoTiposVeto = false;
      },
      error: () => {
        this.tiposVetoOpciones = [];
        this.cargandoTiposVeto = false;
      },
    });
  }

  // ═══════════════════════════════════════════════════════
  //  CONSTRUCCIÓN DE FORMULARIOS
  // ═══════════════════════════════════════════════════════
  private buildForms(): void {

    // ── 1. DATOS ──────────────────────────────────────────
    this.formDatos = this.fb.group({
      curp: ['', [Validators.required, Validators.minLength(18), Validators.maxLength(18)]],
      nombre: [{ value: '', disabled: true }],
      motivo: ['', Validators.required],
      noProveedor: [''],
      razonSocial: [''],
      foto: [null],
      vetado: [false],
      tipoBan: [''],
      fechaInicio: [''],
      fechaTermino: [''],
    });

    // ── 2. VEHÍCULO ───────────────────────────────────────
    this.formVehiculo = this.fb.group({
      tipoVehiculo: [''],
      placa: [''],
      modelo: [''],
      marca: [''],
    });

    // ── 3. EQUIPO ─────────────────────────────────────────
    this.formEquipo = this.fb.group({});

    // ── 4. INCIDENCIAS ────────────────────────────────────
    this.formIncidencias = this.fb.group({
      incidencias: this.fb.array([]),
    });

    // ── 5. OTROS ──────────────────────────────────────────
    this.formOtros = this.fb.group({
      otros: this.fb.array([]),
    });

    // ── Sub-formularios de alta ───────────────────────────
    this.nuevaIncidenciaForm = this.fb.group({
      nivel: ['1'],
      descripcion: ['', [Validators.required, Validators.maxLength(255)]],
    });

    this.nuevoOtroForm = this.fb.group({
      tipo: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(255)]],
      cantidad: [null],
    });
  }

  // ═══════════════════════════════════════════════════════
  //  EQUIPO DE SEGURIDAD
  // ═══════════════════════════════════════════════════════
  cargarValidacionesSeguridad(curp: string): void {
    Object.keys(this.formEquipo.controls).forEach(k =>
      this.formEquipo.removeControl(k)
    );
    this.validacionesSeguridad = [];

    if (!curp || curp.length < 18) return;

    this.cargandoEquipo = true;

    this.validacionesSeguridadService.obtener(curp).subscribe({
      next: (lista) => {
        this.validacionesSeguridad = lista;

        lista.forEach(v => {
          const ctrl = this.fb.control(v.estadoValidacion === 1);
          this.formEquipo.addControl(v.lblClaveValidacion, ctrl);

          ctrl.valueChanges.subscribe((activa: boolean | null) => {
            this.onToggleValidacion(v.lblClaveValidacion, !!activa);
          });
        });

        this.cargandoEquipo = false;
      },
      error: () => {
        console.warn('No se pudieron cargar validaciones para:', curp);
        this.cargandoEquipo = false;
      },
    });
  }

  onToggleValidacion(clave: string, activa: boolean): void {
    const curp = (this.formDatos.get('curp')?.value ?? '').trim().toUpperCase();

    this.validacionesSeguridadService.toggle({
      curp,
      clave,
      activa,
      usuario: this.usuarioActual,
    }).subscribe({
      next: (res) => {
        if (res.errId !== 0) {
          console.error('Error al actualizar validación:', res.errMsg);
          this.formEquipo.get(clave)?.setValue(!activa, { emitEvent: false });
        }
      },
      error: () => {
        console.error('Error de red al actualizar validación');
        this.formEquipo.get(clave)?.setValue(!activa, { emitEvent: false });
      },
    });
  }

  private limpiarEquipo(): void {
    Object.keys(this.formEquipo.controls).forEach(k =>
      this.formEquipo.removeControl(k)
    );
    this.validacionesSeguridad = [];
  }

  // ═══════════════════════════════════════════════════════
  //  GETTERS DE TIPADO
  // ═══════════════════════════════════════════════════════
  asControl(group: FormGroup, name: string): FormControl {
    const ctrl = group.get(name);
    if (!ctrl) throw new Error(`Control "${name}" no encontrado`);
    return ctrl as FormControl;
  }

  get incNivel(): FormControl { return this.asControl(this.nuevaIncidenciaForm, 'nivel'); }
  get incDescripcion(): FormControl { return this.asControl(this.nuevaIncidenciaForm, 'descripcion'); }
  get otrTipo(): FormControl { return this.asControl(this.nuevoOtroForm, 'tipo'); }
  get otrCantidad(): FormControl { return this.asControl(this.nuevoOtroForm, 'cantidad'); }
  get otrDescripcion(): FormControl { return this.asControl(this.nuevoOtroForm, 'descripcion'); }

  // ═══════════════════════════════════════════════════════
  //  GETTERS DE ESTADO
  // ═══════════════════════════════════════════════════════
  get esBanDefinitivo(): boolean {
    return this.formDatos.get('tipoBan')?.value === '2';
  }

  get motivoRequiereProveedor(): boolean {
    return MOTIVOS_CON_PROVEEDOR.has(this.formDatos.get('motivo')?.value ?? '');
  }

  get tieneVetoPrevio(): boolean {
    return this.curpEncontrado && !!this.formDatos.get('vetado')?.value;
  }

  get vetoEstaBlockeado(): boolean {
    return this.tieneVetoPrevio && !this.editandoVeto;
  }

  getDescripcionTipoVeto(tipo: string): string {
    const found = this.tiposVetoOpciones.find(t => t.lblTipoVeto === tipo);
    return found ? found.lblDescripcionTipoVeto : tipo;
  }

  // ═══════════════════════════════════════════════════════
  //  COLOR PARA TABLA DE INCIDENCIAS
  // ═══════════════════════════════════════════════════════  
  getColorNivel(inc: any): string {
    return (inc.get('colorNivel')?.value ?? '').trim();
  }

  // ═══════════════════════════════════════════════════════
  //  FOTO
  // ═══════════════════════════════════════════════════════
  onFotoCapturada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.fotoPreview = e.target?.result as string;
        this.formDatos.patchValue({ foto: input.files![0] });
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  eliminarFoto(): void {
    this.fotoPreview = null;
    this.formDatos.patchValue({ foto: null });
  }

  // ═══════════════════════════════════════════════════════
  //  BÚSQUEDA POR CURP
  // ═══════════════════════════════════════════════════════
  onCurpBlur(): void {
    const curp = (this.formDatos.get('curp')?.value ?? '').trim().toUpperCase();
    if (curp.length < 18) return;

    const datos: DatosCurp | undefined = CURP_DB[curp];
    this.editandoVeto = false;

    if (datos) {
      this.curpEncontrado = true;

      this.formDatos.get('nombre')?.setValue(datos.nombre);
      this.formDatos.get('motivo')?.setValue(datos.motivo);
      this.formDatos.get('nombre')?.disable();
      this.formDatos.get('motivo')?.disable();

      this.formDatos.patchValue({
        noProveedor: datos.noProveedor,
        razonSocial: datos.razonSocial,
      });

      if (datos.vehiculo) {
        this.formVehiculo.patchValue(datos.vehiculo);
        this.disableVehiculo();
      } else {
        this.formVehiculo.patchValue({ tipoVehiculo: '', placa: '', modelo: '', marca: '' });
        this.enableVehiculo();
      }

      // Veto: se consulta directamente al endpoint
      this.consultarVeto(curp);

      this.cargarValidacionesSeguridad(curp);

      // Incidencias
      this.incidencias.clear();
      this.incidenciasService.obtener(curp).subscribe({
        next: (lista: IncidenciaResponse[]) => {
          lista.forEach(inc => {
            this.incidencias.push(
              this.fb.group({
                id: [inc.lblId],
                fecha: [inc.lblFecha],
                nivel: [inc.lblClaveNivel],
                colorNivel: [inc.lblColor],
                descripcion: [inc.lblDescripcion, [Validators.required, Validators.maxLength(255)]],
              })
            );
          });
        },
        error: () => console.warn('No se pudieron cargar incidencias para:', curp),
      });

      // Otros (elementos adicionales)
      this.recargarOtros(curp);

    } else {
      this.curpEncontrado = false;
      this.formDatos.get('nombre')?.enable();
      this.formDatos.get('motivo')?.enable();
      this.enableVehiculo();
      this.formDatos.get('nombre')?.setValue('');
      this.formDatos.patchValue({ motivo: '', noProveedor: '', razonSocial: '' });
      this.formDatos.patchValue({
        vetado: false, tipoBan: '', fechaInicio: '', fechaTermino: '',
      });
      this.incidencias.clear();
      this.otros.clear();
      this.limpiarEquipo();
    }
  }

  private recargarIncidencias(curp: string): void {
    this.incidencias.clear();
    this.incidenciasService.obtener(curp).subscribe({
      next: (lista: IncidenciaResponse[]) => {
        lista.forEach(inc => {
          this.incidencias.push(
            this.fb.group({
              id: [inc.lblId],
              fecha: [inc.lblFecha],
              nivel: [inc.lblClaveNivel],
              colorNivel: [inc.lblColor],
              descripcion: [inc.lblDescripcion, [Validators.required, Validators.maxLength(255)]],
            })
          );
        });
      },
      error: () => console.warn('No se pudieron recargar incidencias para:', curp),
    });
  }

  private recargarOtros(curp: string): void {
    this.otros.clear();
    this.elementosAdicionalesService.obtener(curp).subscribe({
      next: (lista: ElementoAdicionalResponse[]) => {
        lista.forEach(el => {
          this.otros.push(
            this.fb.group({
              id: [el.lblId],
              tipo: [el.lblClasifica, Validators.required],
              descripcion: [el.lblDescripcion, Validators.maxLength(255)],
              cantidad: [el.lblCantidad],
            })
          );
        });
      },
      error: () => console.warn('No se pudieron cargar elementos adicionales para:', curp),
    });
  }

  private disableVehiculo(): void {
    ['tipoVehiculo', 'placa', 'modelo', 'marca'].forEach(f =>
      this.formVehiculo.get(f)?.disable()
    );
  }

  private enableVehiculo(): void {
    ['tipoVehiculo', 'placa', 'modelo', 'marca'].forEach(f =>
      this.formVehiculo.get(f)?.enable()
    );
  }

  // ═══════════════════════════════════════════════════════
  //  VETO
  // ═══════════════════════════════════════════════════════
  activarEdicionVeto(): void { this.editandoVeto = true; }

  cancelarEdicionVeto(): void {
    this.editandoVeto = false;
    this.onCurpBlur();
  }

  /**
   * Consulta si el CURP tiene un veto vigente y rellena el formulario.
   * Si la API responde sin err_id = 0 o sin lbl_TipoVeto, se asume sin veto.
   */
  private consultarVeto(curp: string): void {
    this.diasRestantes = ''
    this.formDatos.patchValue({
      vetado: false, tipoBan: '', fechaInicio: '', fechaTermino: '',
    });

    this.vetoService.consultarVeto(curp).subscribe({
      next: (res) => {
        if (res.errId === 0 && res.lblTipoVeto) {

          this.diasRestantes = res.lblDiasRestantes ?? '';

          this.formDatos.patchValue({
            vetado: true,
            tipoBan: res.lblTipoVeto,
            fechaInicio: this.convertirAInputDate(res.lblFechaInicio),
            fechaTermino: this.convertirAInputDate(res.lblFechaTermino),
          });

        }
      },
      error: () => {
        // Sin veto registrado o error de consulta: se deja el formulario sin veto
      },
    });
  }

  /**
   * Convierte una fecha "MM/DD/YYYY HH:mm:ss" (formato de la API) a
   * "YYYY-MM-DD" (formato requerido por <input type="date">).
   */
  private convertirAInputDate(fecha: string): string {
    if (!fecha) return '';
    const soloFecha = fecha.split(' ')[0];
    const partes = soloFecha.split('/');
    if (partes.length !== 3) return '';
    const [mes, dia, anio] = partes;
    return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }

  /**
   * Convierte una fecha "YYYY-MM-DD" (formato de <input type="date">) a
   * "YYYY-MM-DD" para el endpoint (mismo formato, se deja explícito por claridad).
   */
  private convertirAApiDate(fecha: string): string {
    return fecha;
  }

  /**
   * Guarda o edita el veto. Para "Definitivo" el usuario solo captura
   * fecha de inicio; internamente se suma 1 día y se envía como fechaTermino.
   */
  guardarVeto(): void {
    const curp = (this.formDatos.get('curp')?.value ?? '').trim().toUpperCase();
    const tipoVeto = this.formDatos.get('tipoBan')?.value;
    const fechaInicio = this.formDatos.get('fechaInicio')?.value;

    if (!tipoVeto || !fechaInicio) {
      this.formDatos.markAllAsTouched();
      return;
    }

    let fechaTermino: string;

    if (this.esBanDefinitivo) {
      const inicio = new Date(fechaInicio);
      inicio.setDate(inicio.getDate() + 1);
      fechaTermino = inicio.toISOString().split('T')[0];
    } else {
      fechaTermino = this.formDatos.get('fechaTermino')?.value;
      if (!fechaTermino) {
        this.formDatos.markAllAsTouched();
        return;
      }
    }

    this.guardandoVeto = true;

    this.vetoService.guardarVeto({
      curp,
      tipoVeto,
      fechaInicio: this.convertirAApiDate(fechaInicio),
      fechaTermino: this.convertirAApiDate(fechaTermino),
      usuario: this.usuarioActual,
    }).subscribe({
      next: (res) => {
        this.guardandoVeto = false;
        if (res.errId !== 0) {
          alert(`Error al guardar el veto: ${res.errMsg}`);
          return;
        }
        this.editandoVeto = false;
        this.consultarVeto(curp);
        alert('Veto guardado correctamente');
      },
      error: () => {
        this.guardandoVeto = false;
        alert('No se pudo guardar el veto. Intenta de nuevo.');
      },
    });
  }

  // ═══════════════════════════════════════════════════════
  //  INCIDENCIAS
  // ═══════════════════════════════════════════════════════
  get incidencias(): FormArray {
    return this.formIncidencias.get('incidencias') as FormArray;
  }

  agregarIncidencia(): void {
    if (this.nuevaIncidenciaForm.invalid) {
      this.nuevaIncidenciaForm.markAllAsTouched();
      return;
    }

    const curp = (this.formDatos.get('curp')?.value ?? '').trim().toUpperCase();
    const val = this.nuevaIncidenciaForm.value;

    this.incidenciasService.agregar({
      CURP: curp,
      Nivel: String(val.nivel),
      Descripcion: val.descripcion,
      Usuario: this.usuarioActual,
    }).subscribe({
      next: (res: IncidenciaResponse) => {
        if (res.errId !== 0) {
          alert(`Error al guardar: ${res.errMsg}`);
          return;
        }
        this.incidencias.push(
          this.fb.group({
            id: [res.lblId],
            fecha: [res.lblFecha],
            nivel: [res.lblClaveNivel || String(val.nivel)],
            descripcion: [
              res.lblDescripcion || val.descripcion,
              [Validators.required, Validators.maxLength(255)],
            ],
          })
        );
        this.limpiarIncidenciaForm();
        this.recargarIncidencias(curp);
      },
      error: () => alert('No se pudo guardar la incidencia. Intenta de nuevo.'),
    });
  }

  limpiarIncidenciaForm(): void {
    this.nuevaIncidenciaForm.reset({ nivel: '', descripcion: '' });
    this.nuevaIncidenciaForm.markAsUntouched();
    this.nuevaIncidenciaForm.markAsPristine();
  }

  abrirEditarIncidencia(index: number): void {
    const inc = this.incidencias.at(index) as FormGroup;
    this.modalEditIncidencia = {
      index,
      form: this.fb.group({
        nivel: [inc.get('nivel')?.value, Validators.required],
        descripcion: [inc.get('descripcion')?.value, [Validators.required, Validators.maxLength(255)]],
      }),
    };
  }

  guardarEdicionIncidencia(): void {
    if (!this.modalEditIncidencia) return;
    if (this.modalEditIncidencia.form.invalid) {
      this.modalEditIncidencia.form.markAllAsTouched();
      return;
    }

    const { index, form } = this.modalEditIncidencia;
    const inc = this.incidencias.at(index) as FormGroup;
    const curp = (this.formDatos.get('curp')?.value ?? '').trim().toUpperCase();

    this.incidenciasService.modificar({
      Id: Number(inc.get('id')?.value ?? 0),
      CURP: curp,
      Nivel: String(form.get('nivel')?.value),
      Descripcion: form.get('descripcion')?.value,
    }).subscribe({
      next: (res: IncidenciaResponse) => {
        if (res.errId !== 0) {
          alert(`Error al modificar: ${res.errMsg}`);
          return;
        }
        inc.patchValue({
          nivel: res.lblClaveNivel || form.get('nivel')?.value,
          descripcion: res.lblDescripcion || form.get('descripcion')?.value,
        });
        this.cerrarEditarIncidencia();
        this.recargarIncidencias(curp);
      },
      error: () => alert('No se pudo modificar la incidencia. Intenta de nuevo.'),
    });
  }

  cerrarEditarIncidencia(): void {
    this.modalEditIncidencia = null;
  }

  getNivelEtiqueta(clave: string | number): string {
    const found = this.nivelesOpciones.find(n => n.clave === String(clave));
    return found ? found.etiqueta : String(clave);
  }

  // ═══════════════════════════════════════════════════════
  //  OTROS (elementos adicionales)
  // ═══════════════════════════════════════════════════════
  get otros(): FormArray {
    return this.formOtros.get('otros') as FormArray;
  }

  agregarOtro(): void {
    if (this.nuevoOtroForm.invalid) {
      this.nuevoOtroForm.markAllAsTouched();
      return;
    }

    const curp = (this.formDatos.get('curp')?.value ?? '').trim().toUpperCase();
    const val = this.nuevoOtroForm.value;

    this.elementosAdicionalesService.agregar({
      tipoElemento: val.tipo,
      descripcionElemento: val.descripcion ?? '',
      cantidad:
        val.cantidad === null ||
          val.cantidad === undefined ||
          val.cantidad === ''
          ? ''
          : String(val.cantidad),
      curp,
      usuario: this.usuarioActual,
    }).subscribe({
      next: (res: ElementoAdicionalResponse) => {
        if (res.errId !== 0) {
          alert(`Error al guardar: ${res.errMsg}`);
          return;
        }
        this.limpiarOtroForm();
        this.recargarOtros(curp);
      },
      error: () => alert('No se pudo guardar el artículo. Intenta de nuevo.'),
    });
  }

  limpiarOtroForm(): void {
    this.nuevoOtroForm.reset({ tipo: '', descripcion: '', cantidad: null });
    this.nuevoOtroForm.markAsUntouched();
    this.nuevoOtroForm.markAsPristine();
  }

  abrirEditarOtro(index: number): void {
    const item = this.otros.at(index) as FormGroup;
    this.modalEditOtro = {
      index,
      form: this.fb.group({
        tipo: [item.get('tipo')?.value, Validators.required],
        descripcion: [
          item.get('descripcion')?.value,
          [Validators.required, Validators.maxLength(255)]
        ],
        cantidad: [item.get('cantidad')?.value ?? null],
      }),
    };
  }

  guardarEdicionOtro(): void {
    if (!this.modalEditOtro) return;
    if (this.modalEditOtro.form.invalid) {
      this.modalEditOtro.form.markAllAsTouched();
      return;
    }

    const { index, form } = this.modalEditOtro;
    const item = this.otros.at(index) as FormGroup;
    const curp = (this.formDatos.get('curp')?.value ?? '').trim().toUpperCase();

    this.elementosAdicionalesService.modificar({
      idElemento: item.get('id')?.value ?? '',
      tipoElemento: form.get('tipo')?.value,
      descripcionElemento: form.get('descripcion')?.value ?? '',
      cantidad:
        form.get('cantidad')?.value === null ||
          form.get('cantidad')?.value === undefined ||
          form.get('cantidad')?.value === ''
          ? ''
          : String(form.get('cantidad')?.value),
      curp,
      usuario: this.usuarioActual,
    }).subscribe({
      next: (res: ElementoAdicionalResponse) => {
        if (res.errId !== 0) {
          alert(`Error al modificar: ${res.errMsg}`);
          return;
        }
        item.patchValue({
          tipo: form.get('tipo')?.value,
          descripcion: form.get('descripcion')?.value,
          cantidad: form.get('cantidad')?.value,
        });
        this.cerrarEditarOtro();
        this.recargarOtros(curp);
      },
      error: () => alert('No se pudo modificar el artículo. Intenta de nuevo.'),
    });
  }

  cerrarEditarOtro(): void {
    this.modalEditOtro = null;
  }

  // ═══════════════════════════════════════════════════════
  //  MODAL DESCRIPCIÓN
  // ═══════════════════════════════════════════════════════
  abrirModalDescripcion(texto: string): void {
    this.modalDescripcion = texto;
  }

  cerrarModal(): void {
    this.modalDescripcion = null;
  }

  // ═══════════════════════════════════════════════════════
  //  RESET GLOBAL
  // ═══════════════════════════════════════════════════════
  confirmarReset(): void { this.modalResetVisible = true; }
  cancelarReset(): void { this.modalResetVisible = false; }

  ejecutarReset(): void {
    this.incidencias.clear();
    this.otros.clear();
    this.limpiarEquipo();

    this.formDatos.reset({
      curp: '', nombre: '', motivo: '', noProveedor: '', razonSocial: '', foto: null,
      vetado: false, tipoBan: '', fechaInicio: '', fechaTermino: '',
    });
    this.formDatos.get('nombre')?.enable();
    this.formDatos.get('motivo')?.enable();

    this.formVehiculo.reset({ tipoVehiculo: '', placa: '', modelo: '', marca: '' });
    this.enableVehiculo();

    this.limpiarIncidenciaForm();
    this.limpiarOtroForm();

    this.fotoPreview = null;
    this.curpEncontrado = false;
    this.editandoVeto = false;
    this.diasRestantes = '';
    this.seccionActiva = 'datos';
    this.modalResetVisible = false;
    this.modalEditIncidencia = null;
    this.modalEditOtro = null;

    [this.formDatos, this.formVehiculo, this.formEquipo,
    this.formIncidencias, this.formOtros].forEach(f => {
      f.markAsUntouched();
      f.markAsPristine();
    });
  }

  // ═══════════════════════════════════════════════════════
  //  SUBMIT POR SECCIÓN
  // ═══════════════════════════════════════════════════════
  onSubmitDatos(): void {
    if (this.formDatos.invalid) { this.formDatos.markAllAsTouched(); return; }
    console.log('POST /api/datos', this.formDatos.getRawValue());
    alert('Datos personales guardados');
  }

  onSubmitVehiculo(): void {
    console.log('POST /api/vehiculo', this.formVehiculo.getRawValue());
    alert('Vehículo guardado');
  }

  onSubmitEquipo(): void {
    console.log('Equipo (estado actual)', this.formEquipo.getRawValue());
    alert('Equipo de seguridad guardado');
  }

  onSubmitIncidencias(): void {
    this.irSeccion('otros');
  }

  // ═══════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════
  irSeccion(id: string): void {
    this.seccionActiva = id;
  }

  isInvalid(form: FormGroup, campo: string): boolean {
    const c = form.get(campo);
    return !!(c?.invalid && c?.touched);
  }

  isInvalidSub(form: FormGroup, campo: string): boolean {
    const c = form.get(campo);
    return !!(c?.invalid && c?.touched);
  }
}