-- ============================================================================
-- MIGRACIÓN: Vendedor, tipo de pago e impuesto (%) en Ventas
-- Agrega a la tabla `ventas`:
--   - IdVendedor         : usuario del sistema que realiza la venta
--   - TipoPago           : EFECTIVO / TARJETA / TRANSFERENCIA / OTRO
--   - PorcentajeImpuesto : % de IVA aplicado sobre el subtotal (ej. 19)
-- Además hace que el número de venta (V-N) sea consecutivo POR EMPRESA,
-- cambiando el único (NumeroVenta) por (NumeroVenta, IdEmpresa).
-- Idempotente: se puede ejecutar varias veces sin error.
-- ============================================================================

-- ventas.IdVendedor
SET @tiene = (SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'ventas'
                AND COLUMN_NAME = 'IdVendedor');
SET @sql = IF(@tiene = 0,
  'ALTER TABLE ventas ADD COLUMN IdVendedor INT NULL
     COMMENT ''Usuario vendedor'' AFTER IdBodega',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ventas.TipoPago
SET @tiene = (SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'ventas'
                AND COLUMN_NAME = 'TipoPago');
SET @sql = IF(@tiene = 0,
  'ALTER TABLE ventas ADD COLUMN TipoPago VARCHAR(50) NULL
     COMMENT ''Efectivo, tarjeta, transferencia, otro'' AFTER IdVendedor',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ventas.PorcentajeImpuesto
SET @tiene = (SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'ventas'
                AND COLUMN_NAME = 'PorcentajeImpuesto');
SET @sql = IF(@tiene = 0,
  'ALTER TABLE ventas ADD COLUMN PorcentajeImpuesto DECIMAL(5,2) NOT NULL DEFAULT 0
     COMMENT ''% de IVA aplicado'' AFTER TipoPago',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Índice único del número de venta por empresa
-- (V-1 genera una secuencia por cada empresa; antes era global)
SET @tieneViejo = (SELECT COUNT(*) FROM information_schema.STATISTICS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'ventas'
                     AND INDEX_NAME = 'uk_venta_numero');
SET @tieneNuevo = (SELECT COUNT(*) FROM information_schema.STATISTICS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'ventas'
                     AND INDEX_NAME = 'uk_venta_numero_empresa');
SET @sql = IF(@tieneNuevo = 0 AND @tieneViejo = 1,
  'ALTER TABLE ventas
     DROP INDEX uk_venta_numero,
     ADD UNIQUE KEY uk_venta_numero_empresa (NumeroVenta, IdEmpresa)',
  IF(@tieneNuevo = 0,
    'ALTER TABLE ventas
       ADD UNIQUE KEY uk_venta_numero_empresa (NumeroVenta, IdEmpresa)',
    'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;