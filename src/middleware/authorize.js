const pool = require('../database/mysql');

// =============================================================================
// esSuperAdmin: ¿el usuario tiene rol SUPERADMIN global o perfil SUPERADMIN?
// (RF-022). Aplica acceso total sin necesidad de rolpermisos.
// =============================================================================
async function esSuperAdmin(UsuarioId) {
    const [rows] = await pool.query(
        `SELECT (
            EXISTS(
                SELECT 1 FROM usuarioroles ur
                INNER JOIN roles r ON ur.IdRol = r.IdRol AND r.Activo = 1
                WHERE ur.UsuarioId = ?
                  AND r.Nombre = 'SUPERADMIN'
                  AND r.IdEmpresa IS NULL
            )
            OR EXISTS(
                SELECT 1 FROM Usuarios u
                INNER JOIN perfiles pf ON u.IdPerfil = pf.IdPerfil
                WHERE u.UsuarioId = ? AND pf.Nombre = 'SUPERADMIN'
            )
        ) AS es`,
        [UsuarioId, UsuarioId]
    );
    return !!rows[0].es;
}

// =============================================================================
// obtenerPermisosUsuario: devuelve el conjunto de permisos efectivos del
// usuario. Fuentes: perfil (perfilpermisos, configuración inicial RF-004),
// roles (vía usuarioroles + rolpermisos) y permisos directos
// (usuariopermisos, RF-010). Precedencia: DENEGAR gana sobre PERMITIR.
// Devuelve un Map<Codigo, true|false>  (true = permitido).
// =============================================================================
async function obtenerPermisosUsuario(UsuarioId, IdPerfil = null) {
    const [rows] = await pool.query(
        `SELECT p.Codigo,
                MAX(CASE WHEN t.Tipo = 'DENEGAR' THEN 1
                         WHEN t.Tipo = 'PERMITIR' THEN 2
                         ELSE 0 END) AS nivel
         FROM permisos p
         INNER JOIN (
             SELECT pp.IdPermiso, pp.TipoAcceso AS Tipo
             FROM perfilpermisos pp
             WHERE pp.IdPerfil = ?
             UNION ALL
             SELECT rp.IdPermiso, rp.TipoAcceso AS Tipo
             FROM usuarioroles ur
             INNER JOIN roles r         ON ur.IdRol = r.IdRol AND r.Activo = 1
             INNER JOIN rolpermisos rp  ON rp.IdRol = r.IdRol
             WHERE ur.UsuarioId = ?
             UNION ALL
             SELECT up.IdPermiso, up.TipoAcceso AS Tipo
             FROM usuariopermisos up
             WHERE up.UsuarioId = ?
         ) t ON t.IdPermiso = p.IdPermiso
         WHERE p.Activo = 1
         GROUP BY p.Codigo`,
        [IdPerfil, UsuarioId, UsuarioId]
    );

    const permisos = new Map();
    for (const r of rows) {
        permisos.set(r.Codigo, r.nivel === 2);
    }
    return permisos;
}

// =============================================================================
// authorize(codigoPermiso): valida que el usuario autenticado tenga el permiso
// MODULO.ACCION. Retorna 403 si no lo tiene (RN-009, RN-010, RF-012).
// Uso: router.post('/ajuste', authenticate, authorize('INVENTARIO.AJUSTAR'), ...)
// =============================================================================
function authorize(codigoPermiso) {
    return async (req, res, next) => {
        if (!req.auth) {
            return res.status(401).json({
                ok: false,
                mensaje: 'No autorizado: debe autenticarse primero'
            });
        }

        try {
            if (await esSuperAdmin(req.auth.UsuarioId)) {
                return next();
            }

            const permisos = await obtenerPermisosUsuario(
                req.auth.UsuarioId,
                req.auth.IdPerfil
            );

            if (permisos.get(codigoPermiso) === true) {
                return next();
            }

            return res.status(403).json({
                ok: false,
                mensaje: `No autorizado: se requiere el permiso ${codigoPermiso}`
            });
        } catch (error) {
            console.error('Error authorize:', error);
            return res.status(500).json({
                ok: false,
                mensaje: 'Error interno del servidor',
                error: error.message
            });
        }
    };
}

// =============================================================================
// authorizeAny(moduloCodigo): permite pasar si el usuario tiene CUALQUIER
// permiso PERMITIDO dentro de un módulo (útil para endpoints de listado
// ligero del propio módulo). Complementa a authorize().
// =============================================================================
function authorizeAny(moduloCodigo) {
    return async (req, res, next) => {
        if (!req.auth) {
            return res.status(401).json({
                ok: false,
                mensaje: 'No autorizado: debe autenticarse primero'
            });
        }

        try {
            if (await esSuperAdmin(req.auth.UsuarioId)) {
                return next();
            }

            const permisos = await obtenerPermisosUsuario(
                req.auth.UsuarioId,
                req.auth.IdPerfil
            );

            const [rows] = await pool.query(
                `SELECT idModulos FROM modulos WHERE Codigo = ? AND Activo = 1`,
                [moduloCodigo]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    ok: false,
                    mensaje: `Módulo ${moduloCodigo} no existe`
                });
            }

            const [permisosModulo] = await pool.query(
                `SELECT Codigo FROM permisos WHERE IdModulo = ? AND Activo = 1`,
                [rows[0].idModulos]
            );

            const tieneAlguno = permisosModulo.some(p => permisos.get(p.Codigo) === true);

            if (tieneAlguno) {
                return next();
            }

            return res.status(403).json({
                ok: false,
                mensaje: `No autorizado: no tiene permisos sobre ${moduloCodigo}`
            });
        } catch (error) {
            console.error('Error authorizeAny:', error);
            return res.status(500).json({
                ok: false,
                mensaje: 'Error interno del servidor',
                error: error.message
            });
        }
    };
}

// =============================================================================
// REGLAS_MODULOS: matriz de permisos por verbo HTTP para los módulos de negocio.
// GET  -> CONSULTAR,  POST -> CREAR,  PUT/PATCH -> EDITAR,  DELETE -> ELIMINAR/ANULAR
// RUTAS: sub-rutas específicas que exigen su propio permiso (más específico que
// el verbo genérico; si coincide alguna, se exige cualquiera de las coincidentes).
// =============================================================================
const REGLAS_MODULOS = {
    CLIENTES: {
        GET: 'CLIENTES.CONSULTAR',
        POST: 'CLIENTES.CREAR',
        PUT: 'CLIENTES.EDITAR',
        DELETE: 'CLIENTES.ELIMINAR'
    },
    MASCOTAS: {
        GET: 'MASCOTAS.CONSULTAR',
        POST: 'MASCOTAS.CREAR',
        PUT: 'MASCOTAS.EDITAR',
        DELETE: 'MASCOTAS.ELIMINAR'
    },
    VETERINARIOS: {
        GET: 'VETERINARIOS.CONSULTAR',
        POST: 'VETERINARIOS.CREAR',
        PUT: 'VETERINARIOS.EDITAR',
        DELETE: 'VETERINARIOS.ELIMINAR'
    },
    CITAS: {
        GET: 'CITAS.CONSULTAR',
        POST: 'CITAS.CREAR',
        PUT: 'CITAS.EDITAR',
        DELETE: 'CITAS.ANULAR',
        RUTAS: { '/aprobar': 'CITAS.APROBAR', '/anular': 'CITAS.ANULAR' }
    },
    HISTORIA_CLINICA: {
        GET: 'HISTORIA.CONSULTAR',
        POST: 'HISTORIA.CREAR',
        PUT: 'HISTORIA.EDITAR',
        DELETE: 'HISTORIA.ANULAR',
        RUTAS: {
            '/cerrar': 'HISTORIA.CERRAR',
            '/cancelar': 'HISTORIA.ANULAR',
            '/export': 'HISTORIA.EXPORTAR',
            '/imprimir': 'HISTORIA.IMPRIMIR'
        }
    },
    SERVICIOS: {
        GET: 'SERVICIOS.CONSULTAR',
        POST: 'SERVICIOS.CREAR',
        PUT: 'SERVICIOS.EDITAR',
        DELETE: 'SERVICIOS.ELIMINAR'
    },
    PRODUCTOS: {
        GET: 'PRODUCTOS.CONSULTAR',
        POST: 'PRODUCTOS.CREAR',
        PUT: 'PRODUCTOS.EDITAR',
        DELETE: 'PRODUCTOS.ELIMINAR'
    },
    BODEGAS: {
        GET: 'BODEGAS.CONSULTAR',
        POST: 'BODEGAS.CREAR',
        PUT: 'BODEGAS.EDITAR',
        DELETE: 'BODEGAS.ELIMINAR'
    },
    EMPRESAS: {
        GET: 'EMPRESAS.CONSULTAR',
        POST: 'EMPRESAS.CREAR',
        PUT: 'EMPRESAS.EDITAR',
        DELETE: 'EMPRESAS.ELIMINAR'
    },
    INVENTARIOS: {
        GET: 'INVENTARIO.CONSULTAR',
        POST: 'INVENTARIO.ENTRADA',
        PUT: 'INVENTARIO.AJUSTAR',
        DELETE: 'INVENTARIO.SALIDA',
        RUTAS: {
            '/entrada': 'INVENTARIO.ENTRADA',
            '/salida': 'INVENTARIO.SALIDA',
            '/ajuste': 'INVENTARIO.AJUSTAR',
            '/ajustar': 'INVENTARIO.AJUSTAR',
            '/traslado': 'INVENTARIO.TRASLADAR',
            '/costo': 'INVENTARIO.COSTO'
        }
    },
    COMPRAS: {
        GET: 'COMPRAS.CONSULTAR',
        POST: 'COMPRAS.CREAR',
        PUT: 'COMPRAS.APROBAR',
        DELETE: 'COMPRAS.ANULAR',
        RUTAS: {
            '/confirmar': 'COMPRAS.APROBAR',
            '/aprobar': 'COMPRAS.APROBAR',
            '/anular': 'COMPRAS.ANULAR',
            '/imprimir': 'COMPRAS.IMPRIMIR'
        }
    },
    VENTAS: {
        GET: 'VENTAS.CONSULTAR',
        POST: 'VENTAS.CREAR',
        PUT: 'VENTAS.EDITAR',
        DELETE: 'VENTAS.ANULAR',
        RUTAS: {
            '/confirmar': 'VENTAS.CONFIRMAR',
            '/anular': 'VENTAS.ANULAR',
            '/devolver': 'VENTAS.DEVOLVER',
            '/imprimir': 'VENTAS.IMPRIMIR',
            '/exportar': 'VENTAS.EXPORTAR'
        }
    },
    REPORTES: {
        GET: 'REPORTES.CONSULTAR',
        RUTAS: { '/imprimir': 'REPORTES.IMPRIMIR', '/exportar': 'REPORTES.EXPORTAR' }
    }
};

// =============================================================================
// autorizarModulo(codigoModulo): protege todo un router de negocio según el
// verbo HTTP (y sub-rutas especiales). Uso en server.js:
//   app.use('/api/clientes', autorizarModulo('CLIENTES'), clientesRoutes);
// Mismo contrato que authorize(): 401 sin auth, 403 sin permiso, 500 en error.
// =============================================================================
function autorizarModulo(codigoModulo) {
    const reglas = REGLAS_MODULOS[codigoModulo];
    if (!reglas) {
        throw new Error(`Módulo ${codigoModulo} sin reglas de autorización definidas`);
    }

    return async (req, res, next) => {
        if (!req.auth) {
            return res.status(401).json({
                ok: false,
                mensaje: 'No autorizado: debe autenticarse primero'
            });
        }

        try {
            if (await esSuperAdmin(req.auth.UsuarioId)) {
                return next();
            }

            const permisos = await obtenerPermisosUsuario(
                req.auth.UsuarioId,
                req.auth.IdPerfil
            );

            const ruta = req.originalUrl || req.url;
            const verbo = req.method.toUpperCase();

            // 1) Regla genérica del verbo HTTP
            const reglaVerbo = verbo === 'PATCH' ? reglas.PUT : reglas[verbo];

            // 2) Reglas de sub-ruta específicas (tienen prioridad: si coinciden,
            //    se exige CUALQUIERA de las coincidentes en lugar del verbo genérico)
            const coincidentes = reglas.RUTAS
                ? Object.entries(reglas.RUTAS)
                      .filter(([sufijo]) => ruta.includes(sufijo))
                      .map(([, codigo]) => codigo)
                : [];

            const requeridos = coincidentes.length > 0 ? coincidentes
                : (reglaVerbo ? [reglaVerbo] : []);

            if (requeridos.length === 0) {
                return next();
            }

            const tieneAlguno = requeridos.some(c => permisos.get(c) === true);

            if (tieneAlguno) {
                return next();
            }

            return res.status(403).json({
                ok: false,
                mensaje: `No autorizado: se requiere uno de ${requeridos.join(', ')}`
            });
        } catch (error) {
            console.error('Error autorizarModulo:', error);
            return res.status(500).json({
                ok: false,
                mensaje: 'Error interno del servidor',
                error: error.message
            });
        }
    };
}

module.exports = { authorize, authorizeAny, autorizarModulo, esSuperAdmin, obtenerPermisosUsuario };