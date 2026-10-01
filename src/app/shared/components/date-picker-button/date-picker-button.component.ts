import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  forwardRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

/** Días de la semana (0 = domingo ... 6 = sábado) */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DatePickerConfig {
  /** Inhabilita sábado y domingo */
  bloquearFinesDeSemana?: boolean;

  /** Inhabilita días específicos de la semana (0=Dom ... 6=Sáb) */
  diasBloqueados?: DiaSemana[];

  /** Solo permite seleccionar N días (hábiles o naturales) desde hoy */
  diasPermitidosDesdeHoy?: number;

  /**
   * Si es true, al contar `diasPermitidosDesdeHoy` se saltan
   * los días que estén bloqueados (fines de semana / diasBloqueados).
   * Si es false, se cuentan días naturales.
   * Default: true
   */
  contarSoloDiasValidos?: boolean;

  /**
   * Fecha base para el conteo. Si no se envía, se usa "hoy".
   * Útil para tests o escenarios "a partir de X fecha".
   */
  fechaBase?: Date;
}

@Component({
  selector: 'app-date-picker-button',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
  ],
  templateUrl: './date-picker-button.component.html',
  styleUrls: ['./date-picker-button.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerButtonComponent),
      multi: true,
    },
  ],
})
export class DatePickerButtonComponent
  implements ControlValueAccessor, OnChanges
{
  // ─────────────────────────────────────────────────────────────
  // Inputs
  // ─────────────────────────────────────────────────────────────

  @Input() placeholder = 'Seleccionar fecha';
  @Input() disabled = false;
  @Input() formato: 'short' | 'medium' | 'long' = 'medium';

  /**
   * Configuración declarativa de días habilitados.
   * Ej:
   *   [config]="{ bloquearFinesDeSemana: true, diasPermitidosDesdeHoy: 3 }"
   */
  @Input() config: DatePickerConfig = {};

  /**
   * Filtro adicional definido por el consumidor.
   * Se aplica DESPUÉS de las reglas de `config`.
   */
  @Input() dateFilter?: (d: Date | null) => boolean;

  // ─────────────────────────────────────────────────────────────
  // Outputs
  // ─────────────────────────────────────────────────────────────

  @Output() fechaChange = new EventEmitter<Date | null>();

  // ─────────────────────────────────────────────────────────────
  // ViewChild
  // ─────────────────────────────────────────────────────────────

  @ViewChild('picker') picker!: MatDatepicker<Date>;

  // ─────────────────────────────────────────────────────────────
  // Estado interno
  // ─────────────────────────────────────────────────────────────

  private _value: Date | null = null;
  private _onChange: (v: Date | null) => void = () => {};
  private _onTouched: () => void = () => {};

  /** Caché del filtro compilado */
  private _filtroCache: ((d: Date | null) => boolean) | null = null;

  // ─────────────────────────────────────────────────────────────
  // Ciclo de vida
  // ─────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] || changes['dateFilter']) {
      this._filtroCache = null; // invalida el filtro compilado
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Filtro compilado
  // ─────────────────────────────────────────────────────────────

  /** Filtro final que se pasa a matDatepickerFilter */
  get filtroInterno(): (d: Date | null) => boolean {
    if (!this._filtroCache) {
      this._filtroCache = this.construirFiltro();
    }
    return this._filtroCache;
  }

  private construirFiltro(): (d: Date | null) => boolean {
    const cfg = this.config ?? {};
    const userFilter = this.dateFilter;

    const {
      bloquearFinesDeSemana = false,
      diasBloqueados = [],
      diasPermitidosDesdeHoy,
      contarSoloDiasValidos = true,
      fechaBase,
    } = cfg;

    // Precalculamos el rango [min, max] si aplica
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    if (typeof diasPermitidosDesdeHoy === 'number' && diasPermitidosDesdeHoy >= 0) {
      const base = this.normalizarFecha(fechaBase ?? new Date());
      const bloqueadosSet = new Set<number>(diasBloqueados);

      const esValido = (d: Date): boolean => {
        const dow = d.getDay() as DiaSemana;
        if (bloquearFinesDeSemana && (dow === 0 || dow === 6)) return false;
        if (bloqueadosSet.has(dow)) return false;
        return true;
      };

      minDate = base;

      if (contarSoloDiasValidos) {
        // Avanzamos N días VÁLIDOS (excluyendo los bloqueados)
        let encontrados = 0;
        const cursor = new Date(base);
        let guard = 0;
        while (encontrados < diasPermitidosDesdeHoy && guard < 3650) {
          if (esValido(cursor)) {
            encontrados++;
            if (encontrados === diasPermitidosDesdeHoy) {
              maxDate = new Date(cursor);
              break;
            }
          }
          cursor.setDate(cursor.getDate() + 1);
          guard++;
        }
      } else {
        // Conteo de días naturales
        maxDate = new Date(base);
        maxDate.setDate(maxDate.getDate() + diasPermitidosDesdeHoy);
      }
    }

    const minTime = minDate ? this.normalizarFecha(minDate).getTime() : null;
    const maxTime = maxDate ? this.normalizarFecha(maxDate).getTime() : null;

    return (d: Date | null): boolean => {
      if (!d) return false;
      const fecha = this.normalizarFecha(d);
      const dow = fecha.getDay() as DiaSemana;

      // 1) Fines de semana
      if (bloquearFinesDeSemana && (dow === 0 || dow === 6)) return false;

      // 2) Días bloqueados explícitos
      if (diasBloqueados.includes(dow)) return false;

      // 3) Rango desde hoy
      const t = fecha.getTime();
      if (minTime !== null && t < minTime) return false;
      if (maxTime !== null && t > maxTime) return false;

      // 4) Filtro del consumidor
      if (userFilter && !userFilter(fecha)) return false;

      return true;
    };
  }

  // ─────────────────────────────────────────────────────────────
  // ControlValueAccessor
  // ─────────────────────────────────────────────────────────────

  get value(): Date | null {
    return this._value;
  }

  writeValue(value: Date | null): void {
    this._value = value ?? null;
  }

  registerOnChange(fn: (v: Date | null) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // ─────────────────────────────────────────────────────────────
  // Interacción
  // ─────────────────────────────────────────────────────────────

  abrirCalendario(): void {
    if (this.disabled) return;
    this._onTouched();
    this.picker?.open();
  }

  onFechaSeleccionada(fecha: Date | null): void {
    this._value = fecha;
    this._onChange(fecha);
    this.fechaChange.emit(fecha);
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  /** Devuelve una copia a medianoche (evita problemas de TZ/hora) */
  private normalizarFecha(d: Date): Date {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
  }

  // ─────────────────────────────────────────────────────────────
  // Texto formateado
  // ─────────────────────────────────────────────────────────────

  get textoFecha(): string {
    if (!this._value) return this.placeholder;
    return this._value.toLocaleDateString('es-MX', this.opcionesFormato);
  }

  private get opcionesFormato(): Intl.DateTimeFormatOptions {
    switch (this.formato) {
      case 'short':
        return { day: '2-digit', month: '2-digit', year: 'numeric' };
      case 'long':
        return { day: '2-digit', month: 'long', year: 'numeric' };
      case 'medium':
      default:
        return { day: '2-digit', month: 'short', year: 'numeric' };
    }
  }
}