import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { SelectComponent, ISelectOption } from '../../../../../shared/components/select/select.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { IconButtonComponent } from '../../../../../shared/components/icon-button/icon-button.component';
import { VetoExistente } from '../../models/registro-entrada-almacen.models';

interface DatosForm {
  curp: string;
  nombre: string;
  apellidoP: string;
  apellidoM: string;
  motivo: string;
  noProveedor: string;
  razonSocial: string;
  area: string;
  idEmpresaArea: number;
}

interface NuevoVetoForm {
  tipoVeto: string;
  fechaInicio: string;
  fechaTermino: string;
}

@Component({
  selector: 'app-apartado-datos',
  standalone: true,
  imports: [
    CommonModule,
    InputComponent,
    SelectComponent,
    ButtonComponent,
    IconButtonComponent
  ],
  templateUrl: './apartado-datos.component.html',
  styleUrls: ['./apartado-datos.component.css']
})
export class ApartadoDatosComponent {
  @Input() datosForm!: DatosForm;
  @Input() motivoOptions: ISelectOption[] = [];
  @Input() areaOptions: ISelectOption[] = [];
  @Input() opcionMotivoSeleccionado: number = 0;
  @Input() imagenUrl: string | null = null;
  @Input() imagenExiste: boolean = false;
  @Input() vetoExistente: VetoExistente | null = null;
  @Input() editandoVeto: boolean = false;
  @Input() tipoVetoOptions: ISelectOption[] = [];
  @Input() nuevoVeto!: NuevoVetoForm;
  @Input() vetoConsultado: boolean = false;
  @Input() tipoVetoSeleccionadoEsDefinitivo: boolean = false;

  @Output() datosFormChange = new EventEmitter<{ campo: string, valor: any }>();
  @Output() onCurpBlur = new EventEmitter<void>();
  @Output() verImagenAmpliada = new EventEmitter<void>();
  @Output() abrirCapturaImagen = new EventEmitter<HTMLInputElement>();
  @Output() eliminarImagen = new EventEmitter<void>();
  @Output() onSeleccionarImagen = new EventEmitter<Event>();
  @Output() iniciarEdicionVeto = new EventEmitter<void>();
  @Output() cancelarEdicionVeto = new EventEmitter<void>();
  @Output() onTipoVetoChange = new EventEmitter<string>();
  @Output() aplicarVeto = new EventEmitter<void>();
  @Output() actualizarVisitante = new EventEmitter<void>();

  onCampoChange(campo: string, valor: any): void {
    this.datosFormChange.emit({ campo, valor });
  }

  onCurpBlurEvent(): void {
    this.onCurpBlur.emit();
  }

  verImagenAmpliadaEvent(): void {
    this.verImagenAmpliada.emit();
  }

  abrirCapturaImagenEvent(input: HTMLInputElement): void {
    this.abrirCapturaImagen.emit(input);
  }

  eliminarImagenEvent(): void {
    this.eliminarImagen.emit();
  }

  onSeleccionarImagenEvent(event: Event): void {
    this.onSeleccionarImagen.emit(event);
  }

  iniciarEdicionVetoEvent(): void {
    this.iniciarEdicionVeto.emit();
  }

  cancelarEdicionVetoEvent(): void {
    this.cancelarEdicionVeto.emit();
  }

  onTipoVetoChangeEvent(valor: string): void {
    this.onTipoVetoChange.emit(valor);
  }

  aplicarVetoEvent(): void {
    this.aplicarVeto.emit();
  }

  actualizarVisitanteEvent(): void {
    this.actualizarVisitante.emit();
  }
}