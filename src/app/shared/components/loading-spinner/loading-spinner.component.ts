import {
  Component,
  input,
  OnInit,
  OnDestroy,
  ElementRef,
  Renderer2,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css']
})
export class LoadingSpinnerComponent implements OnInit, OnDestroy {

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

  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);
  private parentRelativeApplied = false;

  ngOnInit(): void {
    if (this.overlay()) {
      this.aplicarRelativeAlPadre();
    }
  }

  ngOnDestroy(): void {
    // Limpiar el estilo aplicado al padre
    if (this.parentRelativeApplied) {
      const parent = this.elementRef.nativeElement.parentElement;
      if (parent) {
        this.renderer.removeStyle(parent, 'position');
      }
    }
  }

  private aplicarRelativeAlPadre(): void {
    const parent = this.elementRef.nativeElement.parentElement;
    if (parent) {
      const computedStyle = window.getComputedStyle(parent);
      // Solo aplicar si no tiene ya una posición que cree contexto de apilamiento
      if (computedStyle.position === 'static') {
        this.renderer.setStyle(parent, 'position', 'relative');
        this.parentRelativeApplied = true;
      }
    }
  }
}