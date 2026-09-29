export interface ResumenReasignacion {
    fecha: string;
    numero_lote: number;
    tiendas: number;
    cajas_por_reasignar: number;
    cajas_reasignadas: number;
    diferencia: number;
}

export interface DetalleReasignacion {
    fecha: string;
    numero_lote: number;
    clave_proveedor: number;
    caja_a_reasignar: string;
    numero_de_ordenes: number;
    caja_nueva: string;
    codigo_transferencia: number;
    estatus: string;
    clave_tienda_origen: string;
    destino_anterior: number;
    destino_nuevo: number;
    fecha_reasignacion: string | null;
    usuario_que_reasigno: string;
    pallet: string;
}

export interface ApiResponse<T> {
    success: boolean;
    error: string;
    code: string;
    data: T[];
}

export interface FiltrosReasignacion {
    numero_lote: number | null;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    usuario: string;
}

export interface DetalleLoteRequest {
    numero_lote: number;
    usuario: string;
}