import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
    DetallePallet, 
    ApiResponse, 
    DetallePalletRequest 
} from '../interfaces/detalle-pallet.interface';
import { url } from '../../../../variables';

@Injectable({
    providedIn: 'root'
})
export class DetallePalletService {
    private readonly API_BASE_URL = url;

    constructor(private http: HttpClient) { }

    /**
     * Obtiene el detalle de pallets según los parámetros de búsqueda
     */
    obtenerDetallePallets(request: DetallePalletRequest): Observable<ApiResponse<DetallePallet>> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': '*/*'
        });

        return this.http.post<ApiResponse<DetallePallet>>(
            `${this.API_BASE_URL}/cedis/consulta-reasignacion/obtener-detalle-pallets`, 
            request, 
            { headers }
        );
    }
}