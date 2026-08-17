/////////////////////////////////////////
//      Validaciones de seguridad
/////////////////////////////////////////
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

/////////////////////////////////////////
//              Vetos
/////////////////////////////////////////

export interface TipoVeto {
  errId: number;
  errMsg: string;
  lblTipoVeto: string;
  lblDescripcionTipoVeto: string;
  lblFechaInicio: string;
  lblFechaTermino: string;
  lblDiasRestantes: string;
}

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

/////////////////////////////////////////
//              Incidencias
/////////////////////////////////////////
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

/////////////////////////////////////////
// Otros: elementos adicionales de entrada
/////////////////////////////////////////
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

/////////////////////////////////////////
//              Imagenes
/////////////////////////////////////////
export interface ImagenInfo {
  CURP: string;
  pathRelativo: string;
}

export interface EliminarImagenResponse {
  mensaje: string;
}

export interface Visitante {
  idCita: number;
  tipoCita: string;
  idTipoIngreso: number;
  tipoIngreso: string;
  fechaCita: string;
  idEmpresaArea: number;
  empresaArea: string;
  CURP: string;
  nombre: string;
  tipoUnidad: number;
  descripcionUnidad: string;
  placas: string;
  marca: string;
  modelo: string;
  entrada: boolean;
  salida: boolean;
}

export interface MotivoVisita {
  id: number;
  motivo: string;
  opcion: number;
}

export interface Area {
  idArea: number;
  descripcionArea: string;
}

export interface RazonSocialProveedor {
  razonSocial: string;
}

export interface DatosVisitante {
  curp: string;
  nombre: string;
  paterno: string;
  materno: string;
}

export interface TipoUnidad {
  id: number;
  tipoUnidad: string;
  usaRemolque: number;
}

export interface ActualizarVisitantePayload {
  idCita: number;
  idTipoIngreso: number;
  idEmpresaArea: number;
  empresaArea: string;
  curp: string;
  nombre: string;
  paterno: string;
  materno: string;
  unidad: number;
  placas: string;
  marca: string;
  modelo: string;
  usuario: string;
}

export interface ValidarCurpPayload {
  curp: string;
  nombre: string;
  paterno: string;
  materno: string;
  usuario: string;
}

export interface ValidarCurpResponse {
  errId: number;
  errMsg: string | null;
}

export interface ConsultarVisitantesPayload {
  usuario: string;
}

export interface ConsultarAreasPayload {
  tipo: number;
  usuario: string;
}

export interface ConsultarRazonSocialPayload {
  idProvedor: number;
}

export interface ConsultarDatosVisitantePayload {
  curp: string;
}

export interface ConsultarTiposUnidadPayload {
  usuario: string;
}