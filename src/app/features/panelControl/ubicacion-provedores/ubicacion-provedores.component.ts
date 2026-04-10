import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, signal, ViewChild } from '@angular/core';

export interface UbicacionAlmacen {
  id: string;
  f: number;
  c: number;
  label: string;
  tipo: 'almacenaje' | 'pasillo' | 'oficina';
}

interface CeldaColoreada {
  id: string;
  color: string;
}

@Component({
  selector: 'app-ubicacion-provedores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ubicacion-provedores.component.html',
  styleUrl: './ubicacion-provedores.component.css'
})

// ... imports y setup del componente
export class UbicacionProvedoresComponent {
  @ViewChild('gridContainer') gridContainer!: ElementRef;

  // --- CONFIGURACIÓN ---
  filas = signal(12);
  columnas = signal(29);

  // --- MODOS DE OPERACIÓN ---
  modoBloqueoEstructura = signal(false); // El botón "Bloquear"
  tipoAccionColor = signal<'pintar' | 'borrar' | null>(null); // Los botones "Seleccionar/Deseleccionar"

  // --- DATOS ---
  celdasBloqueadasFisicas = signal<Set<string>>(new Set()); // Bloqueo de base (Estructura)
  mapaColoresProveedores = signal<Map<string, string>>(new Map()); // Colores por código

  seleccionActualVisual = signal<Set<string>>(new Set());
  colorActivo = signal('');
  codigoInput = signal('');

  // Lógica del rectángulo
  seleccionando = signal(false);
  startPos = { x: 0, y: 0 };
  rectStyle = signal({ left: '0px', top: '0px', width: '0px', height: '0px', display: 'none' });

  celdas = computed(() => {
    const matriz = [];
    for (let f = 1; f <= this.filas(); f++) {
      for (let c = 1; c <= this.columnas(); c++) {
        matriz.push({ id: `${f}-${c}`, label: `(${c},${f})`, tipo: 'almacenaje' });
      }
    }
    return matriz;
  });

  // --- ACCIONES ---

  toggleModoBloqueo() {
    this.modoBloqueoEstructura.update(v => !v);
    this.tipoAccionColor.set(null); // Reseteamos acciones de color al bloquear estructura
  }

prepararSeleccionColor(tipo: 'pintar' | 'borrar') {
  // Si estamos bloqueando estructura, solo permitimos activar "borrar"
  // para que no se mezcle la pintura de proveedores con la de estructura.
  //if (this.modoBloqueoEstructura() && tipo === 'pintar') return;

  this.tipoAccionColor.set(tipo);
}

  alCambiarInput(valor: string) {
    this.codigoInput.set(valor);
    const diccionarioColores: { [key: string]: string } = {
      '101': '#0bfd03',
      '102': '#0078d7',
      '103': '#6f42c1',
      '104': '#f0ad4e'
    };
    this.colorActivo.set(diccionarioColores[valor] || '#5cb85c');
  }

  obtenerColorCelda(id: string): string | null {
    // 1. Si estamos en modo BLOQUEO FÍSICO (Estructura)
    if (this.modoBloqueoEstructura()) {
      if (this.seleccionActualVisual().has(id) || this.celdasBloqueadasFisicas().has(id)) return '#fd0b03'; // Rojo estructura
    }

    // 2. Si estamos pintando/borrando colores de proveedor
    if (this.seleccionActualVisual().has(id)) {
      return this.tipoAccionColor() === 'borrar' ? '#ffffff' : this.colorActivo();
    }

    // 3. Colores permanentes (Si la celda está bloqueada físicamente tiene prioridad)
    if (this.celdasBloqueadasFisicas().has(id)) return '#fd0b03';

    return this.mapaColoresProveedores().get(id) || null;
  }

  // --- MOUSE EVENTS ---

  iniciarSeleccion(event: MouseEvent) {
    // Solo iniciamos si el Modo Bloqueo está ON o si hay una acción de color activa
    if (!this.modoBloqueoEstructura() && !this.tipoAccionColor()) return;

    this.seleccionando.set(true);
    const containerRect = this.gridContainer.nativeElement.getBoundingClientRect();
    this.startPos = { x: event.clientX - containerRect.left, y: event.clientY - containerRect.top };
  }

  moverSeleccion(event: MouseEvent) {
    if (!this.seleccionando()) return;
    const containerRect = this.gridContainer.nativeElement.getBoundingClientRect();
    const l = Math.min(this.startPos.x, event.clientX - containerRect.left);
    const t = Math.min(this.startPos.y, event.clientY - containerRect.top);
    const w = Math.abs(this.startPos.x - (event.clientX - containerRect.left));
    const h = Math.abs(this.startPos.y - (event.clientY - containerRect.top));

    this.rectStyle.set({ left: `${l}px`, top: `${t}px`, width: `${w}px`, height: `${h}px`, display: 'block' });
    this.calcularInterseccion(l, t, w, h);
  }

  calcularInterseccion(l: number, t: number, w: number, h: number) {
    const elementos = this.gridContainer.nativeElement.querySelectorAll('.celda');
    const tocados = new Set<string>();
    elementos.forEach((el: any) => {
      const r = { left: el.offsetLeft, top: el.offsetTop, right: el.offsetLeft + el.offsetWidth, bottom: el.offsetTop + el.offsetHeight };
      if (r.left < l + w && r.right > l && r.top < t + h && r.bottom > t) {
        tocados.add(el.getAttribute('data-id')!);
      }
    });
    this.seleccionActualVisual.set(tocados);
  }

 finalizarSeleccion() {
  if (!this.seleccionando()) return;

  // 1. Identificamos si la intención es borrar
  const esModoBorrar = this.tipoAccionColor() === 'borrar';

  // 2. Si estamos en Modo Bloqueo de Estructura (El botón de la llave/candado)
  if (this.modoBloqueoEstructura()) {
    this.celdasBloqueadasFisicas.update(setExistente => {
      const nuevoSet = new Set(setExistente);
      
      this.seleccionActualVisual().forEach(id => {
        if (esModoBorrar) {
          nuevoSet.delete(id); // <--- AQUÍ QUITA LA SELECCIÓN ROJA
        } else {
          nuevoSet.add(id);    // <--- AQUÍ PONE LA SELECCIÓN ROJA
        }
      });
      return nuevoSet;
    });
  } 
  // 3. Si NO estamos en modo bloqueo, manejamos los colores de proveedores
  else {
    if (this.tipoAccionColor() === 'pintar') {
      this.mapaColoresProveedores.update(mapa => {
        const nuevoMapa = new Map(mapa);
        this.seleccionActualVisual().forEach(id => {
          nuevoMapa.set(id, this.colorActivo());
        });
        return nuevoMapa;
      });
    } else if (esModoBorrar) {
      this.mapaColoresProveedores.update(mapa => {
        const nuevoMapa = new Map(mapa);
        this.seleccionActualVisual().forEach(id => nuevoMapa.delete(id));
        return nuevoMapa;
      });
    }
  }

  // Limpieza final de estados visuales
  this.seleccionando.set(false);
  this.seleccionActualVisual.set(new Set());
  this.rectStyle.update(s => ({ ...s, display: 'none' }));
}
}