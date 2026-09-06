-- ============================================================================
-- MIGRACIÓN: Módulo "Tipos de Pago" (administración del catálogo de medios
-- de pago usados en Ventas).
--   1. Registra el módulo en `modulos` (idModulos = 21)
--   2. Crea los permisos TIPOS_PAGO.* (166..169)
--   3. Otorga los permisos al rol ADMINISTRADOR (1)
--   4. Asocia el módulo a los planes BÁSICO/PROFESIONAL/EMPRESARIAL
-- Idempotente: se puede ejecutar varias veces sin error.
-- ============================================================================

-- 1. Módulo en el menú
INSERT INTO modulos (idModulos, Codigo, NombreModulo, Descripcion, Ruta, Icono, Orden, Activo)
SELECT 21, 'TIPOS_PAGO', 'Tipos de Pago', 'Medios de pago de ventas', '/dashboard/tipos-pago', '💳', 16, 1
WHERE NOT EXISTS (SELECT 1 FROM modulos WHERE idModulos = 21);

-- 2. Permisos del módulo
INSERT INTO permisos (IdPermiso, IdModulo, Codigo, Nombre, Descripcion, Activo)
SELECT 166, 21, 'TIPOS_PAGO.CONSULTAR', 'Consultar tipos de pago', 'Ver tipos de pago', 1
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE Codigo = 'TIPOS_PAGO.CONSULTAR');

INSERT INTO permisos (IdPermiso, IdModulo, Codigo, Nombre, Descripcion, Activo)
SELECT 167, 21, 'TIPOS_PAGO.CREAR', 'Crear tipo de pago', 'Registrar tipos de pago', 1
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE Codigo = 'TIPOS_PAGO.CREAR');

INSERT INTO permisos (IdPermiso, IdModulo, Codigo, Nombre, Descripcion, Activo)
SELECT 168, 21, 'TIPOS_PAGO.EDITAR', 'Editar tipo de pago', 'Modificar tipos de pago', 1
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE Codigo = 'TIPOS_PAGO.EDITAR');

INSERT INTO permisos (IdPermiso, IdModulo, Codigo, Nombre, Descripcion, Activo)
SELECT 169, 21, 'TIPOS_PAGO.ELIMINAR', 'Eliminar tipo de pago', 'Eliminar tipos de pago', 1
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE Codigo = 'TIPOS_PAGO.ELIMINAR');

-- 3. Permisos efectivos para el rol ADMINISTRADOR (1)
INSERT INTO rolpermisos (IdRol, IdPermiso, TipoAcceso, FechaAsignacion)
SELECT 1, p.IdPermiso, 'PERMITIR', NOW()
FROM permisos p
WHERE p.Codigo LIKE 'TIPOS_PAGO.%'
  AND NOT EXISTS (SELECT 1 FROM rolpermisos rp WHERE rp.IdRol = 1 AND rp.IdPermiso = p.IdPermiso);

-- 4. Módulo disponible en los tres planes
INSERT INTO plan_modulos (IdPlan, IdModulo, FechaAsignacion)
SELECT p.IdPlan, 21, NOW()
FROM planes p
WHERE NOT EXISTS (SELECT 1 FROM plan_modulos pm WHERE pm.IdPlan = p.IdPlan AND pm.IdModulo = 21);