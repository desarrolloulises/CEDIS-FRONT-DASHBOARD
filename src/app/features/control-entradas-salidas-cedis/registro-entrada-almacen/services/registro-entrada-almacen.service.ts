import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
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
  EliminarImagenResponse,
  Visitante,
  MotivoVisita,
  Area,
  RazonSocialProveedor,
  DatosVisitante,
  TipoUnidad,
  ValidarCurpResponse,
  ActualizarVisitantePayload,
  ConsultarVisitantesPayload,
  ConsultarAreasPayload,
  ConsultarRazonSocialPayload,
  ConsultarTiposUnidadPayload,
  ConsultarDatosVisitantePayload,
  ValidarCurpPayload
} from '../models/registro-entrada-almacen.models';

@Injectable({ providedIn: 'root' })
export class RegistroEntradaAlmacenService {

  private readonly baseUrl = `${url}/cedis`;
  private readonly timeoutMs = 5000;

  constructor(private http: HttpClient) { }

  /////////////////////////////////////////
  //   Visitantes
  /////////////////////////////////////////

  consultarVisitantes(payload: ConsultarVisitantesPayload): Observable<Visitante[]> {
    return this.http.post<Visitante[]>(`${this.baseUrl}/visitantes`, payload)
      .pipe(
        timeout(this.timeoutMs),
        catchError(this.handleError)
      );
  }

  obtenerMotivosVisita(payload: ConsultarVisitantesPayload): Observable<MotivoVisita[]> {
    return this.http.post<MotivoVisita[]>(`${this.baseUrl}/visitante/motivos-visita`, payload)
      .pipe(
        timeout(this.timeoutMs),
        catchError(this.handleError)
      );
  }

  obtenerAreas(payload: ConsultarAreasPayload): Observable<Area[]> {
    return this.http.post<Area[]>(`${this.baseUrl}/visitante/areas`, payload)
      .pipe(
        timeout(this.timeoutMs),
        catchError(this.handleError)
      );
  }

  obtenerRazonSocialProveedor(payload: ConsultarRazonSocialPayload): Observable<RazonSocialProveedor> {
    return this.http.post<RazonSocialProveedor>(`${this.baseUrl}/visitante/razon-social-proveedor`, payload)
      .pipe(
        timeout(this.timeoutMs),
        catchError(this.handleError)
      );
  }

  obtenerDatosVisitante(payload: ConsultarDatosVisitantePayload): Observable<DatosVisitante> {
    return this.http.post<DatosVisitante>(`${this.baseUrl}/visitante/datos-visitante`, payload)
      .pipe(
        timeout(this.timeoutMs),
        catchError(this.handleError)
      );
  }

  obtenerTiposUnidad(payload: ConsultarTiposUnidadPayload): Observable<TipoUnidad[]> {
    return this.http.post<TipoUnidad[]>(`${this.baseUrl}/visitante/tipos-unidad`, payload)
      .pipe(
        timeout(this.timeoutMs),
        catchError(this.handleError)
      );
  }

  actualizarVisitante(payload: ActualizarVisitantePayload): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/visitante`, payload)
      .pipe(
        timeout(this.timeoutMs),
        catchError(this.handleError)
      );
  }

  validarCurp(payload: ValidarCurpPayload): Observable<ValidarCurpResponse> {
    return this.http.post<ValidarCurpResponse>(`${this.baseUrl}/visitante/validar-curp`, payload)
      .pipe(
        timeout(this.timeoutMs),
        catchError(this.handleError)
      );
  }

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
    return this.http.get<TipoVeto[]>(`${this.baseUrl}/vetos/catalogo-tipos-veto`)
      .pipe(
        timeout(this.timeoutMs),
        catchError(this.handleError)
      );
  }


  obtenerVetoPorCurp(curp: string): Observable<VetoExistente> {
    return this.http.get<VetoExistente>(`${this.baseUrl}/vetos`, {
      params: { curp }
    }).pipe(
      timeout(this.timeoutMs),
      catchError(this.handleError)
    );
  }

  aplicarVeto(payload: AplicarVetoPayload): Observable<AplicarVetoResponse> {
    return this.http.post<AplicarVetoResponse>(`${this.baseUrl}/vetos`, payload)
      .pipe(
        timeout(this.timeoutMs),
        catchError(this.handleError)
      );
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
    return this.http.post<ImagenInfo>(`${this.baseUrl}/obtener-imagen/${curp}`, null)
      .pipe(
        timeout(this.timeoutMs),
        catchError(this.handleError)
      );
  }

  obtenerImagenBinario(curp: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/imagen/${curp}`, null, {
      responseType: 'blob'
    }).pipe(
      timeout(this.timeoutMs),
      catchError(this.handleError)
    );
  }

  subirImagen(curp: string, archivo: File): Observable<ImagenInfo> {
    const formData = new FormData();
    formData.append('CURP', curp);
    formData.append('archivo', archivo, archivo.name);
    return this.http.post<ImagenInfo>(`${this.baseUrl}/subir-imagen`, formData)
      .pipe(
        timeout(this.timeoutMs),
        catchError(this.handleError)
      );
  }

  actualizarImagen(curp: string, archivo: File): Observable<ImagenInfo> {
    const formData = new FormData();
    formData.append('CURP', curp);
    formData.append('archivo', archivo, archivo.name);
    return this.http.put<ImagenInfo>(`${this.baseUrl}/imagen`, formData)
      .pipe(
        timeout(this.timeoutMs),
        catchError(this.handleError)
      );
  }

  eliminarImagenPorCurp(curp: string): Observable<EliminarImagenResponse> {
    return this.http.delete<EliminarImagenResponse>(`${this.baseUrl}/imagen/${curp}`)
      .pipe(
        timeout(this.timeoutMs),
        catchError(this.handleError)
      );
  }


  /////////////////////////////////////////
  //              Errores
  /////////////////////////////////////////

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Error desconocido';

    if (error instanceof TimeoutError) {
      errorMessage = 'La petición excedió el tiempo de espera';
    } else if (error.status === 404) {
      errorMessage = 'No se encontró el recurso solicitado';
    } else if (error.status === 400) {
      errorMessage = 'Solicitud inválida';
    } else if (error.status === 500) {
      errorMessage = 'Error interno del servidor';
    } else if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    //console.error('Error en la petición:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}