// ── Nivel 1: tipos de entrada ───────────────────────────────────
export interface TipoEntrada {
  idTipoEntrada: number;
  descripcionTipoEntrada: string;
  /** 0 = solo lectura · 1 = editable */
  tipoEntrada: 0 | 1;
}

// ── Nivel 2: tipos de ingreso ───────────────────────────────────
export interface TipoIngreso {
  clave: number;
  descripcion: string;
  estatus: boolean;
}

// ── Nivel 3: validaciones del tipo de ingreso ───────────────────
export interface Validacion {
  clave: number;
  descripcion: string;
  estatus: boolean;
}

export type ModoModalTipoIngreso = 'editar' | 'crear';