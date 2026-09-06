-- ============================================================================
-- MIGRACIÓN: Tipos de pago por empresa
-- Crea la tabla `tipospago` (catálogo multiempresa de medios de pago usados en
-- Ventas) y siembra los 4 valores por defecto (EFECTIVO, TARJETA,
-- TRANSFERENCIA, OTRO) para TODAS las empresas existentes.
--   * El valor `Nombre` es el que se guarda en ventas.TipoPago.
--   * Idempotente: se puede ejecutar varias veces sin error.
-- ============================================================================

CREATE TABLE IF NOT EXISTS tipospago (
    Id                  INT AUTO_INCREMENT PRIMARY KEY,
    Nombre              VARCHAR(50)  NOT NULL,
    Descripcion         VARCHAR(100) NULL,
    Activo              TINYINT(1)   NOT NULL DEFAULT 1,
    FechaCreacion       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FechaModificacion   DATETIME     NULL,
    UsuarioIdCreacion   INT          NULL,
    UsuarioIdModificacion INT        NULL,
    IdEmpresa           INT          NULL,
    KEY idx_tipospago_empresa (IdEmpresa, Activo)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Seed por defecto para cada empresa existente (idempotente)
INSERT INTO tipospago (Nombre, Descripcion, Activo, IdEmpresa)
SELECT v.Nombre, v.Descripcion, 1, e.IdEmpresa
FROM empresas e
JOIN (
    SELECT 'EFECTIVO'      AS Nombre, 'Pago en efectivo'         AS Descripcion
    UNION ALL SELECT 'TARJETA',        'Pago con tarjeta'
    UNION ALL SELECT 'TRANSFERENCIA',  'Transferencia bancaria'
    UNION ALL SELECT 'OTRO',           'Otro medio de pago'
) v ON 1 = 1
WHERE NOT EXISTS (
    SELECT 1 FROM tipospago t
    WHERE t.IdEmpresa = e.IdEmpresa AND t.Nombre = v.Nombre
);