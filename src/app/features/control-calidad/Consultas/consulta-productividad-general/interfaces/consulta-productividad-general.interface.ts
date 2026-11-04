export interface ColumnaDinamica {
  nombre: string;
  tipo: string;
  /** Etiqueta amigable para mostrar en UI/exportación (opcional). */
  etiqueta?: string;
}

export interface FilaProductividad {
  [key: string]: any;
}

export interface ConsultarProductividadRequest {
  fechaInicio: string | null;   // dd-MM-yyyy o null
  fechaFin: string | null;      // dd-MM-yyyy o null
}

export interface ConsultarProductividadResponse {
  success: boolean;
  error: string;
  code: string;
  data: {
    columnas: ColumnaDinamica[];
    filas: FilaProductividad[];
  } | null;
}