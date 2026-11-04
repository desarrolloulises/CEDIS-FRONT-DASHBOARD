export interface ColumnaDinamica {
  nombre: string;
  tipo: string;
  /** Etiqueta amigable para mostrar en UI/exportación (opcional). */
  etiqueta?: string;
}

export interface FilaRechazoDetalle {
  [key: string]: any;
}

export interface ConsultarRechazoDetalleRequest {
  fechaInicio: string;   // dd-MM-yyyy o "" (sin filtro)
  fechaFin: string;      // dd-MM-yyyy o "" (sin filtro)
}

export interface ConsultarRechazoDetalleResponse {
  success: boolean;
  error: string;
  code: string;
  data: {
    columnas: ColumnaDinamica[];
    filas: FilaRechazoDetalle[];
  } | null;
}