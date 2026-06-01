import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icon-button.component.html',
  styleUrls: ['./icon-button.component.css']
})
export class IconButtonComponent {

  /**
   * Clase del icono Tabler.
   * Ejemplo:
   * ti ti-edit
   * ti ti-trash
   * ti ti-printer
   */
  @Input({ required: true })
  icon!: string;

  @Input() type:
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'success'
    | 'warning'
    | 'error' = 'primary';

  @Input() size:
    | 'xs'
    | 'sm'
    | 'md' = 'sm';

  @Input() disabled = false;

  @Input() title = '';

}