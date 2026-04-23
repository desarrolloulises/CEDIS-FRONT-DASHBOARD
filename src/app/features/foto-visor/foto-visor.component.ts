
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
    .visor-container-unificado { 
      position: relative;
      width: 100%;
      max-width: 420px; /* Ajusta al mismo valor que tu cámara */
      aspect-ratio: 4 / 3; 
      background: #000;
      border-radius: 12px;
      border: 4px solid #fff; /* Misma línea blanca que la cámara */
      overflow: hidden;
      margin: auto;
    }

    .img-preview-unificada { 
      width: 100%; 
      height: 100%; 
      object-fit: cover; /* Para que llene el cuadro igual que el video */
    }

    /* Posicionamos los botones EXACTAMENTE donde están los de la cámara */
    .controles-unificados { 
      position: absolute; 
      bottom: 15px; 
      left: 0; 
      right: 0; 
      display: flex; 
      gap: 10px; 
      justify-content: center; 
      z-index: 50; 
    }

    .btn-retry, .btn-confirm { 
      padding: 8px 16px; 
      font-size: 0.9rem; 
      border-radius: 4px; 
      border: none; 
      font-weight: bold;
      cursor: pointer;
      min-width: 110px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .btn-retry { background: #6c757d; color: white; }
    .btn-confirm { background: #28a745; color: white; }
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