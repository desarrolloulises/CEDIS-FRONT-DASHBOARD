export interface ColumnaDinamica {
  nombre: string;
  tipo: string;
  /** Etiqueta amigable para mostrar en UI/exportación (opcional). */
  etiqueta?: string;
}

export interface FilaMotivoRechazo {
  [key: string]: any;
}

export interface ConsultarMotivosRechazoRequest {
  fechaInicio: string;   // dd-MM-yyyy o "" (sin filtro)
  fechaFin: string;      // dd-MM-yyyy o "" (sin filtro)
}

export interface ConsultarMotivosRechazoResponse {
  success: boolean;
  error: string;
  code: string;
  data: {
    columnas: ColumnaDinamica[];
    filas: FilaMotivoRechazo[];
  } | null;
}