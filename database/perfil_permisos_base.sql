-- =============================================================================
-- Matriz predeterminada de permisos por perfil (paquete canónico)
-- =============================================================================
-- Tabla que define el "paquete" oficial de permisos para cada perfil operativo.
-- Se usa para:
--   1) Restaurar los permisos a predeterminados (endpoint restaurar) y
--   2) Sincronizar automáticamente perfilpermisos/rolpermisos al crear usuarios.
--
-- Incluye los 6 perfiles operativos (Veterinario..Gerente).
-- EXCLUYE: Administrador (1) y SUPERADMIN (8): estos no necesitan paquete,
-- por diseño nadie puede quitarles permisos.
-- =============================================================================

CREATE TABLE IF NOT EXISTS perfil_permisos_base (
    IdPerfil  INT NOT NULL,
    IdPermiso INT NOT NULL,
    PRIMARY KEY (IdPerfil, IdPermiso),
    CONSTRAINT fk_ppb_perfil  FOREIGN KEY (IdPerfil)  REFERENCES perfiles(IdPerfil)  ON DELETE CASCADE,
    CONSTRAINT fk_ppb_permiso FOREIGN KEY (IdPermiso) REFERENCES permisos(IdPermiso) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Paquete predeterminado de permisos por perfil';

-- -----------------------------------------------------------------------------
-- Perfil 2 · Veterinario: atención clínica e historias clínicas
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO perfil_permisos_base (IdPerfil, IdPermiso) VALUES
(2, 16), (2, 17), (2, 18),                                    -- CLIENTES consultar/crear/editar
(2, 20), (2, 21), (2, 22),                                    -- MASCOTAS consultar/crear/editar
(2, 24),                                                       -- VETERINARIOS consultar
(2, 28), (2, 29), (2, 30), (2, 32),                           -- CITAS consultar/crear/editar/aprobar
(2, 33), (2, 34), (2, 35), (2, 36), (2, 38), (2, 39),         -- HISTORIA consultar/crear/editar/cerrar/imprimir/exportar
(2, 40),                                                       -- SERVICIOS consultar
(2, 170);                                                      -- FACTURACION.SERVICIOS

-- -----------------------------------------------------------------------------
-- Perfil 3 · Vendedor: ventas y atención al cliente
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO perfil_permisos_base (IdPerfil, IdPermiso) VALUES
(3, 7),                                                        -- EMPRESAS consultar
(3, 16), (3, 17), (3, 18),                                    -- CLIENTES consultar/crear/editar
(3, 20), (3, 21), (3, 22),                                    -- MASCOTAS consultar/crear/editar
(3, 24),                                                       -- VETERINARIOS consultar
(3, 28),                                                       -- CITAS consultar
(3, 40),                                                       -- SERVICIOS consultar
(3, 44),                                                       -- PRODUCTOS consultar
(3, 48),                                                       -- BODEGAS consultar
(3, 77), (3, 78), (3, 79),                                    -- CAJA consultar/abrir/cerrar
(3, 166),                                                      -- TIPOS_PAGO consultar
(3, 171),                                                      -- PROVEEDORES consultar
(3, 63), (3, 64), (3, 65), (3, 66), (3, 67), (3, 68), (3, 69), (3, 70), -- VENTAS consultar/crear/editar/confirmar/anular/devolver/imprimir/exportar
(3, 58);                                                       -- COMPRAS consultar

-- -----------------------------------------------------------------------------
-- Perfil 4 · Auxiliar: apoyo administrativo y operativo
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO perfil_permisos_base (IdPerfil, IdPermiso) VALUES
(4, 7),                                                        -- EMPRESAS consultar
(4, 16), (4, 17), (4, 18),                                    -- CLIENTES consultar/crear/editar
(4, 20), (4, 21), (4, 22),                                    -- MASCOTAS consultar/crear/editar
(4, 24),                                                       -- VETERINARIOS consultar
(4, 28), (4, 29), (4, 30),                                    -- CITAS consultar/crear/editar
(4, 40),                                                       -- SERVICIOS consultar
(4, 44),                                                       -- PRODUCTOS consultar
(4, 48),                                                       -- BODEGAS consultar
(4, 77),                                                       -- CAJA consultar
(4, 166),                                                      -- TIPOS_PAGO consultar
(4, 171),                                                      -- PROVEEDORES consultar
(4, 58), (4, 59),                                              -- COMPRAS consultar/crear
(4, 63), (4, 64),                                              -- VENTAS consultar/crear
(4, 52),                                                       -- INVENTARIO consultar
(4, 170);                                                      -- FACTURACION.SERVICIOS

-- -----------------------------------------------------------------------------
-- Perfil 5 · Bodeguero: gestión de inventarios
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO perfil_permisos_base (IdPerfil, IdPermiso) VALUES
(5, 7),                                                        -- EMPRESAS consultar
(5, 44), (5, 45), (5, 46),                                    -- PRODUCTOS consultar/crear/editar
(5, 48), (5, 49), (5, 50),                                    -- BODEGAS consultar/crear/editar
(5, 52), (5, 53), (5, 54), (5, 55), (5, 56), (5, 57),         -- INVENTARIO consultar/entrada/salida/ajustar/trasladar/costo
(5, 171),                                                      -- PROVEEDORES consultar
(5, 58),                                                       -- COMPRAS consultar
(5, 63),                                                       -- VENTAS consultar
(5, 71);                                                       -- REPORTES consultar

-- -----------------------------------------------------------------------------
-- Perfil 6 · Recepcionista: citas y recepción
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO perfil_permisos_base (IdPerfil, IdPermiso) VALUES
(6, 7),                                                        -- EMPRESAS consultar
(6, 16), (6, 17), (6, 18),                                    -- CLIENTES consultar/crear/editar
(6, 20), (6, 21), (6, 22),                                    -- MASCOTAS consultar/crear/editar
(6, 24),                                                       -- VETERINARIOS consultar
(6, 28), (6, 29), (6, 30),                                    -- CITAS consultar/crear/editar
(6, 40),                                                       -- SERVICIOS consultar
(6, 44),                                                       -- PRODUCTOS consultar
(6, 48),                                                       -- BODEGAS consultar
(6, 166),                                                      -- TIPOS_PAGO consultar
(6, 63),                                                       -- VENTAS consultar
(6, 170);                                                      -- FACTURACION.SERVICIOS

-- -----------------------------------------------------------------------------
-- Perfil 7 · Gerente: dirección y reportes
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO perfil_permisos_base (IdPerfil, IdPermiso) VALUES
(7, 7),                                                        -- EMPRESAS consultar
(7, 16),                                                       -- CLIENTES consultar
(7, 20),                                                       -- MASCOTAS consultar
(7, 24),                                                       -- VETERINARIOS consultar
(7, 28),                                                       -- CITAS consultar
(7, 33),                                                       -- HISTORIA consultar
(7, 40),                                                       -- SERVICIOS consultar
(7, 44),                                                       -- PRODUCTOS consultar
(7, 48),                                                       -- BODEGAS consultar
(7, 52),                                                       -- INVENTARIO consultar
(7, 58),                                                       -- COMPRAS consultar
(7, 63),                                                       -- VENTAS consultar
(7, 77),                                                       -- CAJA consultar
(7, 166),                                                      -- TIPOS_PAGO consultar
(7, 171),                                                      -- PROVEEDORES consultar
(7, 74),                                                       -- AUDITORIA consultar
(7, 71), (7, 72), (7, 73),                                    -- REPORTES consultar/exportar/imprimir
(7, 170);                                                      -- FACTURACION.SERVICIOS