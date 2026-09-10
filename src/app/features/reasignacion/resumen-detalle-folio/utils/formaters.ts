/**
 * Formatea una fecha en formato local mexicano (dd/mm/aaaa)
 */
export function formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * Formatea una fecha y hora en formato local mexicano
 */
export function formatearFechaHora(fecha: string | null): string {
    if (!fecha) return '—';
    const date = new Date(fecha);
    return date.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * Obtiene la descripción completa del estatus
 */
export function obtenerDescripcionEstatus(estatus: string): string {
    switch (estatus) {
        case 'RA':
            return 'Reasignada';
        case 'PR':
            return 'Por Reasignar';
        default:
            return estatus;
    }
}

/**
 * Genera un nombre de archivo con timestamp
 */
export function generarNombreArchivo(prefijo: string, sufijo?: string): string {
    const fecha = new Date();
    const timestamp = `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}_${String(fecha.getHours()).padStart(2, '0')}${String(fecha.getMinutes()).padStart(2, '0')}`;
    
    if (sufijo) {
        return `${prefijo}_${sufijo}_${timestamp}.xlsx`;
    }
    
    return `${prefijo}_${timestamp}.xlsx`;
}