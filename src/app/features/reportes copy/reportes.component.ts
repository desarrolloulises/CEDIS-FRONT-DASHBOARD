import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { signal, WritableSignal } from '@angular/core';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);

  // 1. Declaramos la Signal (asegúrate que diga 'signal')
  public urlSegura: WritableSignal<SafeResourceUrl | null> = signal(null);

  ngOnInit() {
    this.cargarReporte();
  }

  cargarReporte() {
    // 2. IP de tu servidor de la bodega (SSRS)
    const urlDirecta = "http://192.168.101.191:8080/Reports/browse&rs:Command=Render&rs:Embed=true";

    // 3. Limpiamos la URL para el iframe
    const segura = this.sanitizer.bypassSecurityTrustResourceUrl(urlDirecta);

    // 4. Actualizamos la Signal
    this.urlSegura.set(segura);
  }
}