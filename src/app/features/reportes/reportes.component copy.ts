import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {
  // 1. Declaramos la variable que faltaba
  public urlFinal: SafeResourceUrl | undefined;

  constructor(private sanitizer: DomSanitizer) { }

ngOnInit(): void {
  // 1. Apuntamos a TU API (Capa 2), no al servidor físico
  // Cambia el puerto por el que use tu proyecto .NET (ej: 5000, 7000 o el de IIS)
  const urlDeMiApi = "http://localhost:8080/api/cedis/VerReporte"; 
  
  // 2. Angular confía en tu propia API
  this.urlFinal = this.sanitizer.bypassSecurityTrustResourceUrl(urlDeMiApi);
}

  // 4. Declaramos la función que faltaba para el error del HTML
  onLoadReport() {
    console.log("El iframe ha terminado de cargar el contenido.");
  }
}