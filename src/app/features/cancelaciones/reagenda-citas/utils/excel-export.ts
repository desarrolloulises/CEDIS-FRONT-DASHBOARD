import * as XLSX from 'xlsx';
import { ColumnaDinamica } from '../../../control-entradas-salidas-cedis/consulta-entrega-devolucion/interfaces/consulta-entrega-devolucion.interface';

interface ExcelExportParams {
    columnas: ColumnaDinamica[];
    filas: Record<string, any>[];
    nombreArchivo: string;
    filtrosAplicados?: {
        idProveedor?: number | null;
        fechaInicio?: string | null;
        fechaFin?: string | null;
        usuario?: string | null;
    };
}

/* ───────────────────────────────────────────────────────────────
 * Clasificación de tipos
 * ─────────────────────────────────────────────────────────────── */

const TIPOS_ENTEROS = ['Int16', 'Int32', 'Int64'];
const TIPOS_DECIMALES = ['Decimal', 'Double', 'Single'];

/* ───────────────────────────────────────────────────────────────
 * Conversión de un TimeSpan ("HH:mm:ss.fffffff" o "00:00:00")
 * a string "HH:mm:ss" (formato 24 hrs).
 * ─────────────────────────────────────────────────────────────── */
function timeSpanToString(valor: any): string {
    if (valor === null || valor === undefined || valor === '') return '';

    const [horaCompleta] = String(valor).split('.');
    const partes = horaCompleta.split(':');
    if (partes.length < 2) return String(valor);

    const hh = String(parseInt(partes[0], 10) || 0).padStart(2, '0');
    const mm = String(parseInt(partes[1], 10) || 0).padStart(2, '0');
    const ss = String(parseInt(partes[2] ?? '0', 10) || 0).padStart(2, '0');

    if (hh === '00' && mm === '00' && ss === '00') return '';
    return `${hh}:${mm}:${ss}`;
}

/* ───────────────────────────────────────────────────────────────
 * Conversión de un DateTime a Date con hora en cero
 * (para que Excel lo muestre como dd/mm/yyyy sin importar
 *  la zona horaria)
 * ─────────────────────────────────────────────────────────────── */
function dateTimeParaExcel(valor: any): Date | '' {
    if (!valor) return '';
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return '';

    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

/* ───────────────────────────────────────────────────────────────
 * Conversión de un valor al tipo nativo de Excel según su tipo
 * ─────────────────────────────────────────────────────────────── */
function valorParaExcel(valor: any, tipo: string): any {
    if (valor === null || valor === undefined) return '';

    switch (tipo) {
        case 'DateTime':
            return dateTimeParaExcel(valor);

        case 'TimeSpan':
            return timeSpanToString(valor);

        case 'Int16':
        case 'Int32':
        case 'Int64':
            return Number(valor);

        case 'Decimal':
        case 'Double':
        case 'Single':
            return Number(valor);

        case 'Boolean':
            return valor ? 'Sí' : 'No';

        case 'String':
        default:
            return String(valor);
    }
}

/* ───────────────────────────────────────────────────────────────
 * Ancho de columnas
 * ─────────────────────────────────────────────────────────────── */
function calcularAnchos(
    columnas: ColumnaDinamica[],
    filas: any[][],
    encabezados: string[]
): XLSX.ColInfo[] {
    return columnas.map((col, idx) => {
        const valoresTexto = filas.map(f => String(f[idx] ?? ''));
        const maxContenido = Math.max(
            encabezados[idx].length,
            ...valoresTexto.map(v => v.length),
            8
        );
        return { wch: Math.min(maxContenido + 2, 45) };
    });
}

/* ───────────────────────────────────────────────────────────────
 * Aplicación de formatos de celda según el tipo de columna
 * ─────────────────────────────────────────────────────────────── */
function aplicarFormatos(
    worksheet: XLSX.WorkSheet,
    columnas: ColumnaDinamica[],
    totalFilas: number
): void {
    columnas.forEach((col, idx) => {
        let formato: string | null = null;

        if (col.tipo === 'DateTime') {
            formato = 'dd/mm/yyyy';
        } else if (TIPOS_ENTEROS.includes(col.tipo)) {
            formato = '#,##0';
        } else if (TIPOS_DECIMALES.includes(col.tipo)) {
            formato = '#,##0.00';
        }

        if (!formato) return;

        for (let r = 1; r <= totalFilas; r++) {
            const addr = XLSX.utils.encode_cell({ c: idx, r });
            const cell = worksheet[addr];
            if (!cell) continue;
            cell.z = formato;
        }
    });
}

/* ───────────────────────────────────────────────────────────────
 * Exportación principal
 * ─────────────────────────────────────────────────────────────── */
export function exportarConsultaEntregaDevolucionExcel(
    params: ExcelExportParams
): void {
    const { columnas, filas, nombreArchivo, filtrosAplicados } = params;

    if (!columnas.length || !filas.length) {
        throw new Error('No hay datos para exportar');
    }

    const encabezados = columnas.map(c => c.nombre);

    // Convertimos cada fila a array de valores nativos de Excel
    const datosExcel = filas.map(fila =>
        columnas.map(col => valorParaExcel(fila[col.nombre], col.tipo))
    );

    const worksheet = XLSX.utils.aoa_to_sheet([encabezados, ...datosExcel]);

    // Ancho de columnas
    worksheet['!cols'] = calcularAnchos(columnas, datosExcel, encabezados);
    worksheet['!rows'] = [{ hpt: 22 }]; 

    // Formatos por tipo (fecha, enteros, decimales)
    aplicarFormatos(worksheet, columnas, datosExcel.length);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resumen');

    // Hoja informativa de filtros
    if (filtrosAplicados) {
        const fmtFecha = (iso?: string | null) => {
            if (!iso) return '(sin límite)';
            const d = new Date(iso);
            if (isNaN(d.getTime())) return iso;
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        };

        const filtrosData: any[][] = [
            ['Filtros aplicados'],
            ['Usuario', filtrosAplicados.usuario ?? ''],
            ['ID Proveedor', filtrosAplicados.idProveedor ?? '(todos)'],
            ['Fecha inicio', fmtFecha(filtrosAplicados.fechaInicio)],
            ['Fecha fin', fmtFecha(filtrosAplicados.fechaFin)],
            ['Fecha de exportación', new Date().toLocaleString('es-MX')]
        ];
        const wsFiltros = XLSX.utils.aoa_to_sheet(filtrosData);
        wsFiltros['!cols'] = [{ wch: 22 }, { wch: 35 }];
        XLSX.utils.book_append_sheet(workbook, wsFiltros, 'Filtros');
    }

    XLSX.writeFile(workbook, `${nombreArchivo}.xlsx`);
}

/* ───────────────────────────────────────────────────────────────
 * Nombre del archivo
 * ─────────────────────────────────────────────────────────────── */
export function construirNombreArchivo(
    usuario: string | number | null,
    fechaInicio?: string | null,
    fechaFin?: string | null
): string {
    const partes = ['consulta-entrega-devolucion'];
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

    const stamp = new Date()
        .toISOString()
        .slice(0, 16)
        .replace(/[-:T]/g, '');

    partes.push(stamp);
    return partes.join('_');
}