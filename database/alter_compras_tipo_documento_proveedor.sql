-- ============================================================================
-- MIGRACIÓN: Tipo de documento y número de documento del proveedor en compras.
--   * compras.TipoDocumento          : tipo de documento del proveedor
--     (opcional, ej. Factura, Nota crédito, etc.) para exportar a SIIGO/NovaSoft.
--   * compras.NumeroDocumentoProveedor: número del documento del proveedor
--     (opcional, ej. factura o número de cruce) para exportar a SIIGO/NovaSoft.
-- Idempotente: se puede ejecutar varias veces sin error.
-- ============================================================================

-- 1) compras.TipoDocumento
SET @t1 = (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'compras'
             AND COLUMN_NAME = 'TipoDocumento');
SET @s1 = IF(@t1 = 0,
  'ALTER TABLE compras
     ADD COLUMN TipoDocumento VARCHAR(30) NULL
       COMMENT ''Tipo de documento del proveedor (opcional, ej. Factura)'' AFTER MetodoPago',
  'SELECT 1');
PREPARE st1 FROM @s1; EXECUTE st1; DEALLOCATE PREPARE st1;

-- 2) compras.NumeroDocumentoProveedor
SET @t2 = (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'compras'
             AND COLUMN_NAME = 'NumeroDocumentoProveedor');
SET @s2 = IF(@t2 = 0,
  'ALTER TABLE compras
     ADD COLUMN NumeroDocumentoProveedor VARCHAR(50) NULL
       COMMENT ''Número del documento del proveedor (opcional)'' AFTER TipoDocumento',
  'SELECT 1');
PREPARE st2 FROM @s2; EXECUTE st2; DEALLOCATE PREPARE st2;