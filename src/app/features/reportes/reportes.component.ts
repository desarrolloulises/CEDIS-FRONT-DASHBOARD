import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SafeUrlPipe } from '../../services/safe-url.pipe';
import { ReportService } from '../../services/ReportService';
// Crea una interfaz simple para que sea ordenado


@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeUrlPipe],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent {
  private reportService = inject(ReportService);
  private sanitizer = inject(DomSanitizer);

  reportUrl: SafeResourceUrl | null = null;
  cargando = signal<boolean>(true);

  private idSeleccionado = signal<string | null>(null);

  // Lo que el componente reporte va a leer
  reporteIdActual = this.idSeleccionado.asReadonly();

  actualizarSeleccion(id: string) {
    this.idSeleccionado.set(id);
  }





  // Ejemplo de cómo apagar el loader
  generarReporte() {
    this.cargando.set(true);

    // Aquí va tu lógica de la URL y el Sanitizer...

    // Simulamos que el reporte terminó de cargar (puedes usar el evento (load) del iframe)
    setTimeout(() => {
      this.cargando.set(false);
    }, 2000);
  }


  // DICCIONARIO: La llave debe ser IGUAL a lo que sale en tu console.log
  private readonly CONFIG_REPORTES: Record<string, string> = {
    'reporte-primerReporte': '/11%20Inventarios/Toma%20de%20Inventario/Log%20de%20Errores%20Toma%20de%20Inventario',
    '14-2': '/11%20Inventarios/Toma%20de%20Inventario/Log%20de%20Errores%20Toma%20de%20Inventario',
    // Si en consola sale la URL completa del sub.URL, ponla aquí como llave
  };
  constructor() {

    effect(() => {
      // 1. Escuchamos el ID que viene del servicio
      const idRecuperado = this.reportService.reporteIdActual();

      console.log("📥 Visor de Reportes recibió:", idRecuperado);
 

      if (idRecuperado) {
        // 2. Buscamos la ruta técnica de SSRS en nuestro diccionario
        const rutaSSRS = this.CONFIG_REPORTES[idRecuperado];
        console.log("ID RECUPERADO: " +  this.CONFIG_REPORTES[idRecuperado]);
        if (rutaSSRS) {
          
         // this.cargando.set(true);

console.log("rut " + rutaSSRS);


          // 3. Construimos la URL completa
          const servidor = 'http://192.168.101.191:8080/ReportServer?';
          const urlFinal = `${servidor}${rutaSSRS}&rs:Command=Render `;
          console.log("url " + urlFinal);
          

          console.log("🚀 Cargando URL en iframe:", urlFinal);

          // 4. Saneamos la URL para que el iframe la acepte
          this.reportUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlFinal);
        } else {
          console.warn("⚠️ El ID recibido no está configurado en el diccionario del componente.");
          this.reportUrl = null;
        }
      }
    });

  }



  /*
    ngOnInit() {
      // 1. URL de tu Minimal API (el puente que creamos en .NET 8)
      // Cambia el puerto si tu API usa uno distinto al 5000
      const apiBaseUrl = "http://192.168.101.191:8080/Reports/browse/?/api/visor/reporte";
  
      // 2. Nombre del reporte tal cual lo espera el endpoint {nombreReporte}
      const nombreReporte = "01%20%C3%81rea%20Recibo/Control%20Recibo";
  
      // 3. Parámetros que quieres enviarle al reporte
      // Nota: Ya no ponemos &rs:Command ni nada de eso, eso ya lo hace el Back
      const clienteId = "123";
  
  
      /*
      // Construimos la URL que apunta a TU API
      //const urlFinal = `${apiBaseUrl}/${nombreReporte}?ClienteId=${clienteId}`;
      const urlFinal = `${rute}&rs:Command=Render&rs:Format=HTML5`;*/
  /*  const rute = "http://192.168.101.191:8080/Reports?/report/11%20Inventarios/Toma%20de%20Inventario/Log%20de%20Errores%20Toma%20de%20Inventario";
    /*
     const baseUrl = "http://192.168.101.191:8080/ReportServer?";
     const pathReporte = "/report/01%20%C3%81rea%20Recibo/Control%20Recibo";
     const comandos = "rs:Command=Render&rc:Toolbar=true";
     */
  /*const baseUrl = "http://192.168.101.191:8080/ReportServer/Pages/ReportViewer.aspx?";
  const pathReporte = "%2f01+Área+Recibo%2fControl+Recibo";
  const comandos = "rs:Command=Render&rc:Toolbar=true";
  const url1 = "http://192.168.101.191:8080/ReportServer?/11%20Inventarios/Toma%20de%20Inventario/Log%20de%20Errores%20Toma%20de%20Inventario 	";

  const urlFinal = baseUrl + encodeURI(pathReporte) + comandos;
  //const urlFinal = `${rute}?rs:Command=Render&rc:Toolbar=false`;
  console.log(urlFinal);

  // 4. Sanitizamos la URL de nuestra propia API para el iframe
  this.reportUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url1);
}
/*
  ngOnInit() {
 
    const url =
      "http://192.168.101.191:8080/Reports/?/api/reportes/ver" +
      "&rs:Command=Render" +
      "&rc:Toolbar=false" +
      "&rc:Parameters=false" +
      "&ClienteId=123";
 
    this.reportUrl =
      this.sanitizer.bypassSecurityTrustResourceUrl(url);
 
  }*/

}



/*implements OnInit {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  public urlSegura = signal<SafeResourceUrl | null>(null);





  // CONFIGURACIÓN MAESTRA: Aquí relacionas cada HIJO con su REPORTE REAL
  private readonly MAPEO_REPORTES: Record<string, { carpeta: string, reporte: string }> = {
    'reporte-primerReporte': { carpeta: '01%20%C3%81rea%20Recibo', reporte: 'Control%20Recibo' },
    'reporte-segundo': { carpeta: '01%20Recibo', reporte: 'Faltantes_Escaneo' },
    'reporte-ventas': { carpeta: '02%20Ventas', reporte: 'Resumen_Diario' }
  };

  ngOnInit() {
    // Escuchamos el cambio de "Hijo" sin recargar la página
    this.route.paramMap.subscribe(params => {
      const idHijo = params.get('id');
      console.log("idHijo " + idHijo);


      if (idHijo && this.MAPEO_REPORTES[idHijo]) {
        this.generarIframe(idHijo);
      } else {
        this.urlSegura.set(null); // Limpiar si el ID no existe
      }
    });
  }

 private generarIframe(id: string) {
  const config = this.MAPEO_REPORTES[id];
  if (!config) return;

  // 1. Usamos el valor del diccionario tal cual (el que tiene %20)
  // 2. Reemplazamos CADA símbolo '%' por '%25' para imitar a Swagger
  const carpetaSwagger = config.carpeta.replace(/%/g, '%25');
  const reporteSwagger = config.reporte.replace(/%/g, '%25');

  // 3. Construimos la URL manualmente (sin HttpParams para que no nos limpie los %25)
  const urlFinal = `${APIURL_VERREPORTE}?carpeta=${carpetaSwagger}&reporte=${reporteSwagger}`;

  console.log("🎯 URL CON DOBLE CODIFICACIÓN (Estilo Swagger):", urlFinal);

  // 4. Pasamos al Iframe
  this.urlSegura.set(this.sanitizer.bypassSecurityTrustResourceUrl(urlFinal));
}

}*/