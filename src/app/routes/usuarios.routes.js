const express = require('express');
const bcrypt = require('bcryptjs');

const router = express.Router();

const pool = require('../../database/mysql.js');
const { authenticate, generarToken } = require('../../middleware/auth.js');
const { authorize } = require('../../middleware/authorize.js');
const { registrarAuditoria } = require('../../middleware/auditoria.js');
const { obtenerSuscripcionActiva, verificarLimiteUsuarios } = require('../../middleware/suscripcion.js');

function obtenerIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket?.remoteAddress
        || req.ip
        || null;
}

// =============================================================================
// GET /api/usuarios/login  (compatibilidad: solo informativo)
// =============================================================================
router.get('/login', (req, res) => {
    res.json({
        ok: true,
        mensaje: 'La ruta usuarios/login existe'
    });
});

// =============================================================================
// POST /api/usuarios/login   (PÚBLICO - RF-018, RF-020, RF-021)
// Autentica con bcrypt, genera JWT, registra sesión y auditoría LOGIN.
// Controla intentos fallidos y bloqueo automático (RF-018).
// =============================================================================
router.post('/login', async (req, res) => {
    try {
        const { Username, PasswordHash, IdEmpresa } = req.body;

        if (!Username || !PasswordHash) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Usuario y contraseña son obligatorios'
            });
        }

        if (!IdEmpresa) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Debe seleccionar la empresa'
            });
        }

        // Parámetros de seguridad (RF-019)
        const [pars] = await pool.query(
            `SELECT Codigo, Valor FROM parametrosseguridad WHERE Activo = 1`
        );
        const param = {};
        for (const p of pars) param[p.Codigo] = Number(p.Valor) || 0;
        const maxIntentos = param.MAX_INTENTOS_FALLIDOS || 5;

        // Validar empresa activa (RN-002, RF-002)
        const [empresas] = await pool.query(
            `SELECT IdEmpresa, NombreComercial
             FROM empresas
             WHERE IdEmpresa = ? AND Activo = 1`,
            [IdEmpresa]
        );

        if (empresas.length === 0) {
            return res.status(401).json({
                ok: false,
                mensaje: 'La empresa seleccionada no está vigente'
            });
        }

        const empresa = empresas[0];

        // Buscar usuario (RN-001)
        const [rows] = await pool.query(
            `SELECT UsuarioId, Username, PasswordHash, IdEmpresa, IdPerfil,
                    Activo, Bloqueado, IntentosFallidos
             FROM Usuarios
             WHERE Username = ? AND IdEmpresa = ?`,
            [Username, IdEmpresa]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Usuario o contraseña incorrectos'
            });
        }

        const user = rows[0];

        if (!user.Activo) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Usuario inactivo'
            });
        }

        if (user.Bloqueado) {
            return res.status(403).json({
                ok: false,
                mensaje: 'Usuario bloqueado. Contacte al administrador'
            });
        }

        // Verificar contraseña con bcrypt (RN-015)
        const passwordOk = await bcrypt.compare(PasswordHash, user.PasswordHash);

        if (!passwordOk) {
            const nuevosIntentos = user.IntentosFallidos + 1;
            const quedaBloqueado = nuevosIntentos >= maxIntentos ? 1 : 0;

            await pool.query(
                `UPDATE Usuarios
                 SET IntentosFallidos = ?, Bloqueado = ?
                 WHERE UsuarioId = ?`,
                [nuevosIntentos, quedaBloqueado, user.UsuarioId]
            );

            await registrarAuditoria({
                IdEmpresa: user.IdEmpresa,
                UsuarioId: user.UsuarioId,
                Accion: 'LOGIN',
                DireccionIP: obtenerIP(req),
                Descripcion: `Intento de login fallido (${nuevosIntentos}/${maxIntentos})`
            });

            if (quedaBloqueado) {
                return res.status(403).json({
                    ok: false,
                    mensaje: `Usuario bloqueado por ${maxIntentos} intentos fallidos`
                });
            }

            return res.status(401).json({
                ok: false,
                mensaje: 'Usuario o contraseña incorrectos'
            });
        }

        // Éxito: resetear intentos y actualizar último ingreso
        await pool.query(
            `UPDATE Usuarios
             SET IntentosFallidos = 0, Bloqueado = 0, FechaUltimoIngreso = NOW(), UltimoAcceso = NOW()
             WHERE UsuarioId = ?`,
            [user.UsuarioId]
        );

        const token = generarToken({
            UsuarioId: user.UsuarioId,
            Username: user.Username,
            IdEmpresa: user.IdEmpresa,
            IdPerfil: user.IdPerfil
        });

        // Registrar sesión ACTIVA (RF-020)
        const [sesion] = await pool.query(
            `INSERT INTO sesiones
               (IdEmpresa, UsuarioId, FechaIngreso, UltimoAcceso, DireccionIP, UserAgent, EstadoSesion)
             VALUES (?, ?, NOW(), NOW(), ?, ?, 'ACTIVA')`,
            [
                user.IdEmpresa,
                user.UsuarioId,
                obtenerIP(req),
                (req.headers['user-agent'] || '').substring(0, 300)
            ]
        );

        // Auditoría LOGIN (RF-017)
        await registrarAuditoria({
            IdEmpresa: user.IdEmpresa,
            UsuarioId: user.UsuarioId,
            Accion: 'LOGIN',
            DireccionIP: obtenerIP(req),
            Descripcion: `Login correcto de ${user.Username}`
        });

        // Información de suscripción (RF-MON-013): plan, estado y vigencia
        const suscripcion = await obtenerSuscripcionActiva(user.IdEmpresa);

        res.json({
            ok: true,
            mensaje: 'Login correcto',
            token,
            usuario: {
                UsuarioId: user.UsuarioId,
                Username: user.Username,
                IdEmpresa: user.IdEmpresa,
                IdPerfil: user.IdPerfil,
                IdSesion: sesion[0]?.insertId
            },
            empresa: {
                IdEmpresa: empresa.IdEmpresa,
                NombreComercial: empresa.NombreComercial
            },
            suscripcion: suscripcion ? {
                IdSuscripcion: suscripcion.IdSuscripcion,
                IdPlan: suscripcion.IdPlan,
                Estado: suscripcion.Estado,
                FechaInicio: suscripcion.FechaInicio,
                FechaFin: suscripcion.FechaFin,
                Periodicidad: suscripcion.Periodicidad,
                AutoRenovacion: suscripcion.AutoRenovacion,
                CodigoPlan: suscripcion.CodigoPlan,
                NombrePlan: suscripcion.NombrePlan,
                PrecioMensual: suscripcion.PrecioMensual,
                Moneda: suscripcion.Moneda
            } : null
        });
    } catch (error) {
        console.error('Error login:', error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
});

// =============================================================================
// POST /api/usuarios/logout   (PROTEGIDO - RF-017, RF-020)
// Cierra la sesión activa y registra auditoría LOGOUT.
// =============================================================================
router.post('/logout', authenticate, async (req, res) => {
    try {
        const { IdSesion } = req.body || {};

        await pool.query(
            `UPDATE sesiones
             SET FechaSalida = NOW(), EstadoSesion = 'CERRADA'
             WHERE IdSesion = ? AND UsuarioId = ?`,
            [IdSesion || null, req.auth.UsuarioId]
        );

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Accion: 'LOGOUT',
            DireccionIP: obtenerIP(req),
            Descripcion: 'Cierre de sesión'
        });

        res.json({ ok: true, mensaje: 'Sesión cerrada' });
    } catch (error) {
        console.error('Error logout:', error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
});

// =============================================================================
// GET /api/usuarios   (PROTEGIDO - RF-003, RN-008)
// Lista usuarios de la empresa del token; no filtra nada del body.
// =============================================================================
router.get('/', authenticate, authorize('USUARIOS.CONSULTAR'), async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT u.UsuarioId, u.IdEmpresa, u.IdPerfil, u.Username, u.TipoDocumento,
                    u.NumeroDocumento, u.PrimerNombre, u.SegundoNombre, u.PrimerApellido,
                    u.SegundoApellido, u.Correo, u.Telefono, u.Activo, u.Bloqueado,
                    u.IntentosFallidos, u.FechaUltimoIngreso, u.FechaCreacion,
                    p.Nombre AS Perfil, e.NombreComercial
             FROM Usuarios u
             LEFT JOIN perfiles p ON p.IdPerfil = u.IdPerfil
             LEFT JOIN empresas e ON e.IdEmpresa = u.IdEmpresa
             WHERE u.IdEmpresa = ?
             ORDER BY u.PrimerNombre, u.PrimerApellido`,
            [req.auth.IdEmpresa]
        );

        const usuarios = rows.map(u => {
            const { PasswordHash, ...resto } = u;
            return resto;
        });

        res.json({ ok: true, datos: usuarios });
    } catch (error) {
        console.error('Error listando usuarios:', error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo usuarios',
            error: error.message
        });
    }
});

// =============================================================================
// GET /api/usuarios/:id   (PROTEGIDO - RF-003, RN-008)
// Solo puede ver usuarios de su propia empresa (RF-013).
// =============================================================================
router.get('/:id', authenticate, authorize('USUARIOS.CONSULTAR'), async (req, res) => {
    try {
        const id = Number(req.params.id);

        const [rows] = await pool.query(
            `SELECT u.UsuarioId, u.IdEmpresa, u.IdPerfil, u.Username, u.TipoDocumento,
                    u.NumeroDocumento, u.PrimerNombre, u.SegundoNombre, u.PrimerApellido,
                    u.SegundoApellido, u.Correo, u.Telefono, u.Activo, u.Bloqueado,
                    u.IntentosFallidos, u.FechaUltimoIngreso, u.FechaCreacion,
                    p.Nombre AS Perfil
             FROM Usuarios u
             LEFT JOIN perfiles p ON p.IdPerfil = u.IdPerfil
             WHERE u.UsuarioId = ? AND u.IdEmpresa = ?`,
            [id, req.auth.IdEmpresa]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        const { PasswordHash, ...resto } = rows[0];
        res.json({ ok: true, datos: resto });
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo usuario',
            error: error.message
        });
    }
});

// =============================================================================
// POST /api/usuarios   (PROTEGIDO - RF-003)
// Crea usuarios SOLO dentro de su propia empresa. La contraseña se hashea
// con bcrypt; Nunca se almacena en texto plano (RN-015).
// =============================================================================
router.post('/', authenticate, authorize('USUARIOS.CREAR'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const {
            Username,
            Password,
            IdPerfil,
            TipoDocumento,
            NumeroDocumento,
            PrimerNombre,
            SegundoNombre,
            PrimerApellido,
            SegundoApellido,
            Correo,
            Telefono
        } = req.body;

        if (!Username || !Password || !IdPerfil) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Username, Password e IdPerfil son obligatorios'
            });
        }

        const IdEmpresa = req.auth.IdEmpresa;

        // Monetización (RF-MON-009): verificar cupo de usuarios del plan
        const limite = await verificarLimiteUsuarios(IdEmpresa);
        if (!limite.permitido) {
            return res.status(409).json({
                ok: false,
                mensaje: limite.mensaje,
                detalles: {
                    maximo: limite.maximo,
                    actuales: limite.actuales
                }
            });
        }

        const [existe] = await pool.query(
            `SELECT UsuarioId FROM Usuarios WHERE Username = ?`,
            [Username]
        );
        if (existe.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: 'El nombre de usuario ya existe'
            });
        }

        const hash = await bcrypt.hash(Password, 10);

        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO Usuarios
               (IdEmpresa, IdPerfil, Username, PasswordHash, TipoDocumento,
                NumeroDocumento, PrimerNombre, SegundoNombre, PrimerApellido,
                SegundoApellido, Correo, Telefono, Activo, UsuarioIdCreacion)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            [
                IdEmpresa,
                IdPerfil,
                Username,
                hash,
                TipoDocumento || null,
                NumeroDocumento || null,
                PrimerNombre || null,
                SegundoNombre || null,
                PrimerApellido || null,
                SegundoApellido || null,
                Correo || null,
                Telefono || null,
                req.auth.UsuarioId
            ]
        );

        await registrarAuditoria({
            IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'Usuarios',
            RegistroId: result.insertId,
            Accion: 'CREAR',
            DireccionIP: obtenerIP(req),
            DatosNuevos: { Username, IdPerfil, NumeroDocumento, PrimerNombre, PrimerApellido },
            Descripcion: `Creación del usuario ${Username}`
        }, conn);

        await conn.commit();

        res.status(201).json({
            ok: true,
            mensaje: 'Usuario creado correctamente',
            UsuarioId: result.insertId
        });
    } catch (error) {
        await conn.rollback();
        console.error('Error creando usuario:', error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error creando usuario',
            error: error.message
        });
    } finally {
        conn.release();
    }
});

// =============================================================================
// PUT /api/usuarios/:id   (PROTEGIDO - RF-003)
// Modifica datos del usuario de la misma empresa. Nunca recibe PasswordHash.
// =============================================================================
router.put('/:id', authenticate, authorize('USUARIOS.EDITAR'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const id = Number(req.params.id);

        const {
            IdPerfil,
            TipoDocumento,
            NumeroDocumento,
            PrimerNombre,
            SegundoNombre,
            PrimerApellido,
            SegundoApellido,
            Correo,
            Telefono,
            Activo,
            Bloqueado
        } = req.body;

        const [actual] = await pool.query(
            `SELECT * FROM Usuarios WHERE UsuarioId = ? AND IdEmpresa = ?`,
            [id, req.auth.IdEmpresa]
        );
        if (actual.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }
        const anterior = actual[0];

        await conn.beginTransaction();

        await conn.query(
            `UPDATE Usuarios
             SET IdPerfil = COALESCE(?, IdPerfil),
                 TipoDocumento = COALESCE(?, TipoDocumento),
                 NumeroDocumento = COALESCE(?, NumeroDocumento),
                 PrimerNombre = COALESCE(?, PrimerNombre),
                 SegundoNombre = COALESCE(?, SegundoNombre),
                 PrimerApellido = COALESCE(?, PrimerApellido),
                 SegundoApellido = COALESCE(?, SegundoApellido),
                 Correo = COALESCE(?, Correo),
                 Telefono = COALESCE(?, Telefono),
                 Activo = COALESCE(?, Activo),
                 Bloqueado = COALESCE(?, Bloqueado),
                 IntentosFallidos = IF(? = 1, 0, IntentosFallidos),
                 FechaModificacion = NOW(),
                 UsuarioIdModificacion = ?
             WHERE UsuarioId = ? AND IdEmpresa = ?`,
            [
                IdPerfil !== undefined ? IdPerfil : null,
                TipoDocumento !== undefined ? TipoDocumento : null,
                NumeroDocumento !== undefined ? NumeroDocumento : null,
                PrimerNombre !== undefined ? PrimerNombre : null,
                SegundoNombre !== undefined ? SegundoNombre : null,
                PrimerApellido !== undefined ? PrimerApellido : null,
                SegundoApellido !== undefined ? SegundoApellido : null,
                Correo !== undefined ? Correo : null,
                Telefono !== undefined ? Telefono : null,
                Activo !== undefined ? (Activo ? 1 : 0) : null,
                Bloqueado !== undefined ? (Bloqueado ? 1 : 0) : null,
                Bloqueado !== undefined && Bloqueado ? 1 : 0,
                req.auth.UsuarioId,
                id,
                req.auth.IdEmpresa
            ]
        );

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'Usuarios',
            RegistroId: id,
            Accion: 'EDITAR',
            DireccionIP: obtenerIP(req),
            DatosAnteriores: anterior,
            DatosNuevos: req.body,
            Descripcion: `Modificación del usuario ${anterior.Username}`
        }, conn);

        await conn.commit();

        res.json({
            ok: true,
            mensaje: 'Usuario actualizado correctamente'
        });
    } catch (error) {
        await conn.rollback();
        console.error('Error actualizando usuario:', error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error actualizando usuario',
            error: error.message
        });
    } finally {
        conn.release();
    }
});

// =============================================================================
// PUT /api/usuarios/:id/cambiar-password   (PROTEGIDO - USUARIOS.CAMBIAR_CLAVE)
// =============================================================================
router.put('/:id/cambiar-password', authenticate, authorize('USUARIOS.CAMBIAR_CLAVE'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const id = Number(req.params.id);
        const { Password } = req.body;

        if (!Password) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La nueva contraseña es obligatoria'
            });
        }

        const [actual] = await pool.query(
            `SELECT Username, PasswordHash FROM Usuarios
             WHERE UsuarioId = ? AND IdEmpresa = ?`,
            [id, req.auth.IdEmpresa]
        );
        if (actual.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        const anterior = actual[0];
        const hash = await bcrypt.hash(Password, 10);

        await conn.beginTransaction();

        await conn.query(
            `UPDATE Usuarios
             SET PasswordHash = ?, IntentosFallidos = 0, Bloqueado = 0,
                 FechaModificacion = NOW(), UsuarioIdModificacion = ?
             WHERE UsuarioId = ? AND IdEmpresa = ?`,
            [hash, req.auth.UsuarioId, id, req.auth.IdEmpresa]
        );

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'Usuarios',
            RegistroId: id,
            Accion: 'CAMBIAR_CLAVE',
            DireccionIP: obtenerIP(req),
            DatosAnteriores: { Username: anterior.Username },
            Descripcion: `Cambio de contraseña del usuario ${anterior.Username}`
        }, conn);

        await conn.commit();

        res.json({ ok: true, mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        await conn.rollback();
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error cambiando contraseña',
            error: error.message
        });
    } finally {
        conn.release();
    }
});

module.exports = router;