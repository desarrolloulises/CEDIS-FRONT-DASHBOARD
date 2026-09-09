-- Consulta 1: Resumen de cajas y tiendas por fecha y lote
SELECT 
    FechaAgregado,
    NoLote,
    (
        SELECT COUNT(DISTINCT DestinoNuevo) 
        FROM TReasignaCajas
    ) AS tiendas,
    COUNT(*) AS cajasxreasigna,
    SUM(CASE WHEN Estatus = 'RA' THEN 1 ELSE 0 END) AS cajasReasignadas
FROM TReasignaCajas
GROUP BY 
    FechaAgregado, 
    NoLote;

-- Consulta 2: Detalle de reasignación de cajas para un lote específico
SELECT 
    rc.FechaAgregado,
    rc.NoLote,
    rc.CajaAReasignar,
    rc.NumeroOrdenes,
    rc.CajaNueva,
    rc.CodigoTransferencia,
    rc.Estatus,
    mt.ClaveTiendaOrigen,
    rc.DestinoAnterior,
    rc.DestinoNuevo,
    rc.FechaReasignacion,
    rc.UsuarioReasigno
FROM TReasignaCajas rc 
LEFT OUTER JOIN TMaestroTransferencias mt 
    ON mt.CodigoTransferencia = rc.CodigoTransferencia
WHERE rc.NoLote = 2  
ORDER BY 
    rc.Estatus, 
    rc.DestinoAnterior;

-- Consulta 3: Desglose de pallets/cajas asociadas con y sin asignación de Pallet
SELECT
    mc.Pallet,
    mc.Ubicacion,
    (
        SELECT COUNT(DISTINCT Caja)
        FROM TMaestroCajas
        WHERE Pallet = mc.Pallet
    ) AS cajaspallet,
    (
        SELECT COUNT(DISTINCT Caja)
        FROM TMaestroCajas
        WHERE Caja = rc.CajaAReasignar
    ) AS cajasreasignar
FROM TReasignaCajas rc
INNER JOIN TMaestroCajas mc
    ON rc.CajaAReasignar = mc.Caja
WHERE mc.Pallet IS NOT NULL 
  AND rc.NoLote = 1
  AND rc.DestinoAnterior = 3000
GROUP BY
    mc.Pallet,
    mc.Ubicacion,
    rc.CajaAReasignar

UNION

SELECT
    rc.CajaAReasignar AS Pallet,
    mc.Ubicacion,
    (
        SELECT COUNT(*)
        FROM TMaestroCajas
        WHERE Pallet = mc.Pallet
    ) AS cajaspallet,
    (
        SELECT COUNT(DISTINCT Caja)
        FROM TMaestroCajas
        WHERE Caja = rc.CajaAReasignar
    ) AS cajasreasignar
FROM TReasignaCajas rc
INNER JOIN TMaestroCajas mc
    ON rc.CajaAReasignar = mc.Caja
WHERE mc.Pallet IS NULL 
  AND rc.NoLote = 1
  AND rc.DestinoAnterior = 3000;
GO



-- Lista global de reasignaciones
EXEC sp_consulta_reasignacion @numero_proceso = 1, @usuario = '406991';
EXEC sp_consulta_reasignacion @numero_proceso = 1, @numero_lote = 1, @usuario = '406991';

-- Detalle por lote
EXEC sp_consulta_reasignacion @numero_proceso = 2, @numero_lote = 1, @usuario = '406991';
EXEC sp_consulta_reasignacion @numero_proceso = 2, @numero_lote = 2, @usuario = '406991';

-- Detalle de palet de acuerdo al lote y destino anterior
 EXEC sp_consulta_reasignacion @numero_proceso = 3, @numero_lote = 1, @destino_anterior = 3000 ,@usuario = '406991';
 EXEC sp_consulta_reasignacion @numero_proceso = 3, @numero_lote = 1, @destino_anterior = 3071 ,@usuario = '406991';
 EXEC sp_consulta_reasignacion @numero_proceso = 3, @numero_lote = 1, @destino_anterior = 3380 ,@usuario = '406991';
 EXEC sp_consulta_reasignacion @numero_proceso = 3, @numero_lote = 1, @destino_anterior = 3582 ,@usuario = '406991';

 EXEC sp_consulta_reasignacion @numero_proceso = 3, @numero_lote = 2, @destino_anterior = 3380 ,@usuario = '406991';


