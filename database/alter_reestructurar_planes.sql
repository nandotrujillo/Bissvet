-- =============================================================================
-- MIGRACIÓN: Reestructuración de módulos por plan
-- -----------------------------------------------------------------------------
-- BÁSICO:  operacional (clientes, productos, bodegas, inventarios, compras,
--           ventas, servicios, reportes, seguridad, empresas, usuarios)
-- PROFESIONAL: + clínico (mascotas, citas, veterinarios, historia clínica,
--              auditoría)
-- EMPRESARIAL: + caja + módulos nuevos para pruebas
--              (CATEGORIAS_SERVICIO)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. MÓDULO NUEVO: Categorías de Servicio (menú dinámico / RF-007)
--    Solo se contratará en el plan EMPRESARIAL.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO modulos
  (Codigo, NombreModulo, Descripcion, Ruta, Icono, Orden, Activo)
VALUES
  ('CATEGORIAS_SERVICIO', 'Categorías de Servicio',
   'Clasificación de servicios veterinarios',
   '/dashboard/categorias-servicio', 'category', 18, 1);

-- 0.1 PERMISOS del módulo CATEGORIAS_SERVICIO
INSERT IGNORE INTO permisos (IdModulo, Codigo, Nombre, Descripcion)
SELECT
  m.idModulos, CONCAT(m.Codigo, '.', a.sufijo), a.Nombre, a.Descripcion
FROM modulos m
CROSS JOIN (
  SELECT 'CONSULTAR' AS sufijo, 'Consultar categorías' AS Nombre, 'Ver categorías de servicio' AS Descripcion
  UNION ALL SELECT 'CREAR',    'Crear categorías',     'Registrar categorías de servicio'
  UNION ALL SELECT 'EDITAR',   'Editar categorías',    'Modificar categorías de servicio'
  UNION ALL SELECT 'ELIMINAR', 'Eliminar categorías',  'Inactivar categorías de servicio'
) a
WHERE m.Codigo = 'CATEGORIAS_SERVICIO';

-- 0.2 Otorgar los permisos nuevos al rol ADMINISTRADOR (todas las empresas)
INSERT IGNORE INTO rolpermisos (IdRol, IdPermiso, TipoAcceso)
SELECT r.IdRol, p.IdPermiso, 'PERMITIR'
FROM roles r
INNER JOIN permisos p ON p.Codigo LIKE 'CATEGORIAS_SERVICIO.%'
WHERE r.Nombre = 'ADMINISTRADOR';

-- 1. Limpiar la tabla plan_modulos
DELETE FROM plan_modulos;

-- 2. BÁSICO: módulos operacionales
INSERT INTO plan_modulos (IdPlan, IdModulo)
SELECT p.IdPlan, m.idModulos
FROM planes p
INNER JOIN modulos m ON m.Codigo IN (
  'SEGURIDAD','EMPRESAS','USUARIOS','CLIENTES',
  'PRODUCTOS','BODEGAS','INVENTARIOS','COMPRAS','VENTAS',
  'SERVICIOS','REPORTES'
)
WHERE p.CodigoPlan = 'BASICO';

-- 3. PROFESIONAL: operacionales + clínicos
INSERT INTO plan_modulos (IdPlan, IdModulo)
SELECT p.IdPlan, m.idModulos
FROM planes p
INNER JOIN modulos m ON m.Codigo IN (
  'SEGURIDAD','EMPRESAS','USUARIOS','CLIENTES',
  'PRODUCTOS','BODEGAS','INVENTARIOS','COMPRAS','VENTAS',
  'SERVICIOS','REPORTES',
  'MASCOTAS','CITAS','VETERINARIOS','HISTORIA_CLINICA','AUDITORIA'
)
WHERE p.CodigoPlan = 'PROFESIONAL';

-- 4. EMPRESARIAL: operacionales + clínicos + caja + módulos nuevos
INSERT INTO plan_modulos (IdPlan, IdModulo)
SELECT p.IdPlan, m.idModulos
FROM planes p
INNER JOIN modulos m ON m.Codigo IN (
  'SEGURIDAD','EMPRESAS','USUARIOS','CLIENTES',
  'PRODUCTOS','BODEGAS','INVENTARIOS','COMPRAS','VENTAS',
  'SERVICIOS','REPORTES',
  'MASCOTAS','CITAS','VETERINARIOS','HISTORIA_CLINICA','AUDITORIA',
  'CAJA',
  'CATEGORIAS_SERVICIO'
)
WHERE p.CodigoPlan = 'EMPRESARIAL';

-- 5. Verificar resultado
SELECT p.CodigoPlan, m.Codigo, m.NombreModulo
FROM plan_modulos pm
INNER JOIN planes p ON pm.IdPlan = p.IdPlan
INNER JOIN modulos m ON pm.IdModulo = m.idModulos
ORDER BY p.CodigoPlan, m.Orden;
