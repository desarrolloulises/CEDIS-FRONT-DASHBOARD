export function formatearCelda(valor: any, tipo: string): string {
    if (valor === null || valor === undefined) return '';

    switch (tipo) {
        case 'DateTime':     return formatearFecha(valor);
        case 'TimeSpan':     return formatearTimeSpan(valor);
        case 'Int16':
        case 'Int32':
        case 'Int64':
        case 'Decimal':
        case 'Double':
        case 'Single':       return formatearNumero(valor);
        case 'Boolean':      return valor ? 'Sí' : 'No';
        case 'String':
        default:             return String(valor);
    }
}

function formatearFecha(valor: string): string {
    if (!valor) return '';
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return String(valor);

    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();

    const tieneHora =
        fecha.getHours() !== 0 ||
        fecha.getMinutes() !== 0 ||
        fecha.getSeconds() !== 0;

    if (!tieneHora) return `${dia}/${mes}/${anio}`;

    const hh = String(fecha.getHours()).padStart(2, '0');
    const mm = String(fecha.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hh}:${mm}`;
}

function formatearTimeSpan(valor: string): string {
    if (!valor) return '';
    const [horaCompleta] = String(valor).split('.');
    const partes = horaCompleta.split(':');
    if (partes.length < 2) return String(valor);

    const hh = String(parseInt(partes[0], 10) || 0).padStart(2, '0');
    const mm = String(parseInt(partes[1], 10) || 0).padStart(2, '0');
    const ss = String(parseInt(partes[2] ?? '0', 10) || 0).padStart(2, '0');

    if (hh === '00' && mm === '00' && ss === '00') return '';

    return `${hh}:${mm}:${ss}`;
}

function formatearNumero(valor: any): string {
    const num = Number(valor);
    if (isNaN(num)) return String(valor);
    return num.toLocaleString('es-MX');
}