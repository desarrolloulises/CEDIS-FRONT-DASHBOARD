import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);

  obtenerReporte(nombre: string, parametros: any) {
    let params = new HttpParams();
    // Mapeamos dinámicamente los parámetros del componente
    Object.keys(parametros).forEach(key => {
      params = params.append(key, parametros[key]);
    });

    return this.http.get(`api/reportes/${nombre}`, {
      params,
      responseType: 'blob' // Fundamental para manejar el PDF
    });
  }
}