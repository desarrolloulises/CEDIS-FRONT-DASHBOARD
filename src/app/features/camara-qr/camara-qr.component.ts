import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FotoVisorComponent } from '../foto-visor/foto-visor.component';
import { ChangeDetectorRef } from '@angular/core'; // Al principio
import jsQR from 'jsqr';

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

  // Dentro de tu clase
  private cd = inject(ChangeDetectorRef);

  private http = inject(HttpClient);
  //private stream: MediaStream | null = null;
  // Referencias y estados
  fotoCapturadaUrl: string | null = null;
  blobTemporal: Blob | null = null;

  // Define el tipo correctamente para que reconozca .deviceId
  dispositivosVideo: MediaDeviceInfo[] = [];
  indiceCamaraActual: number = 0;
  stream: MediaStream | null = null;

  //para la camara poder cambiar entre ellas
  listaCamaras: MediaDeviceInfo[] = [];
  idCamaraActual: string = '';

  private scanning: boolean = false; // Controla el bucle
  public qrDetectado: boolean = false; // Evita lecturas repetidas

  // IMPORTANTE: Cambia esta IP por la de tu servidor local
  private readonly API_URL = 'http://192.168.101.10:82/captura';

  // Bucle de lectura automática
  escanearAutomatico() {
    if (!this.scanning || this.qrDetectado) return; // Si ya detectó uno o está apagado, sale

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
      const tamaño = 400;
      canvas.width = tamaño;
      canvas.height = tamaño;

      const sx = (video.videoWidth - tamaño) / 2;
      const sy = (video.videoHeight - tamaño) / 2;

      // Dibujamos en el canvas oculto para procesar
      context.drawImage(video, sx, sy, tamaño, tamaño, 0, 0, tamaño, tamaño);

      // Análisis de jsQR
      const imageData = context.getImageData(0, 0, tamaño, tamaño);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        this.qrDetectado = true; // Bloqueamos nuevas lecturas momentáneamente
        this.procesarLecturaExitosa(code.data);
      }
    }

    // Se vuelve a llamar a sí misma para el siguiente frame
    requestAnimationFrame(() => this.escanearAutomatico());
  }

  procesarLecturaExitosa(valor: string) {
    console.log("QR Leído:", valor);
    alert("Código detectado: " + valor);

    // Si quieres que después de leer el QR se tome la foto automáticamente:
    // this.soloCapturar(); 
  }


  async iniciarCamara(deviceId?: string) {
    /*  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Tu navegador bloqueó la cámara por falta de HTTPS o conexión segura.");
        return;
      }
  */
    // DIFERENCIA 1: Detener la cámara anterior para liberar el recurso
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    const constraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' },
      audio: false
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.nativeElement.srcObject = this.stream;
    } catch (err) {
      console.error("Error:", err);
    }

    // ELIMINAR las líneas de 'this.fotoCapturada.nativeElement' de aquí, 
    // ya que el *ngIf del HTML se encargará de mostrar/ocultar.

try {
    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.videoElement.nativeElement.srcObject = this.stream;
    
    // IMPORTANTE: Cuando el video esté listo, empezamos a escanear
    this.videoElement.nativeElement.onloadedmetadata = () => {
      this.scanning = true;
      this.qrDetectado = false; // Permitimos lectura nueva
      this.escanearAutomatico();
    };

  } catch (err) {
    console.error("Error al iniciar cámara", err);
  }


  }

  soloCapturar() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    // Usamos 'willReadFrequently' para que el navegador optimice la lectura de píxeles
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (context && video.videoWidth > 0) {
      const anchoRecorte = 400;
      const altoRecorte = 400;

      canvas.width = anchoRecorte;
      canvas.height = altoRecorte;

      const sx = (video.videoWidth - anchoRecorte) / 2;
      const sy = (video.videoHeight - altoRecorte) / 2;

      // A. Dibujamos el recorte (Lo que ya hacías para la foto)
      context.drawImage(video, sx, sy, anchoRecorte, altoRecorte, 0, 0, anchoRecorte, altoRecorte);

      // --- B. NUEVA PARTE: LECTURA DE QR (Agregado) ---
      try {
        const imageData = context.getImageData(0, 0, anchoRecorte, altoRecorte);
        const codigoObtenido = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (codigoObtenido) {
          console.log("¡QR Detectado!", codigoObtenido.data);
          // Aquí puedes asignar el valor a una variable o mostrar un aviso
          alert("Contenido del QR: " + codigoObtenido.data);
        }
      } catch (error) {
        console.error("Error al procesar QR:", error);
      }
      // -----------------------------------------------

      // C. Guardamos la URL para el visor (Manteniendo tu lógica)
      this.fotoCapturadaUrl = canvas.toDataURL('image/jpeg');

      // D. Guardamos el BLOB para el servidor (Manteniendo tu lógica)
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
    try {
      // 1. Forzamos el permiso. Esto abre la cámara y desbloquea los IDs reales
      await this.iniciarCamara();

      // 2. Ahora que tenemos permiso, listamos las cámaras
      await this.listarDispositivos();
    } catch (err) {
      console.error("No se pudo inicializar:", err);
    }
  }




  //cambio de camaras metodos usados
  // Obtener lista de cámaras (puedes llamarlo en el constructor o ngOnInit)
  async listarDispositivos() {
    try {
      // Al llamar a esto después de iniciarCamara, los IDs y Labels ya no serán privados
      const dispositivos = await navigator.mediaDevices.enumerateDevices();
      this.listaCamaras = dispositivos.filter(d => d.kind === 'videoinput');

      // Forzamos a Angular a que detecte que 'listaCamaras' ya no está vacío
      this.cd.detectChanges();
    } catch (err) {
      console.error("Error listando dispositivos:", err);
    }
  }



  // Esta es la función que llama tu <select (change)="...">
  async cambiarDispositivo(event: any) {
    const nuevoId = event.target.value;
    this.idCamaraActual = nuevoId;

    // Si la cámara ya estaba encendida, la reiniciamos con el nuevo ID
    await this.iniciarCamara(nuevoId);
  }


}