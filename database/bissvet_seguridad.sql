-- ============================================================================
-- BISSVET - SCRIPT DE SEGURIDAD / MULTIEMPRESA
-- Modelo de datos completo: Empresa + Usuario + Rol + Módulo + Permiso
-- MySQL 8.0
-- Fecha: 04/09/2026
--
-- Alcance de este script:
--   1. Tabla EMPRESAS (propietaria de la información)
--   2. Tabla PERFILES (función de negocio del usuario)
--   3. Usuarios asociados a EMPRESA y a PERFIL (IdEmpresa, IdPerfil)
--   4. Tabla ROLES (conjunto de permisos, propios de cada empresa)
--   5. Tabla MODULOS (pieza central de permisos; se amplía la existente)
--   6. Tabla PERMISOS (autorización específica por módulo y operación)
--   7. Tablas puente: USUARIOROLES, ROLPERMISOS, PERFILPERMISOS
--   8. Tabla AUDITORIA (trazabilidad de operaciones críticas)
--   9. IdEmpresa como dato transversal en las entidades de negocio
--
-- Regla de oro: toda consulta del backend debe filtrar por IdEmpresa
-- obtenido del token/sesión del usuario autenticado (nunca confiable
-- desde Angular). Ver comentario final "REGLAS DE ORO".
--
-- Nota: este script asume que las tablas base ya existen
-- (clientes, mascotas, veterinarios, servicios, ciudades, modulos, ...).
-- Sobre ellas SOLO se agregan columnas/índices; no se destruye información.
-- Las tablas de seguridad nuevas se recrean limpias (DROP + CREATE).
-- ============================================================================

USE BissVet;

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ============================================================================
-- 0. ELIMINA TABLAS DE SEGURIDAD ANTERIORES (si existen)
--    Orden: primero las dependientes (hijo), luego las padres
-- ============================================================================
DROP TABLE IF EXISTS auditoria;
DROP TABLE IF EXISTS rolpermisos;
DROP TABLE IF EXISTS perfilpermisos;
DROP TABLE IF EXISTS usuarioroles;
DROP TABLE IF EXISTS permisos;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS perfiles;
DROP TABLE IF EXISTS empresas;

-- ============================================================================
-- 1. EMPRESAS
--    Primer nivel de seguridad: propietaria de toda la información.
--    (La FK a Usuarios(UsuarioId) se agrega al final para evitar
--     referencia cruzada al momento de crear Usuarios)
-- ============================================================================
CREATE TABLE empresas (
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

-- ============================================================================
-- 1.1 DATOS BÁSICOS: EMPRESA DE EJEMPLO
-- ============================================================================
INSERT IGNORE INTO empresas
  (CodigoEmpresa, Nit, RazonSocial, NombreComercial, TipoDocumento,
   Direccion, Telefono, Correo, Activo)
VALUES
  ('EMP001', '900123456-7', 'Veterinaria Los Amigos SAS',
   'Veterinaria Los Amigos', 'NIT',
   'Calle 1 # 2-3', '3001234567', 'contacto@losamigos.com', 1);

-- ============================================================================
-- 2. PERFILES
--    Función de negocio del usuario (nivel SISTEMA, no por empresa)
-- ============================================================================
CREATE TABLE perfiles (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- PERFILES INICIALES
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO perfiles (Nombre, Descripcion) VALUES
  ('Administrador',   'Administración total de la empresa'),
  ('Veterinario',     'Atención clínica y historias clínicas'),
  ('Vendedor',        'Ventas y atención al cliente'),
  ('Auxiliar',        'Apoyo administrativo y operativo'),
  ('Bodeguero',       'Gestión de inventarios'),
  ('Recepcionista',   'Citas y recepción'),
  ('Gerente',         'Dirección y reportes'),
  ('SUPERADMIN',      'Administra todo el sistema y las empresas');

-- ============================================================================
-- 3. USUARIOS (tabla existente)
--    Se asegura la existencia de IdEmpresa e IdPerfil.
--    Para una instalación nueva se crea la tabla completa; para una base
--    existente solo se agregan las columnas faltantes.
-- ============================================================================
CREATE TABLE IF NOT EXISTS Usuarios (
  UsuarioId            INT           NOT NULL AUTO_INCREMENT,
  IdEmpresa            INT           NULL,
  IdPerfil             INT           NULL,
  Username             VARCHAR(50)   NOT NULL,
  PasswordHash         VARCHAR(255)  NOT NULL COMMENT 'bcrypt (nunca texto plano)',
  Nombre               VARCHAR(120)  NULL,
  Correo               VARCHAR(120)  NULL,
  Activo               TINYINT(1)    NOT NULL DEFAULT 1,
  FechaCreacion        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdCreacion    INT           NULL,
  FechaModificacion    DATETIME      NULL,
  UsuarioIdModificacion INT          NULL,
  UltimoAcceso         DATETIME      NULL,
  PRIMARY KEY (UsuarioId),
  UNIQUE KEY uk_usuarios_username (Username),
  KEY idx_usuarios_empresa (IdEmpresa),
  KEY idx_usuarios_perfil (IdPerfil),
  CONSTRAINT fk_usuarios_empresa FOREIGN KEY (IdEmpresa)
    REFERENCES empresas(IdEmpresa),
  CONSTRAINT fk_usuarios_perfil FOREIGN KEY (IdPerfil)
    REFERENCES perfiles(IdPerfil)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Si la tabla Usuarios YA existía sin IdEmpresa, se agrega (columna + índice + FK)
SET @tiene = (SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'Usuarios'
                AND COLUMN_NAME = 'IdEmpresa');
SET @sql = IF(@tiene = 0,
  'ALTER TABLE Usuarios
     ADD COLUMN IdEmpresa INT NULL,
     ADD INDEX idx_usuarios_empresa (IdEmpresa),
     ADD CONSTRAINT fk_usuarios_empresa FOREIGN KEY (IdEmpresa)
       REFERENCES empresas(IdEmpresa)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- IdPerfil en Usuarios (si no existe)
SET @tiene = (SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'Usuarios'
                AND COLUMN_NAME = 'IdPerfil');
SET @sql = IF(@tiene = 0,
  'ALTER TABLE Usuarios
     ADD COLUMN IdPerfil INT NULL,
     ADD INDEX idx_usuarios_perfil (IdPerfil),
     ADD CONSTRAINT fk_usuarios_perfil FOREIGN KEY (IdPerfil)
       REFERENCES perfiles(IdPerfil)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Se eliminan las FK cruzadas de empresas -> Usuarios (ya agregadas)
SET @fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = DATABASE()
             AND TABLE_NAME = 'empresas'
             AND CONSTRAINT_NAME = 'fk_empresa_usuario_creacion');
SET @sql = IF(@fk = 0,
  'ALTER TABLE empresas
     ADD CONSTRAINT fk_empresa_usuario_creacion
       FOREIGN KEY (UsuarioIdCreacion) REFERENCES Usuarios(UsuarioId),
     ADD CONSTRAINT fk_empresa_usuario_modificacion
       FOREIGN KEY (UsuarioIdModificacion) REFERENCES Usuarios(UsuarioId)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Comentario de diseño:
-- Para una futura versión con "una persona en varias empresas" se crearía
-- la tabla puente EmpresaUsuarios (IdEmpresa, UsuarioId, Activo) y el
-- usuario pasaría a ser independiente de empresa. Para la V1 cada usuario
-- pertenece a UNA sola empresa (columna IdEmpresa en Usuarios).

-- ============================================================================
-- 4. ROLES
--    Conjunto de permisos. Propios de cada empresa.
--    IdEmpresa NULL = rol del sistema (p. ej. SUPERADMIN).
-- ============================================================================
CREATE TABLE roles (
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
  CONSTRAINT fk_roles_empresa FOREIGN KEY (IdEmpresa)
    REFERENCES empresas(IdEmpresa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ROLES INICIALES DE LA EMPRESA DE EJEMPLO (IdEmpresa = 1)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO roles (IdEmpresa, Nombre, Descripcion) VALUES
  (1, 'ADMINISTRADOR', 'Acceso total a todos los módulos'),
  (1, 'VETERINARIO',   'Atención clínica y citas'),
  (1, 'VENDEDOR',      'Ventas y atención al cliente'),
  (1, 'AUXILIAR',      'Apoyo administrativo'),
  (1, 'BODEGUERO',     'Inventarios y bodegas'),
  (1, 'RECEPCIONISTA', 'Citas y recepción'),
  (1, 'GERENTE',       'Dirección y reportes');

-- ============================================================================
-- 5. MODULOS (tabla existente)
--    Se amplía la tabla `modulos` para convertirla en la pieza central de
--    seguridad: Codigo, Descripcion, Ruta, Icono, Orden, Activo.
-- ============================================================================
SET @tiene = (SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'modulos'
                AND COLUMN_NAME = 'Codigo');
SET @sql = IF(@tiene = 0,
  'ALTER TABLE modulos
     ADD COLUMN Codigo       VARCHAR(50)  NULL AFTER idModulos,
     ADD COLUMN Descripcion  VARCHAR(300) NULL AFTER NombreModulo,
     ADD COLUMN Ruta         VARCHAR(150) NULL,
     ADD COLUMN Icono        VARCHAR(100) NULL,
     ADD COLUMN Orden        INT          NULL,
     ADD COLUMN Activo       TINYINT(1)   NOT NULL DEFAULT 1',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Respaldo del Codigo para los módulos que ya existían
UPDATE modulos
SET Codigo = CONCAT('MOD_', idModulos)
WHERE Codigo IS NULL OR Codigo = '';

SET @idx = (SELECT COUNT(*) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'modulos'
              AND INDEX_NAME = 'uk_modulos_codigo');
SET @sql = IF(@idx = 0,
  'ALTER TABLE modulos ADD UNIQUE KEY uk_modulos_codigo (Codigo)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ----------------------------------------------------------------------------
-- CATÁLOGO DE MÓDULOS DE BISSVET
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO modulos
  (Codigo, NombreModulo, Descripcion, Ruta, Icono, Orden, Activo) VALUES
  ('SEGURIDAD',        'Seguridad',        'Usuarios, roles y permisos',     '/dashboard/seguridad',      '🔐', 1,  1),
  ('EMPRESAS',         'Empresas',         'Mantenimiento de empresas',      '/dashboard/empresas',       '🏢', 2,  1),
  ('USUARIOS',         'Usuarios',         'Gestión de usuarios',            '/dashboard/usuarios',       '👤', 3,  1),
  ('CLIENTES',         'Clientes',         'Gestión de clientes',            '/dashboard/clientes',       '👥', 4,  1),
  ('MASCOTAS',         'Mascotas',         'Gestión de mascotas',            '/dashboard/mascotas',       '🐾', 5,  1),
  ('VETERINARIOS',     'Veterinarios',     'Gestión de veterinarios',        '/dashboard/veterinarios',   '👨‍⚕️', 6,  1),
  ('CITAS',            'Citas',            'Agenda de citas',                '/dashboard/citas',          '📅', 7,  1),
  ('HISTORIA_CLINICA', 'Historia Clínica', 'Historias clínicas',             '/dashboard/historiaclinica','📋', 8,  1),
  ('SERVICIOS',        'Servicios',        'Catálogo de servicios',          '/dashboard/servicios',      '🩺', 9,  1),
  ('PRODUCTOS',        'Productos',        'Catálogo de productos',          '/dashboard/productos',      '📦', 10, 1),
  ('BODEGAS',          'Bodegas',          'Gestión de bodegas',             '/dashboard/bodegas',        '🏬', 11, 1),
  ('INVENTARIOS',      'Inventarios',      'Existencias y movimientos',      '/dashboard/inventario',     '📊', 12, 1),
  ('COMPRAS',          'Compras',          'Órdenes de compra',              '/dashboard/compras',        '🛒', 13, 1),
  ('VENTAS',           'Ventas',           'Ventas, estados y anulaciones',  '/dashboard/ventas',         '🧾', 14, 1),
  ('CAJA',             'Caja',             'Arqueo y caja',                  '/dashboard/caja',           '💰', 15, 1),
  ('REPORTES',         'Reportes',         'Reportes e indicadores',         '/dashboard/reportes',       '📈', 16, 1),
  ('AUDITORIA',        'Auditoría',        'Trazabilidad de operaciones',    '/dashboard/auditoria',      '🕵️', 17, 1);

-- ============================================================================
-- 6. PERMISOS
--    Autorización específica sobre una funcionalidad (p. ej. VENTAS.ANULAR)
-- ============================================================================
CREATE TABLE permisos (
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
  CONSTRAINT fk_permisos_modulo FOREIGN KEY (IdModulo)
    REFERENCES modulos(idModulos)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- PERMISOS INICIALES (por módulo y operación)
-- Operaciones de control: CONSULTAR, CREAR, EDITAR, ELIMINAR, ANULAR,
-- APROBAR, IMPRIMIR, EXPORTAR + operaciones específicas de cada módulo.
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO permisos (IdModulo, Codigo, Nombre, Descripcion) VALUES
  -- SEGURIDAD
  ((SELECT idModulos FROM modulos WHERE Codigo='SEGURIDAD'), 'SEGURIDAD.CONSULTAR',           'Consultar seguridad',          'Ver usuarios, roles y permisos'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SEGURIDAD'), 'SEGURIDAD.CREAR',              'Crear seguridad',              'Crear elementos de seguridad'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SEGURIDAD'), 'SEGURIDAD.EDITAR',             'Editar seguridad',             'Editar elementos de seguridad'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SEGURIDAD'), 'SEGURIDAD.ELIMINAR',           'Eliminar seguridad',           'Inactivar elementos de seguridad'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SEGURIDAD'), 'SEGURIDAD.ASIGNAR_ROLES',      'Asignar roles a usuarios',     'Administrar usuarioroles'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SEGURIDAD'), 'SEGURIDAD.ASIGNAR_PERMISOS',   'Asignar permisos a roles',     'Administrar rolpermisos'),
  -- EMPRESAS
  ((SELECT idModulos FROM modulos WHERE Codigo='EMPRESAS'),  'EMPRESAS.CONSULTAR',           'Consultar empresas',           'Ver empresas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='EMPRESAS'),  'EMPRESAS.CREAR',               'Crear empresa',                'Registrar empresas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='EMPRESAS'),  'EMPRESAS.EDITAR',              'Editar empresa',               'Modificar empresas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='EMPRESAS'),  'EMPRESAS.ELIMINAR',            'Inactivar empresa',            'Activar/Inactivar empresas'),
  -- USUARIOS
  ((SELECT idModulos FROM modulos WHERE Codigo='USUARIOS'),  'USUARIOS.CONSULTAR',           'Consultar usuarios',           'Ver usuarios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='USUARIOS'),  'USUARIOS.CREAR',               'Crear usuario',                'Registrar usuarios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='USUARIOS'),  'USUARIOS.EDITAR',              'Editar usuario',               'Modificar usuarios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='USUARIOS'),  'USUARIOS.CAMBIAR_CLAVE',       'Cambiar contraseña',           'Cambiar contraseñas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='USUARIOS'),  'USUARIOS.ASIGNAR_EMPRESA',     'Asignar empresa a usuario',    'Definir empresa del usuario'),
  -- CLIENTES
  ((SELECT idModulos FROM modulos WHERE Codigo='CLIENTES'),  'CLIENTES.CONSULTAR',           'Consultar clientes',           'Ver listado y detalle de clientes'),
  ((SELECT idModulos FROM modulos WHERE Codigo='CLIENTES'),  'CLIENTES.CREAR',               'Crear cliente',                'Registrar clientes'),
  ((SELECT idModulos FROM modulos WHERE Codigo='CLIENTES'),  'CLIENTES.EDITAR',              'Editar cliente',               'Modificar clientes'),
  ((SELECT idModulos FROM modulos WHERE Codigo='CLIENTES'),  'CLIENTES.ELIMINAR',            'Inactivar cliente',            'Activar/Inactivar clientes'),
  -- MASCOTAS
  ((SELECT idModulos FROM modulos WHERE Codigo='MASCOTAS'),  'MASCOTAS.CONSULTAR',           'Consultar mascotas',           'Ver listado y detalle de mascotas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='MASCOTAS'),  'MASCOTAS.CREAR',               'Crear mascota',                'Registrar mascotas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='MASCOTAS'),  'MASCOTAS.EDITAR',              'Editar mascota',               'Modificar mascotas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='MASCOTAS'),  'MASCOTAS.ELIMINAR',            'Inactivar mascota',            'Activar/Inactivar mascotas'),
  -- VETERINARIOS
  ((SELECT idModulos FROM modulos WHERE Codigo='VETERINARIOS'),'VETERINARIOS.CONSULTAR',     'Consultar veterinarios',       'Ver veterinarios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VETERINARIOS'),'VETERINARIOS.CREAR',         'Crear veterinario',            'Registrar veterinarios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VETERINARIOS'),'VETERINARIOS.EDITAR',        'Editar veterinario',           'Modificar veterinarios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VETERINARIOS'),'VETERINARIOS.ELIMINAR',      'Inactivar veterinario',        'Activar/Inactivar veterinarios'),
  -- CITAS
  ((SELECT idModulos FROM modulos WHERE Codigo='CITAS'),      'CITAS.CONSULTAR',             'Consultar citas',              'Ver citas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='CITAS'),      'CITAS.CREAR',                 'Crear cita',                   'Programar citas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='CITAS'),      'CITAS.EDITAR',                'Editar cita',                  'Reagendar citas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='CITAS'),      'CITAS.ANULAR',                'Anular cita',                  'Cancelar citas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='CITAS'),      'CITAS.APROBAR',               'Aprobar cita',                 'Confirmar citas'),
  -- HISTORIA CLÍNICA
  ((SELECT idModulos FROM modulos WHERE Codigo='HISTORIA_CLINICA'),'HISTORIA.CONSULTAR',     'Consultar historias',          'Ver historias clínicas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='HISTORIA_CLINICA'),'HISTORIA.CREAR',         'Crear historia',               'Abrir historias clínicas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='HISTORIA_CLINICA'),'HISTORIA.EDITAR',        'Editar historia',              'Modificar historias clínicas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='HISTORIA_CLINICA'),'HISTORIA.CERRAR',        'Cerrar historia',              'Cerrar historias clínicas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='HISTORIA_CLINICA'),'HISTORIA.ANULAR',        'Anular historia',              'Anular historias clínicas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='HISTORIA_CLINICA'),'HISTORIA.IMPRIMIR',      'Imprimir historia',            'Imprimir historias clínicas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='HISTORIA_CLINICA'),'HISTORIA.EXPORTAR',      'Exportar historias',           'Exportar historias clínicas'),
  -- SERVICIOS
  ((SELECT idModulos FROM modulos WHERE Codigo='SERVICIOS'),  'SERVICIOS.CONSULTAR',         'Consultar servicios',          'Ver servicios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SERVICIOS'),  'SERVICIOS.CREAR',             'Crear servicio',               'Registrar servicios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SERVICIOS'),  'SERVICIOS.EDITAR',            'Editar servicio',              'Modificar servicios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SERVICIOS'),  'SERVICIOS.ELIMINAR',          'Inactivar servicio',           'Activar/Inactivar servicios'),
  -- PRODUCTOS
  ((SELECT idModulos FROM modulos WHERE Codigo='PRODUCTOS'),  'PRODUCTOS.CONSULTAR',         'Consultar productos',          'Ver productos'),
  ((SELECT idModulos FROM modulos WHERE Codigo='PRODUCTOS'),  'PRODUCTOS.CREAR',             'Crear producto',               'Registrar productos'),
  ((SELECT idModulos FROM modulos WHERE Codigo='PRODUCTOS'),  'PRODUCTOS.EDITAR',            'Editar producto',              'Modificar productos'),
  ((SELECT idModulos FROM modulos WHERE Codigo='PRODUCTOS'),  'PRODUCTOS.ELIMINAR',          'Inactivar producto',           'Activar/Inactivar productos'),
  -- BODEGAS
  ((SELECT idModulos FROM modulos WHERE Codigo='BODEGAS'),    'BODEGAS.CONSULTAR',           'Consultar bodegas',            'Ver bodegas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='BODEGAS'),    'BODEGAS.CREAR',               'Crear bodega',                 'Registrar bodegas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='BODEGAS'),    'BODEGAS.EDITAR',              'Editar bodega',                'Modificar bodegas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='BODEGAS'),    'BODEGAS.ELIMINAR',            'Inactivar bodega',             'Activar/Inactivar bodegas'),
  -- INVENTARIOS
  ((SELECT idModulos FROM modulos WHERE Codigo='INVENTARIOS'),'INVENTARIO.CONSULTAR',        'Consultar inventario',         'Ver existencias y kardex'),
  ((SELECT idModulos FROM modulos WHERE Codigo='INVENTARIOS'),'INVENTARIO.ENTRADA',          'Entrada de inventario',        'Registrar entradas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='INVENTARIOS'),'INVENTARIO.SALIDA',           'Salida de inventario',         'Registrar salidas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='INVENTARIOS'),'INVENTARIO.AJUSTAR',          'Ajustar inventario',           'Ajustes de existencias'),
  ((SELECT idModulos FROM modulos WHERE Codigo='INVENTARIOS'),'INVENTARIO.TRASLADAR',        'Trasladar inventario',         'Traslados entre bodegas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='INVENTARIOS'),'INVENTARIO.COSTO',            'Costos de inventario',         'Ver y editar costos'),
  -- COMPRAS
  ((SELECT idModulos FROM modulos WHERE Codigo='COMPRAS'),    'COMPRAS.CONSULTAR',           'Consultar compras',            'Ver compras'),
  ((SELECT idModulos FROM modulos WHERE Codigo='COMPRAS'),    'COMPRAS.CREAR',               'Crear compra',                 'Registrar compras'),
  ((SELECT idModulos FROM modulos WHERE Codigo='COMPRAS'),    'COMPRAS.APROBAR',             'Aprobar compra',               'Aprobar compras'),
  ((SELECT idModulos FROM modulos WHERE Codigo='COMPRAS'),    'COMPRAS.ANULAR',              'Anular compra',                'Anular compras'),
  ((SELECT idModulos FROM modulos WHERE Codigo='COMPRAS'),    'COMPRAS.IMPRIMIR',            'Imprimir compra',              'Imprimir compras'),
  -- VENTAS
  ((SELECT idModulos FROM modulos WHERE Codigo='VENTAS'),     'VENTAS.CONSULTAR',            'Consultar ventas',             'Ver ventas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VENTAS'),     'VENTAS.CREAR',                'Crear venta',                  'Registrar ventas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VENTAS'),     'VENTAS.EDITAR',               'Editar venta',                 'Modificar ventas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VENTAS'),     'VENTAS.CONFIRMAR',            'Confirmar venta',              'Confirmar ventas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VENTAS'),     'VENTAS.ANULAR',               'Anular venta',                 'Anular ventas (conservando trazabilidad)'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VENTAS'),     'VENTAS.DEVOLVER',             'Devolver venta',               'Procesar devoluciones'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VENTAS'),     'VENTAS.IMPRIMIR',             'Imprimir venta',               'Imprimir facturas/tickets'),
  ((SELECT idModulos FROM modulos WHERE Codigo='VENTAS'),     'VENTAS.EXPORTAR',             'Exportar ventas',              'Exportar ventas'),
  -- REPORTES
  ((SELECT idModulos FROM modulos WHERE Codigo='REPORTES'),   'REPORTES.CONSULTAR',          'Consultar reportes',           'Ver reportes'),
  ((SELECT idModulos FROM modulos WHERE Codigo='REPORTES'),   'REPORTES.EXPORTAR',           'Exportar reportes',            'Exportar reportes'),
  ((SELECT idModulos FROM modulos WHERE Codigo='REPORTES'),   'REPORTES.IMPRIMIR',           'Imprimir reportes',            'Imprimir reportes'),
  -- AUDITORÍA
  ((SELECT idModulos FROM modulos WHERE Codigo='AUDITORIA'),  'AUDITORIA.CONSULTAR',         'Consultar auditoría',          'Ver bitácora de operaciones'),
  ((SELECT idModulos FROM modulos WHERE Codigo='AUDITORIA'),  'AUDITORIA.EXPORTAR',          'Exportar auditoría',           'Exportar bitácora');

-- ============================================================================
-- 7. USUARIOROLES (un usuario puede tener uno o varios roles)
-- ============================================================================
CREATE TABLE usuarioroles (
  UsuarioId            INT          NOT NULL,
  IdRol                INT          NOT NULL,
  AsignadoPor          INT          NULL,
  FechaAsignacion      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (UsuarioId, IdRol),
  KEY idx_ur_rol (IdRol),
  CONSTRAINT fk_ur_usuario FOREIGN KEY (UsuarioId)
    REFERENCES Usuarios(UsuarioId),
  CONSTRAINT fk_ur_rol FOREIGN KEY (IdRol)
    REFERENCES roles(IdRol),
  CONSTRAINT fk_ur_asignado_por FOREIGN KEY (AsignadoPor)
    REFERENCES Usuarios(UsuarioId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. ROLPERMISOS (permisos autorizados a cada rol)
-- ============================================================================
CREATE TABLE rolpermisos (
  IdRol                INT          NOT NULL,
  IdPermiso            INT          NOT NULL,
  TipoAcceso           VARCHAR(20)  NOT NULL DEFAULT 'PERMITIR' COMMENT 'PERMITIR / DENEGAR',
  AsignadoPor          INT          NULL,
  FechaAsignacion      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (IdRol, IdPermiso),
  KEY idx_rp_permiso (IdPermiso),
  CONSTRAINT fk_rp_rol FOREIGN KEY (IdRol)
    REFERENCES roles(IdRol),
  CONSTRAINT fk_rp_permiso FOREIGN KEY (IdPermiso)
    REFERENCES permisos(IdPermiso),
  CONSTRAINT fk_rp_asignado_por FOREIGN KEY (AsignadoPor)
    REFERENCES Usuarios(UsuarioId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. PERFILPERMISOS (permisos globales por perfil de negocio)
-- ============================================================================
CREATE TABLE perfilpermisos (
  IdPerfil             INT          NOT NULL,
  IdPermiso            INT          NOT NULL,
  TipoAcceso           VARCHAR(20)  NOT NULL DEFAULT 'PERMITIR' COMMENT 'PERMITIR / DENEGAR',
  AsignadoPor          INT          NULL,
  FechaAsignacion      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (IdPerfil, IdPermiso),
  KEY idx_pp_permiso (IdPermiso),
  CONSTRAINT fk_pp_perfil FOREIGN KEY (IdPerfil)
    REFERENCES perfiles(IdPerfil),
  CONSTRAINT fk_pp_permiso FOREIGN KEY (IdPermiso)
    REFERENCES permisos(IdPermiso),
  CONSTRAINT fk_pp_asignado_por FOREIGN KEY (AsignadoPor)
    REFERENCES Usuarios(UsuarioId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. AUDITORIA
--     Trazabilidad de operaciones críticas: quién, qué, cuándo y desde dónde.
-- ============================================================================
CREATE TABLE auditoria (
  IdAuditoria          BIGINT       NOT NULL AUTO_INCREMENT,
  IdEmpresa            INT          NOT NULL,
  UsuarioId            INT          NOT NULL,
  IdModulo             INT          NULL,
  Tabla                VARCHAR(100) NULL,
  RegistroId           BIGINT       NULL,
  Accion               VARCHAR(30)  NOT NULL COMMENT 'CONSULTAR, CREAR, EDITAR, ELIMINAR, ANULAR, APROBAR, IMPRIMIR, EXPORTAR, ENTRADA, SALIDA, AJUSTAR, TRASLADO, DEVOLUCION, LOGIN, LOGOUT',
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
  CONSTRAINT fk_auditoria_empresas FOREIGN KEY (IdEmpresa)
    REFERENCES empresas(IdEmpresa),
  CONSTRAINT fk_auditoria_usuarios FOREIGN KEY (UsuarioId)
    REFERENCES Usuarios(UsuarioId),
  CONSTRAINT fk_auditoria_modulos FOREIGN KEY (IdModulo)
    REFERENCES modulos(idModulos)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. IdEMPRESA EN ENTIDADES DE NEGOCIO (dato transversal)
--     Procedimiento auxiliar: agrega la columna + índice + FK a empresas
--     de forma segura e idempotente (MySQL no tiene ADD COLUMN IF NOT EXISTS).
--     Datos existentes quedan en NULL: se debe asignar la empresa real en la
--     migración de datos antes de volver la columna NOT NULL.
-- ============================================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS bissvet_add_idempresa$$
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

-- ----------------------------------------------------------------------------
-- 11.1 USUARIOS (ya procesado arriba, se reutiliza el procedimiento)
-- ----------------------------------------------------------------------------
CALL bissvet_add_idempresa('Usuarios', 'idx_usuarios_idempresa');

-- ----------------------------------------------------------------------------
-- 11.2 MÓDULO: CLIENTES Y MASCOTAS
-- ----------------------------------------------------------------------------
CALL bissvet_add_idempresa('clientes', 'idx_clientes_idempresa');
CALL bissvet_add_idempresa('mascotas', 'idx_mascotas_idempresa');

-- ----------------------------------------------------------------------------
-- 11.3 MÓDULO: VETERINARIOS, CITAS, SERVICIOS
-- ----------------------------------------------------------------------------
CALL bissvet_add_idempresa('veterinarios', 'idx_veterinarios_idempresa');
CALL bissvet_add_idempresa('citas', 'idx_citas_idempresa');
CALL bissvet_add_idempresa('servicios', 'idx_servicios_idempresa');

-- ----------------------------------------------------------------------------
-- 11.4 MÓDULO: HISTORIA CLÍNICA
-- ----------------------------------------------------------------------------
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
CALL bissvet_add_idempresa('controles', 'idx_controles_idempresa');
CALL bissvet_add_idempresa('archivoshistoriaclinica', 'idx_archivoshistoriaclinica_idempresa');

-- ----------------------------------------------------------------------------
-- 11.5 MÓDULO: PRODUCTOS, BODEGAS, INVENTARIO
--     (bodegas YA tiene la columna IdEmpresa: solo se valida FK/índice)
-- ----------------------------------------------------------------------------
CALL bissvet_add_idempresa('productos', 'idx_productos_idempresa');
CALL bissvet_add_idempresa('inventario', 'idx_inventario_idempresa');
CALL bissvet_add_idempresa('kardex', 'idx_kardex_idempresa');
CALL bissvet_add_idempresa('proveedores', 'idx_proveedores_idempresa');

SET @fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = DATABASE()
             AND TABLE_NAME = 'bodegas'
             AND CONSTRAINT_NAME = 'fk_bodegas_empresa');
SET @sql = IF(@fk = 0,
  'ALTER TABLE bodegas
     ADD INDEX idx_bodegas_idempresa (IdEmpresa),
     ADD CONSTRAINT fk_bodegas_empresa FOREIGN KEY (IdEmpresa)
       REFERENCES empresas(IdEmpresa)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ----------------------------------------------------------------------------
-- 11.6 MÓDULO: COMPRAS, VENTAS Y MOVIMIENTOS
-- ----------------------------------------------------------------------------
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

-- ============================================================================
-- 12. EJEMPLO: ASIGNACIÓN DE PERMISOS POR ROL
--     (descomentar cuando existan usuarios reales; usa los códigos sembrados)
--     Para que el ADMINISTRADOR tenga "acceso total":
--     INSERT IGNORE INTO rolpermisos (IdRol, IdPermiso)
--     SELECT r.IdRol, p.IdPermiso
--     FROM roles r CROSS JOIN permisos p
--     WHERE r.Nombre = 'ADMINISTRADOR' AND r.IdEmpresa = 1;
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- REGLAS DE ORO (para la implementación en Node.js)
-- ============================================================================
-- 1. El IdEmpresa NUNCA debe venir confiablemente del body de Angular.
--    Debe obtenerse del JWT/sesión del usuario autenticado:
--
--    SELECT * FROM clientes
--    WHERE Activo = 1 AND IdEmpresa = @IdEmpresaSesion;
--
--    SELECT * FROM clientes
--    WHERE ClienteId = ? AND IdEmpresa = @IdEmpresaSesion;  -- evita el
--                                                           -- cruce entre
--                                                           -- empresas
--
-- 2. Flujo de autorización de cada endpoint protegido:
--    autenticar (JWT) -> usuario activo -> empresa activa ->
--    permiso (MODULO.OPERACION) -> pertenencia de la entidad a la empresa
--    -> operación -> auditoría.
--
-- 3. INVENTARIOS: nunca "editar existencias" directo. Solo movimientos
--    (ENTRADA, SALIDA, AJUSTE, TRASLADO, DEVOLUCIÓN) en kardex, con
--    UsuarioId, IdEmpresa, IdBodega, IdProducto, Cantidad, Costo y Fecha.
--
-- 4. VENTAS: anular es cambiar estado (VentaEstado = ANULADA) conservando
--    UsuarioAnulacion, FechaAnulacion y MotivoAnulacion. Nunca borrar.
--
-- 5. CONTRASEÑAS: almacenar con bcrypt (coste >= 10). Nunca texto plano.
--    La tabla Usuarios ya tiene la columna PasswordHash para ese formato.
--
-- 6. AUDITORÍA: registrar las operaciones críticas dentro de la misma
--    transacción que la operación de negocio.
-- ============================================================================