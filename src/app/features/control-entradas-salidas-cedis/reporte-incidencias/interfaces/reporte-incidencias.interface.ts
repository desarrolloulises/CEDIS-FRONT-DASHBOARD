export interface ColumnaDinamica {
    nombre: string;
    tipo: string; // 'String' | 'DateTime' | 'TimeSpan' | 'Int16' | 'Int32' | ...
}

export interface ReporteIncidenciasRequest {
    fecha_inicio: string | null;
    fecha_fin: string | null;
    usuario: string;
}

export interface ReporteIncidenciasResponse {
    success: boolean;
    error: string;
    code: string;
    data: {
        columnas: ColumnaDinamica[];
        filas: Record<string, any>[];
    } | null;
}