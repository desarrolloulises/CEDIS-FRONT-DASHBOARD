import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FotoVisorComponent } from '../foto-visor/foto-visor.component';

@Component({
  selector: 'app-camara-qr',
  standalone: true,
  imports: [CommonModule, FotoVisorComponent],
  templateUrl: './camara-qr.component.html',
  styleUrl: './camara-qr.component.css'
})
export class CamaraQrComponent {
  @ViewChild('videoPlayer') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasInvisible') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fotoCapturada') fotoCapturada!: ElementRef<HTMLImageElement>;

  private http = inject(HttpClient);
  //private stream: MediaStream | null = null;
  // Referencias y estados
  fotoCapturadaUrl: string | null = null;
  blobTemporal: Blob | null = null;

  // Define el tipo correctamente para que reconozca .deviceId
  dispositivosVideo: MediaDeviceInfo[] = [];
  indiceCamaraActual: number = 0;
  stream: MediaStream | null = null;

  // IMPORTANTE: Cambia esta IP por la de tu servidor local
  private readonly API_URL = 'http://192.168.101.10:82/captura';
  async iniciarCamara(deviceId?: string) {
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

    // ELIMINAR las líneas de 'this.fotoCapturada.nativeElement' de aquí, 
    // ya que el *ngIf del HTML se encargará de mostrar/ocultar.
  }

  // RENOMBRAR O ACTUALIZAR: Esta función solo captura localmente
  soloCapturar() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (context && video.videoWidth > 0) {
      const anchoRecorte = 400;
      const altoRecorte = 400;

      canvas.width = anchoRecorte;
      canvas.height = altoRecorte;

      const sx = (video.videoWidth - anchoRecorte) / 2;
      const sy = (video.videoHeight - altoRecorte) / 2;

      context.drawImage(video, sx, sy, anchoRecorte, altoRecorte, 0, 0, anchoRecorte, altoRecorte);

      // 1. Guardamos la URL para pasarle al componente HIJO
      this.fotoCapturadaUrl = canvas.toDataURL('image/jpeg');

      // 2. Guardamos el BLOB para cuando se confirme el envío
      canvas.toBlob((blob) => {
        if (blob) {
          this.blobTemporal = blob;
        }
      }, 'image/jpeg', 0.50);
    } else {
      alert("La cámara aún no carga el video o no está activa.");
    }
  }

  // NUEVA FUNCIÓN: Se ejecuta cuando el hijo emite (onConfirm)
  enviarFotoServidor() {
    if (!this.blobTemporal) return;

    const formData = new FormData();
    formData.append('foto', this.blobTemporal, 'captura.jpg');

    this.http.post(this.API_URL, formData).subscribe({
      next: (res: any) => {
        alert("¡Guardado! " + (res?.mensaje || res?.Mensaje || "OK"));
        this.resetearTodo(); // Regresamos a la cámara
      },
      error: (err) => {
        console.error(err);
        alert("Error al subir");
      }
    });
  }

  // NUEVA FUNCIÓN: Se ejecuta cuando el hijo emite (onRetry) o tras guardar
  resetearTodo() {
    this.fotoCapturadaUrl = null;
    this.blobTemporal = null;

    // Pequeño delay para que Angular renderice de nuevo el elemento <video>
    setTimeout(() => {
      if (this.stream && this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
      }
    }, 100);
  }

  // ... (ngOnDestroy se queda igual)


  // Esta función procesa el archivo seleccionado desde el visor
  procesarArchivoElegido(file: File) {
    this.blobTemporal = file; // Guardamos el archivo directamente como blob

    const reader = new FileReader();
    reader.onload = (e: any) => {
      // Actualizamos la URL para que el componente hijo muestre la nueva imagen
      this.fotoCapturadaUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  ////-----------------------------------------------------------------------------------

  async listarCamaras() {
    try {
      // Pedimos permiso primero, si no, enumerateDevices sale vacío
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const dispositivos = await navigator.mediaDevices.enumerateDevices();

      this.dispositivosVideo = dispositivos.filter(d => d.kind === 'videoinput');

      // Cerramos el stream temporal
      tempStream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("No se pudieron listar las cámaras:", err);
    }
  }

  // Función para el botón del icono de cambio
  async cambiarCamara() {
    // Verificamos que tengamos cámaras y que el arreglo no esté vacío
    if (this.dispositivosVideo && this.dispositivosVideo.length > 1) {

      // 1. Calculamos el siguiente índice
      this.indiceCamaraActual = (this.indiceCamaraActual + 1) % this.dispositivosVideo.length;

      // 2. Accedemos de forma segura al ID
      const dispositivo = this.dispositivosVideo[this.indiceCamaraActual];

      if (dispositivo && dispositivo.deviceId) {
        const nuevoId = dispositivo.deviceId;
        console.log("Cambiando a cámara:", dispositivo.label || nuevoId);

        // 3. Llamamos a iniciarCamara con el ID específico
        await this.iniciarCamara(nuevoId);
      }
    }
  }

  // Importante: Llamar a listarCamaras al iniciar
  async ngOnInit() {
    await this.listarCamaras();
  }
}