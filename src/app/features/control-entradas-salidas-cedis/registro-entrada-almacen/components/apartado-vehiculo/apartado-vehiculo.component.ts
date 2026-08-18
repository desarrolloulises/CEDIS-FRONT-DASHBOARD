import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { SelectComponent, ISelectOption } from '../../../../../shared/components/select/select.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';

interface VehiculoForm {
  tipoUnidad: string;
  placas: string;
  marca: string;
  modelo: string;
}

@Component({
  selector: 'app-apartado-vehiculo',
  standalone: true,
  imports: [CommonModule, InputComponent, SelectComponent, ButtonComponent],
  templateUrl: './apartado-vehiculo.component.html',
  styleUrls: ['./apartado-vehiculo.component.css']
})
export class ApartadoVehiculoComponent {
  @Input() curp: string = '';
  @Input() vehiculoForm!: VehiculoForm;
  @Input() tipoUnidadOptions: ISelectOption[] = [];

  @Output() vehiculoFormChange = new EventEmitter<VehiculoForm>();
  @Output() actualizarVisitante = new EventEmitter<void>();

  onCampoChange(campo: string, valor: any): void {
    (this.vehiculoForm as any)[campo] = valor;
    this.vehiculoFormChange.emit(this.vehiculoForm);
  }

  actualizarVisitanteEvent(): void {
    this.actualizarVisitante.emit();
  }
}