import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RespuestaApi, GenerarFolioResponse, DatosFolioResponse, CambioSolicitud, GuardarSolicitudResponse, ValidarSolicitudResponse, ConfirmarSolicitudResponse } from '../interface/reagenda-citas.interface';


@Injectable({ providedIn: 'root' })
export class ReagendaCitasService {

    private readonly baseUrl = 'http://192.168.102.81:5242/cedis/cancelaciones';
    private http = inject(HttpClient);

    // 1. Generar folio
    generarFolio(usuario: string): Observable<RespuestaApi<GenerarFolioResponse>> {
        return this.http.post<RespuestaApi<GenerarFolioResponse>>(
            `${this.baseUrl}/obtener-folio-cambio-fecha-cita`,
            { usuario }
        );
    }

    // 2. Consultar datos del folio
    consultarDatosFolio(folio: number, usuario: string):
        Observable<RespuestaApi<DatosFolioResponse>> {
        return this.http.post<RespuestaApi<DatosFolioResponse>>(
            `${this.baseUrl}/obtener-datos-folio-cambio-fecha-cita`,
            { folio, usuario }
        );
    }

    // 3. Guardar solicitud (importación)
    guardarSolicitud(folio: number, usuario: string, cambios: CambioSolicitud[]):
        Observable<RespuestaApi<GuardarSolicitudResponse>> {
        return this.http.post<RespuestaApi<GuardarSolicitudResponse>>(
            `${this.baseUrl}/guardar-solicitud-cambio-cita`,
            { folio, usuario, cambios }
        );
    }

    // 4. Validar solicitudes
    validarSolicitudes(folio: number, usuario: string):
        Observable<RespuestaApi<ValidarSolicitudResponse>> {
        return this.http.post<RespuestaApi<ValidarSolicitudResponse>>(
            `${this.baseUrl}/validar-solicitudes-cambio-fecha-cita`,
            { folio, usuario }
        );
    }

    // 5. Confirmar y aplicar cambios
    confirmarCambios(folio: number, usuario: string):
        Observable<RespuestaApi<ConfirmarSolicitudResponse>> {
        return this.http.post<RespuestaApi<ConfirmarSolicitudResponse>>(
            `${this.baseUrl}/confirmar-aplicar-cambio-fecha-cita`,
            { folio, usuario }
        );
    }
}