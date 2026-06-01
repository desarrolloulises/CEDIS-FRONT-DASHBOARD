import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
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
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.css']
})
export class SelectComponent implements OnChanges {

  // ─────────────────────────────
  // Value
  // ─────────────────────────────

  @Input()
  value: string = '';

  @Output()
  valueChange = new EventEmitter<string>();

  /** Copia interna que ngModel puede leer y escribir */
  internalValue: string = '';

  ngOnChanges(): void {
    this.internalValue = this.value ?? '';
  }

  // ─────────────────────────────
  // Options
  // ─────────────────────────────

  @Input()
  options: ISelectOption[] = [];

  // ─────────────────────────────
  // UI
  // ─────────────────────────────

  @Input()
  placeholder: string = 'Seleccione una opción';

  @Input()
  size: 'sm' | 'md' | 'lg' = 'md';

  @Input()
  disabled: boolean = false;

  @Input()
  fullWidth: boolean = true;

  // ─────────────────────────────
  // Change
  // ─────────────────────────────

  onModelChange(val: string): void {
    this.value = val;
    this.valueChange.emit(val);
  }
}