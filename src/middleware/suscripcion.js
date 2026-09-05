const pool = require('../database/mysql');

// =============================================================================
// Middleware de SUSCRIPCIÓN y MONETIZACIÓN
// RFC-030: EMPRESA ACTIVA AND SUSCRIPCIÓN ACTIVA AND MÓDULO CONTRATADO
//          AND USUARIO ACTIVO AND PERMISO AUTORIZADO
// El control de suscripción es independiente de los permisos de usuario:
//   - La SUSCRIPCIÓN determina qué MÓDULOS puede usar la empresa.
//   - El ROL/PERMISO determina qué puede hacer cada usuario.
// =============================================================================

const ESTADOS_VALIDOS = ['ACTIVA', 'PRUEBA'];

// =============================================================================
// obtenerSuscripcionActiva: devuelve la suscripción vigente de una empresa
// (la más reciente), junto con los datos del plan.
// =============================================================================
async function obtenerSuscripcionActiva(IdEmpresa) {
    const [rows] = await pool.query(
        `SELECT s.IdSuscripcion, s.IdEmpresa, s.IdPlan, s.Estado,
                s.FechaInicio, s.FechaFin, s.Periodicidad, s.AutoRenovacion,
                s.FechaProximaFacturacion,
                p.CodigoPlan, p.NombrePlan, p.Descripcion,
                p.PrecioMensual, p.PrecioAnual, p.Moneda, p.MaxUsuarios, p.DiasPrueba
         FROM suscripciones s
         INNER JOIN planes p ON p.IdPlan = s.IdPlan
         WHERE s.IdEmpresa = ?
         ORDER BY s.IdSuscripcion DESC
         LIMIT 1`,
        [IdEmpresa]
    );
    return rows[0] || null;
}

// =============================================================================
// modulosContratados: conjunto de códigos de módulos que la empresa tiene
// contratados (los de su plan + los ADD-ON de su suscripción).
// =============================================================================
async function modulosContratados(IdEmpresa) {
    const [rows] = await pool.query(
        `SELECT m.Codigo
         FROM suscripciones s
         INNER JOIN plan_modulos pm ON pm.IdPlan = s.IdPlan
         INNER JOIN modulos m    ON m.idModulos = pm.IdModulo
         WHERE s.IdEmpresa = ? AND s.Estado IN ('ACTIVA','PRUEBA') AND m.Activo = 1
         UNION
         SELECT m.Codigo
         FROM suscripcion_modulos sm
         INNER JOIN suscripciones s ON s.IdSuscripcion = sm.IdSuscripcion
         INNER JOIN modulos m        ON m.idModulos = sm.IdModulo
         WHERE s.IdEmpresa = ? AND s.Estado IN ('ACTIVA','PRUEBA') AND m.Activo = 1`,
        [IdEmpresa, IdEmpresa]
    );
    return new Set(rows.map(r => r.Codigo));
}

// =============================================================================
// verificarModuloContratado: ¿la empresa tiene contratado este módulo en su
// suscripción activa? (RF-MON-008, RFC-030)
// =============================================================================
async function verificarModuloContratado(IdEmpresa, codigoModulo) {
    const [rows] = await pool.query(
        `SELECT 1
         FROM suscripciones s
         INNER JOIN plan_modulos pm ON pm.IdPlan = s.IdPlan
         INNER JOIN modulos m       ON m.idModulos = pm.IdModulo
         WHERE s.IdEmpresa = ? AND s.Estado IN ('ACTIVA','PRUEBA')
           AND m.Codigo = ? AND m.Activo = 1
         UNION
         SELECT 1
         FROM suscripcion_modulos sm
         INNER JOIN suscripciones s ON s.IdSuscripcion = sm.IdSuscripcion
         INNER JOIN modulos m       ON m.idModulos = sm.IdModulo
         WHERE s.IdEmpresa = ? AND s.Estado IN ('ACTIVA','PRUEBA')
           AND m.Codigo = ? AND m.Activo = 1`,
        [IdEmpresa, codigoModulo, IdEmpresa, codigoModulo]
    );
    return rows.length > 0;
}

// =============================================================================
// controlarModuloContratado(codigoModulo): middleware que impide el acceso a
// un módulo cuando la empresa no lo tiene contratado (RF-MON-008, RFC-030).
// El SUPERADMIN global (propietario de la plataforma) siempre tiene acceso.
// =============================================================================
function controlarModuloContratado(codigoModulo) {
    return async (req, res, next) => {
        if (!req.auth) {
            return res.status(401).json({
                ok: false,
                mensaje: 'No autorizado: debe autenticarse primero'
            });
        }

        try {
            const [sa] = await pool.query(
                `SELECT (
                    EXISTS(SELECT 1 FROM usuarioroles ur
                           INNER JOIN roles r ON ur.IdRol = r.IdRol AND r.Activo = 1
                           WHERE ur.UsuarioId = ? AND r.Nombre = 'SUPERADMIN' AND r.IdEmpresa IS NULL)
                    OR EXISTS(SELECT 1 FROM Usuarios u
                              INNER JOIN perfiles pf ON u.IdPerfil = pf.IdPerfil
                              WHERE u.UsuarioId = ? AND pf.Nombre = 'SUPERADMIN')
                ) AS es`,
                [req.auth.UsuarioId, req.auth.UsuarioId]
            );

            if (sa[0].es) {
                return next();
            }

            const contratado = await verificarModuloContratado(
                req.auth.IdEmpresa,
                codigoModulo
            );

            if (contratado) {
                return next();
            }

            return res.status(403).json({
                ok: false,
                mensaje: `Módulo ${codigoModulo} no incluido en el plan contratado por su empresa`
            });
        } catch (error) {
            console.error('Error controlarModuloContratado:', error);
            return res.status(500).json({
                ok: false,
                mensaje: 'Error interno del servidor',
                error: error.message
            });
        }
    };
}

// =============================================================================
// verificarLimiteUsuarios: ¿puede la empresa crear un usuario activo más?
// Usuarios ACTIVOS ocupan cupo; usuarios INACTIVOS no (sección 9).
// Devuelve { permitido, maximo, actuales, mensaje }
// =============================================================================
async function verificarLimiteUsuarios(IdEmpresa) {
    const suscripcion = await obtenerSuscripcionActiva(IdEmpresa);

    if (!suscripcion || !ESTADOS_VALIDOS.includes(suscripcion.Estado)) {
        return {
            permitido: false,
            maximo: 0,
            actuales: 0,
            mensaje: 'Su empresa no tiene una suscripción activa. Contrate o reactive un plan.'
        };
    }

    const maximo = suscripcion.MaxUsuarios;

    const [rows] = await pool.query(
        `SELECT COUNT(*) AS total
         FROM Usuarios
         WHERE IdEmpresa = ? AND Activo = 1 AND Bloqueado = 0`,
        [IdEmpresa]
    );
    const actuales = rows[0].total;

    if (actuales >= maximo) {
        return {
            permitido: false,
            maximo,
            actuales,
            mensaje: `No es posible crear el usuario. Su plan permite máximo ${maximo} usuarios. Actualice su plan para agregar más usuarios.`
        };
    }

    return {
        permitido: true,
        maximo,
        actuales,
        mensaje: ''
    };
}

// =============================================================================
// obtenerConsumoEmpresa: consumo actual de la empresa vs. límites contratados.
// Devuelve por cada tipo de límite: { codigo, nombre, unidad, maximo, actual }
// Además incluye usuarios desde planes.MaxUsuarios.
// =============================================================================
async function obtenerConsumoEmpresa(IdEmpresa) {
    const suscripcion = await obtenerSuscripcionActiva(IdEmpresa);

    const base = {
        IdSuscripcion: suscripcion?.IdSuscripcion || null,
        IdPlan: suscripcion?.IdPlan || null,
        CodigoPlan: suscripcion?.CodigoPlan || null,
        NombrePlan: suscripcion?.NombrePlan || null,
        Estado: suscripcion?.Estado || null,
        FechaInicio: suscripcion?.FechaInicio || null,
        FechaFin: suscripcion?.FechaFin || null,
        Periodicidad: suscripcion?.Periodicidad || null,
        AutoRenovacion: suscripcion?.AutoRenovacion ?? null,
        MaxUsuarios: suscripcion?.MaxUsuarios || 0
    };

    const [rows] = await pool.query(
        `SELECT t.Codigo, t.Nombre, t.Unidad, tl.ValorLimite AS maximo
         FROM plan_limites tl
         INNER JOIN tipos_limite t ON t.IdTipoLimite = tl.IdTipoLimite
         WHERE tl.IdPlan = ?`,
        [suscripcion?.IdPlan || 0]
    );

    const [conteos] = await pool.query(
        `SELECT 'USUARIOS' AS tipo, COUNT(*) AS total FROM Usuarios WHERE IdEmpresa = ? AND Activo = 1
         UNION ALL SELECT 'BODEGAS', COUNT(*) FROM bodegas WHERE IdEmpresa = ?
         UNION ALL SELECT 'MASCOTAS', COUNT(*) FROM mascotas WHERE IdEmpresa = ?
         UNION ALL SELECT 'PRODUCTOS', COUNT(*) FROM productos WHERE IdEmpresa = ?
         UNION ALL SELECT 'CLIENTES', COUNT(*) FROM clientes WHERE IdEmpresa = ?`,
        [IdEmpresa, IdEmpresa, IdEmpresa, IdEmpresa, IdEmpresa]
    );
    const mapaConteos = {};
    for (const c of conteos) mapaConteos[c.tipo] = c.total;

    const consumos = rows.map((l) => ({
        codigo: l.Codigo,
        nombre: l.Nombre,
        unidad: l.Unidad,
        maximo: l.maximo,
        actual: mapaConteos[l.Codigo] ?? 0
    }));

    consumos.unshift({
        codigo: 'USUARIOS',
        nombre: 'Usuarios',
        unidad: 'unidades',
        maximo: suscripcion?.MaxUsuarios ?? 0,
        actual: mapaConteos['USUARIOS'] ?? 0
    });

    return { ...base, consumos };
}

module.exports = {
    ESTADOS_VALIDOS,
    obtenerSuscripcionActiva,
    modulosContratados,
    verificarModuloContratado,
    controlarModuloContratado,
    verificarLimiteUsuarios,
    obtenerConsumoEmpresa
};