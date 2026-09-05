-- ============================================================================
-- BISSVET - MÓDULO DE INVENTARIO, KARDEX Y VENTAS
-- Modelo de datos completo (Fase 1)
--
-- Método de valoración: COSTO PROMEDIO PONDERADO (CPP)
--   * CPP por Producto + Bodega (recomendación del documento)
--   * Kardex inmutable como fuente de verdad
--   * CostoUnitario congelado en cada DetalleVenta (rentabilidad histórica)
--
-- Las tablas heredadas (productos, inventario, movimientos_inventario,
-- compras, compras_detalle, ventas, ventasdetalle, lotes, proveedores,
-- ventasimprticket) están vacías y sin uso de código; se reemplazan.
-- ============================================================================

USE BissVet;

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- ELIMINA TABLAS HEREDADAS QUE SERÁN REEMPLAZADAS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS ventasimprticket;
DROP TABLE IF EXISTS ventasdetalle;
DROP TABLE IF EXISTS compras_detalle;
DROP TABLE IF EXISTS movimientos_inventario;
DROP TABLE IF EXISTS inventario;
DROP TABLE IF EXISTS lotes;
DROP TABLE IF EXISTS compras;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS marcas;
DROP TABLE IF EXISTS unidades_medida;
DROP TABLE IF EXISTS proveedores;

-- ============================================================================
-- 1. CATEGORÍAS DE PRODUCTOS
-- ============================================================================
CREATE TABLE categoriasproducto (
  IdCategoriaProducto INT NOT NULL AUTO_INCREMENT,
  Nombre              VARCHAR(100) NOT NULL,
  Descripcion         VARCHAR(300) NULL,
  Activo              TINYINT(1)   NOT NULL DEFAULT 1,
  FechaCreacion       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdCreacion   INT          NULL,
  FechaModificacion   DATETIME     NULL,
  UsuarioIdModificacion INT        NULL,
  PRIMARY KEY (IdCategoriaProducto),
  UNIQUE KEY uk_categoria_nombre (Nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- DATOS BÁSICOS: CATEGORÍAS DE PRODUCTOS
-- ----------------------------------------------------------------------------
INSERT INTO categoriasproducto (Nombre, Descripcion) VALUES
  ('Alimento',          'Alimentos y dietas para mascotas'),
  ('Farmacéutico',      'Medicamentos veterinarios'),
  ('Suplementos',       'Vitaminas, probióticos y suplementos'),
  ('Higiene',           'Productos de limpieza y cuidado'),
  ('Accesorios',        'Accesorios para mascotas'),
  ('Equipos',           'Equipos e insumos clínicos');

-- ============================================================================
-- 2. MARCAS DE PRODUCTOS
-- ============================================================================
CREATE TABLE marcas (
  Id                 INT            NOT NULL AUTO_INCREMENT,
  Nombre             VARCHAR(100)   NOT NULL,
  Descripcion        VARCHAR(300)   NULL,
  Activo             TINYINT(1)     NOT NULL DEFAULT 1,
  FechaCreacion      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdCreacion  INT            NULL,
  FechaModificacion  DATETIME       NULL,
  UsuarioIdModificacion INT         NULL,
  PRIMARY KEY (Id),
  UNIQUE KEY uk_marca_nombre (Nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 3. UNIDADES DE MEDIDA
-- ============================================================================
CREATE TABLE unidades_medida (
  Id                 INT            NOT NULL AUTO_INCREMENT,
  Unidad             VARCHAR(20)    NOT NULL,
  Descripcion        VARCHAR(100)   NULL,
  Activo             TINYINT(1)     NOT NULL DEFAULT 1,
  FechaCreacion      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdCreacion  INT            NULL,
  FechaModificacion  DATETIME       NULL,
  UsuarioIdModificacion INT         NULL,
  PRIMARY KEY (Id),
  UNIQUE KEY uk_unidad_medida_nombre (Unidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- DATOS BÁSICOS: MARCAS Y UNIDADES DE MEDIDA
-- ----------------------------------------------------------------------------
INSERT INTO marcas (Nombre, Descripcion) VALUES
  ('Royal Canin',    'Alimentos y nutrición veterinaria'),
  ('Hill''s',        'Nutrición clínica veterinaria'),
  ('Bayer',          'Productos farmacéuticos veterinarios'),
  ('Virbac',         'Productos farmacéuticos y dermatología');

INSERT INTO unidades_medida (Unidad, Descripcion) VALUES
  ('Unidad',     'Pieza individual'),
  ('Caja',       'Contenedor de varias unidades'),
  ('Blister',    'Empaque de tabletas o cápsulas'),
  ('Frasco',     'Envase de líquidos o solución'),
  ('Bolsa',      'Empaque sellado'),
  ('Kilogramo',  'Peso'),
  ('Litro',      'Volumen'),
  ('Mililitro',  'Volumen pequeño');

-- ============================================================================
-- 4. PRODUCTOS
-- ============================================================================
CREATE TABLE productos (
  IdProducto         INT            NOT NULL AUTO_INCREMENT,
  CodigoProducto     VARCHAR(50)    NOT NULL,
  CodigoBarras       VARCHAR(50)    NULL,
  NombreProducto     VARCHAR(150)   NOT NULL,
  Descripcion        VARCHAR(500)   NULL,
  IdCategoriaProducto INT           NOT NULL,
  IdUnidadMedida     INT            NULL,
  IdMarca            INT            NULL,
  Referencia         VARCHAR(100)   NULL,
  PrecioVenta        DECIMAL(18,4)  NOT NULL DEFAULT 0,
  CostoActual        DECIMAL(18,4)  NOT NULL DEFAULT 0,
  CostoPromedio      DECIMAL(18,4)  NOT NULL DEFAULT 0,
  StockMinimo        DECIMAL(18,4)  NOT NULL DEFAULT 0,
  StockMaximo        DECIMAL(18,4)  NOT NULL DEFAULT 0,
  ManejaInventario   TINYINT(1)     NOT NULL DEFAULT 1,
  PermiteVenta       TINYINT(1)     NOT NULL DEFAULT 1,
  Activo             TINYINT(1)     NOT NULL DEFAULT 1,
  FechaCreacion      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdCreacion  INT            NULL,
  FechaModificacion  DATETIME       NULL,
  UsuarioIdModificacion INT         NULL,
  PRIMARY KEY (IdProducto),
  UNIQUE KEY uk_producto_codigo (CodigoProducto),
  KEY ix_producto_categoria (IdCategoriaProducto),
  KEY ix_producto_marca (IdMarca),
  KEY ix_producto_unidad (IdUnidadMedida),
  CONSTRAINT fk_producto_categoria FOREIGN KEY (IdCategoriaProducto)
    REFERENCES categoriasproducto (IdCategoriaProducto),
  CONSTRAINT fk_producto_marca FOREIGN KEY (IdMarca)
    REFERENCES marcas (Id),
  CONSTRAINT fk_producto_unidad FOREIGN KEY (IdUnidadMedida)
    REFERENCES unidades_medida (Id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 5. LOTES (diseño preparado para Fase 6: vencimientos y lotes)
-- ============================================================================
CREATE TABLE lotes (
  IdLote            INT            NOT NULL AUTO_INCREMENT,
  IdProducto        INT            NOT NULL,
  NumeroLote        VARCHAR(100)   NOT NULL,
  FechaFabricacion  DATE           NULL,
  FechaVencimiento  DATE           NULL,
  CantidadInicial   DECIMAL(18,4)  NOT NULL DEFAULT 0,
  CantidadActual    DECIMAL(18,4)  NOT NULL DEFAULT 0,
  CostoUnitario     DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Activo            TINYINT(1)     NOT NULL DEFAULT 1,
  FechaCreacion     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (IdLote),
  KEY ix_lote_producto (IdProducto),
  KEY ix_lote_vencimiento (FechaVencimiento),
  CONSTRAINT fk_lote_producto FOREIGN KEY (IdProducto)
    REFERENCES productos (IdProducto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 6. INVENTARIO (existencias por PRODUCTO + BODEGA)
-- ============================================================================
CREATE TABLE inventario (
  IdInventario         BIGINT         NOT NULL AUTO_INCREMENT,
  IdProducto           INT            NOT NULL,
  IdBodega             INT            NOT NULL,
  IdLote               INT            NULL,
  Cantidad             DECIMAL(18,4)  NOT NULL DEFAULT 0,
  CostoPromedio        DECIMAL(18,4)  NOT NULL DEFAULT 0,
  CostoTotal           DECIMAL(18,4)  NOT NULL DEFAULT 0,
  FechaUltimoMovimiento DATETIME      NULL,
  Activo               TINYINT(1)     NOT NULL DEFAULT 1,
  PRIMARY KEY (IdInventario),
  UNIQUE KEY uk_inventario_prod_bod (IdProducto, IdBodega),
  KEY ix_inventario_bodega (IdBodega),
  KEY ix_inventario_lote (IdLote),
  CONSTRAINT fk_inventario_producto FOREIGN KEY (IdProducto)
    REFERENCES productos (IdProducto),
  CONSTRAINT fk_inventario_bodega FOREIGN KEY (IdBodega)
    REFERENCES bodegas (Id),
  CONSTRAINT fk_inventario_lote FOREIGN KEY (IdLote)
    REFERENCES lotes (IdLote)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 7. KARDEX (inmutable, fuente de verdad del inventario)
-- ============================================================================
CREATE TABLE kardex (
  IdKardex             BIGINT         NOT NULL AUTO_INCREMENT,
  Fecha                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  IdProducto           INT            NOT NULL,
  IdBodega             INT            NOT NULL,
  IdLote               INT            NULL,
  TipoMovimiento       ENUM('INVENTARIO_INICIAL','COMPRA','ENTRADA','VENTA',
                            'SALIDA','AJUSTE_POSITIVO','AJUSTE_NEGATIVO',
                            'DEVOLUCION_COMPRA','DEVOLUCION_VENTA',
                            'TRASLADO_ENTRADA','TRASLADO_SALIDA',
                            'CONSUMO_INTERNO','OTRO') NOT NULL,
  DocumentoTipo        VARCHAR(30)    NOT NULL,
  IdDocumento          BIGINT         NULL,
  EntradaCantidad      DECIMAL(18,4)  NOT NULL DEFAULT 0,
  EntradaCostoUnitario DECIMAL(18,4)  NOT NULL DEFAULT 0,
  EntradaCostoTotal    DECIMAL(18,4)  NOT NULL DEFAULT 0,
  SalidaCantidad       DECIMAL(18,4)  NOT NULL DEFAULT 0,
  SalidaCostoUnitario  DECIMAL(18,4)  NOT NULL DEFAULT 0,
  SalidaCostoTotal     DECIMAL(18,4)  NOT NULL DEFAULT 0,
  SaldoCantidad        DECIMAL(18,4)  NOT NULL DEFAULT 0,
  CostoPromedio        DECIMAL(18,4)  NOT NULL DEFAULT 0,
  SaldoValor           DECIMAL(18,4)  NOT NULL DEFAULT 0,
  UsuarioId            INT            NULL,
  Observaciones        VARCHAR(500)   NULL,
  PRIMARY KEY (IdKardex),
  KEY ix_kardex_prod_bod_fecha (IdProducto, IdBodega, Fecha),
  KEY ix_kardex_documento (DocumentoTipo, IdDocumento),
  KEY ix_kardex_tipo (TipoMovimiento),
  KEY ix_kardex_lote (IdLote),
  CONSTRAINT fk_kardex_producto FOREIGN KEY (IdProducto)
    REFERENCES productos (IdProducto),
  CONSTRAINT fk_kardex_bodega FOREIGN KEY (IdBodega)
    REFERENCES bodegas (Id),
  CONSTRAINT fk_kardex_lote FOREIGN KEY (IdLote)
    REFERENCES lotes (IdLote)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 8. PROVEEDORES
-- ============================================================================
CREATE TABLE proveedores (
  IdProveedor          INT            NOT NULL AUTO_INCREMENT,
  TipoDocumento        VARCHAR(20)    NULL,
  NumeroDocumento      VARCHAR(30)    NULL,
  Nit                  VARCHAR(30)    NULL,
  Nombre               VARCHAR(150)   NOT NULL,
  Telefono             VARCHAR(30)    NULL,
  Email                VARCHAR(150)   NULL,
  Direccion            VARCHAR(250)   NULL,
  IdCiudad             INT            NULL,
  Contacto             VARCHAR(100)   NULL,
  Activo               TINYINT(1)     NOT NULL DEFAULT 1,
  FechaCreacion        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdCreacion    INT            NULL,
  FechaModificacion    DATETIME       NULL,
  UsuarioIdModificacion INT           NULL,
  PRIMARY KEY (IdProveedor),
  KEY ix_proveedor_ciudad (IdCiudad),
  CONSTRAINT fk_proveedor_ciudad FOREIGN KEY (IdCiudad)
    REFERENCES ciudades (Id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 9. COMPRAS / ENTRADAS DE INVENTARIO
-- ============================================================================
CREATE TABLE compras (
  IdCompra             BIGINT         NOT NULL AUTO_INCREMENT,
  Numero               VARCHAR(50)    NOT NULL,
  IdProveedor          INT            NOT NULL,
  IdBodega             INT            NOT NULL,
  Fecha                DATE           NOT NULL,
  Subtotal             DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Descuento            DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Impuesto             DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Total                DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Estado               ENUM('BORRADOR','CONFIRMADA','ANULADA') NOT NULL DEFAULT 'BORRADOR',
  Observaciones        VARCHAR(500)   NULL,
  UsuarioIdCreacion    INT            NULL,
  FechaCreacion        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdConfirmacion INT           NULL,
  FechaConfirmacion    DATETIME       NULL,
  UsuarioIdAnulacion   INT            NULL,
  FechaAnulacion       DATETIME       NULL,
  PRIMARY KEY (IdCompra),
  UNIQUE KEY uk_compra_numero (Numero),
  KEY ix_compra_proveedor (IdProveedor),
  KEY ix_compra_bodega (IdBodega),
  KEY ix_compra_fecha (Fecha),
  KEY ix_compra_estado (Estado),
  CONSTRAINT fk_compra_proveedor FOREIGN KEY (IdProveedor)
    REFERENCES proveedores (IdProveedor),
  CONSTRAINT fk_compra_bodega FOREIGN KEY (IdBodega)
    REFERENCES bodegas (Id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE compras_detalle (
  IdDetalleCompra      BIGINT         NOT NULL AUTO_INCREMENT,
  IdCompra             BIGINT         NOT NULL,
  IdProducto           INT            NOT NULL,
  IdLote               INT            NULL,
  Cantidad             DECIMAL(18,4)  NOT NULL,
  CostoUnitario        DECIMAL(18,4)  NOT NULL,
  Descuento            DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Impuesto             DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Total                DECIMAL(18,4)  NOT NULL DEFAULT 0,
  PRIMARY KEY (IdDetalleCompra),
  KEY ix_compradetalle_compra (IdCompra),
  KEY ix_compradetalle_producto (IdProducto),
  KEY ix_compradetalle_lote (IdLote),
  CONSTRAINT fk_compradetalle_compra FOREIGN KEY (IdCompra)
    REFERENCES compras (IdCompra),
  CONSTRAINT fk_compradetalle_producto FOREIGN KEY (IdProducto)
    REFERENCES productos (IdProducto),
  CONSTRAINT fk_compradetalle_lote FOREIGN KEY (IdLote)
    REFERENCES lotes (IdLote)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 10. VENTAS
-- ============================================================================
CREATE TABLE ventas (
  IdVenta              BIGINT         NOT NULL AUTO_INCREMENT,
  NumeroVenta          VARCHAR(50)    NOT NULL,
  Fecha                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  IdCliente            INT            NOT NULL,
  IdMascota            INT            NULL,
  IdBodega             INT            NOT NULL,
  Subtotal             DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Descuento            DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Impuesto             DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Total                DECIMAL(18,4)  NOT NULL DEFAULT 0,
  CostoTotal           DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Utilidad             DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Estado               ENUM('BORRADOR','CONFIRMADA','ANULADA') NOT NULL DEFAULT 'BORRADOR',
  Observaciones        VARCHAR(500)   NULL,
  UsuarioIdCreacion    INT            NULL,
  FechaCreacion        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdConfirmacion INT           NULL,
  FechaConfirmacion    DATETIME       NULL,
  UsuarioIdAnulacion   INT            NULL,
  FechaAnulacion       DATETIME       NULL,
  PRIMARY KEY (IdVenta),
  UNIQUE KEY uk_venta_numero (NumeroVenta),
  KEY ix_venta_cliente (IdCliente),
  KEY ix_venta_mascota (IdMascota),
  KEY ix_venta_bodega (IdBodega),
  KEY ix_venta_fecha (Fecha),
  KEY ix_venta_estado (Estado),
  CONSTRAINT fk_venta_cliente FOREIGN KEY (IdCliente)
    REFERENCES clientes (ClienteId),
  CONSTRAINT fk_venta_mascota FOREIGN KEY (IdMascota)
    REFERENCES mascotas (IdMascota),
  CONSTRAINT fk_venta_bodega FOREIGN KEY (IdBodega)
    REFERENCES bodegas (Id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Detalle de venta: guarda CostoUnitario congelado del momento de la venta
CREATE TABLE ventas_detalle (
  IdDetalleVenta       BIGINT         NOT NULL AUTO_INCREMENT,
  IdVenta              BIGINT         NOT NULL,
  IdProducto           INT            NOT NULL,
  Cantidad             DECIMAL(18,4)  NOT NULL,
  PrecioUnitario       DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Descuento            DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Impuesto             DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Total                DECIMAL(18,4)  NOT NULL DEFAULT 0,
  CostoUnitario        DECIMAL(18,4)  NOT NULL DEFAULT 0,
  CostoTotal           DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Utilidad             DECIMAL(18,4)  NOT NULL DEFAULT 0,
  PRIMARY KEY (IdDetalleVenta),
  KEY ix_ventadetalle_venta (IdVenta),
  KEY ix_ventadetalle_producto (IdProducto),
  CONSTRAINT fk_ventadetalle_venta FOREIGN KEY (IdVenta)
    REFERENCES ventas (IdVenta),
  CONSTRAINT fk_ventadetalle_producto FOREIGN KEY (IdProducto)
    REFERENCES productos (IdProducto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 11. TRASLADOS ENTRE BODEGAS
-- ============================================================================
CREATE TABLE traslados (
  IdTraslado           BIGINT         NOT NULL AUTO_INCREMENT,
  Numero               VARCHAR(50)    NOT NULL,
  IdBodegaOrigen       INT            NOT NULL,
  IdBodegaDestino      INT            NOT NULL,
  Fecha                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Estado               ENUM('BORRADOR','CONFIRMADA','ANULADA') NOT NULL DEFAULT 'BORRADOR',
  Observaciones        VARCHAR(500)   NULL,
  UsuarioIdCreacion    INT            NULL,
  FechaCreacion        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdConfirmacion INT           NULL,
  FechaConfirmacion    DATETIME       NULL,
  UsuarioIdAnulacion   INT            NULL,
  FechaAnulacion       DATETIME       NULL,
  PRIMARY KEY (IdTraslado),
  UNIQUE KEY uk_traslado_numero (Numero),
  KEY ix_traslado_origen (IdBodegaOrigen),
  KEY ix_traslado_destino (IdBodegaDestino),
  CONSTRAINT fk_traslado_origen FOREIGN KEY (IdBodegaOrigen)
    REFERENCES bodegas (Id),
  CONSTRAINT fk_traslado_destino FOREIGN KEY (IdBodegaDestino)
    REFERENCES bodegas (Id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE traslados_detalle (
  IdTrasladoDetalle    BIGINT         NOT NULL AUTO_INCREMENT,
  IdTraslado           BIGINT         NOT NULL,
  IdProducto           INT            NOT NULL,
  Cantidad             DECIMAL(18,4)  NOT NULL,
  CostoUnitario        DECIMAL(18,4)  NOT NULL DEFAULT 0,
  PRIMARY KEY (IdTrasladoDetalle),
  KEY ix_trasladodetalle_traslado (IdTraslado),
  KEY ix_trasladodetalle_producto (IdProducto),
  CONSTRAINT fk_trasladodetalle_traslado FOREIGN KEY (IdTraslado)
    REFERENCES traslados (IdTraslado),
  CONSTRAINT fk_trasladodetalle_producto FOREIGN KEY (IdProducto)
    REFERENCES productos (IdProducto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 12. AJUSTES DE INVENTARIO
-- ============================================================================
CREATE TABLE ajustes_inventario (
  IdAjuste             BIGINT         NOT NULL AUTO_INCREMENT,
  Numero               VARCHAR(50)    NOT NULL,
  IdBodega             INT            NOT NULL,
  Fecha                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  TipoAjuste           ENUM('POSITIVO','NEGATIVO') NOT NULL,
  Estado               ENUM('BORRADOR','CONFIRMADA','ANULADA') NOT NULL DEFAULT 'BORRADOR',
  Motivo               VARCHAR(300)   NOT NULL,
  Observaciones        VARCHAR(500)   NULL,
  UsuarioIdCreacion    INT            NULL,
  FechaCreacion        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdConfirmacion INT           NULL,
  FechaConfirmacion    DATETIME       NULL,
  UsuarioIdAnulacion   INT            NULL,
  FechaAnulacion       DATETIME       NULL,
  PRIMARY KEY (IdAjuste),
  UNIQUE KEY uk_ajuste_numero (Numero),
  KEY ix_ajuste_bodega (IdBodega),
  CONSTRAINT fk_ajuste_bodega FOREIGN KEY (IdBodega)
    REFERENCES bodegas (Id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE ajustes_inventario_detalle (
  IdAjusteDetalle      BIGINT         NOT NULL AUTO_INCREMENT,
  IdAjuste             BIGINT         NOT NULL,
  IdProducto           INT            NOT NULL,
  Cantidad             DECIMAL(18,4)  NOT NULL,
  CostoUnitario        DECIMAL(18,4)  NOT NULL DEFAULT 0,
  PRIMARY KEY (IdAjusteDetalle),
  KEY ix_ajustedetalle_ajuste (IdAjuste),
  KEY ix_ajustedetalle_producto (IdProducto),
  CONSTRAINT fk_ajustedetalle_ajuste FOREIGN KEY (IdAjuste)
    REFERENCES ajustes_inventario (IdAjuste),
  CONSTRAINT fk_ajustedetalle_producto FOREIGN KEY (IdProducto)
    REFERENCES productos (IdProducto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 13. DEVOLUCIONES DE VENTA
-- ============================================================================
CREATE TABLE devoluciones_venta (
  IdDevolucionVenta    BIGINT         NOT NULL AUTO_INCREMENT,
  Numero               VARCHAR(50)    NOT NULL,
  IdVenta              BIGINT         NOT NULL,
  IdCliente            INT            NULL,
  IdBodega             INT            NOT NULL,
  Fecha                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Estado               ENUM('BORRADOR','CONFIRMADA','ANULADA') NOT NULL DEFAULT 'BORRADOR',
  Observaciones        VARCHAR(500)   NULL,
  UsuarioIdCreacion    INT            NULL,
  FechaCreacion        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdConfirmacion INT           NULL,
  FechaConfirmacion    DATETIME       NULL,
  UsuarioIdAnulacion   INT            NULL,
  FechaAnulacion       DATETIME       NULL,
  PRIMARY KEY (IdDevolucionVenta),
  UNIQUE KEY uk_devventa_numero (Numero),
  KEY ix_devventa_venta (IdVenta),
  KEY ix_devventa_bodega (IdBodega),
  CONSTRAINT fk_devventa_venta FOREIGN KEY (IdVenta)
    REFERENCES ventas (IdVenta),
  CONSTRAINT fk_devventa_bodega FOREIGN KEY (IdBodega)
    REFERENCES bodegas (Id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE devoluciones_venta_detalle (
  IdDevolucionVentaDetalle BIGINT     NOT NULL AUTO_INCREMENT,
  IdDevolucionVenta    BIGINT         NOT NULL,
  IdProducto           INT            NOT NULL,
  Cantidad             DECIMAL(18,4)  NOT NULL,
  CostoUnitario        DECIMAL(18,4)  NOT NULL DEFAULT 0,
  PrecioUnitario       DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Total                DECIMAL(18,4)  NOT NULL DEFAULT 0,
  PRIMARY KEY (IdDevolucionVentaDetalle),
  KEY ix_devventadetalle_dev (IdDevolucionVenta),
  KEY ix_devventadetalle_producto (IdProducto),
  CONSTRAINT fk_devventadetalle_dev FOREIGN KEY (IdDevolucionVenta)
    REFERENCES devoluciones_venta (IdDevolucionVenta),
  CONSTRAINT fk_devventadetalle_producto FOREIGN KEY (IdProducto)
    REFERENCES productos (IdProducto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 14. DEVOLUCIONES A PROVEEDOR
-- ============================================================================
CREATE TABLE devoluciones_compra (
  IdDevolucionCompra   BIGINT         NOT NULL AUTO_INCREMENT,
  Numero               VARCHAR(50)    NOT NULL,
  IdCompra             BIGINT         NOT NULL,
  IdProveedor          INT            NULL,
  IdBodega             INT            NOT NULL,
  Fecha                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Estado               ENUM('BORRADOR','CONFIRMADA','ANULADA') NOT NULL DEFAULT 'BORRADOR',
  Observaciones        VARCHAR(500)   NULL,
  UsuarioIdCreacion    INT            NULL,
  FechaCreacion        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdConfirmacion INT           NULL,
  FechaConfirmacion    DATETIME       NULL,
  UsuarioIdAnulacion   INT            NULL,
  FechaAnulacion       DATETIME       NULL,
  PRIMARY KEY (IdDevolucionCompra),
  UNIQUE KEY uk_devcompra_numero (Numero),
  KEY ix_devcompra_compra (IdCompra),
  KEY ix_devcompra_proveedor (IdProveedor),
  KEY ix_devcompra_bodega (IdBodega),
  CONSTRAINT fk_devcompra_compra FOREIGN KEY (IdCompra)
    REFERENCES compras (IdCompra),
  CONSTRAINT fk_devcompra_proveedor FOREIGN KEY (IdProveedor)
    REFERENCES proveedores (IdProveedor),
  CONSTRAINT fk_devcompra_bodega FOREIGN KEY (IdBodega)
    REFERENCES bodegas (Id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE devoluciones_compra_detalle (
  IdDevolucionCompraDetalle BIGINT   NOT NULL AUTO_INCREMENT,
  IdDevolucionCompra   BIGINT         NOT NULL,
  IdProducto           INT            NOT NULL,
  Cantidad             DECIMAL(18,4)  NOT NULL,
  CostoUnitario        DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Total                DECIMAL(18,4)  NOT NULL DEFAULT 0,
  PRIMARY KEY (IdDevolucionCompraDetalle),
  KEY ix_devcompradetalle_dev (IdDevolucionCompra),
  KEY ix_devcompradetalle_producto (IdProducto),
  CONSTRAINT fk_devcompradetalle_dev FOREIGN KEY (IdDevolucionCompra)
    REFERENCES devoluciones_compra (IdDevolucionCompra),
  CONSTRAINT fk_devcompradetalle_producto FOREIGN KEY (IdProducto)
    REFERENCES productos (IdProducto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 15. INTEGRACIÓN CON CITAS: PRODUCTOS CONSUMIDOS EN LA CITA (Fase 6)
-- ============================================================================
CREATE TABLE citas_productos (
  IdCitaProducto       BIGINT         NOT NULL AUTO_INCREMENT,
  IdCita               INT            NOT NULL,
  IdProducto           INT            NOT NULL,
  Cantidad             DECIMAL(18,4)  NOT NULL DEFAULT 0,
  PrecioUnitario       DECIMAL(18,4)  NOT NULL DEFAULT 0,
  Observaciones        VARCHAR(500)   NULL,
  FechaCreacion        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (IdCitaProducto),
  KEY ix_citaprod_cita (IdCita),
  KEY ix_citaprod_producto (IdProducto),
  CONSTRAINT fk_citaprod_cita FOREIGN KEY (IdCita)
    REFERENCES citas (IdCita),
  CONSTRAINT fk_citaprod_producto FOREIGN KEY (IdProducto)
    REFERENCES productos (IdProducto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 16. SEGURIDAD Y PERMISOS (integración con módulos existentes)
-- ============================================================================
INSERT INTO modulos (NombreModulo)
SELECT 'Inventario' WHERE NOT EXISTS (SELECT 1 FROM modulos WHERE NombreModulo = 'Inventario');
INSERT INTO modulos (NombreModulo)
SELECT 'Ventas' WHERE NOT EXISTS (SELECT 1 FROM modulos WHERE NombreModulo = 'Ventas');

INSERT IGNORE INTO permisos (Codigo, Nombre, Descripcion, Modulo, Activo) VALUES
('INV_CONSULTAR',          'Consultar inventario',        'Consultar existencias e inventario',          'Inventario', 1),
('INV_CREAR_PRODUCTO',     'Crear productos',             'Crear productos en el catálogo',              'Inventario', 1),
('INV_MODIFICAR_PRODUCTO', 'Modificar productos',         'Modificar productos del catálogo',            'Inventario', 1),
('INV_ADMIN_BODEGAS',      'Administrar bodegas',         'Administrar bodegas e inventario',            'Inventario', 1),
('INV_CREAR_COMPRA',       'Crear compras',               'Crear compras y entradas de inventario',      'Inventario', 1),
('INV_CONFIRMAR_COMPRA',   'Confirmar compras',           'Confirmar compras que afectan inventario',    'Inventario', 1),
('INV_KARDEX',             'Consultar Kardex',            'Consultar movimientos de Kardex',             'Inventario', 1),
('INV_AJUSTES',            'Realizar ajustes',            'Realizar ajustes de inventario',              'Inventario', 1),
('INV_TRASLADOS',          'Realizar traslados',          'Realizar traslados entre bodegas',            'Inventario', 1),
('INV_CONSULTAR_COSTOS',   'Consultar costos',            'Consultar costos del inventario',             'Inventario', 1),
('VEN_CREAR_VENTA',        'Crear ventas',                'Crear y confirmar ventas',                    'Ventas', 1),
('VEN_ANULAR_VENTA',       'Anular ventas',               'Anular ventas confirmadas',                   'Ventas', 1),
('VEN_CONSULTAR_UTILIDAD', 'Consultar utilidades',        'Consultar utilidades y rentabilidad',         'Ventas', 1);

SET FOREIGN_KEY_CHECKS = 1;