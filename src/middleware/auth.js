const jwt = require('jsonwebtoken');
const pool = require('../database/mysql');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'ClaveSuperSecretaBissVet2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

if (!process.env.JWT_SECRET) {
    console.warn(
        'ADVERTENCIA: JWT_SECRET no está definido; se usa el valor por defecto.'
    );
}

function generarToken(usuario) {
    return jwt.sign(
        {
            UsuarioId: usuario.UsuarioId,
            Username: usuario.Username,
            IdEmpresa: usuario.IdEmpresa,
            IdPerfil: usuario.IdPerfil
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

// =============================================================================
// authenticate: valida el JWT y verifica en BD que el usuario siga activo,
// no esté bloqueado y que su empresa esté vigente (RN-004, RF-013, RF-021).
// Adjunta req.auth = { UsuarioId, Username, IdEmpresa, IdPerfil }.
// El IdEmpresa de la sesión NUNCA proviene del body de Angular.
// =============================================================================
async function authenticate(req, res, next) {
    const header = req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
        return res.status(401).json({
            ok: false,
            mensaje: 'No autorizado: token requerido'
        });
    }

    const token = header.slice(7);

    let payload;
    try {
        payload = jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return res.status(401).json({
            ok: false,
            mensaje: 'Token inválido o expirado'
        });
    }

    try {
        const [rows] = await pool.query(
            `SELECT u.UsuarioId, u.Username, u.IdEmpresa, u.IdPerfil,
                    u.Activo, u.Bloqueado, e.Activo AS EmpresaActiva,
                    s.IdSuscripcion, s.IdPlan,
                    s.Estado AS EstadoSuscripcion, s.FechaFin AS FinSuscripcion,
                    p.CodigoPlan, p.NombrePlan
             FROM usuarios u
             INNER JOIN empresas e ON e.IdEmpresa = u.IdEmpresa
             LEFT JOIN suscripciones s ON s.IdEmpresa = u.IdEmpresa
             LEFT JOIN planes p ON p.IdPlan = s.IdPlan
             WHERE u.UsuarioId = ?
             ORDER BY s.IdSuscripcion DESC
             LIMIT 1`,
            [payload.UsuarioId]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Usuario no existe'
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
                mensaje: 'Usuario bloqueado'
            });
        }

        if (!user.EmpresaActiva) {
            return res.status(403).json({
                ok: false,
                mensaje: 'La empresa no está vigente'
            });
        }

        req.auth = {
            UsuarioId: user.UsuarioId,
            Username: user.Username,
            IdEmpresa: user.IdEmpresa,
            IdPerfil: user.IdPerfil,
            Suscripcion: {
                IdSuscripcion: user.IdSuscripcion || null,
                IdPlan: user.IdPlan || null,
                Estado: user.EstadoSuscripcion || null,
                FechaFin: user.FinSuscripcion || null,
                CodigoPlan: user.CodigoPlan || null,
                NombrePlan: user.NombrePlan || null
            }
        };

        next();
    } catch (error) {
        console.error('Error authenticate:', error);
        return res.status(500).json({
            ok: false,
            mensaje: 'Error interno del servidor'
        });
    }
}

module.exports = { authenticate, generarToken, JWT_SECRET };