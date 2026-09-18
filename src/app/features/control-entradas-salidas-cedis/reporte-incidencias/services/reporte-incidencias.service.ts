// services/reporte-incidencias.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { url } from '../../../../variables';
import {
    ReporteIncidenciasRequest,
    ReporteIncidenciasResponse
} from '../interfaces/reporte-incidencias.interface';

@Injectable({ providedIn: 'root' })
export class ReporteIncidenciasService {

    private readonly endpoint =
        `${url}/cedis/consulta-control-accesos/obtener-resumen-incidencias`;

    constructor(private http: HttpClient) { }

    obtenerResumen(request: ReporteIncidenciasRequest):
        Observable<ReporteIncidenciasResponse> {
        return this.http.post<ReporteIncidenciasResponse>(this.endpoint, request);
    }
}