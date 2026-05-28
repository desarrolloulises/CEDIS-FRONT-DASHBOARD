import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
export interface ISelectOption {

  label: string;
  value: string;
}

@Component({
  selector: 'app-select',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl:
    './select.component.html',

  styleUrls: [
    './select.component.css'
  ]
})
export class SelectComponent {

  // ─────────────────────────────
  // Value
  // ─────────────────────────────

  @Input()
  value: string = '';

  @Output()
  valueChange =
    new EventEmitter<string>();

  // ─────────────────────────────
  // Options
  // ─────────────────────────────

  @Input()
  options: ISelectOption[] = [];

  // ─────────────────────────────
  // UI
  // ─────────────────────────────

  @Input()
  placeholder: string =
    'Seleccione una opción';

  @Input()
  size: 'sm' | 'md' | 'lg' =
    'md';

  @Input()
  disabled: boolean = false;

  @Input()
  fullWidth: boolean = true;

  // ─────────────────────────────
  // Change
  // ─────────────────────────────

  onChange(event: Event): void {

    const value =
      (event.target as HTMLSelectElement)
      .value;

    this.value = value;

    this.valueChange.emit(value);
  }
}