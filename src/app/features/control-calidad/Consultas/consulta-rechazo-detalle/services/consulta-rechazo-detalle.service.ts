import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsultarRechazoDetalleRequest,
  ConsultarRechazoDetalleResponse
} from '../interfaces/consulta-rechazo-detalle.interface';
import { url } from '../../../../../variables';

@Injectable({ providedIn: 'root' })
export class RechazoDetalleService {
  private readonly baseUrl = `${url}/cedis/control-calidad`;

  constructor(private http: HttpClient) {}

  obtenerReporteRechazosDetalle(
    req: ConsultarRechazoDetalleRequest
  ): Observable<ConsultarRechazoDetalleResponse> {
    return this.http.post<ConsultarRechazoDetalleResponse>(
      `${this.baseUrl}/obtener-reporte-rechazos-detalle`, req);
  }
}