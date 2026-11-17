import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ApiResponse, DataDinamica,
  ObtenerTiposEntradaRequest,
  ObtenerMotivosIngresoRequest,
  AgregarMotivoIngresoRequest,
  ActualizarMotivoIngresoRequest,
  ObtenerValidacionesMotivosIngresoRequest,
  ActualizarEstatusValidacionRequest
} from '../Interfaces/gestion-catalogo-validaciones-entrada.interface';

import { url } from '../../../../variables';

@Injectable({ providedIn: 'root' })
export class GestionCatalogoValidacionesEntradaService {
  private readonly baseUrl = `${url}/cedis/catalogos`;

  constructor(private http: HttpClient) {}

  obtenerTiposEntrada(
    req: ObtenerTiposEntradaRequest
  ): Observable<ApiResponse<DataDinamica>> {
    return this.http.post<ApiResponse<DataDinamica>>(
      `${this.baseUrl}/obtener-tipos-entrada`, req);
  }

  obtenerMotivosIngreso(
    req: ObtenerMotivosIngresoRequest
  ): Observable<ApiResponse<DataDinamica>> {
    return this.http.post<ApiResponse<DataDinamica>>(
      `${this.baseUrl}/obtener-motivos-ingreso`, req);
  }

  agregarMotivoIngreso(
    req: AgregarMotivoIngresoRequest
  ): Observable<ApiResponse<{ creado: boolean }>> {
    return this.http.post<ApiResponse<{ creado: boolean }>>(
      `${this.baseUrl}/agregar-motivos-ingreso`, req);
  }

  actualizarMotivoIngreso(
    req: ActualizarMotivoIngresoRequest
  ): Observable<ApiResponse<{ actualizado: boolean }>> {
    return this.http.post<ApiResponse<{ actualizado: boolean }>>(
      `${this.baseUrl}/actualizar-motivos-ingreso`, req);
  }

  obtenerValidacionesMotivoIngreso(
    req: ObtenerValidacionesMotivosIngresoRequest
  ): Observable<ApiResponse<DataDinamica>> {
    return this.http.post<ApiResponse<DataDinamica>>(
      `${this.baseUrl}/obtener-validaciones-motivos-ingreso`, req);
  }

  actualizarEstatusValidacion(
    req: ActualizarEstatusValidacionRequest
  ): Observable<ApiResponse<{ actualizado: boolean }>> {
    return this.http.post<ApiResponse<{ actualizado: boolean }>>(
      `${this.baseUrl}/actualizar-estatus-validacion`, req);
  }
}