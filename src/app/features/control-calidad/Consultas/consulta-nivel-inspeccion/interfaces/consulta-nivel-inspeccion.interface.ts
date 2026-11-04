export interface ColumnaDinamica {
  nombre: string;
  tipo: string;
  /** Etiqueta amigable para mostrar en UI/exportación (opcional). */
  etiqueta?: string;
}

export interface FilaNivelInspeccion {
  [key: string]: any;
}

/**
 * Este endpoint no recibe parámetros. Se declara por consistencia
 * (y por si en el futuro agregan filtros), pero el servicio enviará `null`.
 */
export type ConsultarNivelInspeccionRequest = Record<string, never> | null;

export interface ConsultarNivelInspeccionResponse {
  success: boolean;
  error: string;
  code: string;
  data: {
    columnas: ColumnaDinamica[];
    filas: FilaNivelInspeccion[];
  } | null;
}