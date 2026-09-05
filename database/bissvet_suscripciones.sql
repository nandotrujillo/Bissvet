-- =============================================================================
-- BISSVET - MÓDULO DE MONETIZACIÓN: PLANES, SUSCRIPCIONES, MÓDULOS Y LÍMITES
-- =============================================================================
-- Sistema: BissVet | Módulo: Suscripciones y Monetización | Versión: 1.0
-- Motor:   MySQL 8.0  |  Fecha: 05/09/2026
--
--  ✔ IDEMPOTENTE: puede ejecutarse varias veces sin dañar datos.
--  ✔ Se reutilizan las tablas existentes: empresas, Usuarios, modulos, permisos.
--  ✔ Los planes NO están "quemados" en código: todo es parametrizable.
--
--  Entidades nuevas:
--   planes                         -> catálogo comercial de planes
--   plan_modulos                   -> módulos incluidos en cada plan
--   tipos_limite                   -> catálogo de tipos de límite (extensible)
--   plan_limites                   -> valor límite por plan y tipo
--   suscripciones                  -> plan contratado por empresa + estado + vigencia
--   suscripcion_modulos            -> módulos ADD-ON contratados fuera del plan
--   historial_suscripciones        -> bitácora de cambios de plan/suscripción
--
--  Además:
--   - Se agregan los módulos PLANES y SUSCRIPCIONES al catálogo modulos.
--   - Se crean los permisos PLANES.* y SUSCRIPCIONES.* (solo SUPERADMIN global).
--   - Se configura el periodo de prueba por parámetro TRIAL_DAYS (configurable).
--   - Se crea automáticamente una suscripción PRUEBA para empresas sin suscripción.
-- =============================================================================

USE BissVet;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- FASE 1 - PLANES (catálogo comercial)
-- RF-MON-001: crear planes | RF-MON-002: precios | RF-MON-003: máx. usuarios
-- RF-MON-004: módulos por plan | RF-MON-005: límites de uso
-- =============================================================================

CREATE TABLE IF NOT EXISTS planes (
  IdPlan                 INT            NOT NULL AUTO_INCREMENT,
  CodigoPlan             VARCHAR(20)    NOT NULL,
  NombrePlan             VARCHAR(100)   NOT NULL,
  Descripcion            VARCHAR(300)   NULL,
  PrecioMensual          DECIMAL(18,2)  NOT NULL DEFAULT 0,
  PrecioAnual            DECIMAL(18,2)  NOT NULL DEFAULT 0,
  Moneda                 VARCHAR(5)     NOT NULL DEFAULT 'COP',
  MaxUsuarios            INT            NOT NULL DEFAULT 1,
  DiasPrueba             INT            NULL COMMENT 'Nº de días de prueba gratis para este plan (NULL = usa TRIAL_DAYS global)',
  Activo                 TINYINT(1)     NOT NULL DEFAULT 1,
  FechaCreacion          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdCreacion      INT            NULL,
  FechaModificacion      DATETIME       NULL,
  UsuarioIdModificacion  INT            NULL,
  PRIMARY KEY (IdPlan),
  UNIQUE KEY uk_plan_codigo (CodigoPlan),
  UNIQUE KEY uk_plan_nombre (NombrePlan),
  KEY idx_plan_activo (Activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='RF-MON-001: catálogo de planes comerciales';

-- Planes iniciales (idempotente por CodigoPlan)
INSERT IGNORE INTO planes
  (CodigoPlan, NombrePlan, Descripcion, PrecioMensual, PrecioAnual, Moneda, MaxUsuarios, DiasPrueba, Activo)
VALUES
  ('BASICO',       'Básico',       'Para pequeñas veterinarias: clientes, mascotas, citas y servicios.',
   199000, 1990000, 'COP', 2,  NULL, 1),
  ('PROFESIONAL',  'Profesional',  'Para clínicas: historias clínicas, inventarios, bodegas y ventas.',
   399000, 3990000, 'COP', 5,  NULL, 1),
  ('EMPRESARIAL',  'Empresarial',  'Para operaciones completas: compras, caja y multi-sede.',
   799000, 7990000, 'COP', 10, NULL, 1);

-- =============================================================================
-- FASE 2 - PLAN_MODULOS (módulos incluidos en cada plan)
-- Relación: PLAN -> PLAN_MODULOS -> MODULOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS plan_modulos (
  IdPlan                INT            NOT NULL,
  IdModulo              INT            NOT NULL,
  FechaAsignacion       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (IdPlan, IdModulo),
  KEY idx_pm_modulo (IdModulo),
  CONSTRAINT fk_planmodulos_plan   FOREIGN KEY (IdPlan)   REFERENCES planes(IdPlan),
  CONSTRAINT fk_planmodulos_modulo FOREIGN KEY (IdModulo) REFERENCES modulos(idModulos)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='RF-MON-004: módulos incluidos en cada plan';

-- Mapeo de módulos por plan (idempotente)
INSERT IGNORE INTO plan_modulos (IdPlan, IdModulo)
SELECT p.IdPlan, m.idModulos
FROM planes p
INNER JOIN modulos m ON 1 = 1
WHERE
  (p.CodigoPlan = 'BASICO' AND m.Codigo IN (
     'SEGURIDAD','EMPRESAS','USUARIOS','CLIENTES','MASCOTAS','CITAS','SERVICIOS','REPORTES'))
  OR
  (p.CodigoPlan = 'PROFESIONAL' AND m.Codigo IN (
     'SEGURIDAD','EMPRESAS','USUARIOS','CLIENTES','MASCOTAS','CITAS','SERVICIOS','REPORTES',
     'VETERINARIOS','HISTORIA_CLINICA','PRODUCTOS','BODEGAS','INVENTARIOS','VENTAS','AUDITORIA'))
  OR
  (p.CodigoPlan = 'EMPRESARIAL' AND m.Codigo IN (
     'SEGURIDAD','EMPRESAS','USUARIOS','CLIENTES','MASCOTAS','CITAS','SERVICIOS','REPORTES',
     'VETERINARIOS','HISTORIA_CLINICA','PRODUCTOS','BODEGAS','INVENTARIOS','VENTAS','AUDITORIA',
     'COMPRAS','CAJA'));

-- =============================================================================
-- FASE 3 - LÍMITES DE PLANES (modelo extensible: PLAN -> PLAN_LIMITES -> TIPO_LIMITE)
-- RF-MON-005, sección 18/19 del requerimiento: no crear una columna por límite.
-- =============================================================================

CREATE TABLE IF NOT EXISTS tipos_limite (
  IdTipoLimite          INT            NOT NULL AUTO_INCREMENT,
  Codigo                VARCHAR(50)    NOT NULL,
  Nombre                VARCHAR(100)   NOT NULL,
  Descripcion           VARCHAR(300)   NULL,
  Unidad                VARCHAR(20)    NULL,
  Activo                TINYINT(1)     NOT NULL DEFAULT 1,
  PRIMARY KEY (IdTipoLimite),
  UNIQUE KEY uk_tipolimite_codigo (Codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='RF-MON-005: catálogo de tipos de límite (extensible)';

INSERT IGNORE INTO tipos_limite (Codigo, Nombre, Descripcion, Unidad, Activo) VALUES
  ('BODEGAS',            'Bodegas',            'Máximo de bodegas habilitadas',             'unidades', 1),
  ('MASCOTAS',           'Mascotas',           'Máximo de mascotas registradas',            'unidades', 1),
  ('PRODUCTOS',          'Productos',          'Máximo de productos del catálogo',          'unidades', 1),
  ('CLIENTES',           'Clientes',           'Máximo de clientes registrados',            'unidades', 1),
  ('ALMACENAMIENTO_GB',  'Almacenamiento',     'Almacenamiento en gigabytes',               'GB',       1);

CREATE TABLE IF NOT EXISTS plan_limites (
  IdPlan                INT            NOT NULL,
  IdTipoLimite          INT            NOT NULL,
  ValorLimite           INT            NOT NULL COMMENT '-1 = ilimitado',
  FechaAsignacion       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (IdPlan, IdTipoLimite),
  KEY idx_pl_tipolimite (IdTipoLimite),
  CONSTRAINT fk_planlimites_plan      FOREIGN KEY (IdPlan)       REFERENCES planes(IdPlan),
  CONSTRAINT fk_planlimites_tipolim   FOREIGN KEY (IdTipoLimite) REFERENCES tipos_limite(IdTipoLimite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='RF-MON-005: valor límite por tipo en cada plan';

INSERT IGNORE INTO plan_limites (IdPlan, IdTipoLimite, ValorLimite)
SELECT p.IdPlan, t.IdTipoLimite,
       CASE
         WHEN p.CodigoPlan = 'BASICO' AND t.Codigo = 'BODEGAS'           THEN 1
         WHEN p.CodigoPlan = 'BASICO' AND t.Codigo = 'MASCOTAS'          THEN 200
         WHEN p.CodigoPlan = 'BASICO' AND t.Codigo = 'PRODUCTOS'         THEN 100
         WHEN p.CodigoPlan = 'BASICO' AND t.Codigo = 'CLIENTES'          THEN 200
         WHEN p.CodigoPlan = 'BASICO' AND t.Codigo = 'ALMACENAMIENTO_GB' THEN 1
         WHEN p.CodigoPlan = 'PROFESIONAL' AND t.Codigo = 'BODEGAS'      THEN 3
         WHEN p.CodigoPlan = 'PROFESIONAL' AND t.Codigo = 'MASCOTAS'     THEN 2000
         WHEN p.CodigoPlan = 'PROFESIONAL' AND t.Codigo = 'PRODUCTOS'    THEN 1000
         WHEN p.CodigoPlan = 'PROFESIONAL' AND t.Codigo = 'CLIENTES'     THEN 2000
         WHEN p.CodigoPlan = 'PROFESIONAL' AND t.Codigo = 'ALMACENAMIENTO_GB' THEN 5
         WHEN p.CodigoPlan = 'EMPRESARIAL' AND t.Codigo = 'BODEGAS'      THEN 10
         WHEN p.CodigoPlan = 'EMPRESARIAL' AND t.Codigo = 'MASCOTAS'     THEN 10000
         WHEN p.CodigoPlan = 'EMPRESARIAL' AND t.Codigo = 'PRODUCTOS'    THEN 5000
         WHEN p.CodigoPlan = 'EMPRESARIAL' AND t.Codigo = 'CLIENTES'     THEN 20000
         WHEN p.CodigoPlan = 'EMPRESARIAL' AND t.Codigo = 'ALMACENAMIENTO_GB' THEN 20
       END AS ValorLimite
FROM planes p CROSS JOIN tipos_limite t
WHERE p.CodigoPlan IN ('BASICO','PROFESIONAL','EMPRESARIAL')
  AND NOT EXISTS (
      SELECT 1 FROM plan_limites pl
      WHERE pl.IdPlan = p.IdPlan AND pl.IdTipoLimite = t.IdTipoLimite
  );

SELECT 'FASES 1-3 (PLANES, MÓDULOS, LÍMITES) OK' AS estado;

-- =============================================================================
-- FASE 4 - SUSCRIPCIONES (lo que cada empresa contrató)
-- RF-MON-006: suscripciones | RF-MON-007: vigencia | estado y periodicidad
-- =============================================================================

CREATE TABLE IF NOT EXISTS suscripciones (
  IdSuscripcion         INT            NOT NULL AUTO_INCREMENT,
  IdEmpresa             INT            NOT NULL,
  IdPlan                INT            NOT NULL,
  Estado                ENUM('PRUEBA','ACTIVA','VENCIDA','SUSPENDIDA','CANCELADA') NOT NULL DEFAULT 'PRUEBA',
  FechaInicio           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FechaFin              DATETIME       NULL,
  Periodicidad          ENUM('MENSUAL','ANUAL','UNICO') NOT NULL DEFAULT 'MENSUAL',
  AutoRenovacion        TINYINT(1)     NOT NULL DEFAULT 0,
  FechaProximaFacturacion DATETIME     NULL,
  FechaCreacion         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UsuarioIdCreacion     INT            NULL,
  FechaModificacion     DATETIME       NULL,
  UsuarioIdModificacion INT            NULL,
  PRIMARY KEY (IdSuscripcion),
  KEY idx_sus_empresa (IdEmpresa),
  KEY idx_sus_plan (IdPlan),
  KEY idx_sus_estado (Estado),
  KEY idx_sus_fechafin (FechaFin),
  CONSTRAINT fk_suscripciones_empresa FOREIGN KEY (IdEmpresa) REFERENCES empresas(IdEmpresa),
  CONSTRAINT fk_suscripciones_plan    FOREIGN KEY (IdPlan)    REFERENCES planes(IdPlan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='RF-MON-006: suscripción por empresa';

CREATE TABLE IF NOT EXISTS suscripcion_modulos (
  IdSuscripcion         INT            NOT NULL,
  IdModulo              INT            NOT NULL,
  PrecioAdicional       DECIMAL(18,2)  NOT NULL DEFAULT 0,
  FechaAsignacion       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (IdSuscripcion, IdModulo),
  KEY idx_sm_modulo (IdModulo),
  CONSTRAINT fk_susmod_suscripcion FOREIGN KEY (IdSuscripcion) REFERENCES suscripciones(IdSuscripcion),
  CONSTRAINT fk_susmod_modulo      FOREIGN KEY (IdModulo)      REFERENCES modulos(idModulos)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='RF-MON-010: módulos ADD-ON contratados fuera del plan';

CREATE TABLE IF NOT EXISTS historial_suscripciones (
  IdHistorial           BIGINT         NOT NULL AUTO_INCREMENT,
  IdSuscripcion         INT            NOT NULL,
  IdEmpresa             INT            NOT NULL,
  PlanAnterior          INT            NULL,
  PlanNuevo             INT            NOT NULL,
  EstadoAnterior        VARCHAR(20)    NULL,
  EstadoNuevo           VARCHAR(20)    NOT NULL,
  PrecioAnterior        DECIMAL(18,2)  NULL,
  PrecioNuevo           DECIMAL(18,2)  NULL,
  Motivo                VARCHAR(300)   NULL,
  UsuarioId             INT            NULL,
  FechaCambio           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (IdHistorial),
  KEY idx_hs_suscripcion (IdSuscripcion),
  KEY idx_hs_empresa (IdEmpresa),
  KEY idx_hs_fecha (FechaCambio),
  CONSTRAINT fk_histsus_suscripcion FOREIGN KEY (IdSuscripcion) REFERENCES suscripciones(IdSuscripcion),
  CONSTRAINT fk_histsus_empresa     FOREIGN KEY (IdEmpresa)     REFERENCES empresas(IdEmpresa),
  CONSTRAINT fk_histsus_plan_anterior FOREIGN KEY (PlanAnterior) REFERENCES planes(IdPlan),
  CONSTRAINT fk_histsus_plan_nuevo    FOREIGN KEY (PlanNuevo)    REFERENCES planes(IdPlan),
  CONSTRAINT fk_histsus_usuario       FOREIGN KEY (UsuarioId)    REFERENCES Usuarios(UsuarioId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='RF-MON-012: historial de cambios de suscripción';

-- Suscripción inicial para la empresa de ejemplo (demostración)
INSERT IGNORE INTO suscripciones (IdEmpresa, IdPlan, Estado, FechaInicio, FechaFin, Periodicidad, AutoRenovacion)
SELECT e.IdEmpresa, p.IdPlan, 'PRUEBA', NOW(),
       DATE_ADD(NOW(), INTERVAL COALESCE(p.DiasPrueba, (SELECT COALESCE(MAX(CAST(Valor AS UNSIGNED)), 15)
                                                       FROM parametrosseguridad WHERE Codigo = 'TRIAL_DAYS')) DAY),
       'MENSUAL', 0
FROM empresas e
INNER JOIN planes p ON p.CodigoPlan = 'PROFESIONAL'
WHERE e.CodigoEmpresa = 'EMP001'
  AND NOT EXISTS (SELECT 1 FROM suscripciones s WHERE s.IdEmpresa = e.IdEmpresa);

-- Procedimiento: crea suscripción PRUEBA (plan BÁSICO) para cualquier empresa sin suscripción
DROP PROCEDURE IF EXISTS bissvet_crear_suscripcion_prueba;
DELIMITER $$
CREATE PROCEDURE bissvet_crear_suscripcion_prueba()
BEGIN
  DECLARE v_dias INT;
  SELECT COALESCE(MAX(CAST(Valor AS UNSIGNED)), 15) INTO v_dias
  FROM parametrosseguridad WHERE Codigo = 'TRIAL_DAYS';

  INSERT IGNORE INTO suscripciones (IdEmpresa, IdPlan, Estado, FechaInicio, FechaFin, Periodicidad, AutoRenovacion)
  SELECT e.IdEmpresa, p.IdPlan, 'PRUEBA', NOW(), DATE_ADD(NOW(), INTERVAL COALESCE(p.DiasPrueba, v_dias) DAY),
         'MENSUAL', 0
  FROM empresas e
  INNER JOIN planes p ON p.CodigoPlan = 'BASICO'
  WHERE NOT EXISTS (SELECT 1 FROM suscripciones s WHERE s.IdEmpresa = e.IdEmpresa);
END$$
DELIMITER ;

CALL bissvet_crear_suscripcion_prueba();

SELECT 'FASE 4 (SUSCRIPCIONES) OK' AS estado;

-- =============================================================================
-- FASE 5 - MÓDULOS Y PERMISOS ADMINISTRATIVOS (PLANES y SUSCRIPCIONES)
-- Solo un SUPERADMIN global (propietario de la plataforma) los administra.
-- =============================================================================

INSERT IGNORE INTO modulos (Codigo, NombreModulo, Descripcion, Ruta, Icono, Orden, Activo) VALUES
  ('PLANES',         'Planes',         'Administración comercial de planes',      '/dashboard/planes',        'pricing',     18, 1),
  ('SUSCRIPCIONES',  'Suscripciones',  'Suscripciones de las empresas',           '/dashboard/suscripciones', 'subscriptions', 19, 1),
  ('MI_PLAN',        'Mi Plan',        'Plan y consumo de la empresa',            '/dashboard/mi-plan',       'business',    20, 1);

INSERT IGNORE INTO permisos (IdModulo, Codigo, Nombre, Descripcion) VALUES
  ((SELECT idModulos FROM modulos WHERE Codigo='PLANES'),        'PLANES.CONSULTAR',          'Consultar planes',      'Ver catálogo de planes'),
  ((SELECT idModulos FROM modulos WHERE Codigo='PLANES'),        'PLANES.CREAR',              'Crear plan',            'Crear planes comerciales'),
  ((SELECT idModulos FROM modulos WHERE Codigo='PLANES'),        'PLANES.EDITAR',             'Editar plan',           'Modificar planes y precios'),
  ((SELECT idModulos FROM modulos WHERE Codigo='PLANES'),        'PLANES.ELIMINAR',           'Inactivar plan',        'Activar/Inactivar planes'),
  ((SELECT idModulos FROM modulos WHERE Codigo='PLANES'),        'PLANES.CONFIGURAR',         'Configurar plan',       'Asignar módulos y límites del plan'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SUSCRIPCIONES'), 'SUSCRIPCIONES.CONSULTAR',   'Consultar suscripciones','Ver suscripciones de empresas'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SUSCRIPCIONES'), 'SUSCRIPCIONES.ASIGNAR',     'Asignar suscripción',   'Crear suscripción a una empresa'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SUSCRIPCIONES'), 'SUSCRIPCIONES.CAMBIAR_PLAN','Cambiar plan',          'Cambiar el plan de una empresa'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SUSCRIPCIONES'), 'SUSCRIPCIONES.SUSPENDER',   'Suspender/Reactivar',   'Suspender o reactivar suscripción'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SUSCRIPCIONES'), 'SUSCRIPCIONES.ADDONS',      'Módulos adiciones',     'Administrar módulos ADD-ON'),
  ((SELECT idModulos FROM modulos WHERE Codigo='SUSCRIPCIONES'), 'SUSCRIPCIONES.CANCELAR',    'Cancelar suscripción',  'Cancelar la suscripción de una empresa');

-- Otorgar administración de planes y suscripciones SOLO al rol SUPERADMIN global (IdEmpresa NULL)
INSERT IGNORE INTO rolpermisos (IdRol, IdPermiso)
SELECT r.IdRol, p.IdPermiso
FROM roles r
INNER JOIN permisos p ON p.Codigo IN (
  'PLANES.CONSULTAR','PLANES.CREAR','PLANES.EDITAR','PLANES.ELIMINAR','PLANES.CONFIGURAR',
  'SUSCRIPCIONES.CONSULTAR','SUSCRIPCIONES.ASIGNAR','SUSCRIPCIONES.CAMBIAR_PLAN',
  'SUSCRIPCIONES.SUSPENDER','SUSCRIPCIONES.ADDONS','SUSCRIPCIONES.CANCELAR')
WHERE r.Nombre = 'SUPERADMIN' AND r.IdEmpresa IS NULL;

-- =============================================================================
-- FASE 6 - PARÁMETRO PERIODO DE PRUEBA (configurable)
-- La empresa administradora puede cambiar el valor sin tocar código.
-- =============================================================================

INSERT IGNORE INTO parametrosseguridad (Codigo, Nombre, Valor, Descripcion, Activo) VALUES
('TRIAL_DAYS',  'Días de prueba gratuita', '15', 'Periodo de prueba gratis al crear una empresa', 1);

SET FOREIGN_KEY_CHECKS = 1;

SELECT '=== MÓDULO DE SUSCRIPCIONES Y MONETIZACIÓN COMPLETADO ===' AS estado;