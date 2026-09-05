-- ============================================================================
-- MIGRACIÓN: "Apertura y control de caja" por empresa
-- Agrega a la tabla `empresas` el indicador UsaControlCaja. El módulo CAJA
-- sólo se muestra en el menú cuando la empresa tiene este control activado.
-- Idempotente: se puede ejecutar varias veces sin error.
-- ============================================================================

SET @tiene = (SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'empresas'
                AND COLUMN_NAME = 'UsaControlCaja');
SET @sql = IF(@tiene = 0,
  'ALTER TABLE empresas
     ADD COLUMN UsaControlCaja TINYINT(1) NOT NULL DEFAULT 0
       COMMENT ''Apertura y control de caja'' AFTER Activo',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;