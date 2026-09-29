import * as XLSX from 'xlsx';
import { formatearFecha, formatearFechaHora, obtenerDescripcionEstatus, generarNombreArchivo } from './formaters';
import { ResumenReasignacion, DetalleReasignacion } from '../interfaces/resumen-detalle.interface';

/**
 * Exporta el resumen de reasignaciones a Excel
 */
export function exportarResumenExcel(datos: ResumenReasignacion[]): void {
    // Preparar los datos para el archivo Excel
    const datosExcel = datos.map(item => ({
        'Fecha': formatearFecha(item.fecha),
        'Folio': item.numero_lote,
        'Tiendas': item.tiendas,
        'Cajas por Reasignar': item.cajas_por_reasignar,
        'Cajas Reasignadas': item.cajas_reasignadas,
        'Diferencia': item.diferencia,
    }));

    // Crear la hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resumen Reasignaciones');

    // Ajustar el ancho de las columnas
    worksheet['!cols'] = [
        { wch: 15 },  // Fecha
        { wch: 15 },  // Número de Lote
        { wch: 10 },  // Tiendas
        { wch: 20 },  // Cajas por Reasignar
        { wch: 18 },  // Cajas Reasignadas
        { wch: 10 },  // Diferencia
    ];

    // Generar nombre del archivo
    const nombreArchivo = generarNombreArchivo('resumen_reasignaciones');
    XLSX.writeFile(workbook, nombreArchivo);
}

/**
 * Exporta el detalle de reasignaciones a Excel
 */
export function exportarDetalleExcel(datos: DetalleReasignacion[], numeroLote: number | null): void {
    // Preparar los datos para el archivo Excel
    const datosExcel = datos.map(item => ({
        'Fecha': formatearFecha(item.fecha),
        'Folio': item.numero_lote,
        'Caja a Reasignar': item.caja_a_reasignar,
        'Proveedor': item.clave_proveedor,
        'Número de Trasnferencias': item.numero_de_ordenes,
        'Caja Nueva': item.caja_nueva,
        'Código Transferencia': item.codigo_transferencia,
        'Estatus': obtenerDescripcionEstatus(item.estatus),
        'Clave Tienda Origen': item.clave_tienda_origen,
        'Destino Anterior': item.destino_anterior,
        'Destino Nuevo': item.destino_nuevo,
        'Fecha Reasignación': formatearFechaHora(item.fecha_reasignacion),
        'Usuario que Reasignó': item.usuario_que_reasigno,
        'Pallet': item.pallet
    }));

    // Crear la hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Detalle Reasignaciones');

    // Ajustar el ancho de las columnas
    worksheet['!cols'] = [
        { wch: 12 },  // Fecha
        { wch: 10 },  // Folio
        { wch: 25 },  // Caja a Reasignar
        { wch: 10 },  // Proveedor
        { wch: 15 },  // Número de Órdenes
        { wch: 25 },  // Caja Nueva
        { wch: 18 },  // Código Transferencia
        { wch: 15 },  // Estatus
        { wch: 18 },  // Clave Tienda Origen
        { wch: 15 },  // Destino Anterior
        { wch: 12 },  // Destino Nuevo
        { wch: 20 },  // Fecha Reasignación
        { wch: 20 },  // Usuario que Reasignó
        { wch: 15 },  // Pallet
    ];

    // Generar nombre del archivo con número de lote
    const lote = numeroLote || 'todos';
    const nombreArchivo = generarNombreArchivo('detalle_reasignaciones', `folio_${lote}`);
    XLSX.writeFile(workbook, nombreArchivo);
}