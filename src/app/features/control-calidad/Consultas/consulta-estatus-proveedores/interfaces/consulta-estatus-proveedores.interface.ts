export interface ColumnaDinamica {
  nombre: string;
  tipo: string;
}

export interface FilaEstatusProveedor {
  [key: string]: any;
}

export interface EstatusProveedoresData {
  columnas: ColumnaDinamica[];
  filas: FilaEstatusProveedor[];
}

export interface ObtenerEstatusProveedoresResponse {
  success: boolean;
  error: string;
  code: string;
  data: EstatusProveedoresData | null;
}

export interface TiemposRefreshData {
  horaInicio: string;   // "HH:mm" (puede traer espacios)
  horaFin: string;      // "HH:mm"
  intervalo: number;    // minutos
}

export interface ObtenerTiemposRefreshResponse {
  success: boolean;
  error: string;
  code: string;
  data: TiemposRefreshData | null;
}