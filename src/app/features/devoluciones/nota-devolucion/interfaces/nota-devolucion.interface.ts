export interface ColumnaDinamica {
  nombre: string;
  tipo: string;
}

export interface FilaDevolucion {
  [key: string]: any;
}

/** Payload dinámico compartido por consultar y agregar. */
export interface DevolucionesData {
  columnas: ColumnaDinamica[];
  filas: FilaDevolucion[];
}

export interface ConsultarDevolucionesRequest {
  idProveedor: number | null;
  fechaInicio: string | null;   // yyyy-MM-dd o null
  fechaFin: string | null;
  usuario: string;
}

export interface ConsultarDevolucionesResponse {
  success: boolean;
  error: string;
  code: string;
  data: DevolucionesData | null;
}

export interface ValidarProveedorNotaRequest {
  idProveedor: number;
  folioNota: number;
  usuario: string;
}

export interface ValidarProveedorNotaResponse {
  success: boolean;
  error: string;
  code: string;
  data: { esValido: boolean } | null;
}

export interface AgregarDevolucionRequest {
  idProveedor: number;
  folioNota: number;
  usuario: string;
}

export interface AgregarDevolucionResponse {
  success: boolean;
  error: string;
  code: string;
  data: DevolucionesData | null;   
}

export interface ActualizarEstatusRequest {
  folioNota: number;
  usuario: string;
}

export interface ActualizarEstatusResponse {
  success: boolean;
  error: string;
  code: string;
  data: { esActualizado: boolean } | null;
}