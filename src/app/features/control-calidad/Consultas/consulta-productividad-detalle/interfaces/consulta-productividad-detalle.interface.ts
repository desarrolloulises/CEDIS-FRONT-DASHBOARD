export interface ColumnaDinamica {
  nombre: string;
  tipo: string;
  /** Etiqueta amigable para mostrar en UI/exportación (opcional). */
  etiqueta?: string;
}

export interface FilaProductividadDetalle {
  [key: string]: any;
}

export interface ConsultarProductividadDetalleRequest {
  fechaInicio: string;   // dd-MM-yyyy o "" (sin filtro)
  fechaFin: string;      // dd-MM-yyyy o "" (sin filtro)
}

export interface ConsultarProductividadDetalleResponse {
  success: boolean;
  error: string;
  code: string;
  data: {
    columnas: ColumnaDinamica[];
    filas: FilaProductividadDetalle[];
  } | null;
}