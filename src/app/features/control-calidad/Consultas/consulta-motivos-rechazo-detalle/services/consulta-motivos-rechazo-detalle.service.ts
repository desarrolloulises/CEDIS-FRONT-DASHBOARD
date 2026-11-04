import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsultarMotivosRechazoRequest,
  ConsultarMotivosRechazoResponse
} from '../interfaces/consulta-motivos-rechazo-detalle.interface';
import { url } from '../../../../../variables';

@Injectable({ providedIn: 'root' })
export class MotivosRechazoService {
  private readonly baseUrl = `${url}/cedis/control-calidad`;

  constructor(private http: HttpClient) {}

  obtenerReporteMotivosRechazosDetalle(
    req: ConsultarMotivosRechazoRequest
  ): Observable<ConsultarMotivosRechazoResponse> {
    return this.http.post<ConsultarMotivosRechazoResponse>(
      `${this.baseUrl}/obtener-reporte-motivos-rechazos-detalle`, req);
  }
}