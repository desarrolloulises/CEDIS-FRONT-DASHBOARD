import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { IconButtonComponent } from '../../../../../shared/components/icon-button/icon-button.component';
import { ElementoAdicional } from '../../models/registro-entrada-almacen.models';

interface NuevoElementoForm {
  tipoElemento: string;
  descripcionElemento: string;
  cantidad: string;
}

@Component({
  selector: 'app-apartado-otros',
  standalone: true,
  imports: [
    CommonModule,
    InputComponent,
    ButtonComponent,
    IconButtonComponent
  ],
  templateUrl: './apartado-otros.component.html',
  styleUrls: ['./apartado-otros.component.css']
})
export class ApartadoOtrosComponent {
  @Input() curp: string = '';
  @Input() nuevoElemento!: NuevoElementoForm;
  @Input() elementosAdicionales: ElementoAdicional[] = [];
  @Input() elementosAdicionalesCargados: boolean = false;

  @Output() crearElementoAdicional = new EventEmitter<void>();
  @Output() abrirEdicionElemento = new EventEmitter<ElementoAdicional>();

  onTipoChange(valor: string): void {
    this.nuevoElemento.tipoElemento = valor;
  }

  onDescripcionChange(valor: string): void {
    this.nuevoElemento.descripcionElemento = valor;
  }

  onCantidadChange(valor: string): void {
    this.nuevoElemento.cantidad = valor;
  }

  crearElementoEvent(): void {
    this.crearElementoAdicional.emit();
  }

  editarElementoEvent(item: ElementoAdicional): void {
    this.abrirEdicionElemento.emit(item);
  }
}