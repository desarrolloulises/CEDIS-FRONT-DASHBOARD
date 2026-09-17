import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { url } from '../../../../variables';
import {
    ConsultaSeguridadRequest,
    ConsultaSeguridadResponse
} from '../interfaces/consulta-seguridad.interface';

@Injectable({ providedIn: 'root' })
export class ConsultaSeguridadService {

    private readonly endpoint =
        `${url}/cedis/consulta-control-acceso/obtener-resumen-seguridad`;

    constructor(private http: HttpClient) { }

    obtenerResumen(request: ConsultaSeguridadRequest):
        Observable<ConsultaSeguridadResponse> {
        return this.http.post<ConsultaSeguridadResponse>(this.endpoint, request);
    }
}