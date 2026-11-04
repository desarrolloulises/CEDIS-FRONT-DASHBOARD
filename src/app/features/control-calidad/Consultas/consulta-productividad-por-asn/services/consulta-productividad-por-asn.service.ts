import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsultarProductividadAsnRequest,
  ConsultarProductividadAsnResponse
} from '../interfaces/consulta-productividad-por-asn.interface';
import { url } from '../../../../../variables';

@Injectable({ providedIn: 'root' })
export class ProductividadAsnService {
  private readonly baseUrl = `${url}/cedis/control-calidad`;

  constructor(private http: HttpClient) {}

  obtenerReporteProductividadAsnDetalle(
    req: ConsultarProductividadAsnRequest
  ): Observable<ConsultarProductividadAsnResponse> {
    return this.http.post<ConsultarProductividadAsnResponse>(
      `${this.baseUrl}/obtener-reporte-productividad-asn-detalle`, req);
  }

  obtenerReporteProductividadAsnTotales(
    req: ConsultarProductividadAsnRequest
  ): Observable<ConsultarProductividadAsnResponse> {
    return this.http.post<ConsultarProductividadAsnResponse>(
      `${this.baseUrl}/obtener-reporte-productividad-asn-totales`, req);
  }
}