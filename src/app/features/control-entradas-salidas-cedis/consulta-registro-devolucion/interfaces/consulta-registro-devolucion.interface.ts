export interface ColumnaDinamica {
    nombre: string;
    tipo: string; // 'String' | 'DateTime' | 'TimeSpan' | 'Int16' | 'Int32' | ...
}

export interface ConsultaRegistroDevolucionRequest {
    fecha_inicio: string | null;
    fecha_fin: string | null;
    usuario: string;
}

export interface ConsultaRegistroDevolucionResponse {
    success: boolean;
    error: string;
    code: string;
    data: {
        columnas: ColumnaDinamica[];
        filas: Record<string, any>[];
    } | null;
}