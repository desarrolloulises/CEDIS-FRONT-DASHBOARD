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

//---------------INTERFACEZ DE DAHBOART-----------------------------------------
export interface IMenuSidebar {
    Usuario: string,
    Nivel: number,
    SubNivel: number,
    SubAcceso: number     // Para controlar si el acordeón está abierto
}
export interface IDInventario {
    tipo: number,
    RangoIni: string,
    RangoFin: string,
    Ubica: string     // Para controlar si el acordeón está abierto
    Usuario: string 
}
export interface IAcessoNiveles {
    tipo: number,
    ClaveA: string,
    Niv: string,
    SNiv: string,
    SubA: string,
    Descripcion: string,
    Usuario: string 
}

export interface IAccesoPerfiles {
    tipo: number,
    ClaveP: string,
    Descripcion: string,
    Usuario: string   
}
export interface IAcessosUsuario{
    tipo: number,
    ClaveE :string,
    ClaveU: string,
    ClaveP: string,    // Para controlar si el acordeón está abierto
    Usuario: string 
}

