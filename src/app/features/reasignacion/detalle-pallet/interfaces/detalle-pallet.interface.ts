export interface DetallePallet {
    pallet: string;
    ubicacion: string;
    cajas_pallet: number;
    cajas_a_reasignar: number;
    destino_anterior: number;
}

export interface ApiResponse<T> {
    success: boolean;
    error: string;
    code: string;
    data: T[] | null;
}

export interface DetallePalletRequest {
    numero_lote: number;
    destino_anterior: number;
    usuario: string;
}

export interface ConsultaDetallePallet {
    numero_lote: number | null;
    destino_anterior: number | null;
    usuario: string;
}