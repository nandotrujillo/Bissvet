-- ============================================================================
-- MIGRACIÓN: Pagos de compras con dinero de caja (opción B3 híbrido)
--   * compras.MetodoPago    : 'CONTADO' | 'CREDITO' (la mercancía se paga de
--     contado o de forma diferida en cuotas / cuentas por pagar).
--   * compras.SaldoPendiente : saldo que resta por pagar (solo CREDITO).
--   * pagos_compras          : cada cuota / cuenta por pagar de una compra.
--   * pagos_compras_abonos   : cada abono (pago) registrado sobre una cuota,
--     conSu referencia al movimiento de caja (cajeromovdet) cuando se paga
--     con dinero de la caja.
-- Idempotente: se puede ejecutar varias veces sin error.
-- ============================================================================

-- 1) compras.MetodoPago
SET @t1 = (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'compras'
             AND COLUMN_NAME = 'MetodoPago');
SET @s1 = IF(@t1 = 0,
  'ALTER TABLE compras
     ADD COLUMN MetodoPago ENUM(''CONTADO'',''CREDITO'') NOT NULL DEFAULT ''CONTADO''
       COMMENT ''Método de pago de la compra'' AFTER Observaciones',
  'SELECT 1');
PREPARE st1 FROM @s1; EXECUTE st1; DEALLOCATE PREPARE st1;

-- 2) compras.SaldoPendiente
SET @t2 = (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'compras'
             AND COLUMN_NAME = 'SaldoPendiente');
SET @s2 = IF(@t2 = 0,
  'ALTER TABLE compras
     ADD COLUMN SaldoPendiente DECIMAL(18,4) NOT NULL DEFAULT 0
       COMMENT ''Saldo pendiente por pagar (solo CREDITO)'' AFTER MetodoPago',
  'SELECT 1');
PREPARE st2 FROM @s2; EXECUTE st2; DEALLOCATE PREPARE st2;

-- 3) pagos_compras (cuotas / cuentas por pagar)
CREATE TABLE IF NOT EXISTS pagos_compras (
  IdPagoCompra     BIGINT AUTO_INCREMENT PRIMARY KEY,
  IdCompra         BIGINT       NOT NULL,
  IdEmpresa        INT          NOT NULL,
  NumeroCuota      INT          NOT NULL DEFAULT 1,
  ValorCuota       DECIMAL(18,4) NOT NULL DEFAULT 0,
  SaldoPendiente   DECIMAL(18,4) NOT NULL DEFAULT 0,
  FechaVencimiento DATE         NULL,
  Estado           ENUM('PENDIENTE','PAGADA','CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
  UsuarioIdCreacion INT         NULL,
  FechaCreacion    DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
  FechaPagoCompleto DATETIME    NULL,
  CONSTRAINT fk_pc_compra FOREIGN KEY (IdCompra) REFERENCES compras(IdCompra) ON DELETE CASCADE,
  KEY idx_pc_compra (IdCompra),
  KEY idx_pc_empresa (IdEmpresa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) pagos_compras_abonos (cada pago/abono sobre una cuota)
CREATE TABLE IF NOT EXISTS pagos_compras_abonos (
  IdAbono          BIGINT AUTO_INCREMENT PRIMARY KEY,
  IdPagoCompra     BIGINT       NOT NULL,
  IdCompra         BIGINT       NOT NULL,
  IdEmpresa        INT          NOT NULL,
  ValorAbono       DECIMAL(18,4) NOT NULL DEFAULT 0,
  FechaAbono       DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
  IdCajaMov        INT          NULL,            -- referencia a cajeromovdet si paga con caja
  MetodoCaja       TINYINT(1)   NOT NULL DEFAULT 0,  -- 1 = salió del fondo de caja
  UsuarioIdCreacion INT         NULL,
  FechaCreacion    DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pca_pagocompra FOREIGN KEY (IdPagoCompra) REFERENCES pagos_compras(IdPagoCompra) ON DELETE CASCADE,
  KEY idx_pca_pagocompra (IdPagoCompra),
  KEY idx_pca_compra (IdCompra),
  KEY idx_pca_empresa (IdEmpresa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
