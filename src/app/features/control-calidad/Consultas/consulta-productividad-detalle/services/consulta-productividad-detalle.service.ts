import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsultarProductividadDetalleRequest,
  ConsultarProductividadDetalleResponse
} from '../interfaces/consulta-productividad-detalle.interface';
import { url } from '../../../../../variables';

@Injectable({ providedIn: 'root' })
export class ProductividadDetalleService {
  private readonly baseUrl = `${url}/cedis/control-calidad`;

  constructor(private http: HttpClient) {}

  obtenerReporteProductividadDetalle(
    req: ConsultarProductividadDetalleRequest
  ): Observable<ConsultarProductividadDetalleResponse> {
    return this.http.post<ConsultarProductividadDetalleResponse>(
      `${this.baseUrl}/obtener-reporte-productividad-detalle`, req);
  }
}