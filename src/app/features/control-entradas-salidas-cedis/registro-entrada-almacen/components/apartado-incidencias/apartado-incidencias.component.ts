import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { SelectComponent, ISelectOption } from '../../../../../shared/components/select/select.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { IconButtonComponent } from '../../../../../shared/components/icon-button/icon-button.component';
import { Incidencia } from '../../models/registro-entrada-almacen.models';

interface NuevaIncidenciaForm {
  nivel: string;
  descripcion: string;
}

@Component({
  selector: 'app-apartado-incidencias',
  standalone: true,
  imports: [
    CommonModule,
    InputComponent,
    SelectComponent,
    ButtonComponent,
    IconButtonComponent
  ],
  templateUrl: './apartado-incidencias.component.html',
  styleUrls: ['./apartado-incidencias.component.css']
})
export class ApartadoIncidenciasComponent {
  @Input() curp: string = '';
  @Input() nivelOptions: ISelectOption[] = [];
  @Input() nuevaIncidencia!: NuevaIncidenciaForm;
  @Input() incidencias: Incidencia[] = [];
  @Input() incidenciasCargadas: boolean = false;

  @Output() crearIncidencia = new EventEmitter<void>();
  @Output() abrirEdicionIncidencia = new EventEmitter<Incidencia>();

  onNivelChange(valor: string): void {
    this.nuevaIncidencia.nivel = valor;
  }

  onDescripcionChange(valor: string): void {
    this.nuevaIncidencia.descripcion = valor;
  }

  crearIncidenciaEvent(): void {
    this.crearIncidencia.emit();
  }

  editarIncidenciaEvent(item: Incidencia): void {
    this.abrirEdicionIncidencia.emit(item);
  }

  formatearFecha(fechaApi: string): string {
    const soloFecha = (fechaApi || '').split(' ')[0];
    const partes = soloFecha.split('/');

    if (partes.length !== 3) {
      return fechaApi;
    }

    const [mm, dd, yyyy] = partes;
    return `${dd}/${mm}/${yyyy}`;
  }
}