import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidacionSeguridad } from '../../models/registro-entrada-almacen.models';

@Component({
  selector: 'app-apartado-validaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './apartado-validaciones.component.html',
  styleUrls: ['./apartado-validaciones.component.css']
})
export class ApartadoValidacionesComponent {
  @Input() curp: string = '';
  @Input() validaciones: ValidacionSeguridad[] = [];
  @Input() validacionesCargadas: boolean = false;

  @Output() toggleValidacion = new EventEmitter<{ item: ValidacionSeguridad, activa: boolean }>();

  onToggleValidacion(item: ValidacionSeguridad, event: any): void {
    const activa = event.target.checked;
    this.toggleValidacion.emit({ item, activa });
  }
}