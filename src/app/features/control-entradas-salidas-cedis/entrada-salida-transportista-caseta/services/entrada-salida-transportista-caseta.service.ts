import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ITransportista,
  ITipoIngreso,
  ITipoUnidad,
  IAltaTransportistaRequest,
  IAltaTransportistaResponse,
  IRegistroAccesoRequest,
  IRegistroAccesoResponse,
  IModificarTransportistaRequest,
  IModificarTransportistaResponse,
  IRegistrarQrRequest,
  IRegistrarQrResponse,
  IValidarCurpRequest,
  IValidarCurpResponse,
  IApiErrorResponse
} from '../models/entrada-salida-transportista-caseta.model';

const API_URL = 'http://192.168.102.81:5242/cedis/transportistas';

@Injectable({
  providedIn: 'root'
})
export class TransportistaService {

  private http = inject(HttpClient);

  getEntradas(): Observable<ITransportista[]> {

    return this.http.get<ITransportista[]>(API_URL);
  }

  obtenerTiposIngreso():
    Observable<ITipoIngreso[]> {

    return this.http.get<ITipoIngreso[]>(
      `${API_URL}/tipos-ingreso`
    );
  }

  altaTransportista(
    body: IAltaTransportistaRequest
  ): Observable<IAltaTransportistaResponse> {

    return this.http.post<IAltaTransportistaResponse>(
      `${API_URL}/alta`,
      body
    );
  }

  getProveedor(
    id: number
  ): Observable<
    { razon_social: string } | IApiErrorResponse
  > {

    return this.http.get<
      { razon_social: string } | IApiErrorResponse
    >(
      `${API_URL}/proveedor/${id}`
    );
  }

  registrarQr(
    body: IRegistrarQrRequest
  ): Observable<IRegistrarQrResponse> {

    return this.http.post<IRegistrarQrResponse>(
      `${API_URL}/registrar-qr`,
      body
    );
  }

  obtenerTiposUnidad():
    Observable<ITipoUnidad[]> {

    return this.http.get<ITipoUnidad[]>(
      `${API_URL}/tipos-unidad`
    );
  }

  getOperadorPorCurp(
    curp: string
  ): Observable<
    {
      curp: string;
      nombre: string;
      paterno: string;
      materno: string;
    } | IApiErrorResponse
  > {

    return this.http.get<
      {
        curp: string;
        nombre: string;
        paterno: string;
        materno: string;
      } | IApiErrorResponse
    >(
      `${API_URL}/operador/${curp}`
    );
  }

  registrarEntrada(
    body: IRegistroAccesoRequest
  ): Observable<IRegistroAccesoResponse> {

    return this.http.post<IRegistroAccesoResponse>(
      `${API_URL}/registrar-entrada`,
      body
    );
  }

  registrarSalida(
    body: IRegistroAccesoRequest
  ): Observable<IRegistroAccesoResponse> {

    return this.http.post<IRegistroAccesoResponse>(
      `${API_URL}/registrar-salida`,
      body
    );
  }

  modificarTransportista(
    body: IModificarTransportistaRequest
  ): Observable<IModificarTransportistaResponse> {

    return this.http.put<IModificarTransportistaResponse>(
      `${API_URL}/modificar`,
      body
    );
  }

  validarCurp(
    body: IValidarCurpRequest
  ): Observable<IValidarCurpResponse> {

    return this.http.post<IValidarCurpResponse>(
      `${API_URL}/validar-curp`,
      body
    );
  }

}




