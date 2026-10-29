import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ObtenerEstatusProveedoresResponse, ObtenerTiemposRefreshResponse } from '../interfaces/consulta-estatus-proveedores.interface';
import { url } from '../../../../../variables';

@Injectable({ providedIn: 'root' })
export class ControlCalidadService {
  private readonly baseUrl = `${url}/cedis/control-calidad`;

  constructor(private http: HttpClient) { }

  obtenerEstatusProveedores(): Observable<ObtenerEstatusProveedoresResponse> {
    return this.http.post<ObtenerEstatusProveedoresResponse>(
      `${this.baseUrl}/obtener-estatus-proveedores`, {});
  }

  obtenerTiemposRefresh(): Observable<ObtenerTiemposRefreshResponse> {
    return this.http.get<ObtenerTiemposRefreshResponse>(
      `${this.baseUrl}/obtener-tiempos-refresh`);
  }
}