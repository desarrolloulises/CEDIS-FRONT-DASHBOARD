import {
  Component,
  EventEmitter,
  Input,
  Output,
  HostListener
} from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './modal.component.html',

  styleUrls: ['./modal.component.css']
})
export class ModalComponent {

  @Input()
  visible: boolean = false;

  @Input()
  title: string = '';

  @Input()
  width: string = '520px';

  @Input()
  closeOnBackdrop: boolean = true;

  @Output()
  close =
    new EventEmitter<void>();

  @Input()
  closeOnEscape: boolean = true;

  cerrar(): void {

    this.close.emit();
  }

  onBackdropClick(): void {

    if (!this.closeOnBackdrop) {
      return;
    }

    this.cerrar();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {

    if (!this.visible) {
      return;
    }

    if (!this.closeOnEscape) {
      return;
    }

    this.cerrar();
  }
}