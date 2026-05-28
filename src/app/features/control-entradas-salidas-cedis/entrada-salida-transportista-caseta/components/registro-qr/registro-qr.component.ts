import {
  Component,
  EventEmitter,
  Output,
  signal,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../../../../shared/components/toast/toast.component';

import { TransportistaService } from '../../services/entrada-salida-transportista-caseta.service';

@Component({
  selector: 'app-registro-qr',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    InputComponent,
    ModalComponent,
    LoadingSpinnerComponent,
    ToastComponent
  ],

  templateUrl: './registro-qr.component.html',
  styleUrls: ['./registro-qr.component.css']
})
export class RegistroQrComponent {

  // ─────────────────────────────
  // Inyección
  // ─────────────────────────────

  private svc = inject(TransportistaService);

  @Output()
  registrado = new EventEmitter<void>();

  // ─────────────────────────────
  // Estado modal
  // ─────────────────────────────

  modalVisible = false;

  // ─────────────────────────────
  // Loading
  // ─────────────────────────────

  loading = signal(false);

  // ─────────────────────────────
  // Toast
  // ─────────────────────────────

  toast: {
    tipo: 'success' | 'error';
    titulo: string;
    mensaje: string;
  } | null = null;

  mostrarToast(
    tipo: 'success' | 'error',
    titulo: string,
    mensaje: string
  ): void {
    this.toast = { tipo, titulo, mensaje };
  }

  // ─────────────────────────────
  // Formulario
  // ─────────────────────────────

  curp = '';

  // ─────────────────────────────
  // Abrir / cerrar
  // ─────────────────────────────

  abrir(): void {
    this.curp = '';
    this.toast = null;
    this.modalVisible = true;
  }

  cerrar(): void {
    if (this.loading()) return;
    this.modalVisible = false;
  }

  // ─────────────────────────────
  // Registrar
  // ─────────────────────────────

  registrar(): void {

    if (!this.curp.trim()) {
      this.mostrarToast(
        'error',
        'Campo requerido',
        'Ingrese una CURP.'
      );
      return;
    }

    this.loading.set(true);

    this.svc.registrarQr({
      curp: this.curp.trim().toUpperCase()
    }).subscribe({

      next: (response) => {

        this.loading.set(false);

        if (response.error_id > 0) {
          this.mostrarToast(
            'error',
            'No se pudo registrar',
            response.error_msg ?? 'Error desconocido.'
          );
          return;
        }

        this.mostrarToast(
          'success',
          'Registrado',
          'El transportista fue registrado correctamente.'
        );

        this.registrado.emit();

        setTimeout(() => {
          this.cerrar();
        }, 2000);
      },

      error: (err) => {
        this.loading.set(false);

        const msg =
          err?.error?.detail ??
          err?.error?.error_msg ??
          'Ocurrió un error inesperado.';

        this.mostrarToast(
          'error',
          'Error',
          msg
        );
      }
    });
  }
}