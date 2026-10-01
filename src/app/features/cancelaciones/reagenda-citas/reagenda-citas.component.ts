import {
  Component,
  OnInit,
  signal,
  computed,
  HostListener,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

// ── Componentes compartidos ──────────────────────────────────────
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

// ── Util ─────────────────────────────────────────────────────────
import { formatearCelda } from '../reagenda-cita/utils/formato-celda.util';

// ─────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────

export interface ApiColumna {
  nombre: string;
  tipo: string;
}

export interface ApiFila {
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  error: string;
  code: string;
  data: T | null;
}

export interface ReagendaMasivaData {
  columnas: ApiColumna[];
  filas: ApiFila[];
}

export interface CitaImportada {
  folio: number;
  fecha: Date | null;
}

export interface FilaTabla {
  cita: CitaImportada;
  valores: Record<string, string>;
  estatus: string;
  esValida: boolean;
  confirmada: boolean;
  raw: ApiFila;
}

type ToastTipo = 'success' | 'error';

// ─────────────────────────────────────────────────────────────────
// Mock del endpoint de consulta masiva
// ─────────────────────────────────────────────────────────────────

const LOREM_BREVE =
  'El asn no es valido'
async function fetchReagendaMasivaMock(
  citas: CitaImportada[]
): Promise<ApiResponse<ReagendaMasivaData>> {
  await new Promise((r) => setTimeout(r, 800));

  if (citas.length === 0) {
    return {
      success: false,
      error: 'No hay citas para consultar.',
      code: 'ERROR',
      data: null,
    };
  }

  // Columnas dinámicas que devuelve la API
  const columnas: ApiColumna[] = [
    { nombre: 'ASN', tipo: 'Int32' },
    { nombre: 'Fecha Solicitada', tipo: 'DateTime' },
    { nombre: 'Fecha Original', tipo: 'DateTime' },
    { nombre: 'Observación', tipo: 'String' },
    { nombre: 'Estatus', tipo: 'String' },
  ];

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const filas: ApiFila[] = citas.map((c) => {
    const fecha = c.fecha ?? new Date();
    const dow = fecha.getDay();
    const esFinDeSemana = dow === 0 || dow === 6;
    const esPasada = fecha.getTime() < hoy.getTime();
    const folioStr = String(c.folio);
    const esFolioInvalido = folioStr.endsWith('9');

    const estatus = esFinDeSemana
      ? 'Fin de semana'
      : esPasada
      ? 'Fecha pasada'
      : esFolioInvalido
      ? 'ASN no reagendable'
      : 'Válida';

    return {
      ASN: c.folio,
      'Fecha Solicitada': fecha.toISOString(),
      'Fecha Original': '2026-08-03T00:00:00',
      Observación: LOREM_BREVE,
      Estatus: estatus,
    };
  });

  return {
    success: true,
    error: '',
    code: 'OK',
    data: { columnas, filas },
  };
}

// ─────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-reagenda-citas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent,
    ToastComponent,
    ButtonComponent,
  ],
  templateUrl: './reagenda-citas.component.html',
  styleUrls: ['./reagenda-citas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReagendaCitasComponent implements OnInit {
  // ─────────────────────────────────────────────────────────────
  // ViewChilds
  // ─────────────────────────────────────────────────────────────

  @ViewChild('fileInput', { static: true })
  fileInput!: ElementRef<HTMLInputElement>;

  // ─────────────────────────────────────────────────────────────
  // Estado
  // ─────────────────────────────────────────────────────────────

  readonly citas = signal<CitaImportada[]>([]);
  readonly filasApi = signal<ApiFila[]>([]);
  readonly columnas = signal<ApiColumna[]>([]);
  readonly haConsultado = signal(false);
  readonly cargando = signal(false);
  readonly confirmadas = signal<Set<number>>(new Set());

  readonly toastVisible = signal(false);
  readonly toastTipo = signal<ToastTipo>('success');
  readonly toastTitulo = signal('');
  readonly toastMensaje = signal('');

  readonly nombreArchivo = signal<string>('');

  // ─────────────────────────────────────────────────────────────
  // Derivados
  // ─────────────────────────────────────────────────────────────

  readonly puedeConsultar = computed(() => this.citas().length > 0);

  readonly filasTabla = computed<FilaTabla[]>(() => {
    const citas = this.citas();
    const filas = this.filasApi();
    const cols = this.columnas();
    const confirmadas = this.confirmadas();

    if (citas.length === 0) return [];

    if (!this.haConsultado() || filas.length === 0) {
      return citas.map((cita) => ({
        cita,
        valores: {},
        estatus: '',
        esValida: false,
        confirmada: confirmadas.has(cita.folio),
        raw: {},
      }));
    }

    const porFolio = new Map<number, ApiFila>();
    for (const f of filas) {
      const folio = Number(f['ASN']);
      if (Number.isFinite(folio)) porFolio.set(folio, f);
    }

    return citas.map((cita) => {
      const raw = porFolio.get(cita.folio) ?? {};
      const valores: Record<string, string> = {};
      for (const col of cols) {
        valores[col.nombre] = formatearCelda(raw[col.nombre], col.tipo);
      }
      const estatus = String(raw['Estatus'] ?? '');
      const esValida =
        estatus.toLowerCase() === 'válida' ||
        estatus.toLowerCase() === 'valida';

      return {
        cita,
        valores,
        estatus,
        esValida,
        confirmada: confirmadas.has(cita.folio),
        raw,
      };
    });
  });

  /** Filas válidas y aún no confirmadas (para el botón global) */
  readonly filasValidasPendientes = computed(() =>
    this.filasTabla().filter((f) => f.esValida && !f.confirmada)
  );

  /** ¿Se puede confirmar en bloque? */
  readonly puedeConfirmarGlobal = computed(
    () => this.filasValidasPendientes().length > 0
  );

  readonly totalValidas = computed(
    () => this.filasValidasPendientes().length
  );

  // ─────────────────────────────────────────────────────────────
  // Ciclo de vida
  // ─────────────────────────────────────────────────────────────

  ngOnInit(): void {}

  // ─────────────────────────────────────────────────────────────
  // Atajos de teclado
  // ─────────────────────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  onKeyDown(ev: KeyboardEvent): void {
    if (ev.key === 'F2') {
      ev.preventDefault();
      this.fileInput.nativeElement.click();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Importación de Excel
  // ─────────────────────────────────────────────────────────────

  abrirSelectorArchivo(): void {
    this.fileInput.nativeElement.click();
  }

  async onArchivoSeleccionado(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.cargando.set(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        raw: true,
        blankrows: false,
      });

      const citas = this.parsearFilas(rows);

      if (citas.length === 0) {
        this.mostrarToast(
          'error',
          'Archivo vacío',
          'No se encontraron filas válidas en el archivo.'
        );
        return;
      }

      this.citas.set(citas);
      this.nombreArchivo.set(file.name);
      this.filasApi.set([]);
      this.columnas.set([]);
      this.haConsultado.set(false);
      this.confirmadas.set(new Set());

      this.mostrarToast(
        'success',
        'Archivo importado',
        `Se cargaron ${citas.length} cita(s) desde "${file.name}".`
      );
    } catch (e) {
      this.mostrarToast(
        'error',
        'Error al leer el archivo',
        'Verifica que el archivo sea un Excel válido (.xlsx, .xls o .csv).'
      );
    } finally {
      this.cargando.set(false);
      input.value = '';
    }
  }

  private parsearFilas(rows: unknown[][]): CitaImportada[] {
    const out: CitaImportada[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const folioRaw = row[0];
      const fechaRaw = row[1];

      if (i === 0) {
        const esFolioNumerico = Number.isFinite(Number(folioRaw));
        if (!esFolioNumerico) continue;
      }

      const folio = Number(folioRaw);
      if (!Number.isFinite(folio) || folio <= 0) continue;

      const fecha = this.parsearFecha(fechaRaw);
      out.push({ folio, fecha });
    }

    return out;
  }

  private parsearFecha(v: unknown): Date | null {
    if (v === null || v === undefined || v === '') return null;

    if (v instanceof Date) return this.normalizarFecha(v);

    if (typeof v === 'number') {
      const ms = Math.round((v - 25569) * 86400 * 1000);
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : this.normalizarFecha(d);
    }

    const s = String(v).trim();
    if (!s) return null;

    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      const anio = yyyy.length === 2 ? Number(yyyy) + 2000 : Number(yyyy);
      const d = new Date(anio, Number(mm) - 1, Number(dd));
      return Number.isNaN(d.getTime()) ? null : this.normalizarFecha(d);
    }

    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : this.normalizarFecha(d);
  }

  private normalizarFecha(d: Date): Date {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
  }

  // ─────────────────────────────────────────────────────────────
  // Acciones
  // ─────────────────────────────────────────────────────────────

  async consultar(): Promise<void> {
    if (!this.puedeConsultar()) return;

    this.cargando.set(true);
    this.confirmadas.set(new Set());

    try {
      const resp = await fetchReagendaMasivaMock(this.citas());
      this.haConsultado.set(true);

      if (!resp.success || !resp.data) {
        this.filasApi.set([]);
        this.columnas.set([]);
        this.mostrarToast(
          'error',
          'No se pudo consultar',
          resp.error || 'Ocurrió un error inesperado.'
        );
        return;
      }

      this.columnas.set(resp.data.columnas);
      this.filasApi.set(resp.data.filas);

      const validas = resp.data.filas.filter(
        (f) => String(f['Estatus'] ?? '').toLowerCase() === 'válida'
      ).length;

      this.mostrarToast(
        'success',
        'Consulta completada',
        `${validas} de ${resp.data.filas.length} cita(s) tienen fecha válida.`
      );
    } catch (e) {
      this.filasApi.set([]);
      this.columnas.set([]);
      this.mostrarToast(
        'error',
        'Error inesperado',
        'No fue posible conectar con el servidor.'
      );
    } finally {
      this.cargando.set(false);
    }
  }

  /** Confirmación GLOBAL: afecta a todas las filas válidas pendientes */
  confirmarGlobal(): void {
    const pendientes = this.filasValidasPendientes();
    if (pendientes.length === 0) return;

    // Aquí iría la llamada real al endpoint de confirmación en bloque.
    const set = new Set(this.confirmadas());
    for (const fila of pendientes) {
      set.add(fila.cita.folio);
    }
    this.confirmadas.set(set);

    this.mostrarToast(
      'success',
      'Reagenda confirmada',
      `Se confirmaron ${pendientes.length} cita(s) correctamente.`
    );
  }

  limpiar(): void {
    this.citas.set([]);
    this.filasApi.set([]);
    this.columnas.set([]);
    this.haConsultado.set(false);
    this.confirmadas.set(new Set());
    this.nombreArchivo.set('');
    this.toastVisible.set(false);
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers de presentación
  // ─────────────────────────────────────────────────────────────

  fechaCitaLocal(cita: CitaImportada): string {
    if (!cita.fecha) return '—';
    return cita.fecha.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private mostrarToast(
    tipo: ToastTipo,
    titulo: string,
    mensaje: string
  ): void {
    this.toastTipo.set(tipo);
    this.toastTitulo.set(titulo);
    this.toastMensaje.set(mensaje);
    this.toastVisible.set(true);
  }
}