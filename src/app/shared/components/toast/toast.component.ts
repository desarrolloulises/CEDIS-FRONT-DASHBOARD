import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit, OnDestroy {

  @Input() tipo: 'success' | 'error' = 'success';
  @Input() titulo = '';
  @Input() mensaje = '';
  @Input() duracion = 3000;

  @Output() cerrar = new EventEmitter<void>();

  private timer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    if (this.duracion > 0) {
      this.timer = setTimeout(
        () => this.cerrar.emit(),
        this.duracion
      );
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}