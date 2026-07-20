import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { url } from '../../../../variables';

export interface IncidenciaResponse {
  errId:          number;
  errMsg:         string;
  lblId:          string;
  lblFecha:       string;
  lblClaveNivel:  string;
  lblDescripcionNivel:    string;
  lblDescripcion: string;
  lblColor:  string; 
}

export interface AgregarIncidenciaRequest {
  CURP:        string;
  Nivel:       string;
  Descripcion: string;
  Usuario:     string;
}

export interface ModificarIncidenciaRequest {
  Id:          number;
  CURP:        string;
  Nivel:       string;
  Descripcion: string;
}

@Injectable({ providedIn: 'root' })
export class IncidenciasService {

  private readonly base = `${url}/cedis`;

  constructor(private http: HttpClient) {}

  /**
   * tipo 1 — Historial de incidencias de un visitante por CURP.
   * El SP devuelve un result-set con N filas → Array.
   */
  obtener(curp: string): Observable<IncidenciaResponse[]> {
    return this.http.get<IncidenciaResponse[]>(`${this.base}/incidencias/${curp}`);
  }

  /**
   * tipo 2 — Agrega una nueva incidencia.
   * La fecha la asigna el servidor (getdate()), no se envía desde el front.
   * El SP devuelve una sola fila con el resultado → Objeto único.
   */
  agregar(body: AgregarIncidenciaRequest): Observable<IncidenciaResponse> {
    return this.http.post<IncidenciaResponse>(`${this.base}/incidencias`, body);
  }

  /**
   * tipo 3 — Modifica nivel y descripción de una incidencia existente.
   * Requiere el Id interno del registro.
   * El SP devuelve una sola fila con el resultado → Objeto único.
   */
  modificar(body: ModificarIncidenciaRequest): Observable<IncidenciaResponse> {
    return this.http.put<IncidenciaResponse>(`${this.base}/incidencias`, body);
  }

  /**
   * tipo 4 — Catálogo de niveles de incidencia (TTablaGeneral, fgrupo=20).
   * Se usa para poblar el select de nivel en el formulario.
   * lbl_DesNivel  → clave numérica del nivel (FSubGrupo)
   * lbl_Descripcion → descripción del nivel (FDesSubGrupo)
   */
  obtenerNiveles(): Observable<IncidenciaResponse[]> {
    return this.http.get<IncidenciaResponse[]>(`${this.base}/incidencias/catalogo-niveles`);
  }
}