import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ElementoAdicionalResponse {
  errId: number;
  errMsg: string;
  lblId: string;
  lblClasifica: string;
  lblDescripcion: string;
  lblCantidad: string;
}

export interface NuevoElementoPayload {
  tipoElemento: string;
  descripcionElemento: string;
  cantidad: string;
  curp: string;
  usuario: string;
}

export interface ModificarElementoPayload {
  idElemento: string;
  tipoElemento: string;
  descripcionElemento: string;
  cantidad: string;
  curp: string;
  usuario: string;
}

@Injectable({ providedIn: 'root' })
export class ElementosAdicionalesService {

  private readonly base = 'http://localhost:5242/cedis/entrada-elementos-adicionales';

  constructor(private http: HttpClient) {}

  obtener(curp: string): Observable<ElementoAdicionalResponse[]> {
    return this.http.get<ElementoAdicionalResponse[]>(`${this.base}/${curp}`);
  }

  agregar(payload: NuevoElementoPayload): Observable<ElementoAdicionalResponse> {
    return this.http.post<ElementoAdicionalResponse>(this.base, payload);
  }

  modificar(payload: ModificarElementoPayload): Observable<ElementoAdicionalResponse> {
    return this.http.put<ElementoAdicionalResponse>(this.base, payload);
  }
}