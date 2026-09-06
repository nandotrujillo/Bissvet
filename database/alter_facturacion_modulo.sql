-- ============================================================================
-- MIGRACIÓN: Módulo "Facturación de Servicios" (FACTURACION.SERVICIOS)
-- Controla por rol/usuario quién puede facturar servicios de citas/consultas
-- desde la pantalla de Citas (crear + confirmar la venta del servicio).
--   1. Registra el módulo en `modulos` (idModulos = 22)
--   2. Crea el permiso FACTURACION.SERVICIOS (IdPermiso = 170)
--   3. Otorga el permiso al rol ADMINISTRADOR (1) y a los roles de empresa
--      con perfil que factura (VETERINARIO, VENDEDOR, RECEPCIONISTA, GERENTE,
--      AUXILIAR - por IdRol 2,3,4,6,7)
--   4. Otorga el permiso a los perfiles de empresa que facturan (opcional,
--      para que los usuarios cuyo permiso viene del perfil lo tengan)
--   5. Asocia el módulo a los planes BÁSICO/PROFESIONAL/EMPRESARIAL
-- Idempotente: se puede ejecutar varias veces sin error.
-- ============================================================================

-- 1. Módulo (no es un menú visible como página propia; se usa como permiso
--    de acción de "Facturar servicio" dentro de Citas).
INSERT INTO modulos (idModulos, Codigo, NombreModulo, Descripcion, Ruta, Icono, Orden, Activo)
SELECT 22, 'FACTURACION', 'Facturación de Servicios', 'Permite facturar el servicio de una cita/consulta', NULL, '🧾', 16, 1
WHERE NOT EXISTS (SELECT 1 FROM modulos WHERE idModulos = 22);

-- 2. Permiso del módulo
INSERT INTO permisos (IdPermiso, IdModulo, Codigo, Nombre, Descripcion, Activo)
SELECT 170, 22, 'FACTURACION.SERVICIOS', 'Facturar servicios', 'Crea y confirma la venta de un servicio desde citas', 1
WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE Codigo = 'FACTURACION.SERVICIOS');

-- 3. Permiso efectivo para el rol ADMINISTRADOR (1) y roles de empresa que
--    facturan servicios: VETERINARIO (2), VENDEDOR (3), AUXILIAR (4),
--    RECEPCIONISTA (6), GERENTE (7).
INSERT INTO rolpermisos (IdRol, IdPermiso, TipoAcceso, FechaAsignacion)
SELECT r.IdRol, p.IdPermiso, 'PERMITIR', NOW()
FROM roles r
CROSS JOIN permisos p
WHERE p.Codigo = 'FACTURACION.SERVICIOS'
  AND r.IdRol IN (1, 2, 3, 4, 6, 7)
  AND NOT EXISTS (SELECT 1 FROM rolpermisos rp WHERE rp.IdRol = r.IdRol AND rp.IdPermiso = p.IdPermiso);

-- 4. Permiso efectivo para los perfiles de empresa que facturan servicios
--    (los usuarios cuya configuración inicial viene del perfil).
INSERT INTO perfilpermisos (IdPerfil, IdPermiso, TipoAcceso, FechaAsignacion, AsignadoPor)
SELECT pp.IdPerfil, p.IdPermiso, 'PERMITIR', NOW(), NULL
FROM permisos p
CROSS JOIN perfiles pp
WHERE p.Codigo = 'FACTURACION.SERVICIOS'
  AND pp.IdPerfil IN (1, 2, 3, 4, 6, 7)
  AND NOT EXISTS (SELECT 1 FROM perfilpermisos fp WHERE fp.IdPerfil = pp.IdPerfil AND fp.IdPermiso = p.IdPermiso);

-- 5. Módulo disponible en los tres planes
INSERT INTO plan_modulos (IdPlan, IdModulo, FechaAsignacion)
SELECT pl.IdPlan, 22, NOW()
FROM planes pl
WHERE NOT EXISTS (SELECT 1 FROM plan_modulos pm WHERE pm.IdPlan = pl.IdPlan AND pm.IdModulo = 22);
