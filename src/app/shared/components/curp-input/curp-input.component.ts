import {
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-curp-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './curp-input.component.html',
  styleUrls: ['./curp-input.component.css']
})
export class CurpInputComponent {

  @Input()
  placeholder: string = 'Ingrese CURP';

  @Input()
  disabled: boolean = false;

  @Input()
  readonly: boolean = false;

  @Input()
  size: 'sm' | 'md' | 'lg' = 'md';

  @Input()
  fullWidth: boolean = true;

  @Input()
  mono: boolean = true;

  @Input()
  maxLength: number = 18;

  @Input()
  value: string = '';

  @Output()
  valueChange = new EventEmitter<string>();

  @Output()
  blur = new EventEmitter<void>();

  @Output()
  enter = new EventEmitter<void>();

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let newValue = input.value;

    // Convertir a mayúsculas
    newValue = newValue.toUpperCase();

    // Filtrar solo letras y números
    newValue = newValue.replace(/[^A-Z0-9]/g, '');

    // Limitar a 18 caracteres
    if (newValue.length > this.maxLength) {
      newValue = newValue.slice(0, this.maxLength);
    }

    // Actualizar el valor en el input si es necesario
    if (input.value !== newValue) {
      input.value = newValue;

      // Mantener la posición del cursor
      const cursorPosition = Math.min(input.selectionStart || 0, newValue.length);
      input.setSelectionRange(cursorPosition, cursorPosition);
    }

    this.value = newValue;
    this.valueChange.emit(newValue);
  }

  onBlur(): void {
    this.blur.emit();
  }

  onEnter(): void {
    this.enter.emit();
  }

  hasValidCharacters(): boolean {
    // Verifica que solo contenga letras y números
    return /^[A-Z0-9]+$/.test(this.value);
  }

  hasValidLength(): boolean {
    return this.value.length === this.maxLength;
  }
}