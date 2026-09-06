-- ============================================================================
-- MIGRACIÓN: Trazabilidad de empresa y usuario en movimientos de caja
-- y relleno de los datos de prueba con la empresa y usuario por defecto.
--
-- 1) cajeromovdet gana `UsuarioIdCreacion` e `IdEmpresa` para saber quién y
--    en qué empresa se registró cada movimiento de caja.
-- 2) Los datos de prueba existentes (empresa 1, admin) se rellenan en todas
--    las tablas de negocio que tienen las columnas correspondientes, para que
--    cualquier movimiento/reporte tenga trazabilidad.
-- Idempotente: se puede ejecutar varias veces sin error.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Columnas de trazabilidad en cajeromovdet (idempotente)
-- ---------------------------------------------------------------------------

SET @tiene = (SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'cajeromovdet'
                AND COLUMN_NAME = 'UsuarioIdCreacion');
SET @sql = IF(@tiene = 0,
  'ALTER TABLE cajeromovdet ADD COLUMN UsuarioIdCreacion INT NULL AFTER NroDocumentoProveedor',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @tiene = (SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'cajeromovdet'
                AND COLUMN_NAME = 'IdEmpresa');
SET @sql = IF(@tiene = 0,
  'ALTER TABLE cajeromovdet ADD COLUMN IdEmpresa INT NULL AFTER UsuarioIdCreacion',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 2. Relleno de datos de prueba: empresa 1 y usuario admin (UsuarioId 3)
--    Solo toca filas sin valor (NULL o 0). Los UPDATE son idempotentes.
-- ---------------------------------------------------------------------------

-- Empresa por defecto (IdEmpresa = 1)
UPDATE ajustes_inventario           SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE ajustes_inventario_detalle   SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE alertascontroles             SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE antecedentes                 SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE archivoshistoriaclinica      SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE bodegas                      SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE cajeromov                    SET idEmpresa = 1 WHERE idEmpresa IS NULL OR idEmpresa = 0;
UPDATE cajeromovdet                 SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE citas                        SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE citas_productos              SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE clientes                     SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE compras                      SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE compras_detalle              SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE consentimientoinformado      SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE controles                    SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE detallerecetas               SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE diagnosticos                 SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE examenfisico                 SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE historiasclinicas            SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE inventario                   SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE kardex                       SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE lotes                        SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE mascotas                     SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE pedido                       SET idEmpresa = 1 WHERE idEmpresa IS NULL OR idEmpresa = 0;
UPDATE productos                    SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE proveedores                  SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE recetas                      SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE registroanestesico           SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE registropostoperatorio       SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE registropreoperatorio        SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE sedestiendas                 SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE servicios                    SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE signosvitales                SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE tipodocumento                SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE tipoimpuesto                 SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE tipomovcaja                  SET idEmpresa = 1 WHERE idEmpresa IS NULL OR idEmpresa = 0;
UPDATE traslados                    SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE traslados_detalle            SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE vendedores                   SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE ventas                       SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE ventas_detalle               SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;
UPDATE veterinarios                 SET IdEmpresa = 1 WHERE IdEmpresa IS NULL OR IdEmpresa = 0;

-- Usuario que crea la operación (usuario admin = UsuarioId 3)
UPDATE ajustes_inventario      SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE alertascontroles        SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE antecedentes            SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE archivoshistoriaclinica SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE cajeromov               SET idUsuario = 3 WHERE idUsuario IS NULL;
UPDATE cajeromovdet            SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE cirugias                SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE citas                   SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE clientes                SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE compras                 SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE controles               SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE diagnosticos            SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE historiasclinicas       SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE kardex                  SET UsuarioId = 3 WHERE UsuarioId IS NULL;
UPDATE mascotas                SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE pedido                  SET IdUsuario = 3 WHERE IdUsuario IS NULL;
UPDATE procedimientos          SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE productos               SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE proveedores             SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE recetas                 SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE registroanestesico      SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE registropostoperatorio  SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE registropreoperatorio   SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE servicios               SET IdUsuarioCreacion = 3 WHERE IdUsuarioCreacion IS NULL;
UPDATE traslados               SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE tratamientos            SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE ventas                  SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;
UPDATE veterinarios            SET UsuarioIdCreacion = 3 WHERE UsuarioIdCreacion IS NULL;