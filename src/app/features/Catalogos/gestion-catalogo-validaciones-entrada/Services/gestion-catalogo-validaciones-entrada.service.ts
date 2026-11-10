import {
    TipoEntrada,
    TipoIngreso,
    Validacion
} from '../Interfaces/gestion-catalogo-validaciones-entrada.interface';

/** Tipos de entrada de ejemplo. */
export const MOCK_TIPOS_ENTRADA: TipoEntrada[] = [
    { idTipoEntrada: 1, descripcionTipoEntrada: 'Visitas', tipoEntrada: 1 },
    { idTipoEntrada: 2, descripcionTipoEntrada: 'Transportistas', tipoEntrada: 0 },
    { idTipoEntrada: 3, descripcionTipoEntrada: 'Inspeccion', tipoEntrada: 0 }
];

/** Tipos de ingreso por idTipoEntrada (nivel 2). */
export const MOCK_TIPOS_INGRESO: Record<number, TipoIngreso[]> = {
    1: [
        { clave: 101, descripcion: 'Maniobra', estatus: true },
        { clave: 102, descripcion: 'Servicios externos de oficina', estatus: true },
        { clave: 103, descripcion: 'Servicios externos de bodega', estatus: false },
        { clave: 104, descripcion: 'Oficinas', estatus: false }
    ],
    2: [
        { clave: 201, descripcion: 'Entrega/Devolucion', estatus: true },
        { clave: 202, descripcion: 'Carga/Descarga', estatus: true }
    ],
    3: [
        { clave: 301, descripcion: 'Ingreso directo a bodega', estatus: true }
    ]
};

/** Validaciones por clave de tipo de ingreso (nivel 3). */
export const MOCK_VALIDACIONES: Record<number, Validacion[]> = {
    101: [
        { clave: 1001, descripcion: 'Alta de IMSS', estatus: true },
        { clave: 1002, descripcion: 'DC3', estatus: true },
        { clave: 1003, descripcion: 'Chaleco reflectante', estatus: true },
        { clave: 1004, descripcion: 'Zapatos de seguridad', estatus: true },
        { clave: 1005, descripcion: 'Pantalon de mezclilla (Azul, Negro, Gris)', estatus: true },
        { clave: 1006, descripcion: 'Linea de vida', estatus: true },
        { clave: 1007, descripcion: 'Casco', estatus: true },
        { clave: 1008, descripcion: 'Arnes de cuerpo completo', estatus: true },
        { clave: 1009, descripcion: 'Playera (Manga larga o corta)', estatus: true },
        { clave: 10010, descripcion: 'Fuga de aceite', estatus: true }
    ],
    102: [
        { clave: 1001, descripcion: 'Alta de IMSS', estatus: false },
        { clave: 1002, descripcion: 'DC3', estatus: true },
        { clave: 1003, descripcion: 'Chaleco reflectante', estatus: true },
        { clave: 1004, descripcion: 'Zapatos de seguridad', estatus: false },
        { clave: 1005, descripcion: 'Pantalon de mezclilla (Azul, Negro, Gris)', estatus: false },
        { clave: 1006, descripcion: 'Linea de vida', estatus: true },
        { clave: 1007, descripcion: 'Casco', estatus: true },
        { clave: 1008, descripcion: 'Arnes de cuerpo completo', estatus: false },
        { clave: 1009, descripcion: 'Playera (Manga larga o corta)', estatus: false },
        { clave: 10010, descripcion: 'Fuga de aceite', estatus: true }],
    103: [
        { clave: 1001, descripcion: 'Alta de IMSS', estatus: false },
        { clave: 1002, descripcion: 'DC3', estatus: true },
        { clave: 1003, descripcion: 'Chaleco reflectante', estatus: true },
        { clave: 1004, descripcion: 'Zapatos de seguridad', estatus: false },
        { clave: 1005, descripcion: 'Pantalon de mezclilla (Azul, Negro, Gris)', estatus: false },
        { clave: 1006, descripcion: 'Linea de vida', estatus: true },
        { clave: 1007, descripcion: 'Casco', estatus: true },
        { clave: 1008, descripcion: 'Arnes de cuerpo completo', estatus: false },
        { clave: 1009, descripcion: 'Playera (Manga larga o corta)', estatus: false },
        { clave: 10010, descripcion: 'Fuga de aceite', estatus: true }],
    201: [
        { clave: 1001, descripcion: 'Alta de IMSS', estatus: true },
        { clave: 1002, descripcion: 'DC3', estatus: true },
        { clave: 1003, descripcion: 'Chaleco reflectante', estatus: true },
        { clave: 1004, descripcion: 'Zapatos de seguridad', estatus: true },
        { clave: 1005, descripcion: 'Pantalon de mezclilla (Azul, Negro, Gris)', estatus: true },
        { clave: 1006, descripcion: 'Linea de vida', estatus: true },
        { clave: 1007, descripcion: 'Casco', estatus: true },
        { clave: 1008, descripcion: 'Arnes de cuerpo completo', estatus: true },
        { clave: 1009, descripcion: 'Playera (Manga larga o corta)', estatus: true },
        { clave: 10010, descripcion: 'Fuga de aceite', estatus: true }
    ],
    202: [
        { clave: 1001, descripcion: 'Alta de IMSS', estatus: false },
        { clave: 1002, descripcion: 'DC3', estatus: true },
        { clave: 1003, descripcion: 'Chaleco reflectante', estatus: true },
        { clave: 1004, descripcion: 'Zapatos de seguridad', estatus: false },
        { clave: 1005, descripcion: 'Pantalon de mezclilla (Azul, Negro, Gris)', estatus: false },
        { clave: 1006, descripcion: 'Linea de vida', estatus: true },
        { clave: 1007, descripcion: 'Casco', estatus: true },
        { clave: 1008, descripcion: 'Arnes de cuerpo completo', estatus: false },
        { clave: 1009, descripcion: 'Playera (Manga larga o corta)', estatus: false },
        { clave: 10010, descripcion: 'Fuga de aceite', estatus: true }],
    301: [
        { clave: 3001, descripcion: 'Permiso', estatus: true },
        { clave: 3002, descripcion: 'Chaleco de seguridad', estatus: true },
        { clave: 3003, descripcion: 'Zapatos de seguridad', estatus: true }
    ]
};