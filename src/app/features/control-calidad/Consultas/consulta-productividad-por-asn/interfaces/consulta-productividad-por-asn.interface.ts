export interface ColumnaDinamica {
  nombre: string;
  tipo: string;
  etiqueta?: string;
}

export interface FilaProductividadAsn {
  [key: string]: any;
}

export interface ConsultarProductividadAsnRequest {
  fechaInicio: string;   // dd-MM-yyyy o "" (sin filtro)
  fechaFin: string;      // dd-MM-yyyy o "" (sin filtro)
}

export interface ConsultarProductividadAsnResponse {
  success: boolean;
  error: string;
  code: string;
  data: {
    columnas: ColumnaDinamica[];
    filas: FilaProductividadAsn[];
  } | null;
}

/** Payload interno cuando ambas consultas terminan (forkJoin). */
export interface ProductividadAsnCombinado {
  detalle: ConsultarProductividadAsnResponse;
  totales: ConsultarProductividadAsnResponse;
}