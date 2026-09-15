import * as XLSX from 'xlsx-js-style';
import { ColumnaDinamica } from '../interfaces/consulta-registro-devolucion.interface';
import { colorFila, ColorFila } from './resaltado.util';

interface ExcelExportParams {
    columnas: ColumnaDinamica[];
    filas: Record<string, any>[];
    nombreArchivo: string;
    filtrosAplicados?: {
        fechaInicio?: string | null;
        fechaFin?: string | null;
        usuario?: string | null;
    };
}

const TIPOS_ENTEROS = ['Int16', 'Int32', 'Int64'];
const TIPOS_DECIMALES = ['Decimal', 'Double', 'Single'];

/* ── Conversión DateTime a Date a medianoche ─────────────────── */
function dateTimeParaExcel(valor: any): Date | '' {
    if (!valor) return '';
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return '';
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

/* ── TimeSpan a string HH:mm:ss ──────────────────────────────── */
function timeSpanToString(valor: any): string {
    if (valor === null || valor === undefined || valor === '') return '';
    const [horaCompleta] = String(valor).split('.');
    const partes = horaCompleta.split(':');
    if (partes.length < 2) return String(valor);

    const hh = String(parseInt(partes[0], 10) || 0).padStart(2, '0');
    const mm = String(parseInt(partes[1], 10) || 0).padStart(2, '0');
    const ss = String(parseInt(partes[2] ?? '0', 10) || 0).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

/* ── Conversión por tipo ─────────────────────────────────────── */
function valorParaExcel(valor: any, tipo: string): any {
    if (valor === null || valor === undefined) return '';

    switch (tipo) {
        case 'DateTime': return dateTimeParaExcel(valor);
        case 'TimeSpan': return timeSpanToString(valor);
        case 'Int16':
        case 'Int32':
        case 'Int64': return Number(valor);
        case 'Decimal':
        case 'Double':
        case 'Single': return Number(valor);
        case 'Boolean': return valor ? 'Sí' : 'No';
        case 'String':
        default: return String(valor);
    }
}

/* ── Anchos de columna ───────────────────────────────────────── */
function calcularAnchos(
    columnas: ColumnaDinamica[],
    filas: any[][],
    encabezados: string[]
): XLSX.ColInfo[] {
    return columnas.map((_, idx) => {
        const valoresTexto = filas.map(f => String(f[idx] ?? ''));
        const maxContenido = Math.max(
            encabezados[idx].length,
            ...valoresTexto.map(v => v.length),
            8
        );
        return { wch: Math.min(maxContenido + 2, 45) };
    });
}

/* ── Formatos numéricos/fecha ────────────────────────────────── */
function aplicarFormatos(
    worksheet: XLSX.WorkSheet,
    columnas: ColumnaDinamica[],
    totalFilas: number
): void {
    columnas.forEach((col, idx) => {
        let formato: string | null = null;
        if (col.tipo === 'DateTime') formato = 'dd/mm/yyyy';
        else if (TIPOS_ENTEROS.includes(col.tipo)) formato = '#,##0';
        else if (TIPOS_DECIMALES.includes(col.tipo)) formato = '#,##0.00';
        if (!formato) return;

        for (let r = 1; r <= totalFilas; r++) {
            const addr = XLSX.utils.encode_cell({ c: idx, r });
            const cell = worksheet[addr];
            if (cell) cell.z = formato;
        }
    });
}

/* ── Colores de relleno ──────────────────────────────────────── */
const COLORES: Record<ColorFila, string> = {
    verde: '36FF5E', // verde claro
    amarillo: 'FFDB4B'  // amarillo claro
};

/* ── Aplicar relleno a una fila completa de la hoja ──────────── */
function pintarFila(
    worksheet: XLSX.WorkSheet,
    numeroFilaExcel: number,
    totalColumnas: number,
    color: ColorFila
): void {
    const relleno = {
        patternType: 'solid',
        fgColor: { rgb: COLORES[color] }
    };

    for (let c = 0; c < totalColumnas; c++) {
        const addr = XLSX.utils.encode_cell({ c, r: numeroFilaExcel });
        const cell = worksheet[addr];
        if (!cell) continue;
        cell.s = { fill: relleno };
    }
}

/* ── Exportación principal ───────────────────────────────────── */
export function exportarConsultaRegistroDevolucionExcel(
    params: ExcelExportParams
): void {
    const { columnas, filas, nombreArchivo, filtrosAplicados } = params;

    if (!columnas.length || !filas.length) {
        throw new Error('No hay datos para exportar');
    }

    const encabezados = columnas.map(c => c.nombre);

    const datosExcel = filas.map(fila =>
        columnas.map(col => valorParaExcel(fila[col.nombre], col.tipo))
    );

    const worksheet = XLSX.utils.aoa_to_sheet([encabezados, ...datosExcel]);

    worksheet['!cols'] = calcularAnchos(columnas, datosExcel, encabezados);
    worksheet['!rows'] = [{ hpt: 22 }];
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }; // congela encabezado

    aplicarFormatos(worksheet, columnas, datosExcel.length);

    // Resaltado por fila (fila 0 = encabezado, datos empiezan en 1)
    filas.forEach((fila, idx) => {
        const color = colorFila(fila, columnas, 4);
        pintarFila(worksheet, idx + 1, columnas.length, color);
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registro devolución');

    if (filtrosAplicados) {
        const fmtFecha = (iso?: string | null) => {
            if (!iso) return '(sin límite)';
            const d = new Date(iso);
            if (isNaN(d.getTime())) return iso;
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            return `${dd}/${mm}/${d.getFullYear()}`;
        };

        const filtrosData: any[][] = [
            ['Filtros aplicados'],
            ['Usuario', filtrosAplicados.usuario ?? ''],
            ['Fecha inicio', fmtFecha(filtrosAplicados.fechaInicio)],
            ['Fecha fin', fmtFecha(filtrosAplicados.fechaFin)],
            ['Fecha de exportación', new Date().toLocaleString('es-MX')],
            [''],
            ['Leyenda'],
            ['Verde', 'Las últimas 4 columnas tienen valor'],
            ['Amarillo', 'Al menos una de las últimas 4 columnas está vacía']
        ];
        const wsFiltros = XLSX.utils.aoa_to_sheet(filtrosData);
        wsFiltros['!cols'] = [{ wch: 22 }, { wch: 50 }];

        // Pintamos las celdas de leyenda con su color
        const celdasLeyenda: Array<[number, ColorFila]> = [
            [8, 'verde'],
            [9, 'amarillo']
        ];
        celdasLeyenda.forEach(([row, color]) => {
            const addr = XLSX.utils.encode_cell({ c: 0, r: row });
            if (wsFiltros[addr]) {
                wsFiltros[addr].s = {
                    fill: {
                        patternType: 'solid',
                        fgColor: { rgb: COLORES[color] }
                    }
                };
            }
        });

        XLSX.utils.book_append_sheet(workbook, wsFiltros, 'Filtros');
    }

    XLSX.writeFile(workbook, `${nombreArchivo}.xlsx`, { cellStyles: true });
}

/* ── Nombre del archivo ──────────────────────────────────────── */
export function construirNombreArchivo(
    usuario: string | number | null,
    fechaInicio?: string | null,
    fechaFin?: string | null
): string {
    const partes = ['consulta-registro-devolucion'];
    if (usuario) partes.push(`u${usuario}`);

    const fmt = (iso?: string | null) => {
        if (!iso) return null;
        const d = new Date(iso);
        if (isNaN(d.getTime())) return null;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}${mm}${dd}`;
    };

    const fi = fmt(fechaInicio);
    const ff = fmt(fechaFin);
    if (fi && ff) partes.push(`${fi}-${ff}`);
    else if (fi) partes.push(`desde-${fi}`);
    else if (ff) partes.push(`hasta-${ff}`);

    partes.push(new Date().toISOString().slice(0, 16).replace(/[-:T]/g, ''));
    return partes.join('_');
}