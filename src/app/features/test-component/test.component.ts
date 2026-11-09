import {
  Component, OnInit, signal, inject, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UsuarioService } from './services/usuario.service';
import { CatalogoService } from './services/catalogo.service';
import {
  Catalogo, ColumnaDinamica, FilaCatalogo, PermisosCatalogo,
  ETIQUETAS_POR_CATALOGO, Usuario
} from './interfaces/test.interface';

import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

type ToastTipo = 'success' | 'error';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    LoadingSpinnerComponent, ToastComponent, ButtonComponent
  ],
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {

  private usuarioService = inject(UsuarioService);
  private catalogoService = inject(CatalogoService);

  // ── Spinner / Toast ─────────────────────────────────────────
  cargandoUsuario = signal(false);
  cargandoCatalogos = signal(false);
  cargandoRegistros = signal(false);
  toastVisible = signal(false);
  toastTipo = signal<ToastTipo>('success');
  toastTitulo = signal('');
  toastMensaje = signal('');

  // ── Usuario ────────────────────────────────────────────────
  usuario = signal<Usuario | null>(null);

  // ── Catálogos ──────────────────────────────────────────────
  catalogos = signal<Catalogo[]>([]);
  catalogoSeleccionado = signal<string>('');

  // ── Datos ──────────────────────────────────────────────────
  columnas = signal<ColumnaDinamica[]>([]);
  filas = signal<FilaCatalogo[]>([]);

  // ── Permisos resueltos (rol × catálogo) ────────────────────
  permisos = signal<PermisosCatalogo>({
    puedeAgregar: false,
    puedeEliminar: false,
    columnasNoEditables: []
  });

  // ── Selección / edición ────────────────────────────────────
  filaSeleccionada = signal<FilaCatalogo | null>(null);
  celdaEditando = signal<{ filaIndex: number; campo: string } | null>(null);

  // ── Modal ──────────────────────────────────────────────────
  modalAbierto = signal(false);
  formModel = signal<Record<string, any>>({});
  camposEditables = signal<ColumnaDinamica[]>([]);

  // ── Ciclo de vida ──────────────────────────────────────────
  ngOnInit(): void {
    this.cargarUsuario();
  }

  // ── 1. Usuario → catálogos ─────────────────────────────────
  private cargarUsuario(): void {
    this.cargandoUsuario.set(true);
    this.usuarioService.cargarUsuario().subscribe({
      next: usr => {
        this.usuario.set(usr);
        this.usuarioService.usuario.set(usr);
        this.cargandoUsuario.set(false);
        this.cargarCatalogos(usr.rol);
      },
      error: () => {
        this.cargandoUsuario.set(false);
        this.mostrarToast('error', 'Usuario', 'No se pudo obtener el usuario');
      }
    });
  }

  private cargarCatalogos(rol: Usuario['rol']): void {
    this.cargandoCatalogos.set(true);
    this.catalogoService.obtenerCatalogosPorRol(rol).subscribe({
      next: catalogos => {
        this.cargandoCatalogos.set(false);
        this.catalogos.set(catalogos);
        if (catalogos.length) {
          this.onCambiarCatalogo(catalogos[0].id);
        }
      },
      error: () => {
        this.cargandoCatalogos.set(false);
        this.mostrarToast('error', 'Catálogos', 'No se pudo obtener la lista de catálogos');
      }
    });
  }

  // ── 2. Cambio de catálogo → registros + permisos ───────────
  onCambiarCatalogo(catalogoId: string): void {
    if (!catalogoId) return;
    this.catalogoSeleccionado.set(catalogoId);
    this.cargarRegistros(catalogoId);
  }

  private cargarRegistros(catalogoId: string): void {
    const rol = this.usuario()?.rol;
    if (!rol) return;

    this.cargandoRegistros.set(true);
    this.filas.set([]);
    this.filaSeleccionada.set(null);
    this.celdaEditando.set(null);

    // 🔑 Aquí pasamos el rol: los permisos dependen de él.
    this.catalogoService.obtenerRegistros(catalogoId, rol).subscribe({
      next: data => {
        this.cargandoRegistros.set(false);

        const cols = this.decorarColumnas(data.columnas, catalogoId);
        this.columnas.set(cols);
        this.filas.set([...data.filas]);

        // Los permisos vienen ya resueltos para (rol, catálogo).
        this.permisos.set(data.permisos);

        this.camposEditables.set(
          cols.filter(c => !data.permisos.columnasNoEditables.includes(c.nombre))
        );
      },
      error: () => {
        this.cargandoRegistros.set(false);
        this.mostrarToast('error', 'Registros', 'No se pudo cargar el catálogo');
      }
    });
  }

  // ── Getters de permisos (azúcar sintáctico) ────────────────
  puedeAgregar(): boolean { return this.permisos().puedeAgregar; }
  puedeEliminar(): boolean { return this.permisos().puedeEliminar; }

  // ── 3. Selección de fila ───────────────────────────────────
  seleccionarFila(fila: FilaCatalogo): void {
    if (this.celdaEditando()) return;
    this.filaSeleccionada.set(fila === this.filaSeleccionada() ? null : fila);
  }

  esFilaSeleccionada(fila: FilaCatalogo): boolean {
    return this.filaSeleccionada() === fila;
  }

  // ── 4. Edición de celdas ───────────────────────────────────
  esColumnaEditable(col: ColumnaDinamica): boolean {
    return !this.permisos().columnasNoEditables.includes(col.nombre);
  }

  estaEditando(filaIndex: number, campo: string): boolean {
    const c = this.celdaEditando();
    return !!c && c.filaIndex === filaIndex && c.campo === campo;
  }

  iniciarEdicion(filaIndex: number, col: ColumnaDinamica): void {
    if (!this.esColumnaEditable(col)) return;
    this.filaSeleccionada.set(null);
    this.celdaEditando.set({ filaIndex, campo: col.nombre });
  }

  cancelarEdicion(): void {
    this.celdaEditando.set(null);
  }

  confirmarEdicion(filaIndex: number, col: ColumnaDinamica, valor: any): void {
    const nuevas = this.filas().slice();
    nuevas[filaIndex] = { ...nuevas[filaIndex], [col.nombre]: valor };
    this.filas.set(nuevas);
    this.celdaEditando.set(null);
  }

  // ── 5. CRUD ────────────────────────────────────────────────
  abrirModalAgregar(): void {
    if (!this.puedeAgregar()) return;

    const modelo: Record<string, any> = {};
    this.camposEditables().forEach(c => { modelo[c.nombre] = null; });

    this.formModel.set(modelo);
    this.modalAbierto.set(true);
  }

  guardarModal(): void {
    const modelo = { ...this.formModel() };

    const colId = this.columnas().find(c => c.nombre.toLowerCase() === 'id');
    if (colId) {
      const max = this.filas().reduce(
        (m, f) => Math.max(m, Number(f[colId.nombre]) || 0), 0
      );
      modelo[colId.nombre] = max + 1;
    }

    this.filas.set([...this.filas(), modelo]);
    this.modalAbierto.set(false);
    this.mostrarToast('success', 'Agregado', 'Registro agregado correctamente');
  }

  actualizarCampo(nombre: string, valor: any): void {
    this.formModel.set({ ...this.formModel(), [nombre]: valor });
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  eliminarSeleccionado(): void {
    if (!this.puedeEliminar()) return;

    const fila = this.filaSeleccionada();
    if (!fila) {
      this.mostrarToast('error', 'Eliminar', 'Selecciona una fila primero');
      return;
    }
    if (!confirm('¿Eliminar este registro?')) return;

    const colId = this.columnas().find(c => c.nombre.toLowerCase() === 'id');
    if (!colId) return;
    const id = fila[colId.nombre];

    this.filas.set(this.filas().filter(f => f[colId.nombre] !== id));
    this.filaSeleccionada.set(null);
    this.mostrarToast('success', 'Eliminado', 'Registro eliminado');
  }

  // ── Utilidades ─────────────────────────────────────────────
  valorCelda(valor: any, col: ColumnaDinamica): string {
    if (valor == null) return '';
    if (col.tipo === 'DateTime' || col.tipo === 'Date') {
      return this.formatearFecha(valor);
    }
    return String(valor);
  }

  etiquetaColumna(col: ColumnaDinamica): string {
    return col.etiqueta || col.nombre;
  }

  anchoColumna(col: ColumnaDinamica): string {
    const n = col.nombre.toLowerCase();
    if (n === 'id') return '70px';
    if (n === 'activo') return '90px';
    if (col.tipo === 'Date' || col.tipo === 'DateTime') return '120px';
    return 'auto';
  }

  private decorarColumnas(cols: ColumnaDinamica[], catalogoId: string): ColumnaDinamica[] {
    const etiquetas = ETIQUETAS_POR_CATALOGO[catalogoId] ?? [];
    return cols.map((col, idx) => ({
      ...col,
      etiqueta: etiquetas[idx] ?? col.nombre
    }));
  }

  private formatearFecha(valor: any): string {
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

  // ── Atajos ─────────────────────────────────────────────────
  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.celdaEditando()) {
      this.cancelarEdicion();
      return;
    }
    if (e.key === 'Delete' && this.puedeEliminar()) {
      const activo = document.activeElement as HTMLElement | null;
      if (activo && (activo.tagName === 'INPUT' || activo.tagName === 'TEXTAREA')) return;
      this.eliminarSeleccionado();
    }
  }
}