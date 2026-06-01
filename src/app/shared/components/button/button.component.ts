import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css']
})
export class ButtonComponent {

  @Input() label = 'Botón';

  /* Se han configurado 6 estilos para los botones
  1.- "primary" : Para botones principales como (aceptar, continuar, confirmar, etc)
  2.- "secondary": Pensado para botones con acciones auxiliares, como (ayuda, buscar, editar, etc)
  3.- "ghost": Es un diseño simple pensado para acciones como (cancelar, volver, cerrar). 
  4.- "success"  
  5.- "warning"
  6.- "error"*/
  @Input() type:
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'success'
    | 'warning'
    | 'error' = 'primary';

  /* Se configuraron 4 medidas en la hoja de estilos (consultar button.component.css)*/
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  /* Este atributo permite habilidar o deshabilitar el botón*/
  @Input() disabled = false;

  @Input() fullWidth = false;

  /* Este es un atributo opcional, permite pasar como parametro un icono por ejemplo (ti ti-logout), 
     estos iconos se importan desde el index */
  @Input() icon?: string;
  
  @Output()
  clicked = new EventEmitter<MouseEvent>();

  onClick(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.disabled) {
      this.clicked.emit(event);
    }
  }
}