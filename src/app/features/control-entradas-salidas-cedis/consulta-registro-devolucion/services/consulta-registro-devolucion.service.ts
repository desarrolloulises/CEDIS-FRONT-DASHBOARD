import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { url } from '../../../../variables';
import {
    ConsultaRegistroDevolucionRequest,
    ConsultaRegistroDevolucionResponse
} from '../interfaces/consulta-registro-devolucion.interface';

@Injectable({ providedIn: 'root' })
export class ConsultaRegistroDevolucionService {

    private readonly endpoint =
        `${url}/cedis/consulta-entrega-devolucion/obtener-resumen-registro-devolucion`;

    constructor(private http: HttpClient) { }

    obtenerResumen(request: ConsultaRegistroDevolucionRequest):
        Observable<ConsultaRegistroDevolucionResponse> {
        return this.http.post<ConsultaRegistroDevolucionResponse>(this.endpoint, request);
    }
}