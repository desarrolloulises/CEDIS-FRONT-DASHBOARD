export interface DimensionesCuadriculaResponse {
  error: string;
  DesError: string;
  Color: string;
  Renglon: string;
  Columna: string;
  Coordenadas: string[];
}

export interface ObtenerColorProveedorRequest {
  proveedor: string;
}

export interface ObtenerColorProveedorResponse {
  error: string;
  DesError: string;
  Color: string;
  Renglon: string;
  Columna: string;
  Coordenadas: string[];
}

export interface ProveedorAPI {
  provedor: string;
  color: string;
  celdas: string[];
}

export interface EspaciosAsignadosResponse {
  error: string;
  DesError: string;
  Color: string;
  Renglon: string;
  Columna: string;
  Coordenadas: string[];
  provedores: ProveedorAPI[];
}

export interface CoordenadasRequest {
  coordenadas: string[];
}

export interface AsignarEspacioRequest {
  proveedor: string;
  coordenadas: string[];
}

export interface LiberarEspacioRequest {
  proveedor: string;
  coordenadas: string[];
}

export interface ApiResponse {
  error: string;
  DesError: string;
  Color: string;
  Renglon: string;
  Columna: string;
  Coordenadas: string[];
}

export interface PermisoResponse {
  Opcion: number;
  Descripcion: string;
}

export interface ProveedorLocal {
  id: string;
  color: string;
}

export interface Dimensiones {
  filas: number;
  columnas: number;
}