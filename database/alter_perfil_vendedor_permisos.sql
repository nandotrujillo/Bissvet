-- ============================================================================
-- Migración: completar permisos de CONSULTA del perfil VENDEDOR (IdPerfil 3)
-- ----------------------------------------------------------------------------
-- Motivo: con el perfil Vendedor, los usuarios no ven bodegas/productos en los
-- listados (GET /api/bodegas exige BODEGAS.CONSULTAR). El rol VENDEDOR ya
-- otorga estos permisos; se replican al perfil para que cualquier usuario con
-- perfil Vendedor tenga los combos de datos de referencia operativos.
-- Idempotente: INSERT ... SELECT ... WHERE NOT EXISTS.
-- ============================================================================

USE BissVet;

INSERT INTO perfilpermisos (IdPerfil, IdPermiso, TipoAcceso, FechaAsignacion)
SELECT 3, p.IdPermiso, 'PERMITIR', NOW()
FROM permisos p
WHERE p.Codigo IN (
    'BODEGAS.CONSULTAR',
    'PRODUCTOS.CONSULTAR',
    'PROVEEDORES.CONSULTAR',
    'VETERINARIOS.CONSULTAR',
    'SERVICIOS.CONSULTAR',
    'MASCOTAS.CONSULTAR',
    'COMPRAS.CONSULTAR'
)
AND NOT EXISTS (
    SELECT 1 FROM perfilpermisos pp
    WHERE pp.IdPerfil = 3 AND pp.IdPermiso = p.IdPermiso
);