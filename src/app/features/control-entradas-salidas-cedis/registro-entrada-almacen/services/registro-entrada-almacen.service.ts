import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  VetoExistente
} from '../models/registro-entrada-almacen.models';

@Injectable({ providedIn: 'root' })
export class RegistroEntradaAlmacenService {

  // TODO: mover a environment.apiUrl cuando se tenga configurado por ambiente
  private readonly baseUrl = 'http://localhost:8081/cedis';

  constructor(private http: HttpClient) {}

  // ─────────────────────────────────────────────────────────
  // Validaciones de seguridad
  // ─────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────
  // Vetos
  // ─────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────
  // Incidencias
  // ─────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────
  // Otros: elementos adicionales de entrada
  // ─────────────────────────────────────────────────────────

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
}