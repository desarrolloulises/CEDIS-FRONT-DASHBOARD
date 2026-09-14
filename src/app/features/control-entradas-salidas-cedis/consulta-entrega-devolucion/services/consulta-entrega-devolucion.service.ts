import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { url } from '../../../../variables';
import {
    ConsultaEntregaDevolucionRequest,
    ConsultaEntregaDevolucionResponse
} from '../interfaces/consulta-entrega-devolucion.interface';

@Injectable({ providedIn: 'root' })
export class ConsultaEntregaDevolucionService {

    private readonly endpoint =
        `${url}/cedis/consulta-entrega-devolucion/obtener-resumen-entrega-devolucion`;

    constructor(private http: HttpClient) { }

    obtenerResumen(request: ConsultaEntregaDevolucionRequest):
        Observable<ConsultaEntregaDevolucionResponse> {
        return this.http.post<ConsultaEntregaDevolucionResponse>(this.endpoint, request);
    }
}