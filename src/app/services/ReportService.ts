import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ReportService {
  // La "fuente de la verdad"
  private idSeleccionado = signal<string | null>(null);
  
  // Lo que el componente reporte va a leer
  reporteIdActual = this.idSeleccionado.asReadonly();

  actualizarSeleccion(id: string) {
    this.idSeleccionado.set(id);
  }
}