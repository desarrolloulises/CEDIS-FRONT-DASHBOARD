import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsultarRechazoGeneralRequest,
  ConsultarRechazoGeneralResponse
} from '../interfaces/consulta-rechazo-general.interface';
import { url } from '../../../../../variables';

@Injectable({ providedIn: 'root' })
export class RechazoGeneralService {
  private readonly baseUrl = `${url}/cedis/control-calidad`;

  constructor(private http: HttpClient) {}

  obtenerReporteRechazosGeneral(
    req: ConsultarRechazoGeneralRequest
  ): Observable<ConsultarRechazoGeneralResponse> {
    return this.http.post<ConsultarRechazoGeneralResponse>(
      `${this.baseUrl}/obtener-reporte-rechazos-general`, req);
  }
}