import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { forkJoin } from 'rxjs';

import { ProductividadAsnService } from './services/consulta-productividad-por-asn.service';
import {
  ColumnaDinamica, FilaProductividadAsn,
  ProductividadAsnCombinado
} from './interfaces/consulta-productividad-por-asn.interface';

import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

type ToastTipo = 'success' | 'error';

const ETIQUETAS_POR_POSICION: string[] = [
  'ASN',
  'Proveedor',
  'Razón social',
  'Hora registro',
  'Hora asignacion',
  'Hora inicio',
  'Hora termino',
  'Total cajas',
  'Tiempo de registro final de calidad',
];

@Component({
  selector: 'app-consulta-productividad-por-asn',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    LoadingSpinnerComponent, ToastComponent, ButtonComponent
  ],
  templateUrl: './consulta-productividad-por-asn.component.html',
  styleUrls: ['./consulta-productividad-por-asn.component.scss']
})
export class ConsultaProductividadPorAsnComponent implements OnInit {

  private productividadService = inject(ProductividadAsnService);

  cargando = signal(false);
  toastVisible = signal(false);
  toastTipo = signal<ToastTipo>('success');
  toastTitulo = signal('');
  toastMensaje = signal('');

  fechaInicioInput = signal<string>('');
  fechaFinInput = signal<string>('');

  columnas = signal<ColumnaDinamica[]>([]);
  filas = signal<FilaProductividadAsn[]>([]);
  filaTotales = signal<FilaProductividadAsn | null>(null);
  filtro = signal('');
  cargadoInicialmente = signal(false);
  exportando = signal(false);

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
    this.consultarInicial();
  }

  private consultarInicial(): void {
    this.ejecutarConsulta('', '');
  }

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

    this.ejecutarConsulta(
      this.formatearFechaEnvio(inicio),
      this.formatearFechaEnvio(fin)
    );
  }

  limpiarFormulario(): void {
    this.fechaInicioInput.set('');
    this.fechaFinInput.set('');
    this.filtro.set('');
    this.consultarInicial();
  }

  private ejecutarConsulta(fechaInicio: string, fechaFin: string): void {
    this.cargando.set(true);

    const payload = { fechaInicio, fechaFin };

    forkJoin({
      detalle: this.productividadService.obtenerReporteProductividadAsnDetalle(payload),
      totales: this.productividadService.obtenerReporteProductividadAsnTotales(payload)
    }).subscribe({
      next: (res: ProductividadAsnCombinado) => {
        this.cargando.set(false);
        this.cargadoInicialmente.set(true);

        const errores: string[] = [];

        if (res.detalle.success && res.detalle.data) {
          this.columnas.set(this.decorarColumnas(res.detalle.data.columnas));
          this.filas.set(res.detalle.data.filas);
        } else {
          errores.push(`Detalle: ${res.detalle.error || 'sin datos'}`);
        }

        if (res.totales.success && res.totales.data?.filas?.length) {
          this.filaTotales.set(res.totales.data.filas[0]);
        } else {
          this.filaTotales.set(null);
          errores.push(`Totales: ${res.totales.error || 'sin datos'}`);
        }

        if (errores.length) {
          this.mostrarToast('error', 'Consulta', errores.join(' | '));
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
      XLSX.utils.book_append_sheet(wb, ws, 'ProductividadASN');

      const fecha = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `productividad_asn_${fecha}.xlsx`);

      this.mostrarToast('success', 'Exportación', 'Archivo generado correctamente');
    } catch {
      this.mostrarToast('error', 'Exportación', 'No se pudo generar el archivo');
    } finally {
      this.exportando.set(false);
    }
  }

  etiquetaColumna(col: ColumnaDinamica): string {
    return col.etiqueta || col.nombre;
  }

  valorCelda(fila: FilaProductividadAsn, col: ColumnaDinamica): string {
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

  private decorarColumnas(columnas: ColumnaDinamica[]): ColumnaDinamica[] {
    return columnas.map((col, idx) => ({
      ...col,
      etiqueta: ETIQUETAS_POR_POSICION[idx] ?? col.nombre
    }));
  }

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

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'F2') {
      e.preventDefault();
      document.querySelector<HTMLInputElement>('.filter-input')?.focus();
    }
    if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
      if (!this.exportando() && this.filasFiltradas().length) {
        this.exportarExcel();
      }
    }
  }
}