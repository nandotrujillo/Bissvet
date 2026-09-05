-- =============================================================================
-- BISSVET - MAESTRO DE SEGURIDAD Y ADMINISTRACIÓN (CONSOLIDADO)
-- =============================================================================
-- Sistema: BissVet | Módulo: Seguridad y Administración | Versión: 2.0
-- Motor:   MySQL 8.0  |  Fecha: 05/09/2026
--
--  ✔ SE CONSERVAN TODAS LAS ENTIDADES MySQL YA EXISTENTES  ✔
--  Todos los DROP están condicionados o eliminados: este script SOLO
--  crea lo que falta y completa lo existente. Es 100% idempotente y
--  puede ejecutarse varias veces sin dañar datos.
--
--  Estructura por FASES (según documento de requerimientos, sección 31):
--   FASE 1 : EMPRESA + asociación con Usuarios ............ (RF-001, RF-002)
--   FASE 2 : Seguridad básica (Usuarios, Perfiles, Roles,
--            UsuarioRoles) .................................. (RF-003..RF-005)
--   FASE 3 : Módulos, Permisos, RolPermisos, PerfilPermisos .. (RF-006, RF-007)
--   FASE 4 : Autenticación (JWT, bcrypt, Sesiones, parámetros
--            de seguridad) ................................. (RF-018..RF-020)
--   FASE 5 : Autorización (permisos directos al usuario,
--            matriz de permisos, SUPERADMIN) .............. (RF-010, RF-022)
--   FASE 6 : Auditoría ....................................... (RF-017)
--   FASE 7 : Aislamiento por empresa (IdEmpresa transversal
--            en todas las entidades de negocio) .............. (RF-013)
--
--  Orden de dependencias respetado:
--   modulos    -> permisos    -> rolpermisos / perfilpermisos / usuariopermisos
--   empresas   -> usuarios    -> usuarioroles / sesiones / auditoria
--   perfiles   -> usuarios / perfilpermisos
--                 usuarios  (*) rolpermisos    (*) roles   (*) empresas
-- =============================================================================

USE BissVet;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- FASE 1 - EMPRESA
-- La empresa es el propietario de la información (renta multi-tenant).
-- Solo se crea si no existe. No se tocan datos existentes.
-- =============================================================================

CREATE TABLE IF NOT EXISTS empresas (
  IdEmpresa            INT           NOT NULL AUTO_INCREMENT,
  CodigoEmpresa        VARCHAR(20)   NOT NULL,
  Nit                  VARCHAR(20)   NOT NULL,
  RazonSocial          VARCHAR(200)  NOT NULL,
  NombreComercial      VARCHAR(200)  NOT NULL,
  TipoDocumento        VARCHAR(20)   NULL,
  Direccion            VARCHAR(300)  NULL,
  Telefono             VARCHAR(30)   NULL,
  Correo               VARCHAR(120)  NULL,
  IdCiudad             INT           NULL,
  Logo                 VARCHAR(500)  NULL COMMENT 'Ruta/URL del logo',
  Activo               TINYINT(1)    NOT NULL DEFAULT 1,
  UsaControlCaja       TINYINT(1)    NOT NULL DEFAULT 0 COMMENT 'Apertura y control de caja',
  FechaCreacion        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdCreacion    INT           NULL,
  FechaModificacion    DATETIME      NULL,
  UsuarioIdModificacion INT          NULL,
  PRIMARY KEY (IdEmpresa),
  UNIQUE KEY uk_empresa_codigo (CodigoEmpresa),
  UNIQUE KEY uk_empresa_nit (Nit),
  KEY idx_empresa_activo (Activo),
  KEY idx_empresa_ciudad (IdCiudad),
  CONSTRAINT fk_empresa_ciudad FOREIGN KEY (IdCiudad)
    REFERENCES ciudades(Id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- DATOS BÁSICOS: empresa de ejemplo (insert idempotente)
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO empresas
  (CodigoEmpresa, Nit, RazonSocial, NombreComercial, TipoDocumento,
   Direccion, Telefono, Correo, Activo)
VALUES
  ('EMP001', '900123456-7', 'Veterinaria Los Amigos SAS',
   'Veterinaria Los Amigos', 'NIT',
   'Calle 1 # 2-3', '3001234567', 'contacto@losamigos.com', 1);

-- Procedimiento auxiliar: agrega una columna SOLO si no existe (idempotente)
DROP PROCEDURE IF EXISTS bissvet_add_column;
DELIMITER $$
CREATE PROCEDURE bissvet_add_column(IN p_tabla VARCHAR(64), IN p_columna VARCHAR(64), IN p_def TEXT)
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = p_tabla
          AND COLUMN_NAME  = p_columna
    ) THEN
        SELECT CONCAT('OK (ya existía):  ', p_tabla, '.', p_columna) AS aviso;
    ELSE
        SET @ddl = CONCAT('ALTER TABLE `', p_tabla, '` ADD COLUMN ', p_def);
        PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
        SELECT CONCAT('AGREGADA:          ', p_tabla, '.', p_columna) AS aviso;
    END IF;
END$$
DELIMITER ;

-- Procedimiento auxiliar: agrega IdEmpresa + índice + FK si no existe
DROP PROCEDURE IF EXISTS bissvet_add_idempresa;
DELIMITER $$
CREATE PROCEDURE bissvet_add_idempresa(IN p_tabla VARCHAR(64), IN p_indice VARCHAR(64))
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
    SELECT CONCAT('AVISO: la tabla [', p_tabla, '] no se pudo procesar (¿no existe o FK inválida?)') AS aviso;

  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_tabla
      AND COLUMN_NAME = 'IdEmpresa'
  ) THEN
    SELECT CONCAT(p_tabla, ': IdEmpresa ya existe (sin cambios)') AS aviso;
  ELSE
    SET @ddl = CONCAT(
      'ALTER TABLE `', p_tabla, '` ',
      'ADD COLUMN IdEmpresa INT NULL, ',
      'ADD INDEX `', p_indice, '` (IdEmpresa)'
    );
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

    SET @ddl = CONCAT(
      'ALTER TABLE `', p_tabla, '` ',
      'ADD CONSTRAINT `fk_', p_tabla, '_empresa` ',
      'FOREIGN KEY (IdEmpresa) REFERENCES empresas(IdEmpresa)'
    );
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

    SELECT CONCAT(p_tabla, ': IdEmpresa + índice + FK agregados') AS aviso;
  END IF;
END$$
DELIMITER ;

SELECT 'FASE 1 (EMPRESA) OK' AS estado;

-- =============================================================================
-- FASE 2 - SEGURIDAD BÁSICA
-- Perfiles, Usuarios (completos), Roles y UsuarioRoles
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2.1 PERFILES - función general del usuario en la empresa (nivel sistema)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfiles (
  IdPerfil             INT          NOT NULL AUTO_INCREMENT,
  Nombre               VARCHAR(100) NOT NULL,
  Descripcion          VARCHAR(300) NULL,
  Activo               TINYINT(1)   NOT NULL DEFAULT 1,
  FechaCreacion        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdCreacion    INT          NULL,
  FechaModificacion    DATETIME     NULL,
  UsuarioIdModificacion INT         NULL,
  PRIMARY KEY (IdPerfil),
  UNIQUE KEY uk_perfil_nombre (Nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-004: perfiles (función del usuario)';

INSERT IGNORE INTO perfiles (Nombre, Descripcion) VALUES
  ('Administrador',   'Administración total de la empresa (RF-021)'),
  ('Veterinario',     'Atención clínica y historias clínicas'),
  ('Vendedor',        'Ventas y atención al cliente'),
  ('Auxiliar',        'Apoyo administrativo y operativo'),
  ('Bodeguero',       'Gestión de inventarios'),
  ('Recepcionista',   'Citas y recepción'),
  ('Gerente',         'Dirección y reportes'),
  ('SUPERADMIN',      'Administra todo el sistema y las empresas (RF-022)');

-- -----------------------------------------------------------------------------
-- 2.2 USUARIOS - se CREA si no existe, y se COMPLETA con todos los campos
--     del requerimiento (sección 6 del documento). Nunca password en claro.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Usuarios (
  UsuarioId            INT           NOT NULL AUTO_INCREMENT,
  IdEmpresa            INT           NULL,
  IdPerfil             INT           NULL,
  Username             VARCHAR(50)   NOT NULL,
  PasswordHash         VARCHAR(255)  NOT NULL COMMENT 'bcrypt, NUNCA texto plano (RN-015)',
  Nombre               VARCHAR(120)  NULL,
  Correo               VARCHAR(120)  NULL,
  Telefono             VARCHAR(15)   NULL,
  TipoDocumento        VARCHAR(20)   NULL,
  NumeroDocumento      VARCHAR(30)   NULL,
  PrimerNombre         VARCHAR(60)   NULL,
  SegundoNombre        VARCHAR(60)   NULL,
  PrimerApellido       VARCHAR(60)   NULL,
  SegundoApellido      VARCHAR(60)   NULL,
  Activo               TINYINT(1)    NOT NULL DEFAULT 1,
  Bloqueado            TINYINT(1)    NOT NULL DEFAULT 0,
  IntentosFallidos     INT           NOT NULL DEFAULT 0,
  FechaUltimoIngreso   DATETIME      NULL,
  UltimoAcceso         DATETIME      NULL,
  FechaCreacion        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdCreacion    INT           NULL,
  FechaModificacion    DATETIME      NULL,
  UsuarioIdModificacion INT          NULL,
  PRIMARY KEY (UsuarioId),
  UNIQUE KEY uk_usuarios_username (Username),
  KEY idx_usuarios_empresa (IdEmpresa),
  KEY idx_usuarios_perfil (IdPerfil),
  CONSTRAINT fk_usuarios_empresa FOREIGN KEY (IdEmpresa) REFERENCES empresas(IdEmpresa),
  CONSTRAINT fk_usuarios_perfil FOREIGN KEY (IdPerfil) REFERENCES perfiles(IdPerfil)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-003: usuarios de la empresa';

-- Completa la estructura si la tabla Ya existía (idempotente)
CALL bissvet_add_column('empresas', 'UsaControlCaja', 'UsaControlCaja TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''Apertura y control de caja''');
CALL bissvet_add_column('Usuarios', 'IdEmpresa',   'IdEmpresa INT NULL');
CALL bissvet_add_column('Usuarios', 'IdPerfil',    'IdPerfil INT NULL');
CALL bissvet_add_column('Usuarios', 'TipoDocumento',   'TipoDocumento VARCHAR(20) NULL');
CALL bissvet_add_column('Usuarios', 'NumeroDocumento', 'NumeroDocumento VARCHAR(30) NULL');
CALL bissvet_add_column('Usuarios', 'PrimerNombre',    'PrimerNombre VARCHAR(60) NULL');
CALL bissvet_add_column('Usuarios', 'SegundoNombre',   'SegundoNombre VARCHAR(60) NULL');
CALL bissvet_add_column('Usuarios', 'PrimerApellido',  'PrimerApellido VARCHAR(60) NULL');
CALL bissvet_add_column('Usuarios', 'SegundoApellido', 'SegundoApellido VARCHAR(60) NULL');
CALL bissvet_add_column('Usuarios', 'Correo',          'Correo VARCHAR(100) NULL');
CALL bissvet_add_column('Usuarios', 'Telefono',        'Telefono VARCHAR(15) NULL');
CALL bissvet_add_column('Usuarios', 'Bloqueado',       'Bloqueado TINYINT(1) NOT NULL DEFAULT 0');
CALL bissvet_add_column('Usuarios', 'IntentosFallidos', 'IntentosFallidos INT NOT NULL DEFAULT 0');
CALL bissvet_add_column('Usuarios', 'FechaUltimoIngreso','FechaUltimoIngreso DATETIME NULL');
CALL bissvet_add_column('Usuarios', 'UltimoAcceso',    'UltimoAcceso DATETIME NULL');
CALL bissvet_add_column('Usuarios', 'FechaCreacion',   'FechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL bissvet_add_column('Usuarios', 'UsuarioIdCreacion','UsuarioIdCreacion INT NULL');
CALL bissvet_add_column('Usuarios', 'FechaModificacion','FechaModificacion DATETIME NULL');
CALL bissvet_add_column('Usuarios', 'UsuarioIdModificacion','UsuarioIdModificacion INT NULL');

-- Índices y FKs de Usuarios (solo si faltan)
DROP PROCEDURE IF EXISTS bissvet_ensure_fk;
DELIMITER $$
CREATE PROCEDURE bissvet_ensure_fk(IN p_tabla VARCHAR(64), IN p_fk VARCHAR(64), IN p_ddl TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = p_tabla
      AND CONSTRAINT_NAME = p_fk
  ) THEN
    SET @ddl = p_ddl;
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    SELECT CONCAT('FK AGREGADA: ', p_tabla, '.', p_fk) AS aviso;
  ELSE
    SELECT CONCAT('OK (ya existía): ', p_tabla, '.', p_fk) AS aviso;
  END IF;
END$$
DELIMITER ;

CALL bissvet_ensure_fk('Usuarios', 'fk_usuarios_empresa',
  'ALTER TABLE Usuarios ADD CONSTRAINT fk_usuarios_empresa FOREIGN KEY (IdEmpresa) REFERENCES empresas(IdEmpresa)');
CALL bissvet_ensure_fk('Usuarios', 'fk_usuarios_perfil',
  'ALTER TABLE Usuarios ADD CONSTRAINT fk_usuarios_perfil FOREIGN KEY (IdPerfil) REFERENCES perfiles(IdPerfil)');

DROP PROCEDURE IF EXISTS bissvet_ensure_index;
DELIMITER $$
CREATE PROCEDURE bissvet_ensure_index(IN p_tabla VARCHAR(64), IN p_indice VARCHAR(64), IN p_ddl TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_tabla
      AND INDEX_NAME = p_indice
  ) THEN
    SET @ddl = p_ddl;
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    SELECT CONCAT('ÍNDICE AGREGADO: ', p_tabla, '.', p_indice) AS aviso;
  ELSE
    SELECT CONCAT('OK (ya existía): ', p_tabla, '.', p_indice) AS aviso;
  END IF;
END$$
DELIMITER ;

CALL bissvet_ensure_index('Usuarios', 'idx_usuarios_empresa', 'ALTER TABLE Usuarios ADD INDEX idx_usuarios_empresa (IdEmpresa)');
CALL bissvet_ensure_index('Usuarios', 'idx_usuarios_perfil',  'ALTER TABLE Usuarios ADD INDEX idx_usuarios_perfil (IdPerfil)');
CALL bissvet_ensure_index('Usuarios', 'idx_usuarios_documento','ALTER TABLE Usuarios ADD INDEX idx_usuarios_documento (NumeroDocumento)');

-- -----------------------------------------------------------------------------
-- 2.3 ROLES - conjunto de permisos, propios de cada empresa.
--    IdEmpresa NULL = rol del sistema (SUPERADMIN).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  IdRol                INT          NOT NULL AUTO_INCREMENT,
  IdEmpresa            INT          NULL,
  Nombre               VARCHAR(100) NOT NULL,
  Descripcion          VARCHAR(300) NULL,
  Activo               TINYINT(1)   NOT NULL DEFAULT 1,
  FechaCreacion        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdCreacion    INT          NULL,
  FechaModificacion    DATETIME     NULL,
  UsuarioIdModificacion INT         NULL,
  PRIMARY KEY (IdRol),
  UNIQUE KEY uk_rol_empresa_nombre (IdEmpresa, Nombre),
  KEY idx_rol_empresa (IdEmpresa),
  CONSTRAINT fk_roles_empresa FOREIGN KEY (IdEmpresa) REFERENCES empresas(IdEmpresa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-005: roles por empresa';

INSERT IGNORE INTO roles (IdEmpresa, Nombre, Descripcion) VALUES
  (1, 'ADMINISTRADOR', 'Acceso total a todos los módulos'),
  (1, 'VETERINARIO',   'Atención clínica y citas'),
  (1, 'VENDEDOR',      'Ventas y atención al cliente'),
  (1, 'AUXILIAR',      'Apoyo administrativo'),
  (1, 'BODEGUERO',     'Inventarios y bodegas'),
  (1, 'RECEPCIONISTA', 'Citas y recepción'),
  (1, 'GERENTE',       'Dirección y reportes');

-- Rol global SUPERADMIN (IdEmpresa NULL aplica a todo el sistema - RF-022)
INSERT INTO roles (IdEmpresa, Nombre, Descripcion)
SELECT NULL, 'SUPERADMIN', 'Administración global del sistema (RF-022)'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE Nombre = 'SUPERADMIN' AND IdEmpresa IS NULL);

-- -----------------------------------------------------------------------------
-- 2.4 USUARIOROLES - un usuario puede tener uno o varios roles (RF-009)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarioroles (
  UsuarioId            INT          NOT NULL,
  IdRol                INT          NOT NULL,
  AsignadoPor          INT          NULL,
  FechaAsignacion      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (UsuarioId, IdRol),
  KEY idx_ur_rol (IdRol),
  CONSTRAINT fk_ur_usuario FOREIGN KEY (UsuarioId) REFERENCES Usuarios(UsuarioId),
  CONSTRAINT fk_ur_rol FOREIGN KEY (IdRol) REFERENCES roles(IdRol),
  CONSTRAINT fk_ur_asignado_por FOREIGN KEY (AsignadoPor) REFERENCES Usuarios(UsuarioId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-009: roles asignados al usuario';

SELECT 'FASE 2 (SEGURIDAD BÁSICA) OK' AS estado;

-- =============================================================================
-- FASE 3 - MÓDULOS Y PERMISOS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.1 MODULOS - se amplía la tabla existente con los campos de seguridad.
--    El código es la pieza central para los permisos.
-- -----------------------------------------------------------------------------
CALL bissvet_add_column('modulos', 'Codigo',       'Codigo VARCHAR(50) NULL');
CALL bissvet_add_column('modulos', 'Descripcion',  'Descripcion VARCHAR(300) NULL');
CALL bissvet_add_column('modulos', 'Ruta',         'Ruta VARCHAR(150) NULL');
CALL bissvet_add_column('modulos', 'Icono',        'Icono VARCHAR(100) NULL');
CALL bissvet_add_column('modulos', 'Orden',        'Orden INT NULL');
CALL bissvet_add_column('modulos', 'Activo',       'Activo TINYINT(1) NOT NULL DEFAULT 1');

UPDATE modulos SET Codigo = CONCAT('MOD_', idModulos)
WHERE Codigo IS NULL OR Codigo = '';

CALL bissvet_ensure_index('modulos', 'uk_modulos_codigo', 'ALTER TABLE modulos ADD UNIQUE KEY uk_modulos_codigo (Codigo)');

-- Catálogo de módulos (idempotente: solo inserta los que faltan)
INSERT IGNORE INTO modulos
  (Codigo, NombreModulo, Descripcion, Ruta, Icono, Orden, Activo) VALUES
  ('SEGURIDAD',        'Seguridad',        'Usuarios, roles y permisos',     '/dashboard/seguridad',      'lock',     1,  1),
  ('EMPRESAS',         'Empresas',         'Mantenimiento de empresas',      '/dashboard/empresas',       'business',  2,  1),
  ('USUARIOS',         'Usuarios',         'Gestión de usuarios',            '/dashboard/usuarios',       'person',    3,  1),
  ('CLIENTES',         'Clientes',         'Gestión de clientes',            '/dashboard/clientes',       'group',     4,  1),
  ('MASCOTAS',         'Mascotas',         'Gestión de mascotas',            '/dashboard/mascotas',       'pets',      5,  1),
  ('VETERINARIOS',     'Veterinarios',     'Gestión de veterinarios',        '/dashboard/veterinarios',   'medical',   6,  1),
  ('CITAS',            'Citas',            'Agenda de citas',                '/dashboard/citas',          'calendar',  7,  1),
  ('HISTORIA_CLINICA', 'Historia Clínica', 'Historias clínicas',             '/dashboard/historiaclinica','folder',    8,  1),
  ('SERVICIOS',        'Servicios',        'Catálogo de servicios',          '/dashboard/servicios',      'healing',   9,  1),
  ('PRODUCTOS',        'Productos',        'Catálogo de productos',          '/dashboard/productos',      'inventory', 10, 1),
  ('BODEGAS',          'Bodegas',          'Gestión de bodegas',             '/dashboard/bodegas',        'warehouse', 11, 1),
  ('INVENTARIOS',      'Inventarios',      'Existencias y movimientos',      '/dashboard/inventario',     'analytics', 12, 1),
  ('COMPRAS',          'Compras',          'Órdenes de compra',              '/dashboard/compras',        'shopping_cart', 13, 1),
  ('VENTAS',           'Ventas',           'Ventas, estados y anulaciones',  '/dashboard/ventas',         'receipt',   14, 1),
  ('CAJA',             'Caja',             'Arqueo y caja',                  '/dashboard/caja',           'payments',  15, 1),
  ('REPORTES',         'Reportes',         'Reportes e indicadores',         '/dashboard/reportes',       'bar_chart', 16, 1),
  ('AUDITORIA',        'Auditoría',        'Trazabilidad de operaciones',    '/dashboard/auditoria',      'history',   17, 1);

-- -----------------------------------------------------------------------------
-- 3.2 PERMISOS - operación específica sobre un módulo (MODULO.ACCION)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permisos (
  IdPermiso            INT          NOT NULL AUTO_INCREMENT,
  IdModulo             INT          NOT NULL,
  Codigo               VARCHAR(60)  NOT NULL,
  Nombre               VARCHAR(100) NOT NULL,
  Descripcion          VARCHAR(300) NULL,
  Activo               TINYINT(1)   NOT NULL DEFAULT 1,
  FechaCreacion        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdCreacion    INT          NULL,
  FechaModificacion    DATETIME     NULL,
  UsuarioIdModificacion INT         NULL,
  PRIMARY KEY (IdPermiso),
  UNIQUE KEY uk_permiso_codigo (Codigo),
  KEY idx_permiso_modulo (IdModulo),
  CONSTRAINT fk_permisos_modulo FOREIGN KEY (IdModulo) REFERENCES modulos(idModulos)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-007: permisos por módulo';

-- Catálogo de permisos por módulo (RF-007, RF-015, RF-016)
INSERT IGNORE INTO permisos (IdModulo, Codigo, Nombre, Descripcion) VALUES
  -- SEGURIDAD
  ((SELECT idModulos FROM modulos WHERE Codigo='SEGURIDAD'), 'SEGURIDAD.CONSULTAR',         'Consultar seguridad',       'Ver usuarios, roles y permisos'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SEGURIDAD'), 'SEGURIDAD.CREAR',            'Crear seguridad',           'Crear elementos de seguridad'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SEGURIDAD'), 'SEGURIDAD.EDITAR',           'Editar seguridad',          'Editar elementos de seguridad'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SEGURIDAD'), 'SEGURIDAD.ELIMINAR',         'Eliminar seguridad',        'Inactivar elementos de seguridad'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SEGURIDAD'), 'SEGURIDAD.ASIGNAR_ROLES',    'Asignar roles a usuarios',  'Administrar usuarioroles'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SEGURIDAD'), 'SEGURIDAD.ASIGNAR_PERMISOS', 'Asignar permisos',         'Administrar rolpermisos'),
  -- EMPRESAS (RF-001)
  ((SELECT idModulos FROM modulos WHERE Codigo='EMPRESAS'),  'EMPRESAS.CONSULTAR',         'Consultar empresas',       'Ver empresas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='EMPRESAS'),  'EMPRESAS.CREAR',             'Crear empresa',            'Registrar empresas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='EMPRESAS'),  'EMPRESAS.EDITAR',            'Editar empresa',           'Modificar empresas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='EMPRESAS'),  'EMPRESAS.ELIMINAR',          'Inactivar empresa',        'Activar/Inactivar empresas'),
  -- USUARIOS (RF-003)
  ((SELECT idModulos FROM modulos WHERE Codigo='USUARIOS'),  'USUARIOS.CONSULTAR',         'Consultar usuarios',       'Ver usuarios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='USUARIOS'),  'USUARIOS.CREAR',             'Crear usuario',            'Registrar usuarios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='USUARIOS'),  'USUARIOS.EDITAR',            'Editar usuario',           'Modificar usuarios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='USUARIOS'),  'USUARIOS.CAMBIAR_CLAVE',     'Cambiar contraseña',       'Cambiar contraseñas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='USUARIOS'),  'USUARIOS.ASIGNAR_EMPRESA',   'Asignar empresa',          'Definir empresa del usuario'),
  ((SELECT idModulos FROM modulos WHERE Codigo='USUARIOS'),  'USUARIOS.BLOQUEAR',          'Bloquear/Desbloquear',     'Bloquear y desbloquear usuarios'),
  -- CLIENTES
  ((SELECT idModulos FROM modulos WHERE Codigo='CLIENTES'),  'CLIENTES.CONSULTAR',         'Consultar clientes',       'Ver listado y detalle de clientes'),
  ((SELECT idModulos FROM modulos WHERE Codigo='CLIENTES'),  'CLIENTES.CREAR',             'Crear cliente',            'Registrar clientes'),
  ((SELECT idModulos FROM modulos WHERE Codigo='CLIENTES'),  'CLIENTES.EDITAR',            'Editar cliente',           'Modificar clientes'),
  ((SELECT idModulos FROM modulos WHERE Codigo='CLIENTES'),  'CLIENTES.ELIMINAR',          'Inactivar cliente',        'Activar/Inactivar clientes'),
  -- MASCOTAS
  ((SELECT idModulos FROM modulos WHERE Codigo='MASCOTAS'),  'MASCOTAS.CONSULTAR',         'Consultar mascotas',       'Ver listado y detalle de mascotas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='MASCOTAS'),  'MASCOTAS.CREAR',             'Crear mascota',            'Registrar mascotas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='MASCOTAS'),  'MASCOTAS.EDITAR',            'Editar mascota',           'Modificar mascotas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='MASCOTAS'),  'MASCOTAS.ELIMINAR',          'Inactivar mascota',        'Activar/Inactivar mascotas'),
  -- VETERINARIOS
  ((SELECT idModulos FROM modulos WHERE Codigo='VETERINARIOS'),'VETERINARIOS.CONSULTAR',   'Consultar veterinarios',   'Ver veterinarios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VETERINARIOS'),'VETERINARIOS.CREAR',       'Crear veterinario',        'Registrar veterinarios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VETERINARIOS'),'VETERINARIOS.EDITAR',      'Editar veterinario',       'Modificar veterinarios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VETERINARIOS'),'VETERINARIOS.ELIMINAR',    'Inactivar veterinario',    'Activar/Inactivar veterinarios'),
  -- CITAS
  ((SELECT idModulos FROM modulos WHERE Codigo='CITAS'),      'CITAS.CONSULTAR',           'Consultar citas',          'Ver citas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='CITAS'),      'CITAS.CREAR',               'Crear cita',               'Programar citas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='CITAS'),      'CITAS.EDITAR',              'Editar cita',              'Reagendar citas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='CITAS'),      'CITAS.ANULAR',              'Anular cita',              'Cancelar citas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='CITAS'),      'CITAS.APROBAR',             'Aprobar cita',             'Confirmar citas'),
  -- HISTORIA CLÍNICA (RF-015)
  ((SELECT idModulos FROM modulos WHERE Codigo='HISTORIA_CLINICA'),'HISTORIA.CONSULTAR',   'Consultar historias',      'Ver historias clínicas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='HISTORIA_CLINICA'),'HISTORIA.CREAR',       'Crear historia',           'Abrir historias clínicas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='HISTORIA_CLINICA'),'HISTORIA.EDITAR',      'Editar historia',          'Modificar historias clínicas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='HISTORIA_CLINICA'),'HISTORIA.CERRAR',      'Cerrar historia',          'Cerrar historias clínicas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='HISTORIA_CLINICA'),'HISTORIA.ANULAR',      'Anular historia',          'Anular historias clínicas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='HISTORIA_CLINICA'),'HISTORIA.IMPRIMIR',    'Imprimir historia',        'Imprimir historias clínicas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='HISTORIA_CLINICA'),'HISTORIA.EXPORTAR',    'Exportar historias',       'Exportar historias clínicas'),
  -- SERVICIOS
  ((SELECT idModulos FROM modulos WHERE Codigo='SERVICIOS'),  'SERVICIOS.CONSULTAR',       'Consultar servicios',      'Ver servicios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SERVICIOS'),  'SERVICIOS.CREAR',           'Crear servicio',           'Registrar servicios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SERVICIOS'),  'SERVICIOS.EDITAR',          'Editar servicio',          'Modificar servicios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SERVICIOS'),  'SERVICIOS.ELIMINAR',        'Inactivar servicio',       'Activar/Inactivar servicios'),
  -- PRODUCTOS
  ((SELECT idModulos FROM modulos WHERE Codigo='PRODUCTOS'),  'PRODUCTOS.CONSULTAR',       'Consultar productos',      'Ver productos'),
  ((SELECT idModulos FROM modulos WHERE Codigo='PRODUCTOS'),  'PRODUCTOS.CREAR',           'Crear producto',           'Registrar productos'),
  ((SELECT idModulos FROM modulos WHERE Codigo='PRODUCTOS'),  'PRODUCTOS.EDITAR',          'Editar producto',          'Modificar productos'),
  ((SELECT idModulos FROM modulos WHERE Codigo='PRODUCTOS'),  'PRODUCTOS.ELIMINAR',        'Inactivar producto',       'Activar/Inactivar productos'),
  -- BODEGAS
  ((SELECT idModulos FROM modulos WHERE Codigo='BODEGAS'),    'BODEGAS.CONSULTAR',         'Consultar bodegas',        'Ver bodegas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='BODEGAS'),    'BODEGAS.CREAR',             'Crear bodega',             'Registrar bodegas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='BODEGAS'),    'BODEGAS.EDITAR',            'Editar bodega',            'Modificar bodegas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='BODEGAS'),    'BODEGAS.ELIMINAR',          'Inactivar bodega',         'Activar/Inactivar bodegas'),
  -- INVENTARIOS (RF-014)
  ((SELECT idModulos FROM modulos WHERE Codigo='INVENTARIOS'),'INVENTARIO.CONSULTAR',      'Consultar inventario',     'Ver existencias y kardex'),
  ((SELECT idModulos FROM modulos WHERE Codigo='INVENTARIOS'),'INVENTARIO.ENTRADA',        'Entrada de inventario',    'Registrar entradas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='INVENTARIOS'),'INVENTARIO.SALIDA',         'Salida de inventario',     'Registrar salidas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='INVENTARIOS'),'INVENTARIO.AJUSTAR',        'Ajustar inventario',       'Ajustes de existencias'),
  ((SELECT idModulos FROM modulos WHERE Codigo='INVENTARIOS'),'INVENTARIO.TRASLADAR',      'Trasladar inventario',     'Traslados entre bodegas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='INVENTARIOS'),'INVENTARIO.COSTO',          'Costos de inventario',     'Ver y editar costos'),
  -- COMPRAS
  ((SELECT idModulos FROM modulos WHERE Codigo='COMPRAS'),    'COMPRAS.CONSULTAR',         'Consultar compras',        'Ver compras'),
  ((SELECT idModulos FROM modulos WHERE Codigo='COMPRAS'),    'COMPRAS.CREAR',             'Crear compra',             'Registrar compras'),
  ((SELECT idModulos FROM modulos WHERE Codigo='COMPRAS'),    'COMPRAS.APROBAR',           'Aprobar compra',           'Aprobar compras'),
  ((SELECT idModulos FROM modulos WHERE Codigo='COMPRAS'),    'COMPRAS.ANULAR',            'Anular compra',            'Anular compras'),
  ((SELECT idModulos FROM modulos WHERE Codigo='COMPRAS'),    'COMPRAS.IMPRIMIR',          'Imprimir compra',          'Imprimir compras'),
  -- VENTAS (RF-016)
  ((SELECT idModulos FROM modulos WHERE Codigo='VENTAS'),     'VENTAS.CONSULTAR',          'Consultar ventas',         'Ver ventas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VENTAS'),     'VENTAS.CREAR',              'Crear venta',              'Registrar ventas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VENTAS'),     'VENTAS.EDITAR',             'Editar venta',             'Modificar ventas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VENTAS'),     'VENTAS.CONFIRMAR',          'Confirmar venta',          'Confirmar ventas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VENTAS'),     'VENTAS.ANULAR',             'Anular venta',             'Anular ventas conservando trazabilidad'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VENTAS'),     'VENTAS.DEVOLVER',           'Devolver venta',           'Procesar devoluciones'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VENTAS'),     'VENTAS.IMPRIMIR',           'Imprimir venta',           'Imprimir facturas/tickets'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VENTAS'),     'VENTAS.EXPORTAR',           'Exportar ventas',          'Exportar ventas'),
  -- CAJA
  ((SELECT idModulos FROM modulos WHERE Codigo='CAJA'),       'CAJA.CONSULTAR',            'Consultar caja',           'Ver arqueos y caja'),
  ((SELECT idModulos FROM modulos WHERE Codigo='CAJA'),       'CAJA.ABRIR',                'Abrir caja',               'Apertura de caja'),
  ((SELECT idModulos FROM modulos WHERE Codigo='CAJA'),       'CAJA.CERRAR',               'Cerrar caja',              'Cierre y arqueo'),
  -- REPORTES
  ((SELECT idModulos FROM modulos WHERE Codigo='REPORTES'),   'REPORTES.CONSULTAR',        'Consultar reportes',       'Ver reportes'),
  ((SELECT idModulos FROM modulos WHERE Codigo='REPORTES'),   'REPORTES.EXPORTAR',         'Exportar reportes',        'Exportar reportes'),
  ((SELECT idModulos FROM modulos WHERE Codigo='REPORTES'),   'REPORTES.IMPRIMIR',         'Imprimir reportes',        'Imprimir reportes'),
  -- AUDITORÍA (RF-017)
  ((SELECT idModulos FROM modulos WHERE Codigo='AUDITORIA'),  'AUDITORIA.CONSULTAR',       'Consultar auditoría',      'Ver bitácora de operaciones'),
  ((SELECT idModulos FROM modulos WHERE Codigo='AUDITORIA'),  'AUDITORIA.EXPORTAR',        'Exportar auditoría',       'Exportar bitácora');

-- -----------------------------------------------------------------------------
-- 3.3 ROLPERMISOS - permisos autorizados a cada rol (RF-008)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rolpermisos (
  IdRol                INT          NOT NULL,
  IdPermiso            INT          NOT NULL,
  TipoAcceso           VARCHAR(20)  NOT NULL DEFAULT 'PERMITIR' COMMENT 'PERMITIR / DENEGAR',
  AsignadoPor          INT          NULL,
  FechaAsignacion      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (IdRol, IdPermiso),
  KEY idx_rp_permiso (IdPermiso),
  CONSTRAINT fk_rp_rol FOREIGN KEY (IdRol) REFERENCES roles(IdRol),
  CONSTRAINT fk_rp_permiso FOREIGN KEY (IdPermiso) REFERENCES permisos(IdPermiso),
  CONSTRAINT fk_rp_asignado_por FOREIGN KEY (AsignadoPor) REFERENCES Usuarios(UsuarioId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-008: permisos por rol';

-- -----------------------------------------------------------------------------
-- 3.4 PERFILPERMISOS - configuración inicial de permisos por perfil (RF-004)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfilpermisos (
  IdPerfil             INT          NOT NULL,
  IdPermiso            INT          NOT NULL,
  TipoAcceso           VARCHAR(20)  NOT NULL DEFAULT 'PERMITIR' COMMENT 'PERMITIR / DENEGAR',
  AsignadoPor          INT          NULL,
  FechaAsignacion      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (IdPerfil, IdPermiso),
  KEY idx_pp_permiso (IdPermiso),
  CONSTRAINT fk_pp_perfil FOREIGN KEY (IdPerfil) REFERENCES perfiles(IdPerfil),
  CONSTRAINT fk_pp_permiso FOREIGN KEY (IdPermiso) REFERENCES permisos(IdPermiso),
  CONSTRAINT fk_pp_asignado_por FOREIGN KEY (AsignadoPor) REFERENCES Usuarios(UsuarioId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-004: permisos iniciales por perfil';

SELECT 'FASE 3 (MÓDULOS Y PERMISOS) OK' AS estado;

-- =============================================================================
-- FASE 4 - AUTENTICACIÓN
-- Sesiones, parámetros de seguridad, bloqueo por intentos (RF-018..RF-020)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 4.1 SESIONES - control de ingreso/salida/último acceso por usuario (RF-020)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sesiones (
  IdSesion             BIGINT       NOT NULL AUTO_INCREMENT,
  IdEmpresa            INT          NOT NULL,
  UsuarioId            INT          NOT NULL,
  FechaIngreso         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FechaSalida          DATETIME     NULL,
  UltimoAcceso         DATETIME     NULL,
  DireccionIP          VARCHAR(45)  NULL,
  UserAgent            VARCHAR(300) NULL,
  EstadoSesion         ENUM('ACTIVA','CERRADA','EXPIRADA','BLOQUEADA') NOT NULL DEFAULT 'ACTIVA',
  PRIMARY KEY (IdSesion),
  KEY idx_sesiones_empresa_fecha (IdEmpresa, FechaIngreso),
  KEY idx_sesiones_usuario      (UsuarioId),
  KEY idx_sesiones_estado       (EstadoSesion),
  CONSTRAINT fk_sesiones_empresa  FOREIGN KEY (IdEmpresa) REFERENCES empresas(IdEmpresa),
  CONSTRAINT fk_sesiones_usuario  FOREIGN KEY (UsuarioId) REFERENCES Usuarios(UsuarioId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-020: control de sesiones';

-- -----------------------------------------------------------------------------
-- 4.2 PARAMETROSSEGURIDAD - política de contraseñas y bloqueo (RF-018, RF-019)
--    Valores configurables por el Administrador desde la aplicación.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parametrosseguridad (
  IdParametro          INT          NOT NULL AUTO_INCREMENT,
  Codigo               VARCHAR(50)  NOT NULL,
  Nombre               VARCHAR(100) NOT NULL,
  Valor                VARCHAR(50)  NOT NULL,
  Descripcion          VARCHAR(300) NULL,
  Activo               TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (IdParametro),
  UNIQUE KEY uk_parametro_codigo (Codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-018/RF-019: política de contraseñas';

INSERT IGNORE INTO parametrosseguridad (Codigo, Nombre, Valor, Descripcion, Activo) VALUES
('MAX_INTENTOS_FALLIDOS',  'Máximo de intentos fallidos',              '5',  'Intentos antes de bloquear el usuario',          1),
('CLAVE_LONGITUD_MINIMA',  'Longitud mínima de contraseña',            '8',  'Cantidad mínima de caracteres',                  1),
('CLAVE_MAYUSCULA',        'Requiere mayúscula',                       '1',  'La contraseña exige al menos una mayúscula',     1),
('CLAVE_MINUSCULA',        'Requiere minúscula',                       '1',  'La contraseña exige al menos una minúscula',     1),
('CLAVE_NUMERO',           'Requiere número',                          '1',  'La contraseña exige al menos un número',         1),
('CLAVE_ESPECIAL',         'Requiere carácter especial',               '0',  'La contraseña exige un carácter especial',       1),
('CLAVE_DIAS_EXPIRACION',  'Días de expiración de contraseña',         '90', 'Días para forzar cambio de contraseña',          1);

SELECT 'FASE 4 (AUTENTICACIÓN) OK' AS estado;

-- =============================================================================
-- FASE 5 - AUTORIZACIÓN
-- Permisos directos al usuario (RF-010) y SUPERADMIN (RF-022)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 5.1 USUARIOPERMISOS - permisos especiales otorgados directamente
--     al usuario, adicionales a los de sus roles (RF-010). Auditados.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuariopermisos (
  UsuarioId            INT          NOT NULL,
  IdPermiso            INT          NOT NULL,
  TipoAcceso           VARCHAR(20)  NOT NULL DEFAULT 'PERMITIR' COMMENT 'PERMITIR / DENEGAR',
  AsignadoPor          INT          NULL,
  FechaAsignacion      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (UsuarioId, IdPermiso),
  KEY idx_up_permiso   (IdPermiso),
  CONSTRAINT fk_up_usuario     FOREIGN KEY (UsuarioId)   REFERENCES Usuarios(UsuarioId),
  CONSTRAINT fk_up_permiso     FOREIGN KEY (IdPermiso)   REFERENCES permisos(IdPermiso),
  CONSTRAINT fk_up_asignadopor FOREIGN KEY (AsignadoPor) REFERENCES Usuarios(UsuarioId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-010: permisos directos al usuario';

-- -----------------------------------------------------------------------------
-- 5.2 Asignación inicial: al rol ADMINISTRADOR de la empresa 1 se le
--     otorgan TODOS los permisos existentes (acceso total).
--     (Se ejecuta solo si aún no tiene ninguno asignado.)
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO rolpermisos (IdRol, IdPermiso)
SELECT r.IdRol, p.IdPermiso
FROM roles r CROSS JOIN permisos p
WHERE r.Nombre = 'ADMINISTRADOR'
  AND r.IdEmpresa = 1
  AND NOT EXISTS (SELECT 1 FROM rolpermisos rp WHERE rp.IdRol = r.IdRol);

SELECT 'FASE 5 (AUTORIZACIÓN) OK' AS estado;

-- =============================================================================
-- FASE 6 - AUDITORÍA (RF-017)
-- =============================================================================
CREATE TABLE IF NOT EXISTS auditoria (
  IdAuditoria          BIGINT       NOT NULL AUTO_INCREMENT,
  IdEmpresa            INT          NOT NULL,
  UsuarioId            INT          NOT NULL,
  IdModulo             INT          NULL,
  Tabla                VARCHAR(100) NULL,
  RegistroId           BIGINT       NULL,
  Accion               VARCHAR(30)  NOT NULL COMMENT 'CONSULTAR, CREAR, EDITAR, ELIMINAR, ANULAR, APROBAR, IMPRIMIR, EXPORTAR, LOGIN, LOGOUT, AJUSTAR, TRASLADAR, DEVOLUCION...',
  Fecha                DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  DireccionIP          VARCHAR(45)  NULL,
  DatosAnteriores      LONGTEXT     NULL COMMENT 'JSON del estado anterior',
  DatosNuevos          LONGTEXT     NULL COMMENT 'JSON del estado nuevo',
  Descripcion          VARCHAR(500) NULL,
  PRIMARY KEY (IdAuditoria),
  KEY idx_auditoria_empresa_fecha (IdEmpresa, Fecha),
  KEY idx_auditoria_usuario (UsuarioId),
  KEY idx_auditoria_modulo (IdModulo),
  KEY idx_auditoria_registro (Tabla, RegistroId),
  CONSTRAINT fk_auditoria_empresas FOREIGN KEY (IdEmpresa) REFERENCES empresas(IdEmpresa),
  CONSTRAINT fk_auditoria_usuarios FOREIGN KEY (UsuarioId) REFERENCES Usuarios(UsuarioId),
  CONSTRAINT fk_auditoria_modulos FOREIGN KEY (IdModulo) REFERENCES modulos(idModulos)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-017: auditoría de operaciones críticas';

SELECT 'FASE 6 (AUDITORÍA) OK' AS estado;

-- =============================================================================
-- FASE 7 - AISLAMIENTO POR EMPRESA (RF-013)
--    IdEmpresa como dato transversal en las entidades de negocio.
--    Tablas que aún no existan se crean vacías para el filtrado futuro.
-- =============================================================================

-- WIP: carrito información aún analizada; las tablas base ya se crearon
-- en sus scripts de módulo. Aquí SOLO se garantiza la columna IdEmpresa.

-- -----------------------------------------------------------------------------
-- 7.1 Usuarios / roles de sistema (ya procesado)
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 7.2 CLIENTES - MASCOTAS
-- -----------------------------------------------------------------------------
CALL bissvet_add_idempresa('clientes', 'idx_clientes_idempresa');
CALL bissvet_add_idempresa('mascotas', 'idx_mascotas_idempresa');

-- -----------------------------------------------------------------------------
-- 7.3 VETERINARIOS - CITAS - SERVICIOS
-- -----------------------------------------------------------------------------
CALL bissvet_add_idempresa('veterinarios', 'idx_veterinarios_idempresa');
CALL bissvet_add_idempresa('citas', 'idx_citas_idempresa');
CALL bissvet_add_idempresa('servicios', 'idx_servicios_idempresa');

-- -----------------------------------------------------------------------------
-- 7.4 HISTORIA CLÍNICA
-- -----------------------------------------------------------------------------
CALL bissvet_add_idempresa('historiasclinicas', 'idx_historiasclinicas_idempresa');
CALL bissvet_add_idempresa('antecedentes', 'idx_antecedentes_idempresa');
CALL bissvet_add_idempresa('signosvitales', 'idx_signosvitales_idempresa');
CALL bissvet_add_idempresa('examenfisico', 'idx_examenfisico_idempresa');
CALL bissvet_add_idempresa('diagnosticos', 'idx_diagnosticos_idempresa');
CALL bissvet_add_idempresa('tratamientos', 'idx_tratamientos_idempresa');
CALL bissvet_add_idempresa('recetas', 'idx_recetas_idempresa');
CALL bissvet_add_idempresa('detallerecetas', 'idx_detallerecetas_idempresa');
CALL bissvet_add_idempresa('procedimientos', 'idx_procedimientos_idempresa');
CALL bissvet_add_idempresa('cirugias', 'idx_cirugias_idempresa');
CALL bissvet_add_idempresa('registropreoperatorio', 'idx_registropreoperatorio_idempresa');
CALL bissvet_add_idempresa('registroanestesico', 'idx_registroanestesico_idempresa');
CALL bissvet_add_idempresa('registropostoperatorio', 'idx_registropostoperatorio_idempresa');
CALL bissvet_add_idempresa('controles', 'idx_controles_idempresa');
CALL bissvet_add_idempresa('archivoshistoriaclinica', 'idx_archivoshistoriaclinica_idempresa');
CALL bissvet_add_idempresa('consentimientoinformado', 'idx_consentimientoinformado_idempresa');
CALL bissvet_add_idempresa('alertascontroles', 'idx_alertascontroles_idempresa');

-- -----------------------------------------------------------------------------
-- 7.5 PRODUCTOS - BODEGAS - INVENTARIO
-- -----------------------------------------------------------------------------
CALL bissvet_add_idempresa('productos', 'idx_productos_idempresa');
CALL bissvet_add_idempresa('inventario', 'idx_inventario_idempresa');
CALL bissvet_add_idempresa('kardex', 'idx_kardex_idempresa');
CALL bissvet_add_idempresa('lotes', 'idx_lotes_idempresa');
CALL bissvet_add_idempresa('proveedores', 'idx_proveedores_idempresa');

-- bodegas (tabla heredada con distinta PK: comprobar presencia antes)
CALL bissvet_ensure_index('bodegas', 'idx_bodegas_idempresa',
  'ALTER TABLE bodegas ADD INDEX idx_bodegas_idempresa (IdEmpresa)');
CALL bissvet_ensure_fk('bodegas', 'fk_bodegas_empresa',
  'ALTER TABLE bodegas ADD CONSTRAINT fk_bodegas_empresa FOREIGN KEY (IdEmpresa) REFERENCES empresas(IdEmpresa)');

-- -----------------------------------------------------------------------------
-- 7.6 COMPRAS - VENTAS - MOVIMIENTOS
-- -----------------------------------------------------------------------------
CALL bissvet_add_idempresa('compras', 'idx_compras_idempresa');
CALL bissvet_add_idempresa('compras_detalle', 'idx_compras_detalle_idempresa');
CALL bissvet_add_idempresa('ventas', 'idx_ventas_idempresa');
CALL bissvet_add_idempresa('ventas_detalle', 'idx_ventas_detalle_idempresa');
CALL bissvet_add_idempresa('traslados', 'idx_traslados_idempresa');
CALL bissvet_add_idempresa('traslados_detalle', 'idx_traslados_detalle_idempresa');
CALL bissvet_add_idempresa('ajustes_inventario', 'idx_ajustes_inventario_idempresa');
CALL bissvet_add_idempresa('ajustes_inventario_detalle', 'idx_ajustes_inventario_detalle_idempresa');
CALL bissvet_add_idempresa('devoluciones_venta', 'idx_devoluciones_venta_idempresa');
CALL bissvet_add_idempresa('devoluciones_venta_detalle', 'idx_devoluciones_venta_detalle_idempresa');
CALL bissvet_add_idempresa('devoluciones_compra', 'idx_devoluciones_compra_idempresa');
CALL bissvet_add_idempresa('devoluciones_compra_detalle', 'idx_devoluciones_compra_detalle_idempresa');
CALL bissvet_add_idempresa('citas_productos', 'idx_citas_productos_idempresa');

-- -----------------------------------------------------------------------------
-- 7.7 AUDITORÍA ya incluye IdEmpresa (Fase 6).
--     Lógica de negocio y seguridad (reglas de oro para Node.js):
--       1. IdEmpresa viene del JWT/sesión, NUNCA del body.
--       2. Toda consulta filtra por IdEmpresa.
--       3. Crear/Editar/Inactivar NO destruye: actualiza Activo.
--       4. Anulaciones = cambio de estado + auditoría (nunca DELETE físico).
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 1;

SELECT '=== MAESTRO DE SEGURIDAD COMPLETADO (Fases 1-7) ===' AS estado;