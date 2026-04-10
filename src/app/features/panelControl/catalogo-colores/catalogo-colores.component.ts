import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ColorRow {
  clave: number;
  colorHex: string;
  nombre: string;
  activo: boolean;
  dias?: number;
}

@Component({
  selector: 'app-catalogo-colores',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './catalogo-colores.component.html',
  styleUrl: './catalogo-colores.component.css'
})
export class CatalogoColoresComponent {

  public isWaiting = signal<boolean>(false);
  colorTemporal: string = '#ffffff';


  // Usamos un Signal para la lista de colores (ideal para Angular 18)
  listaColores = signal<ColorRow[]>([
    { clave: 1, colorHex: '#E3D3A3', nombre: 'Paleta Arena', activo: true },
    { clave: 2, colorHex: '#B8C8CC', nombre: 'Paleta Gris', activo: false },
    { clave: 3, colorHex: '#6B9E5A', nombre: 'Paleta Verde', activo: true },
    { clave: 4, colorHex: '#6D4B94', nombre: 'Paleta Púrpura', activo: true },
  ]);

  // Ejemplo de un campo extra como el que aparece abajo en tu foto ("dias")
  diasReferencia = signal<number>(3);

  constructor() {
    // Aquí podrías llamar a tu API para llenar la listaColores()
  }
  cambiarColor(clave: number, nuevoColor: string) {
    this.listaColores.update(colores =>
      colores.map(c => c.clave === clave ? { ...c, colorHex: nuevoColor } : c)
    );
  }
  // Función para cambiar el estado de activo (el [X] de tu imagen)
  toggleActivo(clave: number) {
    this.listaColores.update(colores =>
      colores.map(c => c.clave === clave ? { ...c, activo: !c.activo } : c)
    );
  }

  // Método para guardar cambios (simulado)
  guardarCatalogo() {
    const datosParaEnviar = this.listaColores();
    console.log('Enviando al SP:', datosParaEnviar);
  }

  confirmarNuevoColor(color: string) {
    const nuevaClave = this.listaColores().length + 1;

    const nuevoItem = {
      clave: nuevaClave,
      colorHex: color,
      nombre: 'Nuevo Color',
      activo: true
    };
    // Agregamos al Signal
    this.listaColores.update(actual => [...actual, nuevoItem]);

    // Opcional: Resetear el color del buscador a blanco
    this.colorTemporal = '#ffffff';
  }
}
