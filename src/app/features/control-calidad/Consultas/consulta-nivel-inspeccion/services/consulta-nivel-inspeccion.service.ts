import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsultarNivelInspeccionResponse
} from '../interfaces/consulta-nivel-inspeccion.interface';
import { url } from '../../../../../variables';

@Injectable({ providedIn: 'root' })
export class NivelInspeccionService {
  private readonly baseUrl = `${url}/cedis/control-calidad`;

  constructor(private http: HttpClient) {}

  /**
   * POST sin parámetros. Enviamos `null` como body para replicar
   * el `-d ''` del curl (cuerpo vacío con Content-Type: application/json).
   */
  obtenerReporteNivelInspeccion(): Observable<ConsultarNivelInspeccionResponse> {
    return this.http.post<ConsultarNivelInspeccionResponse>(
      `${this.baseUrl}/obtener-reporte-nivel-inspeccion`, null);
  }
}