import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsultarCambiosFechaCitaRequest,
  ConsultarCambiosFechaCitaResponse
} from '../interfaces/consulta-cambios-fecha-cita.interface';
import { url } from '../../../../../variables';

@Injectable({ providedIn: 'root' })
export class CambiosFechaCitaService {
  private readonly baseUrl = `${url}/cedis/control-calidad`;

  constructor(private http: HttpClient) {}

  obtenerReporteCambiosFechaCita(
    req: ConsultarCambiosFechaCitaRequest
  ): Observable<ConsultarCambiosFechaCitaResponse> {
    return this.http.post<ConsultarCambiosFechaCitaResponse>(
      `${this.baseUrl}/obtener-reporte-cambios-fecha-cita`, req);
  }
}