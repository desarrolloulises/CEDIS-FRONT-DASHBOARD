import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsultarListaRechazosAsnRequest,
  ConsultarListaRechazosAsnResponse,
  ObtenerCatalogoOpcionesRequest,
  ObtenerCatalogoOpcionesResponse,
  DeshacerRechazoAsnRequest,
  DeshacerRechazoAsnResponse
} from '../interfaces/deshacer-rechazo.interface';
import { url } from '../../../../variables';

@Injectable({ providedIn: 'root' })
export class DeshacerRechazoService {
  private readonly baseUrl = `${url}/cedis/control-calidad`;

  constructor(private http: HttpClient) {}

  consultarListaRechazosAsn(
    req: ConsultarListaRechazosAsnRequest
  ): Observable<ConsultarListaRechazosAsnResponse> {
    return this.http.post<ConsultarListaRechazosAsnResponse>(
      `${this.baseUrl}/consultar-lista-rechazos-asn`, req);
  }

  obtenerCatalogoOpcionesAutorizacion(
    req: ObtenerCatalogoOpcionesRequest
  ): Observable<ObtenerCatalogoOpcionesResponse> {
    return this.http.post<ObtenerCatalogoOpcionesResponse>(
      `${this.baseUrl}/obtener-catalogo-opciones-autorizacion-dehacer-rechazos-asn`, req);
  }

  deshacerRechazoAsn(
    req: DeshacerRechazoAsnRequest
  ): Observable<DeshacerRechazoAsnResponse> {
    return this.http.post<DeshacerRechazoAsnResponse>(
      `${this.baseUrl}/dehacer-rechazo-asn`, req);
  }
}