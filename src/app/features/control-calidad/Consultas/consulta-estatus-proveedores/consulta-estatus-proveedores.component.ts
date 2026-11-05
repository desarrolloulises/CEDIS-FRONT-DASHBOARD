import {
  Component, OnInit, OnDestroy,
  signal, computed, inject, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

import { ControlCalidadService } from './services/consulta-estatus-proveedores.service';
import {
  ColumnaDinamica,
  FilaEstatusProveedor,
  TiemposRefreshData
} from './interfaces/consulta-estatus-proveedores.interface';

import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

const ETIQUETAS_POR_POSICION: string[] = [
  'Tipo',
  'Color',
  'Proveedor',
  'Razón social',
  'ASN', 
  'Nombre',
  'Puerta',
  'Hora',
  'Estatus'
];

type ToastTipo = 'success' | 'error';
type AutoRefreshEstado = 'inactivo' | 'activo' | 'fuera-horario' | 'no-disponible';

@Component({
  selector: 'app-consulta-estatus-proveedores',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    LoadingSpinnerComponent, ToastComponent, ButtonComponent
  ],
  templateUrl: './consulta-estatus-proveedores.component.html',
  styleUrls: ['./consulta-estatus-proveedores.component.scss']
})
export class ConsultaEstatusProveedoresComponent implements OnInit, OnDestroy {

  /** Máximo de filas de Tipo 1 en la tabla superior. */
  private readonly LIMITE_TIPO_1 = 10;

  /** Tick del temporizador (1 s). */
  private readonly TICK_MS = 1000;

  private controlCalidadService = inject(ControlCalidadService);

  // ── Spinner / Toast ─────────────────────────────────────────────
  cargando = signal(false);
  toastVisible = signal(false);
  toastTipo = signal<ToastTipo>('success');
  toastTitulo = signal('');
  toastMensaje = signal('');

  // ── Datos tabla ─────────────────────────────────────────────────
  columnas = signal<ColumnaDinamica[]>([]);
  filas = signal<FilaEstatusProveedor[]>([]);
  filtro = signal('');
  cargadoInicialmente = signal(false);
  exportando = signal(false);

  // ── Auto-refresco (estado interno, sin binding en la UI) ───────
  tiemposRefresh = signal<TiemposRefreshData | null>(null);
  autoRefreshEstado = signal<AutoRefreshEstado>('inactivo');
  segundosRestantes = signal<number>(0);
  flashActivo = signal(false);

  private tickId: ReturnType<typeof setInterval> | null = null;

  // ── Computed ────────────────────────────────────────────────────
  filasFiltradas = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    const filas = this.filas();
    if (!texto) return filas;
    return filas.filter(fila =>
      this.columnas().some(col => {
        const v = fila[col.nombre];
        return v != null && String(v).toLowerCase().includes(texto);
      })
    );
  });

  filasTipo1 = computed(() =>
    this.filasFiltradas().filter(f => this.esTipo1(f))
  );

  filasTipo1Visibles = computed(() =>
    this.filasTipo1().slice(0, this.LIMITE_TIPO_1)
  );

  filasResto = computed(() =>
    this.filasFiltradas().filter(f => !this.esTipo1(f))
  );

  tipo1ExcedeLimite = computed(() =>
    this.filasTipo1().length > this.LIMITE_TIPO_1
  );

  columnasVisibles = computed(() =>
    this.columnas().filter(c => !this.esColumnaColor(c))
  );

  /** Nombre de la columna de color, si existe. */
  get columnaColor(): string | null {
    const col = this.columnas().find(c => c.nombre.toLowerCase() === 'color');
    return col?.nombre ?? null;
  }

  // ── Ciclo de vida ──────────────────────────────────────────────
  ngOnInit(): void {
    this.controlCalidadService.obtenerTiemposRefresh().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.tiemposRefresh.set({
            horaInicio: (res.data.horaInicio || '').trim(),
            horaFin: (res.data.horaFin || '').trim(),
            intervalo: Number(res.data.intervalo) || 0
          });
        } else {
          this.autoRefreshEstado.set('no-disponible');
        }
        this.iniciarTick();
        this.consultar();
      },
      error: () => {
        this.autoRefreshEstado.set('no-disponible');
        this.iniciarTick();
        this.consultar();
      }
    });
  }

  ngOnDestroy(): void {
    this.detenerTick();
  }

  // ── Tick (1 s): estado y cuenta regresiva interna ──────────────
  private iniciarTick(): void {
    this.detenerTick();
    const ahora = new Date();
    this.autoRefreshEstado.set(this.calcularEstado(ahora));
    this.segundosRestantes.set(
      this.autoRefreshEstado() === 'activo' ? this.intervaloSegundos() : 0
    );
    this.tickId = setInterval(() => this.onTick(), this.TICK_MS);
  }

  private detenerTick(): void {
    if (this.tickId != null) {
      clearInterval(this.tickId);
      this.tickId = null;
    }
  }

  private onTick(): void {
    const estadoAnterior = this.autoRefreshEstado();
    const estado = this.calcularEstado(new Date());
    this.autoRefreshEstado.set(estado);

    if (estado !== 'activo') {
      this.segundosRestantes.set(0);
      return;
    }

    // Al entrar en horario (o arrancar activo), damos un intervalo completo.
    if (estadoAnterior !== 'activo') {
      this.segundosRestantes.set(this.intervaloSegundos());
      return;
    }

    const restante = this.segundosRestantes() - 1;

    if (restante <= 0) {
      // Reiniciamos el contador antes de la llamada para evitar doble disparo.
      this.segundosRestantes.set(this.intervaloSegundos());
      this.consultar();
    } else {
      this.segundosRestantes.set(restante);
    }
  }

  private calcularEstado(ahora: Date): AutoRefreshEstado {
    const t = this.tiemposRefresh();
    if (!t || t.intervalo <= 0) return 'no-disponible';
    const ini = this.hhmmAMinutos(t.horaInicio);
    const fin = this.hhmmAMinutos(t.horaFin);
    if (ini == null || fin == null) return 'no-disponible';
    const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
    return this.enRango(ahoraMin, ini, fin) ? 'activo' : 'fuera-horario';
  }

  /**
   * Indica si `ahoraMin` está dentro de [ini, fin]. Soporta rangos que
   * cruzan medianoche (ej. 22:00–06:00).
   */
  private enRango(ahoraMin: number, ini: number, fin: number): boolean {
    if (ini <= fin) {
      return ahoraMin >= ini && ahoraMin <= fin;
    }
    return ahoraMin >= ini || ahoraMin <= fin;
  }

  /** Intervalo en segundos (el backend lo envía en segundos). */
  private intervaloSegundos(): number {
    const t = this.tiemposRefresh();
    return t ? Math.max(0, Math.floor(t.intervalo)) : 0;
  }

  private hhmmAMinutos(hhmm: string): number | null {
    const m = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim());
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return h * 60 + min;
  }

  // ── 1. Consultar / recargar ────────────────────────────────────
  consultar(): void {
    this.cargando.set(true);
    this.controlCalidadService.obtenerEstatusProveedores().subscribe({
      next: res => {
        this.cargando.set(false);
        const yaHabiaDatos = this.cargadoInicialmente();
        this.cargadoInicialmente.set(true);

        if (res.success && res.data) {
          this.columnas.set(this.decorarColumnas(res.data.columnas));   // ← decorar
          this.filas.set(res.data.filas);

          if (yaHabiaDatos) {
            this.dispararFlash();
          }
        } else {
          this.mostrarToast('error', 'Consulta', res.error || 'No se pudo consultar');
        }
      },
      error: () => {
        this.cargando.set(false);
        this.cargadoInicialmente.set(true);
        this.mostrarToast('error', 'Consulta', 'Error de comunicación con el servidor');
      }
    });
  }

  /** Recarga manual: reinicia la cuenta regresiva para no refrescar de inmediato. */
  recargarManual(): void {
    if (this.autoRefreshEstado() === 'activo') {
      this.segundosRestantes.set(this.intervaloSegundos());
    }
    this.consultar();
  }

  onFiltroInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filtro.set(value);
  }

  // ── 2. Exportar ────────────────────────────────────────────────
  exportarExcel(): void {
    const filas = this.filasFiltradas();
    if (!filas.length) return;

    this.exportando.set(true);

    try {
      const cols = this.columnas();

      const filasOrdenadas = [...filas].sort((a, b) => {
        const at = this.esTipo1(a) ? 0 : 1;
        const bt = this.esTipo1(b) ? 0 : 1;
        return at - bt;
      });

      const data = filasOrdenadas.map(fila => {
        const obj: Record<string, any> = {};
        cols.forEach(col => {
          obj[this.etiquetaColumna(col)] = this.valorCelda(fila, col);
        });
        return obj;
      });

      const ws = XLSX.utils.json_to_sheet(data);

      ws['!cols'] = cols.map(col => {
        const etiqueta = this.etiquetaColumna(col);
        switch (col.tipo) {
          case 'DateTime':
          case 'Date':
            return { wch: 12 };
          case 'TimeSpan':
            return { wch: 10 };
          case 'Int32':
          case 'Int16':
            return { wch: Math.max(10, etiqueta.length + 2) };
          case 'String':
            return { wch: Math.max(20, etiqueta.length + 4) };
          default:
            return { wch: Math.max(14, etiqueta.length + 2) };
        }
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'EstatusProveedores');

      const fecha = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `estatus_proveedores_${fecha}.xlsx`);

      this.mostrarToast('success', 'Exportación', 'Archivo generado correctamente');
    } catch {
      this.mostrarToast('error', 'Exportación', 'No se pudo generar el archivo');
    } finally {
      this.exportando.set(false);
    }
  }

  // ── Utilidades ────────────────────────────────────────────────
  valorCelda(fila: FilaEstatusProveedor, col: ColumnaDinamica): string {
    const v = fila[col.nombre];
    if (v == null) return '';

    if (col.tipo === 'DateTime' || col.tipo === 'Date') {
      return this.formatearFecha(v);
    }
    if (col.tipo === 'TimeSpan') {
      return this.formatearHora(v);
    }
    return String(v);
  }

  esColumnaColor(col: ColumnaDinamica): boolean {
    return this.columnaColor === col.nombre;
  }

  colorFilaBg(fila: FilaEstatusProveedor): string | null {
    const c = this.colorDeFila(fila);
    if (!c) return null;
    if (c.startsWith('#')) {
      const hex = c.length === 4
        ? c.slice(1).split('').map(ch => ch + ch).join('')
        : c.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, 0.35)`;
    }
    return `color-mix(in srgb, ${c} 15%, white)`;
  }

  colorFilaBorder(fila: FilaEstatusProveedor): string | null {
    const c = this.colorDeFila(fila);
    return c ? `4px solid ${c}` : null;
  }

  colorDeFila(fila: FilaEstatusProveedor): string | null {
    const col = this.columnaColor;
    if (!col) return null;
    const v = fila[col];
    if (typeof v !== 'string') return null;
    const s = v.trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s) || /^[a-z]{3,20}$/i.test(s)) {
      return s;
    }
    return null;
  }

  /** Etiqueta amigable para una columna (por posición, con fallback al nombre técnico). */
  etiquetaColumna(col: ColumnaDinamica): string {
    return col.etiqueta || col.nombre;
  }

  /** Aplica etiquetas por posición sin tocar `nombre` (clave de las filas). */
  private decorarColumnas(columnas: ColumnaDinamica[]): ColumnaDinamica[] {
    return columnas.map((col, idx) => ({
      ...col,
      etiqueta: ETIQUETAS_POR_POSICION[idx] ?? col.nombre
    }));
  }

  private esTipo1(fila: FilaEstatusProveedor): boolean {
    const col = this.columnas().find(c => c.nombre.toLowerCase() === 'tipo');
    if (!col) return false;
    return Number(fila[col.nombre]) === 1;
  }

  private formatearFecha(valor: any): string {
    if (!valor) return '';
    const d = valor instanceof Date ? valor : new Date(valor);
    if (isNaN(d.getTime())) return String(valor);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  private formatearHora(valor: any): string {
    if (valor == null) return '';
    const s = String(valor);
    const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(s);
    if (!m) return s;
    const hh = m[1].padStart(2, '0');
    const mm = m[2];
    const ss = m[3] ?? '00';
    // return `${hh}:${mm}:${ss}`;
    return `${hh}:${mm}`;
  }

  private mostrarToast(tipo: ToastTipo, titulo: string, mensaje: string): void {
    this.toastTipo.set(tipo);
    this.toastTitulo.set(titulo);
    this.toastMensaje.set(mensaje);
    this.toastVisible.set(true);
  }

  /**
 * Overlay negro a pantalla completa durante ~120 ms para evitar que el
 * monitor se queme con imágenes estáticas. Se dispara tras cada
 * actualización exitosa (no en la carga inicial).
 */
  private dispararFlash(): void {
    // Respeta la preferencia del sistema.
    if (typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    if (this.flashActivo()) return; // ya hay uno en curso

    this.flashActivo.set(true);
    setTimeout(() => this.flashActivo.set(false), 120);
  }

  // ── Atajos ────────────────────────────────────────────────────
  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'F2') {
      e.preventDefault();
      document.querySelector<HTMLInputElement>('.filter-input')?.focus();
    }
    if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
      if (!this.exportando() && this.filasFiltradas().length) this.exportarExcel();
    }
  }
}