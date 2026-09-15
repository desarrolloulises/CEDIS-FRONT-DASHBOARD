import { ColumnaDinamica } from '../interfaces/consulta-registro-devolucion.interface';

export type ColorFila = 'verde' | 'amarillo';

/**
 * Determina el color de una fila según las últimas N columnas.
 * - Si TODAS las últimas N columnas tienen valor -> 'verde'
 * - En cualquier otro caso (0, 1, ..., N-1 con valor) -> 'amarillo'
 */
export function colorFila(
    fila: Record<string, any>,
    columnas: ColumnaDinamica[],
    ultimasN = 4
): ColorFila {
    if (!columnas.length) return 'amarillo';

    const ultimas = columnas.slice(-ultimasN);

    const todasConValor = ultimas.every(col => {
        const valor = fila[col.nombre];
        if (valor === null || valor === undefined) return false;
        return String(valor).trim() !== '';
    });

    return todasConValor ? 'verde' : 'amarillo';
}