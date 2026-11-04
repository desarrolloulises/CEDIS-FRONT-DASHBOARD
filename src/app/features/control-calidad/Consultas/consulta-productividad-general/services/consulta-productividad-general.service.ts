import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsultarProductividadRequest,
  ConsultarProductividadResponse
} from '../interfaces/consulta-productividad-general.interface';
import { url } from '../../../../../variables';

@Injectable({ providedIn: 'root' })
export class ProductividadGeneralService {
  private readonly baseUrl = `${url}/cedis/control-calidad`;

  constructor(private http: HttpClient) {}

  obtenerReporteProductividadGeneral(
    req: ConsultarProductividadRequest
  ): Observable<ConsultarProductividadResponse> {
    return this.http.post<ConsultarProductividadResponse>(
      `${this.baseUrl}/obtener-reporte-productividad-general`, req);
  }
}