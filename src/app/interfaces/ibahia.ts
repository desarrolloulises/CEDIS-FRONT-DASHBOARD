export interface Ibahia {
    proceso: number;
    bahia: string;
    etiqueta_caja?: string;
}

export interface IConsultaCaja {
    orden: number;
    tienda: number;
}

export interface IActualizarData {
    proceso: number;
    folio_embarque: string;
}

export interface IReporteGeneralIncidencias {
    manifiesto: string;
    caja?: string;
    tienda?: string;
}

export interface IAlmacen {
    tipo: number,
    Id_Pallet?: string,
    Inp_txt8?: string,
    Usuario: string
}

export interface IAlmacenPallet {
    tipo: number,
    Inp_txt8?: string,
    Usuario: string
}

export interface IContrasenna {
  Usuario: string,
  Password: string,
  PasswordN1: string,
  PasswordN2: string
}
