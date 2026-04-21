
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core'; 

@Component({
  selector: 'app-foto-visor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="visor-overlay">
      <div class="visor-card">
        <h3>¿La foto es correcta?</h3>
        <img [src]="imageSrc" class="img-preview">
        
        <div class="botones">
          <button class="btn-retry" (click)="onRetry.emit()">Repetir</button>
          <button class="btn-confirm" (click)="onConfirm.emit()">Confirmar y Guardar</button>
        </div>
      </div>
    </div>   
  `,
  styles: [`
    .visor-overlay { background: rgba(0,0,0,0.8); padding: 20px; border-radius: 15px; }
    .img-preview { width: 100%; border-radius: 10px; border: 2px solid white; }
    .botones { display: flex; gap: 10px; margin-top: 15px; justify-content: center; }
    .btn-retry { background: #6c757d; color: white; border: none; padding: 10px; border-radius: 5px; }
    .btn-confirm { background: #28a745; color: white; border: none; padding: 10px; border-radius: 5px; }
  `]
})
export class FotoVisorComponent {
@Input() imageSrc: string | null = null;
@Output() onRetry = new EventEmitter<void>();      // Para volver a la cámara
@Output() onConfirm = new EventEmitter<void>();    // Para subir al servidor
@Output() onFileSelected = new EventEmitter<File>(); // Para procesar foto de galería

onFileChange(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.onFileSelected.emit(file);
  }
}
}