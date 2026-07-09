import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, OnInit, signal, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { UbicacionProveedoresService } from './services/ubicacion-proveedores.service';
import { ProveedorLocal } from './models/ubicacion-proveedores.models';

@Component({
  selector: 'app-ubicacion-provedores',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, ToastComponent, LoadingSpinnerComponent],
  templateUrl: './ubicacion-provedores.component.html',
  styleUrl: './ubicacion-provedores.component.css'
})
export class UbicacionProvedoresComponent implements OnInit {
  @ViewChild('gridContainer') gridContainer!: ElementRef;

  // Inyectar el servicio de ubicación de proveedores
  private ubicacionService = inject(UbicacionProveedoresService);

  // --- CONFIGURACIÓN ---
  filas = signal(12);
  columnas = signal(29);

  // --- MODO DE EDICIÓN ACTUAL ---
  modoEdicion = signal(false);
  accionActual = signal<'bloquear' | 'desbloquear' | null>(null);

  // --- DATOS DE PROVEEDORES (incluye bloqueos como provedor '0') ---
  proveedores = signal<ProveedorLocal[]>([]);
  mapaProveedores = signal<Map<string, Set<string>>>(new Map());

  // El proveedor seleccionado para editar (click en la cuadrícula)
  proveedorSeleccionado = signal<string>('');

  // --- AGREGAR NUEVO PROVEEDOR EN CABECERA ---
  nuevoProveedorId = signal('');

  // --- MODAL CONFIRMAR ELIMINACIÓN ---
  mostrarModalEliminar = signal(false);
  proveedorAEliminar = signal('');
  accionEliminarDesdeCuadricula = signal(false);

  // --- ESTADOS VISUALES ---
  seleccionActual = signal<Set<string>>(new Set());
  cargando = signal(false);

  // --- TOAST ---
  mostrarToast = signal(false);
  toastTipo = signal<'success' | 'error'>('success');
  toastTitulo = signal('');
  toastMensaje = signal('');

  // --- PERMISOS ---
  tienePermisoBloqueo = signal(false);
  verificandoPermisos = signal(false);

  // Lógica del rectángulo de selección
  seleccionando = signal(false);
  startPos = { x: 0, y: 0 };
  rectStyle = signal({ left: '0px', top: '0px', width: '0px', height: '0px', display: 'none' });

  // --- COMPUTED ---

  // Determina si el usuario tiene permisos de edición basado en la API
  puedeEditar = computed(() => {
    // Si tiene permiso de bloqueo, puede editar todo
    if (this.tienePermisoBloqueo()) {
      return true;
    }

    // Si no tiene permiso de bloqueo, puede editar proveedores pero NO el proveedor '0'
    if (this.proveedorSeleccionado() === '0') {
      return false;
    }

    return true;
  });

  puedeEditarBloqueos = computed(() => {
    return this.tienePermisoBloqueo();
  });

  celdas = computed(() => {
    const matriz = [];
    for (let f = 1; f <= this.filas(); f++) {
      for (let c = 1; c <= this.columnas(); c++) {
        matriz.push({ id: `${f},${c}`, label: `(${f},${c})`, tipo: 'almacenaje' });
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
    this.cargarDatosIniciales();
    this.verificarPermisos();
  }

  // --- MÉTODOS DE CARGA DE DATOS ---

  async cargarDatosIniciales(): Promise<void> {
    try {
      this.cargando.set(true);

      // Cargar dimensiones y lista de proveedores en paralelo usando el servicio
      const [dimensiones, espaciosResponse] = await Promise.all([
        this.ubicacionService.obtenerDimensiones(),
        this.ubicacionService.obtenerEspaciosAsignados()
      ]);

      // Actualizar dimensiones
      this.filas.set(dimensiones.filas);
      this.columnas.set(dimensiones.columnas);

      // Procesar proveedores usando el método del servicio
      const { proveedores, mapaProveedores } =
        this.ubicacionService.procesarProveedores(espaciosResponse.provedores);

      this.proveedores.set(proveedores);
      this.mapaProveedores.set(mapaProveedores);

    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      this.mostrarNotificacion('error', 'Error de conexión', 'No se pudieron cargar los datos del servidor');
    } finally {
      this.cargando.set(false);
    }
  }

  async verificarPermisos(): Promise<void> {
    try {
      this.verificandoPermisos.set(true);

      // Usar el método del servicio para verificar permisos
      const tienePermiso = await this.ubicacionService.verificarPermisos();
      this.tienePermisoBloqueo.set(tienePermiso);

    } catch (error) {
      console.error('Error al verificar permisos:', error);
      // Por defecto, si hay error, denegar permisos de bloqueo
      this.tienePermisoBloqueo.set(false);
    } finally {
      this.verificandoPermisos.set(false);
    }
  }

  // --- MÉTODOS DE NOTIFICACIÓN ---

  mostrarNotificacion(tipo: 'success' | 'error', titulo: string, mensaje: string): void {
    // Solo mostramos errores 
    if (tipo === 'success') {
      return; // En caso de requerirse, podemos mandadar a llamar al metodo Mostrar notificacion 
      // para mostrar un mensaje de exito
    }

    this.toastTipo.set(tipo);
    this.toastTitulo.set(titulo);
    this.toastMensaje.set(mensaje);
    this.mostrarToast.set(true);
  }

  cerrarToast(): void {
    this.mostrarToast.set(false);
  }

  // --- MÉTODOS DE MODO EDICIÓN ---

  activarModoEdicion() {
    if (!this.proveedorSeleccionado()) {
      this.mostrarNotificacion('error', 'Sin selección', 'Seleccione un proveedor haciendo clic en sus celdas');
      return;
    }

    // Verificar permisos para editar bloqueos
    if (this.proveedorSeleccionado() === '0' && !this.puedeEditarBloqueos()) {
      this.mostrarNotificacion('error', 'Sin permisos', 'No tiene permisos para editar bloqueos');
      return;
    }

    this.limpiarSeleccion();
    this.modoEdicion.set(true);
    this.accionActual.set('bloquear'); // Por defecto inicia en modo asignar/bloquear
  }

  cambiarAccion(accion: 'bloquear' | 'desbloquear') {
    this.accionActual.set(accion);
  }

  salirModoEdicion() {
    this.modoEdicion.set(false);
    this.accionActual.set(null);
    this.limpiarSeleccion();
  }

  limpiarSeleccion() {
    this.seleccionActual.set(new Set());
    this.seleccionando.set(false);
    this.rectStyle.update(s => ({ ...s, display: 'none' }));
  }

  // --- GESTIÓN DE PROVEEDORES ---

  seleccionarProveedor(id: string) {
    if (!this.modoEdicion()) {
      // Si intenta seleccionar el proveedor '0' y no tiene permisos de bloqueo, no permite manipular 
      // este el proveedor 0 "bloqueo"
      if (id === '0' && !this.puedeEditarBloqueos()) {
        return;
      }
      this.proveedorSeleccionado.set(id);
    }
  }

  // En ubicacion-provedores.component.ts

  async agregarProveedor() {
    if (!this.puedeEditar()) {
      this.mostrarNotificacion('error', 'Sin permisos', 'No tiene permisos para agregar proveedores');
      return;
    }

    const id = this.nuevoProveedorId().trim();

    if (!id) {
      this.mostrarNotificacion('error', 'Campo requerido', 'El número de proveedor es requerido');
      return;
    }

    if (id === '0') {
      this.mostrarNotificacion('error', 'ID no válido', 'El ID 0 está reservado para bloqueos');
      return;
    }

    if (this.proveedores().some(p => p.id === id)) {
      this.mostrarNotificacion('error', 'Duplicado', 'Ya existe un proveedor con ese número');
      return;
    }

    try {
      this.cargando.set(true);

      // Obtener el color del servidor
      const response = await this.ubicacionService.obtenerColorProveedor(id);

      // Validar que la respuesta tenga un color válido
      if (!response.Color) {
        throw new Error('El servidor no proporcionó un color válido');
      }

      // Usar el color proporcionado por el servidor
      const color = response.Color;

      // Agregar el proveedor con el color del servidor
      this.proveedores.update(provs => [...provs, { id, color }]);
      this.mapaProveedores.update(mapa => {
        const nuevo = new Map(mapa);
        nuevo.set(id, new Set());
        return nuevo;
      });

      this.proveedorSeleccionado.set(id);
      this.nuevoProveedorId.set('');

    } catch (error: any) {
      console.error('Error al agregar proveedor:', error);

      const mensajeError = error.message || 'No se pudo obtener el color del servidor';

      this.mostrarNotificacion(
        'error',
        'Error al agregar proveedor',
        mensajeError  
      );

      
    } finally {
      this.cargando.set(false);
    }
  }

  // Colores temporales al crear un provedor en lo que el servidor nos proporciona el color asignado
  generarColorAleatorio(): string {
    const colores = ['#0bfd03', '#0078d7', '#6f42c1', '#f0ad4e', '#c1428c', '#4ed0f0', '#4259c1', '#c5f04e', '#fd7e14', '#20c997'];
    return colores[Math.floor(Math.random() * colores.length)];
  }

  confirmarEliminarProveedor(desdeCuadricula: boolean = false) {
    if (!this.puedeEditar()) {
      this.mostrarNotificacion('error', 'Sin permisos', 'No tiene permisos para eliminar proveedores');
      return;
    }

    const id = this.proveedorSeleccionado();
    if (!id) {
      this.mostrarNotificacion('error', 'Sin selección', 'Seleccione un proveedor primero');
      return;
    }
    if (id === '0') {
      this.mostrarNotificacion('error', 'No permitido', 'No se puede eliminar el bloqueo estructural');
      return;
    }

    this.proveedorAEliminar.set(id);
    this.accionEliminarDesdeCuadricula.set(desdeCuadricula);
    this.mostrarModalEliminar.set(true);
  }

  cerrarModalEliminar() {
    this.mostrarModalEliminar.set(false);
    this.proveedorAEliminar.set('');
    this.accionEliminarDesdeCuadricula.set(false);
  }

  async eliminarProveedor() {
    if (!this.puedeEditar()) return;

    const id = this.proveedorAEliminar();
    if (!id || id === '0') return;

    try {
      // Liberar todas las celdas del proveedor antes de eliminarlo
      const celdasProveedor = this.mapaProveedores().get(id);
      if (celdasProveedor && celdasProveedor.size > 0) {
        await this.liberarEspaciosProveedor(id, Array.from(celdasProveedor));
      }

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
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      this.mostrarNotificacion('error', 'Error', 'No se pudo eliminar el proveedor');
    }
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
          return this.hexToRgba(proveedor.color, 0.9);
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
      return '#000000';
    }

    if (this.celdasBloqueadas().has(id)) {
      return '#ffffff';
    }

    return '#393939';
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
      // Si el proveedor es '0' y no tiene permisos, no permitir selección
      if (provId === '0' && !this.puedeEditarBloqueos()) {
        return;
      }
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

  async finalizarSeleccion() {
    if (!this.seleccionando()) return;

    await this.aplicarCambios();
    this.limpiarSeleccion();
  }

  async aplicarCambios() {
    if (!this.proveedorSeleccionado() || !this.puedeEditar()) return;

    const provId = this.proveedorSeleccionado();
    const celdasSeleccionadas = Array.from(this.seleccionActual());

    if (celdasSeleccionadas.length === 0) return;

    if (this.accionActual() === 'bloquear') {
      if (provId === '0') {
        // Bloquear celdas
        await this.bloquearCeldas(celdasSeleccionadas);
      } else {
        // Asignar celdas a proveedor
        await this.asignarEspacioProveedor(provId, celdasSeleccionadas);
      }
    } else if (this.accionActual() === 'desbloquear') {
      if (provId === '0') {
        // Desbloquear celdas
        await this.liberarBloqueoCeldas(celdasSeleccionadas);
      } else {
        // Verificar si se liberarán todas las celdas del proveedor
        const celdasProveedor = this.mapaProveedores().get(provId);
        if (celdasProveedor) {
          const celdasRestantes = new Set(celdasProveedor);
          celdasSeleccionadas.forEach(coord => celdasRestantes.delete(coord));

          if (celdasRestantes.size === 0) {
            // Si se liberan todas las celdas, mostrar modal de eliminación
            await this.liberarEspaciosProveedor(provId, celdasSeleccionadas);
            this.confirmarEliminarProveedor(true);
            return;
          }
        }
        // Liberar celdas de proveedor seleccionado
        await this.liberarEspaciosProveedor(provId, celdasSeleccionadas);
      }
    }
  }

  // --- MÉTODOS DE API PARA OPERACIONES (USANDO EL SERVICIO) ---

  async bloquearCeldas(coordenadas: string[]): Promise<void> {
    try {
      await this.ubicacionService.bloquearCeldas(coordenadas);

      // Actualizar el mapa local
      this.mapaProveedores.update(mapa => {
        const nuevo = new Map(mapa);
        const celdasBloqueo = new Set(nuevo.get('0') || []);
        coordenadas.forEach(coord => celdasBloqueo.add(coord));
        nuevo.set('0', celdasBloqueo);
        return nuevo;
      });
    } catch (error: any) {
      console.error('Error al bloquear celdas:', error);
      this.mostrarNotificacion('error', 'Error al bloquear', error.message || 'No se pudieron bloquear las celdas');
    }
  }

  async liberarBloqueoCeldas(coordenadas: string[]): Promise<void> {
    try {
      await this.ubicacionService.liberarBloqueoCeldas(coordenadas);

      // Actualizar el mapa local
      this.mapaProveedores.update(mapa => {
        const nuevo = new Map(mapa);
        const celdasBloqueo = new Set(nuevo.get('0') || []);
        coordenadas.forEach(coord => celdasBloqueo.delete(coord));
        nuevo.set('0', celdasBloqueo);
        return nuevo;
      });
    } catch (error: any) {
      console.error('Error al desbloquear celdas:', error);
      this.mostrarNotificacion('error', 'Error al desbloquear', error.message || 'No se pudieron desbloquear las celdas');
    }
  }

  async asignarEspacioProveedor(proveedor: string, coordenadas: string[]): Promise<void> {
    try {
      const response = await this.ubicacionService.asignarEspacioProveedor(proveedor, coordenadas);

      // Actualizar el color si la respuesta incluye uno nuevo
      if (response.Color) {
        this.proveedores.update(provs =>
          provs.map(p => p.id === proveedor ? { ...p, color: response.Color } : p)
        );
      }

      // Actualizar el mapa local
      this.mapaProveedores.update(mapa => {
        const nuevo = new Map(mapa);
        const celdasProveedor = new Set(nuevo.get(proveedor) || []);
        coordenadas.forEach(coord => celdasProveedor.add(coord));
        nuevo.set(proveedor, celdasProveedor);
        return nuevo;
      });
    } catch (error: any) {
      console.error('Error al asignar espacio:', error);
      this.mostrarNotificacion('error', 'Error al asignar', error.message || 'No se pudo asignar el espacio');
    }
  }

  async liberarEspaciosProveedor(proveedor: string, coordenadas: string[]): Promise<void> {
    try {
      await this.ubicacionService.liberarEspaciosProveedor(proveedor, coordenadas);

      // Actualizar el mapa local
      this.mapaProveedores.update(mapa => {
        const nuevo = new Map(mapa);
        const celdasProveedor = new Set(nuevo.get(proveedor) || []);
        coordenadas.forEach(coord => celdasProveedor.delete(coord));
        nuevo.set(proveedor, celdasProveedor);
        return nuevo;
      });
    } catch (error: any) {
      console.error('Error al liberar espacio:', error);
      this.mostrarNotificacion('error', 'Error al liberar', error.message || 'No se pudo liberar el espacio');
    }
  }
}