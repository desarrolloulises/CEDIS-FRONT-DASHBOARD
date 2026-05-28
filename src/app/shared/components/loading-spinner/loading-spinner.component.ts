import {
  Component,
  input
} from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css']
})
export class LoadingSpinnerComponent {

  visible = input<boolean>(false);

  overlay = input<boolean>(false);

  texto = input<string>('Cargando...');

  /**
   * Spinner compacto:
   * útil para botones, filas o espacios pequeños.
   */
  compact = input<boolean>(false);

  /**
   * Mostrar/ocultar texto.
   */
  showText = input<boolean>(true);
}