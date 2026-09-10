/**
 * Genera un nombre de archivo con timestamp
 */
export function generarNombreArchivo(prefijo: string, sufijos?: string[]): string {
    const fecha = new Date();
    const timestamp = `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}_${String(fecha.getHours()).padStart(2, '0')}${String(fecha.getMinutes()).padStart(2, '0')}`;
    
    const partesSufijo = sufijos && sufijos.length > 0 ? sufijos.join('_') : '';
    
    if (partesSufijo) {
        return `${prefijo}_${partesSufijo}_${timestamp}.xlsx`;
    }
    
    return `${prefijo}_${timestamp}.xlsx`;
}