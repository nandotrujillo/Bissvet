-- ============================================================================
-- Migración: permisos clínicos para el rol y el perfil VETERINARIO
-- ----------------------------------------------------------------------------
-- Aplica el conjunto mínimo de permisos del flujo clínico al rol VETERINARIO
-- (IdRol 2) y al perfil Veterinario (IdPerfil 2):
--   CLIENTES (consultar/crear/editar), MASCOTAS (consultar/crear/editar),
--   VETERINARIOS.CONSULTAR, CITAS (consultar/crear/editar/aprobar),
--   HISTORIA (consultar/crear/editar/cerrar/imprimir/exportar),
--   SERVICIOS.CONSULTAR, FACTURACION.SERVICIOS.
-- Idempotente: INSERT ... SELECT ... WHERE NOT EXISTS.
-- ============================================================================

USE BissVet;

SET @PermisosVet = 'CLIENTES.CONSULTAR,CLIENTES.CREAR,CLIENTES.EDITAR,MASCOTAS.CONSULTAR,MASCOTAS.CREAR,MASCOTAS.EDITAR,VETERINARIOS.CONSULTAR,CITAS.CONSULTAR,CITAS.CREAR,CITAS.EDITAR,CITAS.APROBAR,HISTORIA.CONSULTAR,HISTORIA.CREAR,HISTORIA.EDITAR,HISTORIA.CERRAR,HISTORIA.IMPRIMIR,HISTORIA.EXPORTAR,SERVICIOS.CONSULTAR,FACTURACION.SERVICIOS';

-- Rol VETERINARIO (IdRol 2)
INSERT INTO rolpermisos (IdRol, IdPermiso, TipoAcceso, FechaAsignacion)
SELECT 2, p.IdPermiso, 'PERMITIR', NOW()
FROM permisos p
WHERE FIND_IN_SET(p.Codigo, @PermisosVet)
AND NOT EXISTS (
    SELECT 1 FROM rolpermisos rp
    WHERE rp.IdRol = 2 AND rp.IdPermiso = p.IdPermiso
);

-- Perfil Veterinario (IdPerfil 2)
INSERT INTO perfilpermisos (IdPerfil, IdPermiso, TipoAcceso, FechaAsignacion)
SELECT 2, p.IdPermiso, 'PERMITIR', NOW()
FROM permisos p
WHERE FIND_IN_SET(p.Codigo, @PermisosVet)
AND NOT EXISTS (
    SELECT 1 FROM perfilpermisos pp
    WHERE pp.IdPerfil = 2 AND pp.IdPermiso = p.IdPermiso
);