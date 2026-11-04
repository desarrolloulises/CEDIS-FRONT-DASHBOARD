import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

import { RechazoGeneralService } from './services/consulta-rechazo-general.service';
import {
  ColumnaDinamica, FilaRechazoGeneral
} from './interfaces/consulta-rechazo-general.interface';

import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

type ToastTipo = 'success' | 'error';

/**
 * Etiquetas amigables por POSICIÓN.
 * Déjalo vacío si aún no conoces las columnas del endpoint: el componente
 * caerá automáticamente al `nombre` técnico que devuelva la API.
 *
 * Cuando tengas un ejemplo de respuesta, rellena en orden:
 *   ['Columna 1', 'Columna 2', ...]
 */
const ETIQUETAS_POR_POSICION: string[] = [
  'Proveedor',
  'Razón social',
   'Total ASN',
   'ASN aceptados',
   'ASN rechazados',
   '% Rechazados vs Recibidos'
];

@Component({
  selector: 'app-consulta-rechazo-general',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    LoadingSpinnerComponent, ToastComponent, ButtonComponent
  ],
  templateUrl: './consulta-rechazo-general.component.html',
  styleUrls: ['./consulta-rechazo-general.component.css']
})
export class ConsultaRechazoGeneralComponent implements OnInit {

  private rechazoService = inject(RechazoGeneralService);

  // ── Spinner / Toast ─────────────────────────────────────────────
  cargando = signal(false);
  toastVisible = signal(false);
  toastTipo = signal<ToastTipo>('success');
  toastTitulo = signal('');
  toastMensaje = signal('');

  // ── Filtros ─────────────────────────────────────────────────────
  fechaInicioInput = signal<string>('');
  fechaFinInput = signal<string>('');

  // ── Datos tabla ─────────────────────────────────────────────────
  columnas = signal<ColumnaDinamica[]>([]);
  filas = signal<FilaRechazoGeneral[]>([]);
  filtro = signal('');
  cargadoInicialmente = signal(false);
  exportando = signal(false);

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

  ngOnInit(): void {
    // Consulta inicial SIN fechas: se envían como "" (string vacío)
    this.consultarInicial();
  }

  // ── 1. Consulta inicial (sin fechas → "") ──────────────────────
  private consultarInicial(): void {
    this.cargando.set(true);
    this.rechazoService.obtenerReporteRechazosGeneral({
      fechaInicio: '',
      fechaFin: ''
    }).subscribe({
      next: res => {
        this.cargando.set(false);
        this.cargadoInicialmente.set(true);
        if (res.success && res.data) {
          this.columnas.set(this.decorarColumnas(res.data.columnas));
          this.filas.set(res.data.filas);
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

  // ── 2. Consultar manualmente (exige ambas fechas) ──────────────
  consultar(): void {
    const inicio = this.fechaInicioInput();
    const fin = this.fechaFinInput();

    if (!inicio || !fin) {
      this.mostrarToast('error', 'Filtro', 'Debes especificar fecha inicio y fecha fin');
      return;
    }
    if (inicio > fin) {
      this.mostrarToast('error', 'Filtro', 'La fecha inicio no puede ser mayor que la fecha fin');
      return;
    }

    this.consultarConFechas(
      this.formatearFechaEnvio(inicio),
      this.formatearFechaEnvio(fin)
    );
  }

  // ── 3. Limpiar → vuelve a la consulta sin fechas ───────────────
  limpiarFormulario(): void {
    this.fechaInicioInput.set('');
    this.fechaFinInput.set('');
    this.filtro.set('');
    this.consultarInicial();
  }

  /** Consulta con fechas ya validadas y en formato de envío (dd-MM-yyyy). */
  private consultarConFechas(fechaInicio: string, fechaFin: string): void {
    this.cargando.set(true);
    this.rechazoService.obtenerReporteRechazosGeneral({
      fechaInicio,
      fechaFin
    }).subscribe({
      next: res => {
        this.cargando.set(false);
        if (res.success && res.data) {
          this.columnas.set(this.decorarColumnas(res.data.columnas));
          this.filas.set(res.data.filas);
        } else {
          this.mostrarToast('error', 'Consulta', res.error || 'No se pudo consultar');
        }
      },
      error: () => {
        this.cargando.set(false);
        this.mostrarToast('error', 'Consulta', 'Error de comunicación con el servidor');
      }
    });
  }

  onFiltroInput(event: Event): void {
    this.filtro.set((event.target as HTMLInputElement).value);
  }

  // ── 4. Exportar ────────────────────────────────────────────────
  exportarExcel(): void {
    const filas = this.filasFiltradas();
    if (!filas.length) return;

    this.exportando.set(true);

    try {
      const cols = this.columnas();

      const data = filas.map(fila => {
        const obj: Record<string, any> = {};
        cols.forEach(col => {
          const key = this.etiquetaColumna(col);
          obj[key] = this.valorCelda(fila, col);
        });
        return obj;
      });

      const ws = XLSX.utils.json_to_sheet(data);

      // Anchos: base por tipo, más ancho para texto largo
      ws['!cols'] = cols.map(col => {
        const etiqueta = this.etiquetaColumna(col);
        if (col.tipo === 'String') {
          return { wch: Math.max(18, etiqueta.length + 4) };
        }
        if (col.tipo === 'DateTime' || col.tipo === 'Date') return { wch: 12 };
        if (col.tipo === 'Decimal') return { wch: 16 };
        return { wch: 14 };
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'RechazosGeneral');

      const fecha = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `rechazos_general_${fecha}.xlsx`);

      // this.mostrarToast('success', 'Exportación', 'Archivo generado correctamente');
    } catch {
      this.mostrarToast('error', 'Exportación', 'No se pudo generar el archivo');
    } finally {
      this.exportando.set(false);
    }
  }

  // ── Utilidades de presentación ─────────────────────────────────
  /** Etiqueta amigable para una columna (por posición, con fallback al nombre técnico). */
  etiquetaColumna(col: ColumnaDinamica): string {
    return col.etiqueta || col.nombre;
  }

  /** Valor formateado para UI/exportación. */
  valorCelda(fila: FilaRechazoGeneral, col: ColumnaDinamica): string {
    const v = fila[col.nombre];
    if (v == null) return '';

    if (col.tipo === 'DateTime' || col.tipo === 'Date') {
      return this.formatearFecha(v);
    }
    if (col.tipo === 'Decimal') {
      const n = Number(v);
      return isNaN(n) ? String(v) : n.toFixed(2);
    }
    return String(v);
  }

  // ── Internos ───────────────────────────────────────────────────
  /** Aplica etiquetas por posición sin tocar `nombre` (clave de las filas). */
  private decorarColumnas(columnas: ColumnaDinamica[]): ColumnaDinamica[] {
    return columnas.map((col, idx) => ({
      ...col,
      etiqueta: ETIQUETAS_POR_POSICION[idx] ?? col.nombre
    }));
  }

  /** input date (yyyy-MM-dd) → dd-MM-yyyy. Solo se llama con fechas no vacías. */
  private formatearFechaEnvio(fechaISO: string): string {
    const [yyyy, mm, dd] = fechaISO.split('-');
    return `${dd}-${mm}-${yyyy}`;
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

  private mostrarToast(tipo: ToastTipo, titulo: string, mensaje: string): void {
    this.toastTipo.set(tipo);
    this.toastTitulo.set(titulo);
    this.toastMensaje.set(mensaje);
    this.toastVisible.set(true);
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