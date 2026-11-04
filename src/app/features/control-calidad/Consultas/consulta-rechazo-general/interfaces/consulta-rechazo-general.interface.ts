export interface ColumnaDinamica {
  nombre: string;
  tipo: string;
  /** Etiqueta amigable para mostrar en UI/exportación (opcional). */
  etiqueta?: string;
}

export interface FilaRechazoGeneral {
  [key: string]: any;
}

export interface ConsultarRechazoGeneralRequest {
  fechaInicio: string;   // dd-MM-yyyy o "" (sin filtro)
  fechaFin: string;      // dd-MM-yyyy o "" (sin filtro)
}

export interface ConsultarRechazoGeneralResponse {
  success: boolean;
  error: string;
  code: string;
  data: {
    columnas: ColumnaDinamica[];
    filas: FilaRechazoGeneral[];
  } | null;
}