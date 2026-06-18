import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, Input, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/button/button.component';

// --- INTERFACES PARA API ---

export interface BloqueoAPI {
  id: string;
  nombre: string;
  celdas: string[];
}

export interface ProveedorAPI {
  id: string;
  color: string;
  celdas: string[];
}

export interface ConfiguracionAlmacenAPI {
  filas: number;
  columnas: number;
  proveedores: ProveedorAPI[];
}

export interface RolUsuario {
  id: number;
  tipo: string;
}

// --- DATOS INICIALES SIMULADOS ---

const CONFIGURACION_INICIAL: ConfiguracionAlmacenAPI = {
  filas: 12,
  columnas: 29,
  proveedores: [
    {
      id: '0',
      color: '#fd0b03',
      celdas: [
        '3,1', '3,2', '3,3', '3,4', '3,5', '3,6',  '3,7', '3,8', '3,9', '3,10', '3,11', '3,12', '3,13', '3,14', '3,15', '3,16', '3,17', '3,18', '3,19', '3,20', '3,21', '3,22', '3,23', '3,24', '3,25', '3,26', '3,27', '3,28', '3,29',
        '7,1', '7,2', '7,3', '7,4', '7,5', '7,6',  '7,7', '7,8', '7,9', '7,10', '7,11', '7,12', '7,13', '7,14', '7,15', '7,16', '7,17', '7,18', '7,19', '7,20', '7,21', '7,22', '7,23', '7,24', '7,25', '7,26', '7,27', '7,28', '7,29',
        '8,1', '8,2', '8,3', '8,4', '8,5', '8,6',  '8,7', '8,8', '8,9', '8,10', 
        '9,1', '9,2', '9,3', '9,4', '9,5', '9,6',  '9,7', '9,8', '9,9', '9,10', 
        '10,1', '10,2', '10,3', '10,4', '10,5', '10,6',  '10,7', '10,8', '10,9', '10,10',
        '11,1', '11,2', '11,3', '11,4', '11,5', '11,6',  '11,7', '11,8', '11,9', '11,10', 
        '12,1', '12,2', '12,3', '12,4', '12,5', '12,6',  '12,7', '12,8', '12,9', '12,10', '12,11', '12,12', '12,13', '12,14', '12,15', '12,16', '12,17', '12,18', '12,19', '12,20', '12,21', '12,22', '12,23', '12,24', '12,25', '12,26', '12,27', '12,28', '12,29',
        '1,10', '2,10', '4,10','5,10', '6,10',
        '1,14', '2,14', '4,14','5,14', '6,14',  '8,14','9,14','10,14','11,14',
        '1,18', '2,18', '4,18','5,18', '6,18', '8,18','9,18','10,18','11,18',
        '1,22', '2,22', '4,22','5,22', '6,22', '8,22','9,22','10,22','11,22',
        '1,26', '2,26', '4,26','5,26', '6,26', '8,26','9,26','10,26','11,26',
        '1,29', '2,29', '4,29','5,29', '6,29', '8,29','9,29','10,29','11,29'   
      ]
    },
    {
      id: '101',
      color: '#0bfd03',
      celdas: ['8,11', '9,11', '10,11', '11,11', '8,12', '9,12', '10,12', '11,12', '12,12' , '8,13', '9,13', '10,13', '11,13', '12,13']
    },
    {
      id: '102',
      color: '#0078d7',
      celdas: ['1,11', '2,11', '1,12', '2,12']
    },
    {
      id: '103',
      color: '#6f42c1',
      celdas: ['4,1', '4,2', '4,3', '5,1', '5,2', '5,3']
    },
    {
      id: '104',
      color: '#f0ad4e',
      celdas: ['6,1', '6,2', '4,11', '5,11', '4,12', '5,12']
    },
  ]
};

@Component({
  selector: 'app-ubicacion-provedores',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './ubicacion-provedores.component.html',
  styleUrl: './ubicacion-provedores.component.css'
})
export class UbicacionProvedoresComponent implements OnInit {
  @ViewChild('gridContainer') gridContainer!: ElementRef;

  // --- ROL DE USUARIO (Input desde el padre) ---
  @Input() rolUsuario: RolUsuario | null = null;

  // --- CONFIGURACIÓN ---
  filas = signal(12);
  columnas = signal(29);

  // --- MODO DE EDICIÓN ACTUAL ---
  modoEdicion = signal(false);
  accionActual = signal<'bloquear' | 'desbloquear' | null>(null);

  // --- DATOS DE PROVEEDORES (incluye bloqueos como id '0') ---
  proveedores = signal<Array<{ id: string, color: string }>>([]);
  mapaProveedores = signal<Map<string, Set<string>>>(new Map());

  // El proveedor seleccionado para editar (click en la cuadrícula)
  proveedorSeleccionado = signal<string>('');

  // --- AGREGAR NUEVO PROVEEDOR EN CABECERA ---
  nuevoProveedorId = signal('');

  // --- MODAL CONFIRMAR ELIMINACIÓN ---
  mostrarModalEliminar = signal(false);
  proveedorAEliminar = signal('');

  // --- ESTADOS VISUALES ---
  seleccionActual = signal<Set<string>>(new Set());
  errorMensaje = signal('');

  // Lógica del rectángulo de selección
  seleccionando = signal(false);
  startPos = { x: 0, y: 0 };
  rectStyle = signal({ left: '0px', top: '0px', width: '0px', height: '0px', display: 'none' });

  // --- COMPUTED ---

  // Determina si el usuario tiene permisos de edición
  puedeEditar = computed(() => {
    if (!this.rolUsuario) {
      return false;
    }

    const rol = this.rolUsuario.tipo?.toLowerCase() || '';
    const rolesPermitidos = ['jefe de almacen', 'admin', 'administrador', 'supervisor'];
    return rolesPermitidos.includes(rol);
  });

  celdas = computed(() => {
    const matriz = [];
    for (let f = 1; f <= this.filas(); f++) {
      for (let c = 1; c <= this.columnas(); c++) {
        matriz.push({ id: `${f},${c}`, label: `(${c},${f})`, tipo: 'almacenaje' });
      }
    }
    return matriz;
  });

  celdasBloqueadas = computed(() => {
    return this.mapaProveedores().get('0') || new Set<string>();
  });

  proveedorActual = computed(() => {
    return this.proveedores().find(p => p.id === this.proveedorSeleccionado());
  });

  colorActivo = computed(() => {
    const prov = this.proveedorActual();
    return prov?.color || '#000000';
  });

  // --- CICLO DE VIDA ---

  ngOnInit(): void {
    // Si no se proporciona un rol, establecer uno por defecto
    if (!this.rolUsuario) {
      this.rolUsuario = { id: 2, tipo: 'admin' };
    }

    this.cargarConfiguracion(CONFIGURACION_INICIAL);
  }

  // --- MÉTODOS DE API ---

  cargarConfiguracion(config: ConfiguracionAlmacenAPI): void {
    this.filas.set(config.filas);
    this.columnas.set(config.columnas);
    this.cargarProveedores(config.proveedores);
  }

  obtenerConfiguracion(): ConfiguracionAlmacenAPI {
    return {
      filas: this.filas(),
      columnas: this.columnas(),
      proveedores: this.obtenerProveedores()
    };
  }

  cargarProveedores(proveedores: ProveedorAPI[]): void {
    const provs: Array<{ id: string, color: string }> = [];
    const mapaProvs = new Map<string, Set<string>>();

    proveedores.forEach(prov => {
      provs.push({ id: prov.id, color: prov.color });
      mapaProvs.set(prov.id, new Set(prov.celdas));
    });

    this.proveedores.set(provs);
    this.mapaProveedores.set(mapaProvs);
  }

  obtenerProveedores(): ProveedorAPI[] {
    return this.proveedores().map(prov => ({
      id: prov.id,
      color: prov.color,
      celdas: Array.from(this.mapaProveedores().get(prov.id) || [])
    }));
  }

  // --- MÉTODOS DE MODO EDICIÓN ---

  activarModoEdicion() {
    if (!this.puedeEditar()) {
      this.errorMensaje.set('No tiene permisos para editar. Rol actual: ' + (this.rolUsuario?.tipo || 'Sin rol'));
      return;
    }
    if (!this.proveedorSeleccionado()) {
      this.errorMensaje.set('Seleccione un proveedor haciendo clic en sus celdas');
      return;
    }
    this.limpiarSeleccion();
    this.modoEdicion.set(true);
    this.accionActual.set('bloquear'); // Por defecto inicia en modo asignar/bloquear
    this.errorMensaje.set('');
  }

  cambiarAccion(accion: 'bloquear' | 'desbloquear') {
    this.accionActual.set(accion);
  }

  salirModoEdicion() {
    this.modoEdicion.set(false);
    this.accionActual.set(null);
    this.limpiarSeleccion();
    this.errorMensaje.set('');
  }

  limpiarSeleccion() {
    this.seleccionActual.set(new Set());
    this.seleccionando.set(false);
    this.rectStyle.update(s => ({ ...s, display: 'none' }));
  }

  // --- GESTIÓN DE PROVEEDORES ---

  seleccionarProveedor(id: string) {
    if (!this.modoEdicion()) {
      this.proveedorSeleccionado.set(id);
      this.errorMensaje.set('');
    }
  }

  agregarProveedor() {
    if (!this.puedeEditar()) {
      this.errorMensaje.set('No tiene permisos para agregar proveedores');
      return;
    }

    const id = this.nuevoProveedorId().trim();

    if (!id) {
      this.errorMensaje.set('El número de proveedor es requerido');
      return;
    }

    if (id === '0') {
      this.errorMensaje.set('El ID 0 está reservado para bloqueos');
      return;
    }

    if (this.proveedores().some(p => p.id === id)) {
      this.errorMensaje.set('Ya existe un proveedor con ese número');
      return;
    }

    const color = this.generarColorAleatorio();

    this.proveedores.update(provs => [...provs, { id, color }]);
    this.mapaProveedores.update(mapa => {
      const nuevo = new Map(mapa);
      nuevo.set(id, new Set());
      return nuevo;
    });

    this.proveedorSeleccionado.set(id);
    this.nuevoProveedorId.set('');
    this.errorMensaje.set('');
  }

  generarColorAleatorio(): string {
    const colores = ['#0bfd03', '#0078d7', '#6f42c1', '#f0ad4e', '#c1428c', '#4ed0f0', '#4259c1', '#c5f04e', '#fd7e14', '#20c997'];
    return colores[Math.floor(Math.random() * colores.length)];
  }

  confirmarEliminarProveedor() {
    if (!this.puedeEditar()) {
      this.errorMensaje.set('No tiene permisos para eliminar proveedores');
      return;
    }

    const id = this.proveedorSeleccionado();
    if (!id) {
      this.errorMensaje.set('Seleccione un proveedor primero');
      return;
    }
    if (id === '0') {
      this.errorMensaje.set('No se puede eliminar el bloqueo estructural');
      return;
    }
    this.proveedorAEliminar.set(id);
    this.mostrarModalEliminar.set(true);
  }

  cerrarModalEliminar() {
    this.mostrarModalEliminar.set(false);
    this.proveedorAEliminar.set('');
  }

  eliminarProveedor() {
    if (!this.puedeEditar()) return;

    const id = this.proveedorAEliminar();
    if (!id || id === '0') return;

    this.proveedores.update(provs => provs.filter(p => p.id !== id));

    this.mapaProveedores.update(mapa => {
      const nuevo = new Map(mapa);
      nuevo.delete(id);
      return nuevo;
    });

    if (this.proveedorSeleccionado() === id) {
      this.proveedorSeleccionado.set('');
      if (this.modoEdicion()) {
        this.salirModoEdicion();
      }
    }

    this.cerrarModalEliminar();
  }

  // --- VISUALIZACIÓN DE CELDAS ---

  obtenerColorCelda(id: string): string | null {
    // Celdas en selección actual (modo edición) - Siempre usa el color activo
    if (this.modoEdicion() && this.seleccionActual().has(id)) {
      return this.colorActivo();
    }

    // Bloqueos (proveedor '0')
    if (this.celdasBloqueadas().has(id)) {
      return '#fd0b03';
    }

    // Proveedor seleccionado
    if (this.proveedorSeleccionado() && this.proveedorSeleccionado() !== '0') {
      const celdasProveedor = this.mapaProveedores().get(this.proveedorSeleccionado());
      if (celdasProveedor?.has(id)) {
        return this.proveedorActual()?.color || null;
      }
    }

    // Otros proveedores
    const colorOtroProveedor = this.obtenerColorOtroProveedor(id);
    if (colorOtroProveedor) {
      return colorOtroProveedor;
    }

    return null;
  }

  obtenerColorOtroProveedor(id: string): string | null {
    for (const [provId, celdas] of this.mapaProveedores().entries()) {
      if (provId !== this.proveedorSeleccionado() && provId !== '0' && celdas.has(id)) {
        const proveedor = this.proveedores().find(p => p.id === provId);
        if (proveedor) {
          return this.hexToRgba(proveedor.color, 0.3);
        }
      }
    }
    return null;
  }

  hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  obtenerProveedorEnCelda(id: string): string | null {
    if (this.celdasBloqueadas().has(id)) return '0';

    for (const [provId, celdas] of this.mapaProveedores().entries()) {
      if (provId !== '0' && celdas.has(id)) {
        return provId;
      }
    }
    return null;
  }

  obtenerColorTextoParaCelda(id: string): string {
    const provId = this.obtenerProveedorEnCelda(id);
    if (provId === this.proveedorSeleccionado() && provId !== '0') {
      return '#ffffff';
    }

    if (this.celdasBloqueadas().has(id)) {
      return '#ffffff';
    }

    return '#333333';
  }

  obtenerTooltipCelda(id: string): string {
    const proveedoresEnCelda: string[] = [];

    this.mapaProveedores().forEach((celdas, provId) => {
      if (celdas.has(id)) {
        if (provId === '0') {
          proveedoresEnCelda.push('Bloqueo');
        } else {
          proveedoresEnCelda.push(provId);
        }
      }
    });

    if (proveedoresEnCelda.length > 0) {
      return `Proveedores: ${proveedoresEnCelda.join(', ')}`;
    }

    return '';
  }

  esCeldaOcupada(id: string): boolean {
    if (!this.modoEdicion()) return false;

    if (this.proveedorSeleccionado() === '0') {
      return this.celdasBloqueadas().has(id);
    }

    if (this.proveedorSeleccionado()) {
      const celdasProveedor = this.mapaProveedores().get(this.proveedorSeleccionado());
      return celdasProveedor?.has(id) || false;
    }

    return false;
  }

  // --- VERIFICACIÓN DE DISPONIBILIDAD ---

  esCeldaDisponible(id: string): boolean {
    if (!this.modoEdicion()) return false;

    if (this.accionActual() === 'desbloquear') {
      // Para desbloquear/liberar, la celda debe pertenecer al proveedor seleccionado
      if (this.proveedorSeleccionado() === '0') {
        return this.celdasBloqueadas().has(id);
      } else {
        const celdasProveedor = this.mapaProveedores().get(this.proveedorSeleccionado());
        return celdasProveedor?.has(id) || false;
      }
    }

    if (this.accionActual() === 'bloquear') {
      // Para bloquear/asignar, verificar disponibilidad
      if (this.proveedorSeleccionado() === '0') {
        // Los bloqueos no pueden afectar a proveedores
        for (const [provId, celdas] of this.mapaProveedores().entries()) {
          if (provId !== '0' && celdas.has(id)) {
            return false;
          }
        }
        return !this.celdasBloqueadas().has(id);
      } else {
        // Los proveedores no pueden afectar a bloqueos ni a otros proveedores
        if (this.celdasBloqueadas().has(id)) return false;

        for (const [provId, celdas] of this.mapaProveedores().entries()) {
          if (provId !== this.proveedorSeleccionado() && provId !== '0' && celdas.has(id)) {
            return false;
          }
        }

        return true;
      }
    }

    return false;
  }

  // --- CLIC EN CELDA PARA SELECCIONAR PROVEEDOR ---

  onCeldaClick(id: string) {
    if (this.modoEdicion()) return;

    const provId = this.obtenerProveedorEnCelda(id);
    if (provId) {
      this.seleccionarProveedor(provId);
    }
  }

  // --- MOUSE EVENTS ---

  iniciarSeleccion(event: MouseEvent) {
    if (!this.modoEdicion() || !this.puedeEditar()) return;
    event.preventDefault();

    this.seleccionando.set(true);
    const containerRect = this.gridContainer.nativeElement.getBoundingClientRect();
    this.startPos = {
      x: event.clientX - containerRect.left,
      y: event.clientY - containerRect.top
    };
  }

  moverSeleccion(event: MouseEvent) {
    if (!this.seleccionando()) return;

    requestAnimationFrame(() => {
      if (!this.seleccionando()) return;

      const containerRect = this.gridContainer.nativeElement.getBoundingClientRect();
      const currentX = event.clientX - containerRect.left;
      const currentY = event.clientY - containerRect.top;

      const l = Math.min(this.startPos.x, currentX);
      const t = Math.min(this.startPos.y, currentY);
      const w = Math.abs(this.startPos.x - currentX);
      const h = Math.abs(this.startPos.y - currentY);

      this.rectStyle.set({
        left: `${l}px`,
        top: `${t}px`,
        width: `${w}px`,
        height: `${h}px`,
        display: 'block'
      });

      this.calcularInterseccion(l, t, w, h);
    });
  }

  calcularInterseccion(l: number, t: number, w: number, h: number) {
    const elementos = this.gridContainer.nativeElement.getElementsByClassName('celda');
    const tocados = new Set<string>();

    for (let i = 0; i < elementos.length; i++) {
      const el = elementos[i] as HTMLElement;
      const rLeft = el.offsetLeft;
      const rTop = el.offsetTop;
      const rRight = rLeft + el.offsetWidth;
      const rBottom = rTop + el.offsetHeight;

      if (rLeft < l + w && rRight > l && rTop < t + h && rBottom > t) {
        const id = el.getAttribute('data-id');
        if (id && this.esCeldaDisponible(id)) {
          tocados.add(id);
        }
      }
    }

    this.seleccionActual.set(tocados);
  }

  finalizarSeleccion() {
    if (!this.seleccionando()) return;

    this.aplicarCambios();
    this.limpiarSeleccion();
  }

  aplicarCambios() {
    if (!this.proveedorSeleccionado() || !this.puedeEditar()) return;

    const provId = this.proveedorSeleccionado();

    if (this.accionActual() === 'bloquear') {
      this.mapaProveedores.update(mapa => {
        const nuevo = new Map(mapa);
        const celdasProveedor = new Set(nuevo.get(provId) || []);

        this.seleccionActual().forEach(id => {
          if (this.esCeldaDisponible(id)) {
            celdasProveedor.add(id);
          }
        });

        nuevo.set(provId, celdasProveedor);
        return nuevo;
      });
    } else if (this.accionActual() === 'desbloquear') {
      this.mapaProveedores.update(mapa => {
        const nuevo = new Map(mapa);
        const celdasProveedor = new Set(nuevo.get(provId) || []);

        this.seleccionActual().forEach(id => celdasProveedor.delete(id));

        if (celdasProveedor.size > 0) {
          nuevo.set(provId, celdasProveedor);
        } else {
          nuevo.set(provId, new Set());
        }

        return nuevo;
      });
    }
  }
}