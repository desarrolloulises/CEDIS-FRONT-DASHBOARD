// services/reasignacion.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
    ResumenReasignacion, 
    DetalleReasignacion, 
    ApiResponse, 
    FiltrosReasignacion, 
    DetalleLoteRequest 
} from '../interfaces/resumen-detalle.interface';
import { url } from '../../../../variables';

@Injectable({
    providedIn: 'root'
})
export class ReasignacionService {
    private readonly API_BASE_URL = url;

    constructor(private http: HttpClient) { }

    obtenerResumen(filtros: FiltrosReasignacion): Observable<ApiResponse<ResumenReasignacion>> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': '*/*'
        });

        return this.http.post<ApiResponse<ResumenReasignacion>>(
            `${this.API_BASE_URL}/cedis/consulta-reasignacion/obtener-resumen-reasignaciones`,
            filtros, 
            { headers }
        );
    }

    obtenerDetalle(request: DetalleLoteRequest): Observable<ApiResponse<DetalleReasignacion>> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': '*/*'
        });

        return this.http.post<ApiResponse<DetalleReasignacion>>(
            `${this.API_BASE_URL}/cedis/consulta-reasignacion/obtener-detalle-reasignaciones`,
            request, 
            { headers }
        );
    }
}