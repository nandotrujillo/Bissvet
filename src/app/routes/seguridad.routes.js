const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql.js');
const { authenticate } = require('../../middleware/auth.js');
const { authorize } = require('../../middleware/authorize.js');
const { registrarAuditoria } = require('../../middleware/auditoria.js');
const { modulosContratados } = require('../../middleware/suscripcion.js');

function obtenerIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket?.remoteAddress
        || req.ip
        || null;
}

// =============================================================================
// GET /api/seguridad/mi-menu   (PROTEGIDO - RF-011)
// Devuelve los módulos a los cuales el usuario tiene acceso (menú dinámico).
// =============================================================================
router.get('/mi-menu', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT DISTINCT m.idModulos, m.Codigo, m.NombreModulo, m.Ruta, m.Icono,
                             m.Orden, m.Descripcion
             FROM modulos m
             INNER JOIN permisos p ON p.IdModulo = m.idModulos AND p.Activo = 1
             INNER JOIN (
                 SELECT pp.IdPermiso
                 FROM perfilpermisos pp
                 WHERE pp.IdPerfil = ?
                 UNION
                 SELECT rp.IdPermiso
                 FROM usuarioroles ur
                 INNER JOIN roles r        ON ur.IdRol = r.IdRol AND r.Activo = 1
                 INNER JOIN rolpermisos rp ON rp.IdRol = r.IdRol AND rp.TipoAcceso = 'PERMITIR'
                 WHERE ur.UsuarioId = ?
                 UNION
                 SELECT up.IdPermiso
                 FROM usuariopermisos up
                 WHERE up.UsuarioId = ? AND up.TipoAcceso = 'PERMITIR'
             ) t ON t.IdPermiso = p.IdPermiso
             WHERE m.Activo = 1
             ORDER BY m.Orden, m.NombreModulo`,
            [req.auth.IdPerfil, req.auth.UsuarioId, req.auth.UsuarioId]
        );

        // El SUPERADMIN ve todos los módulos (RF-022)
        const [superAdmin] = await pool.query(
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

        let modulos = rows;

        // Monetización (RF-MON-008): los módulos no contratados no se muestran
        // aunque el usuario tenga permisos sobre ellos.
        if (superAdmin[0].es) {
            const [todos] = await pool.query(
                `SELECT idModulos, Codigo, NombreModulo, Ruta, Icono, Orden, Descripcion
                 FROM modulos WHERE Activo = 1 ORDER BY Orden, NombreModulo`
            );
            modulos = todos;
        } else {
            const contratados = await modulosContratados(req.auth.IdEmpresa);
            modulos = rows.filter((m) => contratados.has(m.Codigo));

            // El módulo CAJA sólo se muestra si la empresa tiene activado
            // "Apertura y control de caja" en sus datos (RFC-030 / RF-MON-008).
            const [empresa] = await pool.query(
                `SELECT UsaControlCaja FROM empresas WHERE IdEmpresa = ?`,
                [req.auth.IdEmpresa]
            );
            const controlCaja = empresa[0]?.UsaControlCaja === 1;
            if (!controlCaja) {
                modulos = modulos.filter((m) => m.Codigo !== 'CAJA');
            }
        }

        res.json({ ok: true, datos: modulos });
    } catch (error) {
        console.error('Error mi-menu:', error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo menú',
            error: error.message
        });
    }
});

// =============================================================================
// GET /api/seguridad/mis-permisos   (PROTEGIDO - RF-011/RF-012)
// Devuelve los códigos de permisos efectivos del usuario para ocultar botones.
// =============================================================================
router.get('/mis-permisos', authenticate, async (req, res) => {
    try {
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
                 INNER JOIN roles r        ON ur.IdRol = r.IdRol AND r.Activo = 1
                 INNER JOIN rolpermisos rp ON rp.IdRol = r.IdRol
                 WHERE ur.UsuarioId = ?
                 UNION ALL
                 SELECT up.IdPermiso, up.TipoAcceso AS Tipo
                 FROM usuariopermisos up
                 WHERE up.UsuarioId = ?
             ) t ON t.IdPermiso = p.IdPermiso
             WHERE p.Activo = 1
             GROUP BY p.Codigo, p.IdPermiso
             HAVING nivel NOT IN (0, 1)`,
            [req.auth.IdPerfil, req.auth.UsuarioId, req.auth.UsuarioId]
        );

        const [superAdmin] = await pool.query(
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

        let permisos;
        if (superAdmin[0].es) {
            const [todos] = await pool.query(
                `SELECT Codigo FROM permisos WHERE Activo = 1`
            );
            permisos = todos.map(p => p.Codigo);
        } else {
            permisos = rows.map(r => r.Codigo);
        }

        res.json({ ok: true, datos: permisos });
    } catch (error) {
        console.error('Error mis-permisos:', error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo permisos',
            error: error.message
        });
    }
});

// =============================================================================
// GET /api/seguridad/perfiles   (PROTEGIDO - RF-004)
// =============================================================================
router.get('/perfiles', authenticate, authorize('SEGURIDAD.CONSULTAR'), async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT IdPerfil, Nombre, Descripcion, Activo, FechaCreacion
             FROM perfiles ORDER BY Nombre`
        );
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error perfiles:', error);
        res.status(500).json({ ok: false, mensaje: 'Error obteniendo perfiles', error: error.message });
    }
});

// =============================================================================
// POST /api/seguridad/perfiles   (PROTEGIDO - SEGURIDAD.CREAR, RF-004)
// =============================================================================
router.post('/perfiles', authenticate, authorize('SEGURIDAD.CREAR'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { Nombre, Descripcion } = req.body;
        if (!Nombre) {
            return res.status(400).json({ ok: false, mensaje: 'Nombre del perfil es obligatorio' });
        }

        const [existe] = await pool.query(
            `SELECT IdPerfil FROM perfiles WHERE LOWER(Nombre) = LOWER(?)`,
            [Nombre]
        );
        if (existe.length > 0) {
            return res.status(409).json({ ok: false, mensaje: 'El perfil ya existe' });
        }

        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO perfiles (Nombre, Descripcion, UsuarioIdCreacion)
             VALUES (?, ?, ?)`,
            [Nombre, Descripcion || null, req.auth.UsuarioId]
        );

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'perfiles',
            RegistroId: result.insertId,
            Accion: 'CREAR',
            DireccionIP: obtenerIP(req),
            DatosNuevos: { Nombre, Descripcion },
            Descripcion: `Creación del perfil ${Nombre}`
        }, conn);

        await conn.commit();
        res.status(201).json({ ok: true, mensaje: 'Perfil creado', IdPerfil: result.insertId });
    } catch (error) {
        await conn.rollback();
        console.error('Error creando perfil:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando perfil', error: error.message });
    } finally {
        conn.release();
    }
});

// =============================================================================
// PUT /api/seguridad/perfiles/:id   (PROTEGIDO - SEGURIDAD.EDITAR, RF-004)
// =============================================================================
router.put('/perfiles/:id', authenticate, authorize('SEGURIDAD.EDITAR'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const id = Number(req.params.id);
        const { Nombre, Descripcion, Activo } = req.body;

        const [actual] = await pool.query(
            `SELECT * FROM perfiles WHERE IdPerfil = ?`,
            [id]
        );
        if (actual.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Perfil no encontrado' });
        }

        await conn.beginTransaction();

        await conn.query(
            `UPDATE perfiles
             SET Nombre = COALESCE(?, Nombre),
                 Descripcion = COALESCE(?, Descripcion),
                 Activo = COALESCE(?, Activo),
                 FechaModificacion = NOW(),
                 UsuarioIdModificacion = ?
             WHERE IdPerfil = ?`,
            [
                Nombre || null,
                Descripcion !== undefined ? Descripcion : null,
                Activo !== undefined ? (Activo ? 1 : 0) : null,
                req.auth.UsuarioId,
                id
            ]
        );

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'perfiles',
            RegistroId: id,
            Accion: 'EDITAR',
            DireccionIP: obtenerIP(req),
            DatosAnteriores: actual[0],
            DatosNuevos: req.body,
            Descripcion: `Modificación del perfil ${actual[0].Nombre}`
        }, conn);

        await conn.commit();
        res.json({ ok: true, mensaje: 'Perfil actualizado correctamente' });
    } catch (error) {
        await conn.rollback();
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando perfil', error: error.message });
    } finally {
        conn.release();
    }
});

// =============================================================================
// GET /api/seguridad/perfilpermisos/:idPerfil   (PROTEGIDO - RF-004)
// Permisos asignados al perfil (configuración inicial).
// =============================================================================
router.get('/perfilpermisos/:idPerfil', authenticate, authorize('SEGURIDAD.CONSULTAR'), async (req, res) => {
    try {
        const idPerfil = Number(req.params.idPerfil);

        const [rows] = await pool.query(
            `SELECT IdPermiso, TipoAcceso FROM perfilpermisos WHERE IdPerfil = ?`,
            [idPerfil]
        );

        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error perfilpermisos:', error);
        res.status(500).json({ ok: false, mensaje: 'Error obteniendo perfilpermisos', error: error.message });
    }
});

// =============================================================================
// POST /api/seguridad/perfilpermisos/:idPerfil   (PROTEGIDO - SEGURIDAD.ASIGNAR_PERMISOS)
// Reemplaza los permisos del perfil (RF-004, RF-028).
// =============================================================================
router.post('/perfilpermisos/:idPerfil', authenticate, authorize('SEGURIDAD.ASIGNAR_PERMISOS'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const idPerfil = Number(req.params.idPerfil);
        const { permisos } = req.body; // [{ IdPermiso, TipoAcceso }]

        if (!Array.isArray(permisos)) {
            return res.status(400).json({ ok: false, mensaje: 'Se esperaba una lista de permisos' });
        }

        await conn.beginTransaction();

        const [actual] = await conn.query(
            `SELECT IdPermiso, TipoAcceso FROM perfilpermisos WHERE IdPerfil = ?`,
            [idPerfil]
        );

        await conn.query(`DELETE FROM perfilpermisos WHERE IdPerfil = ?`, [idPerfil]);

        for (const p of permisos) {
            await conn.query(
                `INSERT INTO perfilpermisos (IdPerfil, IdPermiso, TipoAcceso, AsignadoPor)
                 VALUES (?, ?, ?, ?)`,
                [idPerfil, p.IdPermiso, p.TipoAcceso === 'DENEGAR' ? 'DENEGAR' : 'PERMITIR', req.auth.UsuarioId]
            );
        }

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'perfilpermisos',
            RegistroId: idPerfil,
            Accion: 'EDITAR',
            DireccionIP: obtenerIP(req),
            DatosAnteriores: { permisos: actual },
            DatosNuevos: { permisos: permisos.length },
            Descripcion: `Actualización de permisos del perfil #${idPerfil}`
        }, conn);

        await conn.commit();
        res.json({ ok: true, mensaje: 'Permisos del perfil actualizados' });
    } catch (error) {
        await conn.rollback();
        console.error('Error asignando permisos al perfil:', error);
        res.status(500).json({ ok: false, mensaje: 'Error asignando permisos', error: error.message });
    } finally {
        conn.release();
    }
});

// =============================================================================
// GET /api/seguridad/roles   (PROTEGIDO - RF-005)
// Roles de la empresa del token (+ roles globales del sistema).
// =============================================================================
router.get('/roles', authenticate, authorize('SEGURIDAD.CONSULTAR'), async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT IdRol, IdEmpresa, Nombre, Descripcion, Activo, FechaCreacion
             FROM roles
             WHERE IdEmpresa = ? OR IdEmpresa IS NULL
             ORDER BY Nombre`,
            [req.auth.IdEmpresa]
        );
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error roles:', error);
        res.status(500).json({ ok: false, mensaje: 'Error obteniendo roles', error: error.message });
    }
});

// =============================================================================
// POST /api/seguridad/roles   (PROTEGIDO - SEGURIDAD.CREAR, RF-005)
// =============================================================================
router.post('/roles', authenticate, authorize('SEGURIDAD.CREAR'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { Nombre, Descripcion } = req.body;
        if (!Nombre) {
            return res.status(400).json({ ok: false, mensaje: 'Nombre del rol es obligatorio' });
        }

        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO roles (IdEmpresa, Nombre, Descripcion, UsuarioIdCreacion)
             VALUES (?, ?, ?, ?)`,
            [req.auth.IdEmpresa, Nombre, Descripcion || null, req.auth.UsuarioId]
        );

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'roles',
            RegistroId: result.insertId,
            Accion: 'CREAR',
            DireccionIP: obtenerIP(req),
            DatosNuevos: { Nombre, Descripcion },
            Descripcion: `Creación del rol ${Nombre}`
        }, conn);

        await conn.commit();
        res.status(201).json({ ok: true, mensaje: 'Rol creado', IdRol: result.insertId });
    } catch (error) {
        await conn.rollback();
        console.error('Error creando rol:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando rol', error: error.message });
    } finally {
        conn.release();
    }
});

// =============================================================================
// PUT /api/seguridad/roles/:id   (PROTEGIDO - SEGURIDAD.EDITAR, RF-005)
// =============================================================================
router.put('/roles/:id', authenticate, authorize('SEGURIDAD.EDITAR'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const id = Number(req.params.id);
        const { Nombre, Descripcion, Activo } = req.body;

        const [actual] = await pool.query(
            `SELECT * FROM roles WHERE IdRol = ?`,
            [id]
        );
        if (actual.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Rol no encontrado' });
        }

        // El SUPERADMIN es global: solo puede gestionarlo quien es SUPERADMIN
        if (
            (actual[0].Nombre === 'SUPERADMIN' || actual[0].IdEmpresa === null) &&
            req.auth.IdPerfil !== 8
        ) {
            // Permitimos ver, pero no modificar roles globales de otro rol
            const [esSuper] = await pool.query(
                `SELECT EXISTS(
                    SELECT 1 FROM usuarioroles ur
                    INNER JOIN roles r ON ur.IdRol = r.IdRol AND r.Nombre = 'SUPERADMIN' AND r.Activo = 1
                    WHERE ur.UsuarioId = ?) AS es`,
                [req.auth.UsuarioId]
            );
            if (!esSuper[0].es) {
                return res.status(403).json({ ok: false, mensaje: 'No autorizado para modificar roles globales' });
            }
        }

        await conn.beginTransaction();

        await conn.query(
            `UPDATE roles
             SET Nombre = COALESCE(?, Nombre),
                 Descripcion = COALESCE(?, Descripcion),
                 Activo = COALESCE(?, Activo),
                 FechaModificacion = NOW(),
                 UsuarioIdModificacion = ?
             WHERE IdRol = ?`,
            [
                Nombre || null,
                Descripcion !== undefined ? Descripcion : null,
                Activo !== undefined ? (Activo ? 1 : 0) : null,
                req.auth.UsuarioId,
                id
            ]
        );

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'roles',
            RegistroId: id,
            Accion: 'EDITAR',
            DireccionIP: obtenerIP(req),
            DatosAnteriores: actual[0],
            DatosNuevos: req.body,
            Descripcion: `Modificación del rol ${actual[0].Nombre}`
        }, conn);

        await conn.commit();
        res.json({ ok: true, mensaje: 'Rol actualizado correctamente' });
    } catch (error) {
        await conn.rollback();
        console.error('Error actualizando rol:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando rol', error: error.message });
    } finally {
        conn.release();
    }
});

// =============================================================================
// GET /api/seguridad/modulos   (PROTEGIDO - RF-006)
// =============================================================================
router.get('/modulos', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT idModulos, Codigo, NombreModulo, Descripcion, Ruta, Icono, Orden, Activo
             FROM modulos ORDER BY Orden, NombreModulo`
        );
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error módulos:', error);
        res.status(500).json({ ok: false, mensaje: 'Error obteniendo módulos', error: error.message });
    }
});

// =============================================================================
// GET /api/seguridad/permisos   (PROTEGIDO - RF-007)
// Permisos agrupados por módulo (matriz de permisos).
// =============================================================================
router.get('/permisos', authenticate, authorize('SEGURIDAD.CONSULTAR'), async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT p.IdPermiso, p.IdModulo, p.Codigo, p.Nombre, p.Descripcion, p.Activo,
                    m.Codigo AS ModuloCodigo, m.NombreModulo
             FROM permisos p
             INNER JOIN modulos m ON m.idModulos = p.IdModulo
             WHERE p.Activo = 1
             ORDER BY m.Orden, p.Codigo`
        );
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error permisos:', error);
        res.status(500).json({ ok: false, mensaje: 'Error obteniendo permisos', error: error.message });
    }
});

// =============================================================================
// GET /api/seguridad/rolpermisos/:idRol   (PROTEGIDO - RF-008)
// Permisos asignados a un rol.
// =============================================================================
router.get('/rolpermisos/:idRol', authenticate, authorize('SEGURIDAD.CONSULTAR'), async (req, res) => {
    try {
        const idRol = Number(req.params.idRol);

        const [rows] = await pool.query(
            `SELECT IdPermiso, TipoAcceso FROM rolpermisos WHERE IdRol = ?`,
            [idRol]
        );

        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error rolpermisos:', error);
        res.status(500).json({ ok: false, mensaje: 'Error obteniendo rolpermisos', error: error.message });
    }
});

// =============================================================================
// POST /api/seguridad/rolpermisos/:idRol   (PROTEGIDO - SEGURIDAD.ASIGNAR_PERMISOS)
// Reemplaza los permisos del rol (matriz de permisos). RF-008, RF-028.
// =============================================================================
router.post('/rolpermisos/:idRol', authenticate, authorize('SEGURIDAD.ASIGNAR_PERMISOS'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const idRol = Number(req.params.idRol);
        const { permisos } = req.body; // [{ IdPermiso, TipoAcceso }]

        if (!Array.isArray(permisos)) {
            return res.status(400).json({ ok: false, mensaje: 'Se esperaba una lista de permisos' });
        }

        await conn.beginTransaction();

        const [actual] = await conn.query(
            `SELECT IdPermiso, TipoAcceso FROM rolpermisos WHERE IdRol = ?`,
            [idRol]
        );

        await conn.query(`DELETE FROM rolpermisos WHERE IdRol = ?`, [idRol]);

        for (const p of permisos) {
            await conn.query(
                `INSERT INTO rolpermisos (IdRol, IdPermiso, TipoAcceso, AsignadoPor)
                 VALUES (?, ?, ?, ?)`,
                [idRol, p.IdPermiso, p.TipoAcceso === 'DENEGAR' ? 'DENEGAR' : 'PERMITIR', req.auth.UsuarioId]
            );
        }

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'rolpermisos',
            RegistroId: idRol,
            Accion: 'EDITAR',
            DireccionIP: obtenerIP(req),
            DatosAnteriores: { permisos: actual },
            DatosNuevos: { permisos: permisos.length },
            Descripcion: `Actualización de permisos del rol #${idRol}`
        }, conn);

        await conn.commit();
        res.json({ ok: true, mensaje: 'Permisos del rol actualizados' });
    } catch (error) {
        await conn.rollback();
        console.error('Error asignando permisos al rol:', error);
        res.status(500).json({ ok: false, mensaje: 'Error asignando permisos', error: error.message });
    } finally {
        conn.release();
    }
});

// =============================================================================
// GET /api/seguridad/usuarioroles/:usuarioId   (PROTEGIDO - RF-009)
// =============================================================================
router.get('/usuarioroles/:usuarioId', authenticate, authorize('SEGURIDAD.CONSULTAR'), async (req, res) => {
    try {
        const usuarioId = Number(req.params.usuarioId);

        const [rows] = await pool.query(
            `SELECT IdRol FROM usuarioroles WHERE UsuarioId = ?`,
            [usuarioId]
        );

        res.json({ ok: true, datos: rows.map(r => r.IdRol) });
    } catch (error) {
        console.error('Error usuarioroles:', error);
        res.status(500).json({ ok: false, mensaje: 'Error obteniendo usuarioroles', error: error.message });
    }
});

// =============================================================================
// POST /api/seguridad/usuarioroles/:usuarioId   (PROTEGIDO - SEGURIDAD.ASIGNAR_ROLES)
// Reemplaza los roles del usuario (RF-009).
// =============================================================================
router.post('/usuarioroles/:usuarioId', authenticate, authorize('SEGURIDAD.ASIGNAR_ROLES'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const usuarioId = Number(req.params.usuarioId);
        const { roles } = req.body; // [IdRol]

        if (!Array.isArray(roles)) {
            return res.status(400).json({ ok: false, mensaje: 'Se esperaba una lista de roles' });
        }

        // Solo usuarios de la misma empresa (RN-008)
        const [usuario] = await pool.query(
            `SELECT Username FROM Usuarios WHERE UsuarioId = ? AND IdEmpresa = ?`,
            [usuarioId, req.auth.IdEmpresa]
        );
        if (usuario.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
        }

        await conn.beginTransaction();

        const [actual] = await conn.query(
            `SELECT IdRol FROM usuarioroles WHERE UsuarioId = ?`,
            [usuarioId]
        );

        await conn.query(`DELETE FROM usuarioroles WHERE UsuarioId = ?`, [usuarioId]);

        for (const idRol of roles) {
            await conn.query(
                `INSERT INTO usuarioroles (UsuarioId, IdRol, AsignadoPor) VALUES (?, ?, ?)`,
                [usuarioId, idRol, req.auth.UsuarioId]
            );
        }

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'usuarioroles',
            RegistroId: usuarioId,
            Accion: 'EDITAR',
            DireccionIP: obtenerIP(req),
            DatosAnteriores: { roles: actual.map(r => r.IdRol) },
            DatosNuevos: { roles },
            Descripcion: `Asignación de roles al usuario ${usuario[0].Username}`
        }, conn);

        await conn.commit();
        res.json({ ok: true, mensaje: 'Roles del usuario actualizados' });
    } catch (error) {
        await conn.rollback();
        console.error('Error asignando roles:', error);
        res.status(500).json({ ok: false, mensaje: 'Error asignando roles', error: error.message });
    } finally {
        conn.release();
    }
});

// =============================================================================
// GET /api/seguridad/sesiones   (PROTEGIDO - RF-020)
// =============================================================================
router.get('/sesiones', authenticate, authorize('SEGURIDAD.CONSULTAR'), async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT s.IdSesion, s.UsuarioId, u.Username, s.FechaIngreso, s.FechaSalida,
                    s.UltimoAcceso, s.DireccionIP, s.EstadoSesion
             FROM sesiones s
             INNER JOIN Usuarios u ON u.UsuarioId = s.UsuarioId
             WHERE s.IdEmpresa = ?
             ORDER BY s.FechaIngreso DESC
             LIMIT 200`,
            [req.auth.IdEmpresa]
        );

        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error sesiones:', error);
        res.status(500).json({ ok: false, mensaje: 'Error obteniendo sesiones', error: error.message });
    }
});

// =============================================================================
// GET /api/seguridad/auditoria   (PROTEGIDO - AUDITORIA.CONSULTAR, RF-017)
// =============================================================================
router.get('/auditoria', authenticate, authorize('AUDITORIA.CONSULTAR'), async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT a.IdAuditoria, a.UsuarioId, u.Username, a.IdModulo, m.Codigo AS ModuloCodigo,
                    a.Tabla, a.RegistroId, a.Accion, a.Fecha, a.DireccionIP, a.Descripcion
             FROM auditoria a
             INNER JOIN Usuarios u ON u.UsuarioId = a.UsuarioId
             LEFT JOIN modulos m ON m.idModulos = a.IdModulo
             WHERE a.IdEmpresa = ?
             ORDER BY a.Fecha DESC
             LIMIT 500`,
            [req.auth.IdEmpresa]
        );

        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error auditoria:', error);
        res.status(500).json({ ok: false, mensaje: 'Error obteniendo auditoría', error: error.message });
    }
});

module.exports = router;