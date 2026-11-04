import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

import { NivelInspeccionService } from './services/consulta-nivel-inspeccion.service';
import {
  ColumnaDinamica, FilaNivelInspeccion
} from './interfaces/consulta-nivel-inspeccion.interface';

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
  'Nivel',
  'Uno', 
  'Dos',
  'Tres',
  'Cuatro',
  'Cinco'
  
];

@Component({
  selector: 'app-consulta-nivel-inspeccion',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    LoadingSpinnerComponent, ToastComponent, ButtonComponent
  ],
  templateUrl: './consulta-nivel-inspeccion.component.html',
  styleUrls: ['./consulta-nivel-inspeccion.component.css']
})
export class ConsultaNivelInspeccionComponent implements OnInit {

  private nivelService = inject(NivelInspeccionService);

  // ── Spinner / Toast ─────────────────────────────────────────────
  cargando = signal(false);
  toastVisible = signal(false);
  toastTipo = signal<ToastTipo>('success');
  toastTitulo = signal('');
  toastMensaje = signal('');

  // ── Datos tabla ─────────────────────────────────────────────────
  columnas = signal<ColumnaDinamica[]>([]);
  filas = signal<FilaNivelInspeccion[]>([]);
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
    this.consultar();
  }

  // ── Consultar / Recargar ───────────────────────────────────────
  consultar(): void {
    this.cargando.set(true);

    this.nivelService.obtenerReporteNivelInspeccion().subscribe({
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

  onFiltroInput(event: Event): void {
    this.filtro.set((event.target as HTMLInputElement).value);
  }

  // ── Exportar ───────────────────────────────────────────────────
  exportarExcel(): void {
    const filas = this.filasFiltradas();
    if (!filas.length) return;

    this.exportando.set(true);

    try {
      const cols = this.columnas();

      const data = filas.map(fila => {
        const obj: Record<string, any> = {};
        cols.forEach(col => {
          obj[this.etiquetaColumna(col)] = this.valorCelda(fila, col);
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
      XLSX.utils.book_append_sheet(wb, ws, 'NivelInspeccion');

      const fecha = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `nivel_inspeccion_${fecha}.xlsx`);

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
  valorCelda(fila: FilaNivelInspeccion, col: ColumnaDinamica): string {
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