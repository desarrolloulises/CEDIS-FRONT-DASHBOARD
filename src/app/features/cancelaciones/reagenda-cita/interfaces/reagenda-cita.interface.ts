// interfaces/reagenda-cita.interface.ts

export interface ColumnaDinamica {
    nombre: string;
    tipo: string;
}

export interface ReagendaCitaRequest {
    folio: number;
    usuario: string;
}

export interface ReagendaCitaResponse {
    success: boolean;
    error: string;
    code: string;
    data: {
        columnas: ColumnaDinamica[];
        filas: Record<string, any>[];
    } | null;
}