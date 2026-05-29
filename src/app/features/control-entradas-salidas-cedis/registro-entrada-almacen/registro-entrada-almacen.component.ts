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
  motivo: string;          // ← autocompleta el select de motivo
  noProveedor: string;
  razonSocial: string;
  vehiculo: {
    tipoVehiculo: string;
    placa: string;
    modelo: string;
    marca: string;
  } | null;
  veto: {
    vetado: boolean;
    tipoBan: string;
    fechaInicio: string;
    fechaTermino: string;
    duracionDias: string;
  } | null;
  incidencias: { fecha: string; nivel: number; descripcion: string }[];
}

// ── Catálogo simulado ─────────────────────────────────────
const CURP_DB: Record<string, DatosCurp> = {
  // Chofer — con vehículo, sin veto, con incidencias
  PELJ900101HDFLRS01: {
    nombre: 'Juan Pérez López',
    motivo: 'Chofer',
    noProveedor: '',
    razonSocial: '',
    vehiculo: { tipoVehiculo: 'Camión', placa: 'ABC-123', modelo: '2020', marca: 'Kenworth' },
    veto: null,
    incidencias: [
      { fecha: '2024-03-10', nivel: 2, descripcion: 'Llegada tardía al área de carga' },
      { fecha: '2024-07-22', nivel: 5, descripcion: 'Ingresó sin chaleco reflejante' },
    ],
  },
  // Proveedor — con vehículo, sin veto, sin incidencias
  GOAM850515MDFNRL08: {
    nombre: 'María González Arce',
    motivo: 'Maniobra',
    noProveedor: 'PROV-0042',
    razonSocial: 'Transportes González S.A.',
    vehiculo: { tipoVehiculo: 'Camioneta', placa: 'XYZ-456', modelo: '2021', marca: 'Ford' },
    veto: null,
    incidencias: [],
  },
  // Encargado — con vehículo, veto PARCIAL, con incidencias
  RAHN780320HCSNVR05: {
    nombre: 'Hernán Ramos Nieto',
    motivo: 'Encargado',
    noProveedor: 'PROV-0099',
    razonSocial: 'Fletes Ramos S.C.',
    vehiculo: { tipoVehiculo: 'Camión', placa: 'PQR-789', modelo: '2019', marca: 'Freightliner' },
    veto: {
      vetado: true,
      tipoBan: 'Parcial',
      fechaInicio: '2025-04-01',
      fechaTermino: '2025-05-31',
      duracionDias: '60',
    },
    incidencias: [
      { fecha: '2025-01-15', nivel: 7, descripcion: 'Conducta agresiva con personal de seguridad durante revisión de ingreso' },
      { fecha: '2025-03-20', nivel: 9, descripcion: 'Intento de ingreso con mercancía no declarada en manifiesto de carga' },
    ],
  },
  // Visita — sin vehículo, veto DEFINITIVO, sin incidencias
  SALD920711MDFRRN09: {
    nombre: 'Daniela Salinas Reyes',
    motivo: 'Visita',
    noProveedor: '',
    razonSocial: '',
    vehiculo: null,
    veto: {
      vetado: true,
      tipoBan: 'Definitivo',
      fechaInicio: '2024-11-15',
      fechaTermino: '',
      duracionDias: '',
    },
    incidencias: [
      { fecha: '2024-10-01', nivel: 10, descripcion: 'Comportamiento gravemente inapropiado' },
    ],
  },
};

// ── Motivos que muestran campos de proveedor ──────────────
const MOTIVOS_CON_PROVEEDOR = new Set(['Chofer', 'Maniobra', 'Encargado']);

@Component({
  selector: 'app-registro-visitante',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro-entrada-almacen.component.html',
  styleUrls: ['./registro-entrada-almacen.component.css'],
})
export class RegistroEntradaAlmacenComponent implements OnInit {
  form!: FormGroup;
  fotoPreview: string | null = null;
  seccionActiva = 'datos';

  // ── Estado de la búsqueda ─────────────────────────────
  /** true cuando se encontró el CURP en la BD */
  curpEncontrado = false;
  /** true cuando el usuario activa la edición del veto */
  editandoVeto = false;

  // Modal descripción
  modalDescripcion: string | null = null;
  // Modal confirmación reset
  modalResetVisible = false;

  motivosOpciones  = ['Chofer', 'Maniobra', 'Encargado', 'Visita'];
  tiposVehiculo    = ['Camión', 'Camioneta', 'Automóvil', 'Motocicleta', 'Otro'];
  tiposBan         = ['Parcial', 'Definitivo'];
  duracionOpciones = ['30', '60', '90'];
  nivelesOpciones  = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  secciones = [
    { id: 'datos',       label: 'Datos',       icon: 'ti ti-user'           },
    { id: 'vehiculo',    label: 'Vehículo',     icon: 'ti ti-truck'          },
    { id: 'equipo',      label: 'Equipo',       icon: 'ti ti-shield-check'   },
    { id: 'incidencias', label: 'Incidencias',  icon: 'ti ti-alert-triangle' },
    { id: 'otros',       label: 'Otros',        icon: 'ti ti-package'        },
  ];

  nuevaIncidenciaForm!: FormGroup;
  nuevoOtroForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
    this.calcularDiasRestantes();
  }

  // ═══════════════════════════════════════════════════════
  //  CONSTRUCCIÓN DEL FORMULARIO
  // ═══════════════════════════════════════════════════════
  private buildForm(): void {
    this.form = this.fb.group({
      curp:        ['', [Validators.required, Validators.minLength(18), Validators.maxLength(18)]],
      nombre:      [{ value: '', disabled: true }],
      motivo:      ['', Validators.required],
      noProveedor: [''],
      razonSocial: [''],
      foto:        [null],

      tipoVehiculo: [''],
      placa:        [''],
      modelo:       [''],
      marca:        [''],

      altaImss:          [false],
      dc3:               [false],
      chalecoReflejante: [false],
      zapatosSeguridad:  [false],
      pantalonMezclilla: [false],
      playeraMangaLarga: [false],

      vetado:       [false],
      tipoBan:      [''],
      fechaInicio:  [''],
      fechaTermino: [''],
      duracionDias: [''],
      diasRestantes:[{ value: '', disabled: true }],

      incidencias: this.fb.array([]),
      otros:       this.fb.array([]),
    });

    this.nuevaIncidenciaForm = this.fb.group({
      fecha:       [new Date().toISOString().split('T')[0], Validators.required],
      nivel:       ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(255)]],
    });

    this.nuevoOtroForm = this.fb.group({
      tipo:        ['', Validators.required],
      descripcion: ['', Validators.maxLength(255)],
      cantidad:    [null, [Validators.required, Validators.min(1)]],
    });
  }

  // ═══════════════════════════════════════════════════════
  //  GETTERS DE TIPADO — evitan NG9 / NG2
  // ═══════════════════════════════════════════════════════
  asControl(group: FormGroup, name: string): FormControl {
    const ctrl = group.get(name);
    if (!ctrl) throw new Error(`Control "${name}" no encontrado`);
    return ctrl as FormControl;
  }

  get incFecha():       FormControl { return this.asControl(this.nuevaIncidenciaForm, 'fecha');       }
  get incNivel():       FormControl { return this.asControl(this.nuevaIncidenciaForm, 'nivel');       }
  get incDescripcion(): FormControl { return this.asControl(this.nuevaIncidenciaForm, 'descripcion'); }
  get otrTipo():        FormControl { return this.asControl(this.nuevoOtroForm, 'tipo');        }
  get otrCantidad():    FormControl { return this.asControl(this.nuevoOtroForm, 'cantidad');    }
  get otrDescripcion(): FormControl { return this.asControl(this.nuevoOtroForm, 'descripcion'); }

  // ═══════════════════════════════════════════════════════
  //  GETTERS DE ESTADO
  // ═══════════════════════════════════════════════════════
  get esBanDefinitivo(): boolean {
    return this.form.get('tipoBan')?.value === 'Definitivo';
  }

  /** ¿El motivo actual requiere campos de proveedor? */
  get motivoRequiereProveedor(): boolean {
    return MOTIVOS_CON_PROVEEDOR.has(this.form.get('motivo')?.value ?? '');
  }

  /** El personal ya tiene veto cargado desde la BD */
  get tieneVetoPrevio(): boolean {
    return this.curpEncontrado && !!this.form.get('vetado')?.value;
  }

  /** La sección de veto está bloqueada para edición */
  get vetoEstaBlockeado(): boolean {
    return this.tieneVetoPrevio && !this.editandoVeto;
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
        this.form.patchValue({ foto: input.files![0] });
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  eliminarFoto(): void {
    this.fotoPreview = null;
    this.form.patchValue({ foto: null });
  }

  // ═══════════════════════════════════════════════════════
  //  BÚSQUEDA POR CURP
  // ═══════════════════════════════════════════════════════
  onCurpBlur(): void {
    const curp = (this.form.get('curp')?.value ?? '').trim().toUpperCase();
    if (curp.length < 18) return;

    const datos: DatosCurp | undefined = CURP_DB[curp];
    this.editandoVeto = false;

    if (datos) {
      this.curpEncontrado = true;

      // ── Datos personales (bloqueados) ──────────────────
      this.form.get('nombre')?.setValue(datos.nombre);
      this.form.get('motivo')?.setValue(datos.motivo);
      this.form.get('nombre')?.disable();
      this.form.get('motivo')?.disable();

      // Campos de proveedor (llenados pero editables)
      this.form.patchValue({
        noProveedor: datos.noProveedor,
        razonSocial: datos.razonSocial,
      });

      // ── Vehículo (readonly si viene de BD) ─────────────
      if (datos.vehiculo) {
        this.form.patchValue(datos.vehiculo);
        this.disableVehiculo();
      } else {
        this.form.patchValue({ tipoVehiculo: '', placa: '', modelo: '', marca: '' });
        this.enableVehiculo();
      }

      // ── Veto ───────────────────────────────────────────
      if (datos.veto) {
        this.form.patchValue(datos.veto);
        if (datos.veto.tipoBan === 'Definitivo') {
          this.form.patchValue({ duracionDias: '', diasRestantes: '' });
        }
      } else {
        this.form.patchValue({
          vetado: false, tipoBan: '', fechaInicio: '',
          fechaTermino: '', duracionDias: '', diasRestantes: '',
        });
      }

      // ── Incidencias históricas ─────────────────────────
      this.incidencias.clear();
      datos.incidencias.forEach(inc => {
        this.incidencias.push(
          this.fb.group({
            fecha:       [inc.fecha],
            nivel:       [inc.nivel],
            descripcion: [inc.descripcion],
          })
        );
      });

    } else {
      // CURP no encontrado — habilitar todos los campos
      this.curpEncontrado = false;
      this.form.get('nombre')?.enable();
      this.form.get('motivo')?.enable();
      this.enableVehiculo();
      this.form.get('nombre')?.setValue('');
      this.form.patchValue({ motivo: '', noProveedor: '', razonSocial: '' });
      this.form.patchValue({
        vetado: false, tipoBan: '', fechaInicio: '',
        fechaTermino: '', duracionDias: '', diasRestantes: '',
      });
      this.incidencias.clear();
    }
  }

  private disableVehiculo(): void {
    ['tipoVehiculo', 'placa', 'modelo', 'marca'].forEach(f =>
      this.form.get(f)?.disable()
    );
  }

  private enableVehiculo(): void {
    ['tipoVehiculo', 'placa', 'modelo', 'marca'].forEach(f =>
      this.form.get(f)?.enable()
    );
  }

  // ═══════════════════════════════════════════════════════
  //  VETO — edición
  // ═══════════════════════════════════════════════════════
  activarEdicionVeto(): void {
    this.editandoVeto = true;
  }

  cancelarEdicionVeto(): void {
    this.editandoVeto = false;
    // Restaura los valores originales de la BD
    this.onCurpBlur();
  }

  // ═══════════════════════════════════════════════════════
  //  DÍAS RESTANTES
  // ═══════════════════════════════════════════════════════
  calcularDiasRestantes(): void {
    this.form.get('fechaInicio')?.valueChanges.subscribe(() => this.recalcular());
    this.form.get('duracionDias')?.valueChanges.subscribe(() => this.recalcular());
  }

  recalcular(): void {
    if (this.esBanDefinitivo) return;
    const inicio   = this.form.get('fechaInicio')?.value;
    const duracion = parseInt(this.form.get('duracionDias')?.value || '0', 10);
    if (inicio && duracion) {
      const fechaInicio  = new Date(inicio);
      const fechaTermino = new Date(fechaInicio);
      fechaTermino.setDate(fechaTermino.getDate() + duracion);
      this.form.get('fechaTermino')?.setValue(fechaTermino.toISOString().split('T')[0]);
      const diff = Math.ceil(
        (fechaTermino.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      this.form.get('diasRestantes')?.setValue(diff > 0 ? diff : 0);
    }
  }

  // ═══════════════════════════════════════════════════════
  //  INCIDENCIAS
  // ═══════════════════════════════════════════════════════
  get incidencias(): FormArray {
    return this.form.get('incidencias') as FormArray;
  }

  agregarIncidencia(): void {
    if (this.nuevaIncidenciaForm.invalid) {
      this.nuevaIncidenciaForm.markAllAsTouched();
      return;
    }
    const val = this.nuevaIncidenciaForm.value;
    this.incidencias.push(
      this.fb.group({
        fecha:       [val.fecha],
        nivel:       [val.nivel],
        descripcion: [val.descripcion, [Validators.required, Validators.maxLength(255)]],
      })
    );
    this.limpiarIncidenciaForm();
  }

  limpiarIncidenciaForm(): void {
    this.nuevaIncidenciaForm.reset({
      fecha:       new Date().toISOString().split('T')[0],
      nivel:       '',
      descripcion: '',
    });
    this.nuevaIncidenciaForm.markAsUntouched();
    this.nuevaIncidenciaForm.markAsPristine();
  }

  eliminarIncidencia(i: number): void {
    this.incidencias.removeAt(i);
  }

  getNivelClase(nivel: number | string): string {
    const n = Number(nivel);
    if (!n)     return 'neutro';
    if (n <= 3) return 'bajo';
    if (n <= 6) return 'medio';
    return 'alto';
  }

  // ═══════════════════════════════════════════════════════
  //  OTROS
  // ═══════════════════════════════════════════════════════
  get otros(): FormArray {
    return this.form.get('otros') as FormArray;
  }

  agregarOtro(): void {
    if (this.nuevoOtroForm.invalid) {
      this.nuevoOtroForm.markAllAsTouched();
      return;
    }
    const val = this.nuevoOtroForm.value;
    this.otros.push(
      this.fb.group({
        tipo:        [val.tipo, Validators.required],
        descripcion: [val.descripcion, Validators.maxLength(255)],
        cantidad:    [val.cantidad],
      })
    );
    this.limpiarOtroForm();
  }

  limpiarOtroForm(): void {
    this.nuevoOtroForm.reset({ tipo: '', descripcion: '', cantidad: null });
    this.nuevoOtroForm.markAsUntouched();
    this.nuevoOtroForm.markAsPristine();
  }

  eliminarOtro(i: number): void {
    this.otros.removeAt(i);
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
  //  RESET GLOBAL — nuevo registro / consulta
  // ═══════════════════════════════════════════════════════
  confirmarReset(): void {
    this.modalResetVisible = true;
  }

  cancelarReset(): void {
    this.modalResetVisible = false;
  }

  ejecutarReset(): void {
    // Destruye y reconstruye los FormArrays
    this.incidencias.clear();
    this.otros.clear();

    // Resetea el form principal
    this.form.reset({
      curp: '', nombre: '', motivo: '', noProveedor: '', razonSocial: '', foto: null,
      tipoVehiculo: '', placa: '', modelo: '', marca: '',
      altaImss: false, dc3: false, chalecoReflejante: false,
      zapatosSeguridad: false, pantalonMezclilla: false, playeraMangaLarga: false,
      vetado: false, tipoBan: '', fechaInicio: '', fechaTermino: '',
      duracionDias: '', diasRestantes: '',
    });

    // Re-habilita campos que pueden haber sido bloqueados por CURP
    this.form.get('nombre')?.enable();
    this.form.get('motivo')?.enable();
    this.enableVehiculo();

    // Resetea formularios auxiliares
    this.limpiarIncidenciaForm();
    this.limpiarOtroForm();

    // Resetea estado
    this.fotoPreview     = null;
    this.curpEncontrado  = false;
    this.editandoVeto    = false;
    this.seccionActiva   = 'datos';
    this.modalResetVisible = false;

    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  // ═══════════════════════════════════════════════════════
  //  SUBMIT
  // ═══════════════════════════════════════════════════════
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = { ...this.form.getRawValue(), fotoPreview: this.fotoPreview };
    console.log('Registro guardado:', payload);
    alert('Registro guardado correctamente');
  }

  // ═══════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════
  irSeccion(id: string): void {
    this.seccionActiva = id;
  }

  isInvalid(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && c?.touched);
  }

  isInvalidSub(form: FormGroup, campo: string): boolean {
    const c = form.get(campo);
    return !!(c?.invalid && c?.touched);
  }
}