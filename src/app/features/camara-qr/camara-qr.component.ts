import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-camara-qr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './camara-qr.component.html',
  styleUrl: './camara-qr.component.css'
})
export class CamaraQrComponent {
  @ViewChild('videoPlayer') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasInvisible') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fotoCapturada') fotoCapturada!: ElementRef<HTMLImageElement>;

  private http = inject(HttpClient);
  private stream: MediaStream | null = null;

  // IMPORTANTE: Cambia esta IP por la de tu servidor local
  private readonly API_URL = 'http://192.168.101.10:82/captura';

  async iniciarCamara() {
    // Verificamos si el navegador permite usar la cámara
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Tu navegador bloqueó la cámara por falta de HTTPS o conexión segura.");
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      this.videoElement.nativeElement.srcObject = this.stream;
    } catch (err) {
      console.error("Error al abrir cámara:", err);
    }


    // Reset de la interfaz
  this.fotoCapturada.nativeElement.style.display = 'none';
  this.videoElement.nativeElement.style.display = 'block'
  }

  capturarYEnviar() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');
    const imgPreview = this.fotoCapturada.nativeElement; // Referencia a la imagen

    if (context) {
      // --- AQUÍ DEFINES LA RESOLUCIÓN DEL RECORTE ---
      const anchoRecorte = 400;
      const altoRecorte = 400; 

      canvas.width = anchoRecorte;
      canvas.height = altoRecorte;

      // Calculamos el centro para el recorte real
      const sx = (video.videoWidth - anchoRecorte) / 2;
      const sy = (video.videoHeight - altoRecorte) / 2;

      // --- AQUÍ SE HACE EL RECORTE REAL ---
      context.drawImage(video, sx, sy, anchoRecorte, altoRecorte, 0, 0, anchoRecorte, altoRecorte);


      // ========================================================
      // 🔥 PASO PARA PINTAR LA FOTO EN PANTALLA 🔥
      // ========================================================
      // Convertimos el contenido del canvas a una URL de imagen
      const dataUrl = canvas.toDataURL('image/jpeg');

      // Asignamos la imagen y la mostramos
      imgPreview.src = dataUrl;
      imgPreview.style.display = 'block';
      video.style.display = 'none'; // Opcional: ocultas el video para que no gaste recursos
      // ========================================================



      // --- AQUÍ CONTROLAS CALIDAD Y PESO ---
      canvas.toBlob((blob) => {
        if (blob) {
          // Log para que veas el peso en la consola (F12)
          console.log(`Peso final: ${(blob.size / 1024).toFixed(2)} KB`);

          const formData = new FormData();
          formData.append('foto', blob, 'captura.jpg');

          // Envío al servidor .92 (que luego lo mandará al .24)
          this.http.post(this.API_URL, formData).subscribe({
            next: (res: any) => {
              // El ?. previene el error de "null" que tenías
              alert("¡Guardado! " + (res?.mensaje || res?.Mensaje));
            },
            error: (err) => alert("Error al subir")
          });
        }
      }, 'image/jpeg', 0.50); // 0.80 es el 80% de calidad
    }
  }

  // Limpieza al cerrar el componente
  ngOnDestroy() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
}