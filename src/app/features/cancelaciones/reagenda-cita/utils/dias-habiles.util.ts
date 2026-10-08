/**
 * A partir de una fecha base (hoy) y un número N de días hábiles,
 * devuelve un arreglo con las fechas resultantes, saltando
 * sábados y domingos.
 *
 * Ejemplo: base = viernes, N = 3 -> [lunes, martes, miércoles]
 */
export function calcularDiasHabiles(fechaBase: Date, cantidad: number): Date[] {
    const dias: Date[] = [];
    if (cantidad <= 0) return dias;

    const cursor = new Date(
        fechaBase.getFullYear(),
        fechaBase.getMonth(),
        fechaBase.getDate()
    );

    let agregados = 0;
    while (agregados < cantidad) {
        cursor.setDate(cursor.getDate() + 1);
        const dow = cursor.getDay();
        if (dow !== 0 && dow !== 6) {
            dias.push(new Date(cursor));
            agregados++;
        }
    }

    return dias;
}

/**
 * Devuelve true si la fecha está dentro del arreglo de días permitidos.
 */
export function esDiaPermitido(fecha: Date | null, permitidos: Date[]): boolean {
    if (!fecha) return false;
    return permitidos.some(d =>
        d.getDate() === fecha.getDate() &&
        d.getMonth() === fecha.getMonth() &&
        d.getFullYear() === fecha.getFullYear()
    );
}

/**
 * Formatea una lista de fechas como "dd/mm, dd/mm y dd/mm".
 */
export function formatearListaDias(dias: Date[]): string {
    const fmt = (d: Date) => {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `${dd}/${mm}`;
    };

    if (dias.length === 0) return '(sin días disponibles)';
    if (dias.length === 1) return fmt(dias[0]);
    if (dias.length === 2) return `${fmt(dias[0])} y ${fmt(dias[1])}`;

    const ultimo = dias[dias.length - 1];
    const resto = dias.slice(0, -1).map(fmt).join(', ');
    return `${resto} y ${fmt(ultimo)}`;
}