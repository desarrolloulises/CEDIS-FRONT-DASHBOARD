import {
  Component,
  OnInit,
  Input,
  signal,
  computed,
  inject,
  HostListener,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatosService } from '../../../service/servicio.service';

// ── Componentes compartidos ──────────────────────────────────────
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DatePickerButtonComponent } from '../../../shared/components/date-picker-button/date-picker-button.component';

// ── Servicio y util ──────────────────────────────────────────────
import {
  ReagendaCitaService,
  ApiColumna,
  ReagendaData,
} from './services/reagenda-cita.service';
import { formatearCelda } from './utils/formato-celda.util';

// ─────────────────────────────────────────────────────────────────
// Tipos locales
// ─────────────────────────────────────────────────────────────────

export interface FilaNormalizada {
  nombre: string;
  tipo: string;
  valor: string;
}

type ToastTipo = 'success' | 'error';

/** Índices fijos según el contrato del backend */
const COLUMNAS_IGNORADAS = 2; // err_id, err_msg

// ─────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-reagenda-cita',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent,
    ToastComponent,
    ButtonComponent,
    DatePickerButtonComponent,
  ],
  templateUrl: './reagenda-cita.component.html',
  styleUrls: ['./reagenda-cita.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReagendaCitaComponent implements OnInit {
  // ─────────────────────────────────────────────────────────────
  // Dependencias
  // ─────────────────────────────────────────────────────────────

  private readonly service = inject(ReagendaCitaService);

  // ─────────────────────────────────────────────────────────────
  // ViewChild
  // ─────────────────────────────────────────────────────────────

  @ViewChild('asnInputRef', { static: true })
  asnInputRef!: ElementRef<HTMLInputElement>;

  // ─────────────────────────────────────────────────────────────
  // Estado
  // ─────────────────────────────────────────────────────────────

  readonly asnInput = signal<number | null>(null);
  readonly fechaSeleccionada = signal<Date | null>(null);
  readonly haConsultado = signal(false);
  readonly fila = signal<Record<string, unknown> | null>(null);
  readonly columnas = signal<ApiColumna[]>([]);
  readonly cargando = signal(false);

  // ── Toast ──
  readonly toastVisible = signal(false);
  readonly toastTipo = signal<ToastTipo>('success');
  readonly toastTitulo = signal('');
  readonly toastMensaje = signal('');

  // ─────────────────────────────────────────────────────────────
  // Derivados
  // ─────────────────────────────────────────────────────────────

  readonly puedeConsultar = computed(() => {
    const a = this.asnInput();
    return a !== null && !Number.isNaN(a) && a > 0;
  });

  /**
   * Columnas "reales" (sin las primeras 2 que se ignoran).
   * La última es la de días.
   */
  readonly columnasReales = computed<ApiColumna[]>(() => {
    const cols = this.columnas();
    if (cols.length <= COLUMNAS_IGNORADAS) return [];
    return cols.slice(COLUMNAS_IGNORADAS);
  });

  /** Días permitidos = valor de la ÚLTIMA columna de la fila */
  readonly diasPermitidos = computed<number>(() => {
    const f = this.fila();
    const cols = this.columnas();
    if (!f || cols.length === 0) return 0;

    const ultima = cols[cols.length - 1];
    const valor = f[ultima.nombre];
    const n = typeof valor === 'number' ? valor : Number(valor);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  });

  /** Columnas visibles ya formateadas para la tabla vertical */
  readonly columnasVisibles = computed<FilaNormalizada[]>(() => {
    const f = this.fila();
    const cols = this.columnasReales();
    if (!f || cols.length === 0) return [];

    return cols.map((col) => ({
      nombre: col.nombre,
      tipo: col.tipo,
      valor: formatearCelda(f[col.nombre], col.tipo),
    }));
  });

  // ─────────────────────────────────────────────────────────────
  // Ciclo de vida
  // ─────────────────────────────────────────────────────────────
    constructor(
      public datosService: DatosService,
    ) { }
  
  ngOnInit(): void {
    queueMicrotask(() => this.asnInputRef.nativeElement.focus());
  }

  // ─────────────────────────────────────────────────────────────
  // Atajos de teclado
  // ─────────────────────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  onKeyDown(ev: KeyboardEvent): void {
    if (ev.key === 'F2') {
      ev.preventDefault();
      this.asnInputRef.nativeElement.focus();
      this.asnInputRef.nativeElement.select();
      return;
    }

    if (
      ev.key === 'Enter' &&
      document.activeElement === this.asnInputRef.nativeElement &&
      this.puedeConsultar()
    ) {
      ev.preventDefault();
      this.consultar();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Filtro del calendario: fines de semana bloqueados
  // ─────────────────────────────────────────────────────────────

  readonly filtrarDias = (d: Date | null): boolean => {
    if (!d) return false;
    const dow = d.getDay();
    return dow !== 0 && dow !== 6;
  };

  readonly configCalendario = computed(() => {
    const dias = this.diasPermitidos();
    if (dias === 0) return {};
    return {
      bloquearFinesDeSemana: true,
      diasPermitidosDesdeHoy: dias,
      contarSoloDiasValidos: true,
    };
  });

  // ─────────────────────────────────────────────────────────────
  // Acciones
  // ─────────────────────────────────────────────────────────────

  consultar(): void {
    if (!this.puedeConsultar()) return;

    const asn = this.asnInput()!;
    this.cargando.set(true);
    this.fechaSeleccionada.set(null);

    this.service.validarAsn({ asn, usuario: this.datosService.usuarioSignal() }).subscribe({
      next: (resp) => {
        this.haConsultado.set(true);
        this.cargando.set(false);

        if (!resp.success || !resp.data) {
          this.fila.set(null);
          this.columnas.set([]);
          this.mostrarToast(
            'error',
            'No se pudo consultar',
            resp.error || 'Ocurrió un error inesperado.'
          );
          return;
        }

        const { columnas, filas } = resp.data;

        if (!filas || filas.length === 0) {
          this.fila.set(null);
          this.columnas.set([]);
          this.mostrarToast(
            'error',
            'Sin resultados',
            'No se encontró ninguna cita con ese ASN.'
          );
          return;
        }

        this.columnas.set(columnas);
        this.fila.set(filas[0]);

        const dias = this.diasPermitidos();
        if (dias === 0) {
          this.mostrarToast(
            'error',
            'Sin días disponibles',
            'La cita no tiene días hábiles configurados para reagendar.'
          );
        } else {
          this.mostrarToast(
            'success',
            'Cita encontrada',
            `Puede reagendar dentro de los próximos ${dias} día(s) hábil(es).`
          );
        }
      },
      error: () => {
        this.cargando.set(false);
        this.haConsultado.set(true);
        this.fila.set(null);
        this.columnas.set([]);
        this.mostrarToast(
          'error',
          'Error inesperado',
          'No fue posible conectar con el servidor.'
        );
      },
    });
  }

  confirmarReagenda(): void {
    const fecha = this.fechaSeleccionada();
    const asn = this.asnInput();
    const f = this.fila();
    if (!fecha || !asn || !f) return;

    this.cargando.set(true);

    this.service
      .actualizarFechaCita({
        asn,
        fechaSolicitada: this.formatearFechaApi(fecha),
        usuario: this.datosService.usuarioSignal(),
      })
      .subscribe({
        next: (resp) => {
          this.cargando.set(false);

          if (!resp.success || !resp.data?.citaActualizada) {
            this.mostrarToast(
              'error',
              'No se pudo reagendar',
              resp.error || 'La cita no pudo actualizarse.'
            );
            return;
          }

          this.mostrarToast(
            'success',
            'Reagenda confirmada',
            `La cita se reagendó para el ${fecha.toLocaleDateString('es-MX', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}.`
          );
        },
        error: () => {
          this.cargando.set(false);
          this.mostrarToast(
            'error',
            'Error inesperado',
            'No fue posible conectar con el servidor.'
          );
        },
      });
  }

  limpiarFormulario(): void {
    this.asnInput.set(null);
    this.fechaSeleccionada.set(null);
    this.fila.set(null);
    this.columnas.set([]);
    this.haConsultado.set(false);
    this.toastVisible.set(false);
    queueMicrotask(() => this.asnInputRef.nativeElement.focus());
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  /** Convierte Date → "dd-MM-yyyy" (formato que espera la API) */
  private formatearFechaApi(d: Date): string {
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}-${mes}-${anio}`;
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