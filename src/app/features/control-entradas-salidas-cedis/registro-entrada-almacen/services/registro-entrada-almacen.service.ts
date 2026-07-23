import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { url } from '../../../../variables';

import {
  ActualizarElementoAdicionalPayload,
  ActualizarIncidenciaPayload,
  ActualizarValidacionPayload,
  ActualizarValidacionResponse,
  AplicarVetoPayload,
  AplicarVetoResponse,
  CrearElementoAdicionalPayload,
  CrearIncidenciaPayload,
  ElementoAdicional,
  ElementoAdicionalResponse,
  Incidencia,
  IncidenciaResponse,
  NivelIncidenciaCatalogo,
  TipoVeto,
  ValidacionSeguridad,
  VetoExistente,
  ImagenInfo,
  EliminarImagenResponse
} from '../models/registro-entrada-almacen.models';

@Injectable({ providedIn: 'root' })
export class RegistroEntradaAlmacenService {

  private readonly baseUrl = `${url}/cedis`;

  constructor(private http: HttpClient) { }

  /////////////////////////////////////////
  //   Validaciones de seguridad
  /////////////////////////////////////////

  obtenerValidaciones(curp: string): Observable<ValidacionSeguridad[]> {
    return this.http.get<ValidacionSeguridad[]>(
      `${this.baseUrl}/validaciones-seguridad/${curp}`
    );
  }

  actualizarValidacion(
    payload: ActualizarValidacionPayload
  ): Observable<ActualizarValidacionResponse> {
    return this.http.put<ActualizarValidacionResponse>(
      `${this.baseUrl}/validaciones-seguridad`,
      payload
    );
  }

  /////////////////////////////////////////
  //            Vetos
  /////////////////////////////////////////
  obtenerCatalogoTiposVeto(): Observable<TipoVeto[]> {
    return this.http.get<TipoVeto[]>(`${this.baseUrl}/vetos/catalogo-tipos-veto`);
  }

  obtenerVetoPorCurp(curp: string): Observable<VetoExistente> {
    return this.http.get<VetoExistente>(`${this.baseUrl}/vetos`, {
      params: { curp }
    });
  }

  aplicarVeto(payload: AplicarVetoPayload): Observable<AplicarVetoResponse> {
    return this.http.post<AplicarVetoResponse>(`${this.baseUrl}/vetos`, payload);
  }

  /////////////////////////////////////////
  //            Incidencias
  /////////////////////////////////////////
  obtenerIncidencias(curp: string): Observable<Incidencia[]> {
    return this.http.get<Incidencia[]>(`${this.baseUrl}/incidencias/${curp}`);
  }

  obtenerCatalogoNiveles(): Observable<NivelIncidenciaCatalogo[]> {
    return this.http.get<NivelIncidenciaCatalogo[]>(
      `${this.baseUrl}/incidencias/catalogo-niveles`
    );
  }

  crearIncidencia(payload: CrearIncidenciaPayload): Observable<IncidenciaResponse> {
    return this.http.post<IncidenciaResponse>(`${this.baseUrl}/incidencias`, payload);
  }

  actualizarIncidencia(payload: ActualizarIncidenciaPayload): Observable<IncidenciaResponse> {
    return this.http.put<IncidenciaResponse>(`${this.baseUrl}/incidencias`, payload);
  }

  /////////////////////////////////////////
  //   Otros: Elementos adicionales de entrada
  /////////////////////////////////////////

  obtenerElementosAdicionales(curp: string): Observable<ElementoAdicional[]> {
    return this.http.get<ElementoAdicional[]>(
      `${this.baseUrl}/entrada-elementos-adicionales/${curp}`
    );
  }

  crearElementoAdicional(
    payload: CrearElementoAdicionalPayload
  ): Observable<ElementoAdicionalResponse> {
    return this.http.post<ElementoAdicionalResponse>(
      `${this.baseUrl}/entrada-elementos-adicionales`,
      payload
    );
  }

  actualizarElementoAdicional(
    payload: ActualizarElementoAdicionalPayload
  ): Observable<ElementoAdicionalResponse> {
    return this.http.put<ElementoAdicionalResponse>(
      `${this.baseUrl}/entrada-elementos-adicionales`,
      payload
    );
  }

  /////////////////////////////////////////
  //              Imagenes
  /////////////////////////////////////////

  obtenerImagenInfo(curp: string): Observable<ImagenInfo> {
    return this.http.post<ImagenInfo>(`${this.baseUrl}/obtener-imagen/${curp}`, null);
  }

  obtenerImagenBinario(curp: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/imagen/${curp}`, null, {
      responseType: 'blob'
    });
  }

  subirImagen(curp: string, archivo: File): Observable<ImagenInfo> {
    const formData = new FormData();
    formData.append('CURP', curp);
    formData.append('archivo', archivo, archivo.name);
    return this.http.post<ImagenInfo>(`${this.baseUrl}/subir-imagen`, formData);
  }

  actualizarImagen(curp: string, archivo: File): Observable<ImagenInfo> {
    const formData = new FormData();
    formData.append('CURP', curp);
    formData.append('archivo', archivo, archivo.name);
    return this.http.put<ImagenInfo>(`${this.baseUrl}/imagen`, formData);
  }

  eliminarImagenPorCurp(curp: string): Observable<EliminarImagenResponse> {
    return this.http.delete<EliminarImagenResponse>(`${this.baseUrl}/imagen/${curp}`);
  }
}