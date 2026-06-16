import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TipoVetoResponse {
  errId: number;
  errMsg: string;
  lblTipoVeto: string;
  lblDescripcionTipoVeto: string;
  lblFechaInicio: string;
  lblFechaTermino: string;
  lblDiasRestantes: string;
}

export interface VetoPayload {
  curp: string;
  tipoVeto: string;
  fechaInicio: string;
  fechaTermino: string;
  usuario: string;
}

@Injectable({ providedIn: 'root' })
export class VetoService {
  private base = 'http://localhost:5242/cedis/vetos';

  constructor(private http: HttpClient) {}

  obtenerTiposVeto(): Observable<TipoVetoResponse[]> {
    return this.http.get<TipoVetoResponse[]>(`${this.base}/catalogo-tipos-veto`);
  }

  consultarVeto(curp: string): Observable<TipoVetoResponse> {
    return this.http.get<TipoVetoResponse>(`${this.base}?curp=${curp}`);
  }

  guardarVeto(payload: VetoPayload): Observable<TipoVetoResponse> {
    return this.http.post<TipoVetoResponse>(this.base, payload);
  }
}