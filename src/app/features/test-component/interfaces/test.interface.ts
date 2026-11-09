/** Roles disponibles en la app. */
export type RolUsuario = 'admin' | 'estandar' | 'consulta';

export interface Usuario {
  id: number;
  nombre: string;
  rol: RolUsuario;
}

export interface Catalogo {
  id: string;
  nombre: string;
}

export interface ColumnaDinamica {
  nombre: string;
  tipo: string;
  etiqueta?: string;
}

export interface FilaCatalogo {
  [key: string]: any;
}

/**
 * Permisos que un rol tiene sobre un catálogo concreto.
 * Esta es la unidad real de autorización: (rol, catálogo).
 */
export interface PermisosCatalogo {
  /** ¿Puede agregar registros en este catálogo con este rol? */
  puedeAgregar: boolean;
  /** ¿Puede eliminar registros en este catálogo con este rol? */
  puedeEliminar: boolean;
  /** Columnas que NO puede editar (las demás sí). */
  columnasNoEditables: string[];
}

/** Datos + permisos ya resueltos para el rol actual. */
export interface CatalogoData {
  columnas: ColumnaDinamica[];
  filas: FilaCatalogo[];
  permisos: PermisosCatalogo;
}

/** Etiquetas por posición para los catálogos simulados. */
export const ETIQUETAS_POR_CATALOGO: Record<string, string[]> = {
  proveedores: ['ID', 'Razón social', 'RFC', 'Activo'],
  empleados:   ['ID', 'Nombre', 'Puesto', 'Activo'],
  unidades:    ['ID', 'Placa', 'Modelo', 'Activo']
};