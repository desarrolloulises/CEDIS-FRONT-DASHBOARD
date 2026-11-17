export interface TipoEntrada {
  idTipoEntrada: number;
  descripcionTipoEntrada: string;
  /** 0 = solo lectura · 1 = editable (viene de `Bandera`) */
  tipoEntrada: 0 | 1;
}

export interface TipoIngreso {
  clave: number;
  descripcion: string;
  estatus: boolean;
}

export interface Validacion {
  clave: number;
  descripcion: string;
  estatus: boolean;
}

export type ModoModalTipoIngreso = 'editar' | 'crear';

export interface ColumnaDinamica {
  nombre: string;
  tipo: string;
}

export interface FilaDinamica {
  [key: string]: any;
}

export interface DataDinamica {
  columnas: ColumnaDinamica[];
  filas: FilaDinamica[];
}

export interface ApiResponse<T> {
  success: boolean;
  error: string;
  code: string;
  data: T | null;
}

// ── Requests / Responses por endpoint ─────────────────────────
export interface ObtenerTiposEntradaRequest {
  usuario: number;
}

export interface ObtenerMotivosIngresoRequest {
  clvTipoEntrada: number;
  usuario: number;
}

export interface AgregarMotivoIngresoRequest {
  clvTipoEntrada: number;
  descripcion: string;
  usuario: number;
}

export interface ActualizarMotivoIngresoRequest {
  clv: number;             // clave del motivo 
  descripcion: string;
  estatus: boolean;
  usuario: number;
}

export interface ObtenerValidacionesMotivosIngresoRequest {
  clvTipoEntrada: number;
  clvMotivoIngreso: number;
  usuario: number;
}

export interface ActualizarEstatusValidacionRequest {
  clvTipoEntrada: number;
  clvMotivoIngreso: number;
  clvValidacion: number;
  estatus: boolean;
  usuario: number;
}