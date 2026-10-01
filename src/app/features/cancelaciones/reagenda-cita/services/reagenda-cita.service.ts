import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { url } from '../../../../variables';

// ─────────────────────────────────────────────────────────────────
// Tipos base (compartidos con el componente)
// ─────────────────────────────────────────────────────────────────

export interface ApiColumna {
  nombre: string;
  tipo: string;
}

export interface ApiResponse<T> {
  success: boolean;
  error: string;
  code: string;
  data: T | null;
}

export interface ReagendaData {
  columnas: ApiColumna[];
  filas: Record<string, unknown>[];
}

export interface ConfirmarReagendaData {
  citaActualizada: boolean;
}

// ─────────────────────────────────────────────────────────────────
// Requests
// ─────────────────────────────────────────────────────────────────

export interface ValidarAsnRequest {
  asn: number;
  usuario: string;
}

export interface ActualizarFechaCitaRequest {
  asn: number;
  fechaSolicitada: string; // dd-MM-yyyy
  usuario: string;
}

// ─────────────────────────────────────────────────────────────────
// Servicio
// ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ReagendaCitaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${url}/cedis/cancelaciones`;

  validarAsn(
    req: ValidarAsnRequest
  ): Observable<ApiResponse<ReagendaData>> {
    return this.http.post<ApiResponse<ReagendaData>>(
      `${this.baseUrl}/validar-asn`,
      req
    );
  }

  actualizarFechaCita(
    req: ActualizarFechaCitaRequest
  ): Observable<ApiResponse<ConfirmarReagendaData>> {
    return this.http.post<ApiResponse<ConfirmarReagendaData>>(
      `${this.baseUrl}/actualizar-fecha-cita`,
      req
    );
  }
}