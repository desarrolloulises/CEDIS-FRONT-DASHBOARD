export interface ColumnaDinamica {
  nombre: string;
  tipo: string;
  etiqueta?: string;
}

export interface FilaRechazoAsn {
  [key: string]: any;
}

// ── Consulta de rechazos ────────────────────────────────────────
export interface ConsultarListaRechazosAsnRequest {
  fechaInicial: string;   // yyyy-MM-dd
  fechaFinal: string;     // yyyy-MM-dd
  usuario: number;
}

export interface ConsultarListaRechazosAsnResponse {
  success: boolean;
  error: string;
  code: string;
  data: {
    columnas: ColumnaDinamica[];
    filas: FilaRechazoAsn[];
  } | null;
}

// ── Catálogo de autorizaciones ──────────────────────────────────
export interface OpcionAutorizacion {
  idAutorizacion: number;
  descripcionAutorizacion: string;
}

export interface ObtenerCatalogoOpcionesRequest {
  usuario: number;
}

export interface ObtenerCatalogoOpcionesResponse {
  success: boolean;
  error: string;
  code: string;
  data: { opcionesAutorizacion: OpcionAutorizacion[] } | null;
}

// ── Deshacer rechazo ────────────────────────────────────────────
export interface DeshacerRechazoAsnRequest {
  asn: number;
  idInspeccion: number;
  idAutorizacion: number;
  comentario: string;
  usuario: number;
}

export interface DeshacerRechazoAsnResponse {
  success: boolean;
  error: string;
  code: string;
  data: { seAplico: boolean } | null;
}