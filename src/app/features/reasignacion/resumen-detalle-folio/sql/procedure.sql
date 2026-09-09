-----------------------------------------------------------------------
--                  Consultas de Reasignaciones:
--
--  1.- Obtener información general hacerca de las reasignaciones, 
--  a partir  de un  numero de lote y fecha o intervalos de fecha.
--
--  2.- Obtener  detalles  de  reasignacion  a partir de numero de
--  lote especificado.
--
--  3.- Obtener  detalles  de  pallet  a  partir del lote y tienda
--  (destino_anterior). 
--
--  (RESUMEN DE REASIGNACIONES POR LOTE Y FECHA)
--      EXEC sp_consulta_reasignacion 
--           @numero_proceso = 1, 
--           @usuario = '406991';
--
--      EXEC sp_consulta_reasignacion 
--           @numero_proceso = 1, 
--           @numero_lote = 1, 
--           @usuario = '406991';
--
--  (DETALLE DE REASIGNACIONES POR LOTE):
--      EXEC sp_consulta_reasignacion 
--           @numero_proceso = 2, 
--           @numero_lote = 1, 
--           @usuario = '406991';
--
--      EXEC sp_consulta_reasignacion 
--          @numero_proceso = 2, 
--          @numero_lote = 2, 
--          @usuario = '406991';
--
--  (DETALLE DE REASIGNACIONES-PALLET POR NUMERO DE LOTE)
--      EXEC sp_consulta_reasignacion
--           @numero_proceso = 3, 
--           @numero_lote = 1, 
--           @destino_anterior = 3000 ,
--           @usuario = '406991';
--
--      EXEC sp_consulta_reasignacion 
--          @numero_proceso = 3,
--          @numero_lote = 1,
--          @destino_anterior = 3582 ,
--          @usuario = '406991';
--
--      EXEC sp_consulta_reasignacion 
--          @numero_proceso = 3, 
--          @numero_lote = 2, 
--          @destino_anterior = 3380 ,
--          @usuario = '406991';
-----------------------------------------------------------------------

CREATE OR ALTER PROCEDURE sp_consulta_reasignacion
(
    @numero_proceso     INT,
    @numero_lote        INT = NULL,
    @destino_anterior   INT = NULL,
    @fecha_inicio       DATE = NULL,
    @fecha_fin          DATE = NULL,
    @usuario            VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY

        -----------------------------------------------------------------------
        -- CÓDIGOS DE ERROR
        --
        --  0  = Operación correcta
        -- -1  = numero_proceso obligatorio
        -- -2  = usuario obligatorio
        -- -3  = numero_lote obligatorio
        -- -4  = destino_anterior obligatorio
        -- -5  = numero_proceso inválido
        -----------------------------------------------------------------------

        -----------------------------------------------------------------------
        -- VALIDACIONES GENERALES
        -----------------------------------------------------------------------

        IF @numero_proceso IS NULL
        BEGIN
            SELECT
                -1 AS error_id,
                'El parametro @numero_proceso es obligatorio.' AS error_msg;
            RETURN;
        END;

        IF @usuario IS NULL
           OR LTRIM(RTRIM(@usuario)) = ''
        BEGIN
            SELECT
                -2 AS error_id,
                'El parametro @usuario es obligatorio.' AS error_msg;
            RETURN;
        END;

        -----------------------------------------------------------------------
        -- VALIDAR PROCESO
        -----------------------------------------------------------------------

        IF @numero_proceso NOT IN (1, 2, 3)
        BEGIN
            SELECT
                -5 AS error_id,
                'El valor de @numero_proceso no es valido. Los valores permitidos son 1, 2 y 3.' AS error_msg;
            RETURN;
        END;

        -----------------------------------------------------------------------
        -- PROCESO 1

            -- Retorna:
               -- fecha                 DATETIME
               -- numero_lote           INT
               -- tiendas               INT
               -- cajas_por_reasignar   INT
               -- cajas_reasignadas     INT

        -----------------------------------------------------------------------

        IF @numero_proceso = 1
        BEGIN
            SELECT
                FechaAgregado AS fecha,
                NoLote AS numero_lote,
                COUNT(DISTINCT DestinoNuevo) AS tiendas,
                COUNT(*) AS cajas_por_reasignar,
                SUM(
                    CASE
                        WHEN Estatus = 'RA' THEN 1
                        ELSE 0
                    END
                ) AS cajas_reasignadas
            FROM TReasignaCajas
            WHERE
                (
                    @fecha_inicio IS NULL
                    OR FechaAgregado >= @fecha_inicio
                )
                AND
                (
                    @fecha_fin IS NULL
                    OR FechaAgregado <= @fecha_fin
                )
                AND
                (
                    @numero_lote IS NULL
                    OR NoLote = @numero_lote
                )
            GROUP BY
                FechaAgregado,
                NoLote
            ORDER BY
                FechaAgregado DESC,
                NoLote;

            RETURN;
        END;

        -----------------------------------------------------------------------
        -- PROCESO 2

            -- Requiere:
                -- numero_lote              INT
        --
            -- Retorna:               
                -- fecha                    DATE
                -- numero_lote              INT
                -- caja_a_reasignar         VARCHAR
                -- numero_de_ordenes        INT
                -- caja_nueva               VARCHAR
                -- codigo_transferencia     INT
                -- estatus                  VARCHAR
                -- clave_tienda_origen      VARCHAR
                -- destino_anterior         INT
                -- destino_nuevo            INT
                -- fecha_reasignacion       DATETIME
                -- usuario_que_reasigno     VARCHAR
        -----------------------------------------------------------------------

        IF @numero_proceso = 2
        BEGIN
            IF @numero_lote IS NULL
            BEGIN
                SELECT
                    -3 AS error_id,
                    'El parametro @numero_lote es obligatorio para el proceso 2.' AS error_msg;
                RETURN;
            END;

            SELECT
                rc.FechaAgregado        AS fecha,
                rc.NoLote               AS numero_lote,
                rc.CajaAReasignar       AS caja_a_reasignar,
                rc.NumeroOrdenes        AS numero_de_ordenes,
                rc.CajaNueva            AS caja_nueva,
                rc.CodigoTransferencia  AS codigo_transferencia,
                rc.Estatus              AS estatus,
                mt.ClaveTiendaOrigen    AS clave_tienda_origen,
                rc.DestinoAnterior      AS destino_anterior,
                rc.DestinoNuevo         AS destino_nuevo,
                rc.FechaReasignacion    AS fecha_reasignacion,
                rc.UsuarioReasigno      AS usuario_que_reasigno
            FROM TReasignaCajas rc
            LEFT OUTER JOIN TMaestroTransferencias mt
                ON mt.CodigoTransferencia = rc.CodigoTransferencia
            WHERE rc.NoLote = @numero_lote
            ORDER BY
                rc.Estatus,
                rc.DestinoAnterior;

            RETURN;
        END;

        -----------------------------------------------------------------------
        -- PROCESO 3

            -- Requiere:
                -- numero_lote          INT
                -- destino_anterior     INT
        --
                -- Retorna:
                -- pallet               VARCHAR
                -- ubicacion            VARCHAR
                -- cajas_pallet         INT
                -- cajas_a_reasignar    INT
            -----------------------------------------------------------------------

        IF @numero_proceso = 3
        BEGIN

            IF @numero_lote IS NULL
            BEGIN
                SELECT
                    -3 AS error_id,
                    'El parametro @numero_lote es obligatorio para el proceso 3.' AS error_msg;
                RETURN;
            END;

            IF @destino_anterior IS NULL
            BEGIN
                SELECT
                    -4 AS error_id,
                    'El parametro @destino_anterior es obligatorio para el proceso 3.' AS error_msg;
                RETURN;
            END;

            -------------------------------------------------------------------
            -- Cajas que pertenecen a un pallet
            -------------------------------------------------------------------

            SELECT
                mc.Pallet AS pallet,
                mc.Ubicacion AS ubicacion,
                (
                    SELECT COUNT(DISTINCT Caja)
                    FROM TMaestroCajas
                    WHERE Pallet = mc.Pallet
                ) AS cajas_pallet,
                (
                    SELECT COUNT(DISTINCT Caja)
                    FROM TMaestroCajas
                    WHERE Caja = rc.CajaAReasignar
                ) AS cajas_a_reasignar
            FROM TReasignaCajas rc
            INNER JOIN TMaestroCajas mc
                ON rc.CajaAReasignar = mc.Caja
            WHERE mc.Pallet IS NOT NULL
              AND rc.NoLote = @numero_lote
              AND rc.DestinoAnterior = @destino_anterior
            GROUP BY
                mc.Pallet,
                mc.Ubicacion,
                rc.CajaAReasignar

            UNION

            -------------------------------------------------------------------
            -- Cajas que NO pertenecen a un pallet
            -------------------------------------------------------------------

            SELECT
                rc.CajaAReasignar AS pallet,
                mc.Ubicacion AS ubicacion,
                (
                    SELECT COUNT(*)
                    FROM TMaestroCajas
                    WHERE Pallet = mc.Pallet
                ) AS cajas_pallet,
                (
                    SELECT COUNT(DISTINCT Caja)
                    FROM TMaestroCajas
                    WHERE Caja = rc.CajaAReasignar
                ) AS cajas_a_reasignar
            FROM TReasignaCajas rc
            INNER JOIN TMaestroCajas mc
                ON rc.CajaAReasignar = mc.Caja
            WHERE mc.Pallet IS NULL
              AND rc.NoLote = @numero_lote
              AND rc.DestinoAnterior = @destino_anterior;

            RETURN;
        END;

    END TRY
    BEGIN CATCH

        -----------------------------------------------------------------------
        -- ERROR INTERNO DE SQL SERVER
        -----------------------------------------------------------------------

        SELECT
            ERROR_NUMBER() AS error_id,
            ERROR_MESSAGE() AS error_msg;

    END CATCH;
END;
GO