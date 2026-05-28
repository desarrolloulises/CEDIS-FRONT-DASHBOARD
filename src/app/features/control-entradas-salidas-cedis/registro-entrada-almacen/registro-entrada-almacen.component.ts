import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  AbstractControl,
} from '@angular/forms';

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

// ── Datos simulados que devuelve el CURP ─────────────────
interface DatosCurp {
  nombre: string;
  // Vehículo (null = sin vehículo)
  vehiculo: {
    tipoVehiculo: string;
    placa: string;
    modelo: string;
    marca: string;
  } | null;
  // Veto previo (null = sin veto)
  veto: {
    vetado: boolean;
    tipoBan: string;        // 'Parcial' | 'Definitivo'
    fechaInicio: string;
    fechaTermino: string;
    duracionDias: string;
  } | null;
}

/** Catálogo simulado de CURPs */
const CURP_DB: Record<string, DatosCurp> = {
  // Sin vehículo, sin veto
  PELJ900101HDFLRS01: {
    nombre: 'Juan Pérez López',
    vehiculo: null,
    veto: null,
  },
  // Con vehículo, sin veto
  GOAM850515MDFNRL08: {
    nombre: 'María González Arce',
    vehiculo: {
      tipoVehiculo: 'Camioneta',
      placa: 'XYZ-456',
      modelo: '2021',
      marca: 'Ford',
    },
    veto: null,
  },
  // Con vehículo, veto parcial
  RAHN780320HCSNVR05: {
    nombre: 'Hernán Ramos Nieto',
    vehiculo: {
      tipoVehiculo: 'Camión',
      placa: 'PQR-789',
      modelo: '2019',
      marca: 'Freightliner',
    },
    veto: {
      vetado: true,
      tipoBan: 'Parcial',
      fechaInicio: '2025-04-01',
      fechaTermino: '2025-05-31',
      duracionDias: '60',
    },
  },
  // Sin vehículo, veto definitivo
  SALD920711MDFRRN09: {
    nombre: 'Daniela Salinas Reyes',
    vehiculo: null,
    veto: {
      vetado: true,
      tipoBan: 'Definitivo',
      fechaInicio: '2024-11-15',
      fechaTermino: '',
      duracionDias: '',
    },
  },
};

@Component({
  selector: 'app-registro-entrada-almacen',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro-entrada-almacen.component.html',
  styleUrls: ['./registro-entrada-almacen.component.css'],
})
export class RegistroEntradaAlmacenComponent implements OnInit {
  form!: FormGroup;
  fotoPreview: string | null = null;
  seccionActiva = 'datos';

  // Modal de descripción larga
  modalDescripcion: string | null = null;

  motivosOpciones = ['Chofer', 'Maniobra', 'Encargado', 'Visita'];
  tiposVehiculo  = ['Camión', 'Camioneta', 'Automóvil', 'Motocicleta', 'Otro'];
  tiposBan       = ['Parcial', 'Definitivo'];
  duracionOpciones = ['30', '60', '90'];
  nivelesOpciones  = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  secciones = [
    { id: 'datos',      label: 'Datos',      icon: 'ti ti-user'           },
    { id: 'vehiculo',   label: 'Vehículo',   icon: 'ti ti-truck'          },
    { id: 'equipo',     label: 'Equipo',     icon: 'ti ti-shield-check'   },
    { id: 'incidencias',label: 'Incidencias',icon: 'ti ti-alert-triangle' },
    { id: 'otros',      label: 'Otros',      icon: 'ti ti-package'        },
  ];

  nuevaIncidenciaForm!: FormGroup;
  nuevoOtroForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      // ── Datos personales ──────────────────────────────
      curp:        ['', [Validators.required, Validators.minLength(18), Validators.maxLength(18)]],
      nombre:      [{ value: '', disabled: true }],
      motivo:      ['', Validators.required],
      noProveedor: [''],
      razonSocial: [''],
      foto:        [null],

      // ── Vehículo ──────────────────────────────────────
      tipoVehiculo: [''],
      placa:        [''],
      modelo:       [''],
      marca:        [''],

      // ── Equipo de seguridad ────────────────────────────
      altaImss:          [false],
      dc3:               [false],
      chalecoReflejante: [false],
      zapatosSeguridad:  [false],
      pantalonMezclilla: [false],
      playeraMangaLarga: [false],

      // ── Vetado ────────────────────────────────────────
      vetado:       [false],
      tipoBan:      [''],
      fechaInicio:  [''],
      fechaTermino: [''],
      duracionDias: [''],
      diasRestantes:[{ value: '', disabled: true }],

      // ── Arrays ───────────────────────────────────────
      incidencias: this.fb.array([]),
      otros:       this.fb.array([]),
    });

    // Formulario de nueva incidencia
    this.nuevaIncidenciaForm = this.fb.group({
      fecha:       [new Date().toISOString().split('T')[0], Validators.required],
      nivel:       ['',  Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(255)]],
    });

    // Formulario de nuevo artículo
    this.nuevoOtroForm = this.fb.group({
      tipo:        ['', Validators.required],
      descripcion: ['', Validators.maxLength(255)],
      cantidad:    [null, [Validators.required, Validators.min(1)]],
    });

    this.calcularDiasRestantes();
  }

  // ── Helpers de tipado (resuelven NG9 / NG2) ──────────
  /**
   * Convierte AbstractControl a FormControl para poder usar [formControl].
   * Lanza error explícito si el control no existe, facilitando el debug.
   */
  asControl(group: FormGroup, name: string): FormControl {
    const ctrl = group.get(name);
    if (!ctrl) throw new Error(`Control "${name}" no encontrado en el FormGroup`);
    return ctrl as FormControl;
  }

  // Getters convenientes para la plantilla
  get incFecha():       FormControl { return this.asControl(this.nuevaIncidenciaForm, 'fecha');       }
  get incNivel():       FormControl { return this.asControl(this.nuevaIncidenciaForm, 'nivel');       }
  get incDescripcion(): FormControl { return this.asControl(this.nuevaIncidenciaForm, 'descripcion'); }

  get otrTipo():        FormControl { return this.asControl(this.nuevoOtroForm, 'tipo');        }
  get otrCantidad():    FormControl { return this.asControl(this.nuevoOtroForm, 'cantidad');    }
  get otrDescripcion(): FormControl { return this.asControl(this.nuevoOtroForm, 'descripcion'); }

  // ── ¿Veto es definitivo? ─────────────────────────────
  get esBanDefinitivo(): boolean {
    return this.form.get('tipoBan')?.value === 'Definitivo';
  }

  // ── Foto ─────────────────────────────────────────────
  onFotoCapturada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
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

  // ── CURP → autocomplete datos personales + vehículo + veto + incidencias ──
  onCurpBlur(): void {
    const curp = (this.form.get('curp')?.value ?? '').trim().toUpperCase();
    if (curp.length < 18) return;

    const datos: DatosCurp | undefined = CURP_DB[curp];

    if (datos) {
      // Nombre
      this.form.get('nombre')?.setValue(datos.nombre);

      // Vehículo
      if (datos.vehiculo) {
        this.form.patchValue(datos.vehiculo);
      } else {
        this.form.patchValue({ tipoVehiculo: '', placa: '', modelo: '', marca: '' });
      }

      // Veto
      if (datos.veto) {
        this.form.patchValue(datos.veto);
        // Si es definitivo, limpiar campos de duración
        if (datos.veto.tipoBan === 'Definitivo') {
          this.form.patchValue({ duracionDias: '', diasRestantes: '' });
        }
      } else {
        this.form.patchValue({
          vetado: false, tipoBan: '', fechaInicio: '',
          fechaTermino: '', duracionDias: '', diasRestantes: '',
        });
      }
    } else {
      // CURP no encontrado: limpiar campos dependientes
      this.form.get('nombre')?.setValue('');
    }
  }

  // ── Días restantes ───────────────────────────────────
  calcularDiasRestantes(): void {
    this.form.get('fechaInicio')?.valueChanges.subscribe(() => this.recalcular());
    this.form.get('duracionDias')?.valueChanges.subscribe(() => this.recalcular());
  }

  recalcular(): void {
    if (this.esBanDefinitivo) return;   // no aplica para definitivo
    const inicio   = this.form.get('fechaInicio')?.value;
    const duracion = parseInt(this.form.get('duracionDias')?.value || '0', 10);
    if (inicio && duracion) {
      const fechaInicio  = new Date(inicio);
      const fechaTermino = new Date(fechaInicio);
      fechaTermino.setDate(fechaTermino.getDate() + duracion);
      this.form.get('fechaTermino')?.setValue(fechaTermino.toISOString().split('T')[0]);
      const hoy  = new Date();
      const diff = Math.ceil((fechaTermino.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      this.form.get('diasRestantes')?.setValue(diff > 0 ? diff : 0);
    }
  }

  // ── Incidencias ──────────────────────────────────────
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
    if (!n)   return 'neutro';
    if (n <= 3) return 'bajo';
    if (n <= 6) return 'medio';
    return 'alto';
  }

  // ── Otros ─────────────────────────────────────────────
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

  // ── Modal descripción ─────────────────────────────────
  abrirModalDescripcion(texto: string): void {
    this.modalDescripcion = texto;
  }

  cerrarModal(): void {
    this.modalDescripcion = null;
  }

  // ── Submit ────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = { ...this.form.getRawValue(), fotoPreview: this.fotoPreview };
    console.log('Registro guardado:', payload);
    alert('Registro guardado correctamente');
  }

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