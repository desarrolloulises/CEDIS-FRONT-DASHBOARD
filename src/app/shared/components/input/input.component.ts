import {
  Component,
  Input,
  Output,
  EventEmitter
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './input.component.html',

  styleUrls: ['./input.component.css']
})
export class InputComponent {

  @Input()
  label: string = '';

  @Input()
  placeholder: string = '';

  @Input()
  type: string = 'text';

  @Input()
  value: string = '';

  @Input()
  disabled: boolean = false;

  @Input()
  readonly: boolean = false;

  @Input()
  size: 'sm' | 'md' | 'lg' = 'md';

  @Input()
  fullWidth: boolean = true;

  @Input()
  mono: boolean = false;

  @Output()
  valueChange =
    new EventEmitter<string>();

  @Output()
  blur = new EventEmitter<void>();

  @Output()
  inputBlur = new EventEmitter<void>();

  @Output()
  enter = new EventEmitter<void>();
}