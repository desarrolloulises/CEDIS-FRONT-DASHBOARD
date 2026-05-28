// shared/components/button/button.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css']
})
export class ButtonComponent {

  @Input() label: string = 'Botón';

  /* Se han configurado 3 estilos para los botones
    1.- "primary" : Para botones principales como (aceptar, continuar, confirmar, etc)
    2.- "secondary": Pensado para botones con acciones auxiliares, como (ayuda, buscar, editar, etc)
    3.- "ghost": Es un diseño simple pensado para acciones como (cancelar, volver, cerrar). */
  @Input() type: 'primary' | 'secondary' | 'ghost' = 'primary';

  /* Se configuraron 4 medidas en la hoja de estilos (consultar button.component.css)*/
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  /* Este atributo permite habilidar o deshabilitar el botón*/
  @Input() disabled: boolean = false;

  @Input() fullWidth: boolean = false;

}