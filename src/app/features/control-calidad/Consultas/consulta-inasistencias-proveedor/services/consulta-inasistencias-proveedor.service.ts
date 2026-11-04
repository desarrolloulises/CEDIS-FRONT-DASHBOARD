import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsultarInasistenciasProveedorRequest,
  ConsultarInasistenciasProveedorResponse
} from '../interfaces/consulta-inasistencias-proveedor.interface';
import { url } from '../../../../../variables';

@Injectable({ providedIn: 'root' })
export class InasistenciasProveedorService {
  private readonly baseUrl = `${url}/cedis/control-calidad`;

  constructor(private http: HttpClient) {}

  obtenerReporteInasistenciasProveedor(
    req: ConsultarInasistenciasProveedorRequest
  ): Observable<ConsultarInasistenciasProveedorResponse> {
    return this.http.post<ConsultarInasistenciasProveedorResponse>(
      `${this.baseUrl}/obtener-reporte-inasistencias-proveedor`, req);
  }
}