// src/app/services/validaciones-seguridad.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// validaciones-seguridad.service.ts
export interface ValidacionSeguridad {
  errId:                    number;
  errMsg:                   string;
  lblClaveValidacion:       string;
  lblDescripcionValidacion: string;
  estadoValidacion:         number;
}

export interface ToggleValidacionRequest {
  curp:    string;
  clave:   string;
  activa:  boolean;
  usuario: string;
}

@Injectable({ providedIn: 'root' })
export class ValidacionesSeguridadService {

  private readonly base = 'http://localhost:5242/cedis';

  constructor(private http: HttpClient) {}

  obtener(curp: string): Observable<ValidacionSeguridad[]> {
    return this.http.get<ValidacionSeguridad[]>(
      `${this.base}/validaciones-seguridad/${curp}`
    );
  }

  toggle(body: ToggleValidacionRequest): Observable<ValidacionSeguridad> {
    return this.http.put<ValidacionSeguridad>(
      `${this.base}/validaciones-seguridad`,
      body
    );
  }
}