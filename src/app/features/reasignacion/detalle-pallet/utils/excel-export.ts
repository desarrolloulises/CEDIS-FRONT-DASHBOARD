import * as XLSX from 'xlsx';
import { DetallePallet } from '../interfaces/detalle-pallet.interface';
import { generarNombreArchivo } from './formaters';

/**
 * Exporta el detalle de pallets a Excel
 */
export function exportarDetallePalletsExcel(
    datos: DetallePallet[], 
    numeroLote: string, 
    destinoAnterior: string
): void {
    // Preparar los datos para el archivo Excel
    const datosExcel = datos.map(item => ({
        'Pallet / Caja sin pallet': item.pallet,
        'Ubicación': item.ubicacion,
        'Cajas en Pallet': item.cajas_pallet,
        'Cajas a Reasignar': item.cajas_a_reasignar,
        'Tienda': item.destino_anterior
    }));

    // Crear la hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Detalle Pallets');

    // Ajustar el ancho de las columnas
    worksheet['!cols'] = [
        { wch: 20 },  // Pallet
        { wch: 15 },  // Ubicación
        { wch: 18 },  // Cajas en Pallet
        { wch: 20 },  // Cajas a Reasignar
        { wch: 10 },  // Tienda (Destino anterior)
    ];

    // Generar nombre del archivo
    const nombreArchivo = generarNombreArchivo(
        'detalle_pallets', 
        [`folio_${numeroLote}`, `tienda_${destinoAnterior}`]
    );
    
    XLSX.writeFile(workbook, nombreArchivo);
}