/////////////////////////////////
// Lista citas transportistas
/////////////////////////////////
export interface ITransportista {
  id_cita: number;
  id_tipo_ingreso: number;
  tipo_ingreso: string;
  fecha_cita: string;
  empresa: string;
  nombre: string;
  paterno: string;
  materno: string;
  curp_operador: string;
  placas: string;
  tipo_unidad: number;
  desc_unidad: string;
  remolque: number;      // 1 = sí, 0 = no
  entrada: string;
  salida: string;
}

/////////////////////////////////
// Lista tipos de ingreso para citas transportistas
/////////////////////////////////
export interface ITipoIngreso {
  id: number;
  tipo: string;
}

/////////////////////////////////
// Alta de cita para transportistas
/////////////////////////////////
export interface IAltaTransportistaRequest {
  tipo_ingreso: number;
  empresa: string;
  curp_operador: string;
  nombre: string;
  paterno: string;
  materno: string;
  placas: string;
  usuario: string;
  unidad: number;
}

/////////////////////////////////
// Respuesta alta transportista
/////////////////////////////////
export interface IAltaTransportistaResponse {
  error_id: number;
  error_msg: string | null;
}

/////////////////////////////////
// Lista tipos unidad
/////////////////////////////////
export interface ITipoUnidad {
  id: number;
  tipo_unidad: string;
  usa_remolque: number;
}

/////////////////////////////////
// Registrar entrada/salida
/////////////////////////////////
export interface IRegistroAccesoRequest {
  registro: number;
  caja: number;
  usuario: string;
}

/////////////////////////////////
// Respuesta entrada/salida
/////////////////////////////////
export interface IRegistroAccesoResponse {
  error_id: number;
  error_msg: string | null;
}

/////////////////////////////////
// Modificar cita transportista
/////////////////////////////////
export interface IModificarTransportistaRequest {
  tipo_ingreso: number;
  registro: number;
  empresa: string;
  curp_operador: string;
  nombre: string;
  paterno: string;
  materno: string;
  placas: string;
  unidad: number;
  usuario: string;
}

export interface IModificarTransportistaResponse {
  error_id: number;
  error_msg: string | null;
}

/////////////////////////////////
// Registrar QR
/////////////////////////////////
export interface IRegistrarQrRequest {
  curp: string;
}

export interface IRegistrarQrResponse {
  error_id: number;
  error_msg: string | null;
}

/////////////////////////////////
// Validar CURP
/////////////////////////////////
export interface IValidarCurpRequest {
  curp_operador: string;
  nombre: string;
  paterno: string;
  materno: string;
  usuario: string;
}

export interface IValidarCurpResponse {
  error_id: number;
  error_msg: string | null;
}

/////////////////////////////////
// Respuesta base de error
/////////////////////////////////
export interface IApiErrorResponse {
  error_id: number;
  error_msg: string;
}