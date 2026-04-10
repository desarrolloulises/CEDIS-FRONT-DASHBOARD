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

  filas = signal(12);
  columnas = signal(29);
  modoEdicion = signal(false);
  seleccionadosParaBloquear = signal<Set<string>>(new Set());
  seleccionTemporal = signal<Set<string>>(new Set());

  seleccionAcumulada = signal<Set<string>>(new Set());
  seleccionActualVisual = signal<Set<string>>(new Set());

  todasLasSeleccionadas = computed(() => {
    const union = new Set(this.seleccionAcumulada());
    this.seleccionActualVisual().forEach(id => union.add(id));
    return union;
  });

  // Lógica del rectángulo estilo Windows
  seleccionando = signal(false);
  startPos = { x: 0, y: 0 };
  rectStyle = signal({ left: '0px', top: '0px', width: '0px', height: '0px', display: 'none' });

  //Datos del "Pincel" actual
  colorActivo = signal('#d9534f'); // Rojo por defecto
  codigoActual = signal('');
  alCambiarInput(valor: string) {
    this.codigoActual.set(valor);

    // Lógica temporal para pruebas:
    // Aquí es donde conectarás tu servicio para obtener el color del SP
    const diccionarioColores: { [key: string]: string } = {
      '101': '#d9534f', // Rojo
      '102': '#0078d7', // Azul
      '103': '#6f42c1', // Púrpura
      '104': '#f0ad4e'  // Naranja
    };

    /**
     * PARA IDENTIFICAR QUE COLOR PONER
     */
    

    const nuevoColor = diccionarioColores[valor] || '#76a15d'; // Verde base si no hay código
    this.colorActivo.set(nuevoColor);
  }

  // ESTO DEBE SER COMPUTED PARA USAR celdas() EN EL HTML
  celdas = computed(() => {
    const matriz = [];
    for (let f = 1; f <= this.filas(); f++) {
      for (let c = 1; c <= this.columnas(); c++) {
        matriz.push({
          id: `${f}-${c}`,
          label: `(${c},${f})`,
          tipo: c === 15 ? 'almacenaje' : 'almacenaje'
        });
      }
    }
    return matriz;
  });

  // --- MÉTODOS DE SELECCIÓN ---
  iniciarSeleccion(event: MouseEvent) {
    if (!this.modoEdicion()) return;
    this.seleccionando.set(true);
    const containerRect = this.gridContainer.nativeElement.getBoundingClientRect();
    this.startPos = { x: event.clientX - containerRect.left, y: event.clientY - containerRect.top };
  }

  moverSeleccion(event: MouseEvent) {
    if (!this.seleccionando()) return;

    // Usamos requestAnimationFrame para que el dibujo sea a 60fps y no se trabe
    requestAnimationFrame(() => {
      const containerRect = this.gridContainer.nativeElement.getBoundingClientRect();
      const currentX = event.clientX - containerRect.left;
      const currentY = event.clientY - containerRect.top;

      const left = Math.min(this.startPos.x, currentX);
      const top = Math.min(this.startPos.y, currentY);
      const width = Math.abs(this.startPos.x - currentX);
      const height = Math.abs(this.startPos.y - currentY);

      this.rectStyle.set({
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        display: 'block'
      });

      this.calcularInterseccion(left, top, width, height);
    });
  }

  calcularInterseccion(l: number, t: number, w: number, h: number) {
    const elementos = this.gridContainer.nativeElement.querySelectorAll('.celda.almacenaje');
    const tocadosAhora = new Set<string>();

    // Optimizamos: solo iteramos sobre elementos visibles
    for (let el of elementos) {
      const rect = {
        left: el.offsetLeft,
        top: el.offsetTop,
        right: el.offsetLeft + el.offsetWidth,
        bottom: el.offsetTop + el.offsetHeight
      };

      if (rect.left < l + w && rect.right > l && rect.top < t + h && rect.bottom > t) {
        tocadosAhora.add(el.getAttribute('data-id')!);
      }
    }
    this.seleccionActualVisual.set(tocadosAhora);
  }

  calcularCeldas(l: number, t: number, w: number, h: number) {
    const elementos = this.gridContainer.nativeElement.querySelectorAll('.celda.almacenaje');
    const nuevoSetTemporal = new Set<string>();

    elementos.forEach((el: HTMLElement) => {
      const rect = {
        left: el.offsetLeft,
        top: el.offsetTop,
        right: el.offsetLeft + el.offsetWidth,
        bottom: el.offsetTop + el.offsetHeight
      };

      if (rect.left < l + w && rect.right > l && rect.top < t + h && rect.bottom > t) {
        nuevoSetTemporal.add(el.getAttribute('data-id')!);
      }
    });

    // Actualizamos lo que se ve en tiempo real mientras arrastras
    this.seleccionTemporal.set(nuevoSetTemporal);
  }

  finalizarSeleccion() {
    if (!this.seleccionando()) return;

    // Al soltar, pasamos lo visual a lo acumulado
    this.seleccionAcumulada.update(prev => {
      const nuevo = new Set(prev);
      this.seleccionActualVisual().forEach(id => nuevo.add(id));
      return nuevo;
    });

    this.seleccionando.set(false);
    this.seleccionActualVisual.set(new Set());
    this.rectStyle.update(s => ({ ...s, display: 'none' }));
  } 

  toggleModoEdicion() {
    this.modoEdicion.update(v => !v);
  }
}