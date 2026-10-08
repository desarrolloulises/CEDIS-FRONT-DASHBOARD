export interface RespuestaApi<T = any> {
    success: boolean;
    error: string;
    code: string;
    data: T | null;
}

export interface GenerarFolioResponse {
    folio: number;
}

export interface DatosFolioItem {
    ASN: number;
    FechaCita: string;
    Cita: number;
    FechaSubida: string;
    Observaciones: string;
    EstatusValidacion: number; // 1 = no válido, 2 = válido
}

export interface DatosFolioResponse {
    folio: number;
    estatusEnc: number; // 0 = editable, 3 = confirmado
    jsalida: DatosFolioItem[];
}

export interface GuardarSolicitudResponse {
    guardado: boolean;
}

export interface ValidarSolicitudResponse {
    validado: boolean;
}

export interface ConfirmarSolicitudResponse {
    confirmado: boolean;
}

export interface CambioSolicitud {
    asn: number;
    fechaNueva: string; // YYYY-MM-DD
}
