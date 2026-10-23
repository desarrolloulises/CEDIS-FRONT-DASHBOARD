import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsultarDevolucionesRequest, ConsultarDevolucionesResponse,
  ValidarProveedorNotaRequest, ValidarProveedorNotaResponse,
  AgregarDevolucionRequest, AgregarDevolucionResponse,
  ActualizarEstatusRequest, ActualizarEstatusResponse
} from '../interfaces/nota-devolucion.interface';
import { url } from '../../../../variables';


@Injectable({ providedIn: 'root' })
export class DevolucionService {
  private readonly baseUrl = `${url}/cedis/devolucion`;

  constructor(private http: HttpClient) {}

  consultarDevoluciones(req: ConsultarDevolucionesRequest): Observable<ConsultarDevolucionesResponse> {
    return this.http.post<ConsultarDevolucionesResponse>(
      `${this.baseUrl}/consultar-devoluciones`, req);
  }

  validarProveedorNota(req: ValidarProveedorNotaRequest): Observable<ValidarProveedorNotaResponse> {
    return this.http.post<ValidarProveedorNotaResponse>(
      `${this.baseUrl}/validar-proveedor-nota`, req);
  }

  agregarDevolucion(req: AgregarDevolucionRequest): Observable<AgregarDevolucionResponse> {
    return this.http.post<AgregarDevolucionResponse>(
      `${this.baseUrl}/agregar-devolucion`, req);
  }

  actualizarEstatus(req: ActualizarEstatusRequest): Observable<ActualizarEstatusResponse> {
    return this.http.post<ActualizarEstatusResponse>(
      `${this.baseUrl}/actualizar-estatus-devolucion`, req);
  }
}