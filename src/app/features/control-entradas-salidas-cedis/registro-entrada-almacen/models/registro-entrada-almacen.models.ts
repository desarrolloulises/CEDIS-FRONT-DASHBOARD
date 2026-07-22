// ─────────────────────────────────────────────────────────
// Validaciones de seguridad
// ─────────────────────────────────────────────────────────

export interface ValidacionSeguridad {
  errId: number;
  errMsg: string;
  lblClaveValidacion: string;
  lblDescripcionValidacion: string;
  /** 0 = inactiva, 1 = activa */
  estadoValidacion: number;
}

export interface ActualizarValidacionPayload {
  curp: string;
  clave: string;
  activa: boolean;
  usuario: string;
}

export interface ActualizarValidacionResponse {
  errId: number;
  errMsg: string;
  lblClaveValidacion: string;
  lblDescripcionValidacion: string;
  lblEstadoValidacion: string;
}

// ─────────────────────────────────────────────────────────
// Vetos
// ─────────────────────────────────────────────────────────

export interface TipoVeto {
  errId: number;
  errMsg: string;
  lblTipoVeto: string;
  lblDescripcionTipoVeto: string;
  lblFechaInicio: string;
  lblFechaTermino: string;
  lblDiasRestantes: string;
}

/** Respuesta de GET /vetos?curp=... cuando ya existe un veto registrado */
export interface VetoExistente {
  errId: number;
  errMsg: string;
  lblTipoVeto: string;
  lblDescripcionTipoVeto: string;
  lblFechaInicio: string;
  lblFechaTermino: string;
  lblDiasRestantes: string;
}

export interface AplicarVetoPayload {
  curp: string;
  tipoVeto: string;
  /** yyyy-MM-dd */
  fechaInicio: string;
  /** yyyy-MM-dd */
  fechaTermino: string;
  usuario: string;
}

export interface AplicarVetoResponse {
  errId: number;
  errMsg: string;
  lblTipoVeto: string;
  lblDescripcionTipoVeto: string;
  lblFechaInicio: string;
  lblFechaTermino: string;
  lblDiasRestantes: string;
}

// ─────────────────────────────────────────────────────────
// Incidencias
// ─────────────────────────────────────────────────────────

export interface Incidencia {
  errId: number;
  errMsg: string;
  lblId: string;
  /** MM/DD/YYYY HH:mm:ss */
  lblFecha: string;
  lblClaveNivel: string;
  lblDescripcionNivel: string;
  lblDescripcion: string;
  lblColor: string;
}

/**
 * El catálogo de niveles regresa la forma "invertida" respecto a
 * Incidencia: aquí lblDescripcionNivel trae la CLAVE ("1","2","3")
 * y lblDescripcion trae la ETIQUETA ("Bajo","Medio","Alto").
 */
export interface NivelIncidenciaCatalogo {
  errId: number;
  errMsg: string;
  lblId: string;
  lblFecha: string;
  lblClaveNivel: string;
  lblDescripcionNivel: string;
  lblDescripcion: string;
  lblColor: string;
}

export interface CrearIncidenciaPayload {
  curp: string;
  nivel: string;
  descripcion: string;
  usuario: string;
}

export interface ActualizarIncidenciaPayload {
  id: number;
  curp: string;
  nivel: string;
  descripcion: string;
}

export interface IncidenciaResponse {
  errId: number;
  errMsg: string;
  lblId: string;
  lblFecha: string;
  lblClaveNivel: string;
  lblDescripcionNivel: string;
  lblDescripcion: string;
  lblColor: string;
}

// ─────────────────────────────────────────────────────────
// Otros: elementos adicionales de entrada
// ─────────────────────────────────────────────────────────

export interface ElementoAdicional {
  errId: number;
  errMsg: string;
  lblId: string;
  lblClasifica: string;
  lblDescripcion: string;
  /** viene como string, ej. "2.50" */
  lblCantidad: string;
}

export interface CrearElementoAdicionalPayload {
  tipoElemento: string;
  descripcionElemento: string;
  cantidad: string;
  curp: string;
  usuario: string;
}

export interface ActualizarElementoAdicionalPayload {
  idElemento: string;
  tipoElemento: string;
  descripcionElemento: string;
  cantidad: string;
  curp: string;
  usuario: string;
}

export interface ElementoAdicionalResponse {
  errId: number;
  errMsg: string;
  lblId: string;
  lblClasifica: string;
  lblDescripcion: string;
  lblCantidad: string;
}

// ─────────────────────────────────────────────────────────
// Otros: elementos adicionales
// ─────────────────────────────────────────────────────────

export interface ElementoAdicional {
  errId: number;
  errMsg: string;
  lblId: string;
  lblClasifica: string;
  lblDescripcion: string;
  lblCantidad: string;
}

export interface CrearElementoAdicionalPayload {
  tipoElemento: string;
  descripcionElemento: string;
  cantidad: string;
  curp: string;
  usuario: string;
}

export interface ActualizarElementoAdicionalPayload {
  idElemento: string;
  tipoElemento: string;
  descripcionElemento: string;
  cantidad: string;
  curp: string;
  usuario: string;
}

export interface ElementoAdicionalResponse {
  errId: number;
  errMsg: string;
  lblId: string;
  lblClasifica: string;
  lblDescripcion: string;
  lblCantidad: string;
}

// ─────────────────────────────────────────────────────────
// Imagen
// ─────────────────────────────────────────────────────────

export interface ImagenInfo {
  id: number;
  carpeta: string;
  nombreArchivo: string;
  pathRelativo: string;
}

export interface EliminarImagenResponse {
  mensaje: string;
}