-- ============================================================================
-- BissVet - MÓDULO DE SEGURIDAD Y ADMINISTRACIÓN - FASE 2 (SCRIPT ADITIVO)
-- ============================================================================
-- REGLA GENERAL: SE CONSERVAN TODAS LAS ENTIDADES MySQL YA EXISTENTES.
-- ESTE SCRIPT SOLO CREA LO QUE FALTA (según RF-001..RF-022 del documento).
-- Es 100% idempotente y NO elimina ni modifica estructura o datos existentes.
--
-- MODELO ENTIDAD-RELACIÓN (resumen consolidado Fase 1 + Fase 2):
--
--   empresas (1) ──< Usuarios (N)                  Fc. Usuarios: +Bloqueado,
--   urbanes     │    │  ~ UsuarioId, IdEmpresa,                 +Activo,
--   │           │    │    TipoDocumento, NumeroDocumento,       +IntentosFallidos,
--   │           │    │    PrimerNombre, SegundoNombre,           +FechaUltimoIngreso,
--   │           │    │    PrimerApellido, SegundoApellido,       +Correo, +Telefono,
--   │           │    │    Username, PasswordHash (NUNCA texto    FK IdPerfil
--   │           │    │    plano, se implementará bcrypt + JWT)
--   │           │    └── perfiles (N)   perfiles (1) ──< Usuarios (N)
--   │           │    └── usuarioroles ──< roles (N) ──< rolpermisos >── permisos
--   │           │    └── usuariopermisos (NUEVO: permisos directos RF-010)
--   │           └── sesiones (NUEVO RF-020): ingreso/salida/último acceso/IP
--   │           └── parametrosseguridad (NUEVO RF-018/RF-019: política clave)
--   │
--   ├── Clientes ──< Mascotas ──< Historias (trazabilidad)
--   ├── Veterinarios, Citas
--   ├── Productos ──< Kardex/Movimientos (ENTRADA/SALIDA/AJUSTE/TRASLADO/EVOLUCION)
--   ├── Bodegas, Inventarios, Compras, Ventas (estados + anulaciones auditadas)
--   └── auditoria (crítica: quién/cuándo/qué/PRE y POST)
--
--   permisos (N─1 modulos)   modulos (1)
--   usuarioroles (N─N usuarios/roles)    usuariopermisos (N─N usuarios/permisos)
--   rolpermisos (N─N roles/permisos)     perfilpermisos (N─N perfiles/permisos)
-- ============================================================================

USE BissVet;

-- ----------------------------------------------------------------------------
-- 1. PROCEDIMIENTO AUXILIAR: agrega columna SOLO si no existe (conserva la tabla)
-- ----------------------------------------------------------------------------
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
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('AGREGADA:          ', p_tabla, '.', p_columna) AS aviso;
    END IF;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 2. USUARIOS: completar datos del usuario (RF-003/RF-004, sección 6 del doc)
--    Se conserva UsuarioId, IdEmpresa, IdPerfil, Username, PasswordHash.
-- ----------------------------------------------------------------------------
CALL bissvet_add_column('Usuarios', 'TipoDocumento',     'TipoDocumento VARCHAR(20) NULL');
CALL bissvet_add_column('Usuarios', 'NumeroDocumento',   'NumeroDocumento VARCHAR(30) NULL');
CALL bissvet_add_column('Usuarios', 'PrimerNombre',      'PrimerNombre VARCHAR(60) NULL');
CALL bissvet_add_column('Usuarios', 'SegundoNombre',     'SegundoNombre VARCHAR(60) NULL');
CALL bissvet_add_column('Usuarios', 'PrimerApellido',    'PrimerApellido VARCHAR(60) NULL');
CALL bissvet_add_column('Usuarios', 'SegundoApellido',   'SegundoApellido VARCHAR(60) NULL');
CALL bissvet_add_column('Usuarios', 'Correo',            'Correo VARCHAR(100) NULL');
CALL bissvet_add_column('Usuarios', 'Telefono',          'Telefono VARCHAR(15) NULL');
CALL bissvet_add_column('Usuarios', 'Activo',            'Activo TINYINT(1) NOT NULL DEFAULT 1');
CALL bissvet_add_column('Usuarios', 'Bloqueado',         'Bloqueado TINYINT(1) NOT NULL DEFAULT 0');
CALL bissvet_add_column('Usuarios', 'IntentosFallidos',  'IntentosFallidos INT NOT NULL DEFAULT 0');
CALL bissvet_add_column('Usuarios', 'FechaUltimoIngreso','FechaUltimoIngreso DATETIME NULL');

-- Nota: el índice legible sobre NumeroDocumento se crea al final del script.

-- ----------------------------------------------------------------------------
-- 3. SESIONES (RF-020): control de sesiones por usuario/empresa/IP
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sesiones (
    IdSesion       BIGINT       NOT NULL AUTO_INCREMENT,
    IdEmpresa      INT          NOT NULL,
    UsuarioId      INT          NOT NULL,
    FechaIngreso   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FechaSalida    DATETIME     NULL,
    UltimoAcceso   DATETIME     NULL,
    DireccionIP    VARCHAR(45)  NULL,
    UserAgent      VARCHAR(300) NULL,
    EstadoSesion   ENUM('ACTIVA','CERRADA','EXPIRADA','BLOQUEADA') NOT NULL DEFAULT 'ACTIVA',
    PRIMARY KEY (IdSesion),
    KEY idx_sesiones_empresa_fecha (IdEmpresa, FechaIngreso),
    KEY idx_sesiones_usuario      (UsuarioId),
    KEY idx_sesiones_estado       (EstadoSesion),
    CONSTRAINT fk_sesiones_empresa  FOREIGN KEY (IdEmpresa) REFERENCES empresas (IdEmpresa),
    CONSTRAINT fk_sesiones_usuario  FOREIGN KEY (UsuarioId) REFERENCES Usuarios (UsuarioId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Control de sesiones (RF-020)';

-- ----------------------------------------------------------------------------
-- 4. USUARIOPERMISOS (RF-010): permisos especiales otorgados DIRECTAMENTE
--    a un usuario (adicionales a los de sus roles). Quedan auditados.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuariopermisos (
    UsuarioId      INT          NOT NULL,
    IdPermiso      INT          NOT NULL,
    TipoAcceso     VARCHAR(20)  NOT NULL DEFAULT 'PERMITIR',
    AsignadoPor    INT          NULL,
    FechaAsignacion DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UsuarioId, IdPermiso),
    KEY idx_up_permiso   (IdPermiso),
    CONSTRAINT fk_up_usuario     FOREIGN KEY (UsuarioId)   REFERENCES Usuarios (UsuarioId),
    CONSTRAINT fk_up_permiso     FOREIGN KEY (IdPermiso)   REFERENCES permisos (IdPermiso),
    CONSTRAINT fk_up_asignadopor FOREIGN KEY (AsignadoPor) REFERENCES Usuarios (UsuarioId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Permisos directos a usuario (RF-010)';

-- ----------------------------------------------------------------------------
-- 5. PARAMETROSSEGURIDAD (RF-018/RF-019): política de contraseñas y bloqueo.
--    Valores configurables por el Administrador desde la aplicación.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parametrosseguridad (
    IdParametro INT           NOT NULL AUTO_INCREMENT,
    Codigo      VARCHAR(50)   NOT NULL,
    Nombre      VARCHAR(100)  NOT NULL,
    Valor       VARCHAR(50)   NOT NULL,
    Descripcion VARCHAR(300)  NULL,
    Activo      TINYINT(1)    NOT NULL DEFAULT 1,
    PRIMARY KEY (IdParametro),
    UNIQUE KEY uk_parametro_codigo (Codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Política de contraseñas y bloqueo (RF-018/RF-019)';

INSERT IGNORE INTO parametrosseguridad (Codigo, Nombre, Valor, Descripcion, Activo) VALUES
('MAX_INTENTOS_FALLIDOS',  'Máximo de intentos fallidos',              '5',  'Intentos antes de bloquear el usuario',          1),
('CLAVE_LONGITUD_MINIMA',  'Longitud mínima de contraseña',            '8',  'Cantidad mínima de caracteres',                  1),
('CLAVE_MAYUSCULA',        'Requiere mayúscula',                       '1',  'La contraseña exige al menos una mayúscula',     1),
('CLAVE_MINUSCULA',        'Requiere minúscula',                       '1',  'La contraseña exige al menos una minúscula',     1),
('CLAVE_NUMERO',           'Requiere número',                          '1',  'La contraseña exige al menos un número',         1),
('CLAVE_ESPECIAL',         'Requiere carácter especial',               '0',  'La contraseña exige un carácter especial',       1),
('CLAVE_DIAS_EXPIRACION',  'Días de expiración de contraseña',         '90', 'Días para forzar cambio de contraseña',          1);

-- ----------------------------------------------------------------------------
-- 6. ROL SUPERADMIN (RF-022): rol global (IdEmpresa NULL = aplica a todo).
--    Insert idempotente (evita duplicados al re-ejecutar).
-- ----------------------------------------------------------------------------
INSERT INTO roles (IdEmpresa, Nombre, Descripcion)
SELECT NULL, 'SUPERADMIN', 'Administración global del sistema (RF-022)'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE Nombre = 'SUPERADMIN' AND IdEmpresa IS NULL);

-- ----------------------------------------------------------------------------
-- 7. DATOS INICIALES DEL USUARIO admin EXISTENTE (conserva su UsuarioId/Username)
--    Se completa el perfil de datos personales para pruebas desde la app.
-- ----------------------------------------------------------------------------
UPDATE Usuarios
   SET TipoDocumento   = COALESCE(TipoDocumento, 'CC'),
       NumeroDocumento = COALESCE(NumeroDocumento, '123456789'),
       PrimerNombre    = COALESCE(PrimerNombre, 'Administrador'),
       PrimerApellido  = COALESCE(PrimerApellido, 'Sistema'),
       Correo          = COALESCE(Correo, 'admin@bissvet.local'),
       Telefono        = COALESCE(Telefono, '3000000000'),
       Activo          = 1,
       Bloqueado       = 0,
       IntentosFallidos= 0
 WHERE Username = 'admin';

-- ----------------------------------------------------------------------------
-- 8. ÍNDICE legible para búsqueda de usuarios por documento (idempotente)
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS bissvet_seguridad_add_index_documento;

DELIMITER $$
CREATE PROCEDURE bissvet_seguridad_add_index_documento()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'Usuarios'
          AND INDEX_NAME   = 'idx_usuarios_documento'
    ) THEN
        ALTER TABLE Usuarios ADD INDEX idx_usuarios_documento (NumeroDocumento);
        SELECT 'ÍNDICE CREATE:   idx_usuarios_documento' AS aviso;
    ELSE
        SELECT 'OK (ya existía): idx_usuarios_documento' AS aviso;
    END IF;
END$$
DELIMITER ;

CALL bissvet_seguridad_add_index_documento();

SELECT '=== FASE 2 SEGURIDAD COMPLETADA ===' AS estado;