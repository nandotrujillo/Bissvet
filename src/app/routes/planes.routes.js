const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql.js');
const { authorize } = require('../../middleware/authorize.js');
const { registrarAuditoria } = require('../../middleware/auditoria.js');
const { obtenerSuscripcionActiva, obtenerConsumoEmpresa } = require('../../middleware/suscripcion.js');

function obtenerIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket?.remoteAddress
        || req.ip
        || null;
}

function validarPlan(body) {
    const {
        CodigoPlan, NombrePlan, Descripcion,
        PrecioMensual, PrecioAnual, Moneda,
        MaxUsuarios, DiasPrueba, Activo
    } = body;

    const errores = [];
    if (!CodigoPlan || String(CodigoPlan).trim() === '') errores.push('CodigoPlan es obligatorio');
    if (!NombrePlan || String(NombrePlan).trim() === '') errores.push('NombrePlan es obligatorio');
    if (MaxUsuarios !== undefined && (!Number.isInteger(Number(MaxUsuarios)) || Number(MaxUsuarios) < 1)) {
        errores.push('MaxUsuarios debe ser un entero >= 1');
    }
    if (PrecioMensual !== undefined && Number(PrecioMensual) < 0) errores.push('PrecioMensual no puede ser negativo');
    if (PrecioAnual !== undefined && Number(PrecioAnual) < 0) errores.push('PrecioAnual no puede ser negativo');

    return {
        errores,
        plan: {
            CodigoPlan: CodigoPlan?.trim().toUpperCase(),
            NombrePlan: NombrePlan?.trim(),
            Descripcion: Descripcion || null,
            PrecioMensual,
            PrecioAnual,
            Moneda: Moneda || 'COP',
            MaxUsuarios,
            DiasPrueba: DiasPrueba === null || DiasPrueba === '' ? null : DiasPrueba,
            Activo: Activo === undefined ? 1 : (Activo ? 1 : 0)
        }
    };
}

// =============================================================================
// GET /api/planes  (PROTEGIDO)
// Lista todos los planes con sus módulos y límites. Lo consulta el
// administrador global; las empresas también pueden listarlos para cambiar plan.
// =============================================================================
router.get('/', async (req, res) => {
    try {
        const [planes] = await pool.query(
            `SELECT IdPlan, CodigoPlan, NombrePlan, Descripcion,
                    PrecioMensual, PrecioAnual, Moneda, MaxUsuarios, DiasPrueba, Activo
             FROM planes
             ORDER BY PrecioMensual, NombrePlan`
        );

        for (const p of planes) {
            const [modulos] = await pool.query(
                `SELECT m.idModulos, m.Codigo, m.NombreModulo
                 FROM plan_modulos pm
                 INNER JOIN modulos m ON m.idModulos = pm.IdModulo
                 WHERE pm.IdPlan = ?
                 ORDER BY m.Orden`,
                [p.IdPlan]
            );
            p.modulos = modulos;

            const [limites] = await pool.query(
                `SELECT tl.Codigo, tl.Nombre, tl.Unidad, pl.ValorLimite AS maximo
                 FROM plan_limites pl
                 INNER JOIN tipos_limite tl ON tl.IdTipoLimite = pl.IdTipoLimite
                 WHERE pl.IdPlan = ?`,
                [p.IdPlan]
            );
            p.limites = limites;
        }

        res.json({ ok: true, datos: planes });
    } catch (error) {
        console.error('Error listando planes:', error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo planes',
            error: error.message
        });
    }
});

// =============================================================================
// GET /api/planes/tipos-limite  (PROTEGIDO)
// Catálogo de tipos de límite configurable.
// =============================================================================
router.get('/tipos-limite', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT IdTipoLimite, Codigo, Nombre, Descripcion, Unidad
             FROM tipos_limite WHERE Activo = 1 ORDER BY Nombre`
        );
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error tipos-limite:', error);
        res.status(500).json({ ok: false, mensaje: 'Error obteniendo tipos de límite', error: error.message });
    }
});

// =============================================================================
// GET /api/planes/mi-plan  (PROTEGIDO)
// Pantalla "MI PLAN" de la empresa autenticada: plan, estado, vigencia,
// consumo y módulos disponibles (RFC-013).
// =============================================================================
router.get('/mi-plan', async (req, res) => {
    try {
        if (!req.auth.IdEmpresa) {
            return res.status(400).json({ ok: false, mensaje: 'El usuario no pertenece a una empresa' });
        }

        const suscripcion = await obtenerSuscripcionActiva(req.auth.IdEmpresa);

        if (!suscripcion) {
            return res.json({
                ok: true,
                datos: { existe: false, consumo: null, modulos: [] }
            });
        }

        const [modulos] = await pool.query(
            `SELECT m.idModulos, m.Codigo, m.NombreModulo, m.Ruta, m.Icono, m.Orden
             FROM plan_modulos pm
             INNER JOIN modulos m ON m.idModulos = pm.IdModulo
             WHERE pm.IdPlan = ? AND m.Activo = 1
             UNION
             SELECT m.idModulos, m.Codigo, m.NombreModulo, m.Ruta, m.Icono, m.Orden
             FROM suscripcion_modulos sm
             INNER JOIN suscripciones s ON s.IdSuscripcion = sm.IdSuscripcion
             INNER JOIN modulos m ON m.idModulos = sm.IdModulo
             WHERE s.IdSuscripcion = ? AND m.Activo = 1
             ORDER BY Orden`,
            [suscripcion.IdPlan, suscripcion.IdSuscripcion]
        );

        const consumo = await obtenerConsumoEmpresa(req.auth.IdEmpresa);

        res.json({
            ok: true,
            datos: { existe: true, suscripcion, modulos, consumo }
        });
    } catch (error) {
        console.error('Error mi-plan:', error);
        res.status(500).json({ ok: false, mensaje: 'Error obteniendo su plan', error: error.message });
    }
});

// =============================================================================
// GET /api/planes/consumo  (PROTEGIDO)
// Consumo actual de la empresa vs. límites contratados.
// =============================================================================
router.get('/consumo', async (req, res) => {
    try {
        if (!req.auth.IdEmpresa) {
            return res.status(400).json({ ok: false, mensaje: 'El usuario no pertenece a una empresa' });
        }
        const consumo = await obtenerConsumoEmpresa(req.auth.IdEmpresa);
        res.json({ ok: true, datos: consumo });
    } catch (error) {
        console.error('Error consumo:', error);
        res.status(500).json({ ok: false, mensaje: 'Error obteniendo consumo', error: error.message });
    }
});

// =============================================================================
// POST /api/planes  (PROTEGIDO - PLANES.CREAR)
// Crea un plan comercial. Solo SUPERADMIN (el permiso es exclusivo de él).
// =============================================================================
router.post('/', authorize('PLANES.CREAR'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { errores, plan } = validarPlan(req.body);
        if (errores.length > 0) {
            return res.status(400).json({ ok: false, mensaje: errores.join(', ') });
        }

        const [existe] = await pool.query(
            `SELECT IdPlan FROM planes WHERE CodigoPlan = ? OR NombrePlan = ?`,
            [plan.CodigoPlan, plan.NombrePlan]
        );
        if (existe.length > 0) {
            return res.status(409).json({ ok: false, mensaje: 'Ya existe un plan con ese código o nombre' });
        }

        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO planes
               (CodigoPlan, NombrePlan, Descripcion, PrecioMensual, PrecioAnual, Moneda,
                MaxUsuarios, DiasPrueba, Activo, UsuarioIdCreacion)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                plan.CodigoPlan, plan.NombrePlan, plan.Descripcion,
                plan.PrecioMensual ?? 0, plan.PrecioAnual ?? 0, plan.Moneda,
                plan.MaxUsuarios ?? 1, plan.DiasPrueba ?? null, plan.Activo,
                req.auth.UsuarioId
            ]
        );

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'planes',
            RegistroId: result.insertId,
            Accion: 'CREAR',
            DireccionIP: obtenerIP(req),
            DatosNuevos: plan,
            Descripcion: `Creación del plan ${plan.NombrePlan}`
        }, conn);

        await conn.commit();

        res.status(201).json({
            ok: true,
            mensaje: 'Plan creado correctamente',
            IdPlan: result.insertId
        });
    } catch (error) {
        await conn.rollback();
        console.error('Error creando plan:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando plan', error: error.message });
    } finally {
        conn.release();
    }
});

// =============================================================================
// PUT /api/planes/:id  (PROTEGIDO - PLANES.EDITAR)
// Modifica los datos generales de un plan (nombre, precio, usuarios máx...).
// =============================================================================
router.put('/:id', authorize('PLANES.EDITAR'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const id = Number(req.params.id);
        const { errores, plan } = validarPlan(req.body);
        if (errores.length > 0) {
            return res.status(400).json({ ok: false, mensaje: errores.join(', ') });
        }

        const [actual] = await pool.query(`SELECT * FROM planes WHERE IdPlan = ?`, [id]);
        if (actual.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Plan no encontrado' });
        }
        const anterior = actual[0];

        const [duplicado] = await pool.query(
            `SELECT IdPlan FROM planes
             WHERE (CodigoPlan = ? OR NombrePlan = ?) AND IdPlan <> ?`,
            [plan.CodigoPlan, plan.NombrePlan, id]
        );
        if (duplicado.length > 0) {
            return res.status(409).json({ ok: false, mensaje: 'Ya existe otro plan con ese código o nombre' });
        }

        await conn.beginTransaction();

        await conn.query(
            `UPDATE planes
             SET CodigoPlan = ?, NombrePlan = ?, Descripcion = COALESCE(?, Descripcion),
                 PrecioMensual = COALESCE(?, PrecioMensual),
                 PrecioAnual = COALESCE(?, PrecioAnual),
                 Moneda = COALESCE(?, Moneda),
                 MaxUsuarios = COALESCE(?, MaxUsuarios),
                 DiasPrueba = IF(? IS NULL, NULL, DiasPrueba),
                 Activo = COALESCE(?, Activo),
                 FechaModificacion = NOW(),
                 UsuarioIdModificacion = ?
             WHERE IdPlan = ?`,
            [
                plan.CodigoPlan, plan.NombrePlan, plan.Descripcion,
                plan.PrecioMensual, plan.PrecioAnual, plan.Moneda,
                plan.MaxUsuarios,
                plan.DiasPrueba,
                plan.Activo,
                req.auth.UsuarioId,
                id
            ]
        );

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'planes',
            RegistroId: id,
            Accion: 'EDITAR',
            DireccionIP: obtenerIP(req),
            DatosAnteriores: anterior,
            DatosNuevos: req.body,
            Descripcion: `Modificación del plan ${anterior.NombrePlan}`
        }, conn);

        await conn.commit();

        res.json({ ok: true, mensaje: 'Plan actualizado correctamente' });
    } catch (error) {
        await conn.rollback();
        console.error('Error actualizando plan:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando plan', error: error.message });
    } finally {
        conn.release();
    }
});

// =============================================================================
// PUT /api/planes/:id/estado  (PROTEGIDO - PLANES.ELIMINAR)
// Activa / inactiva un plan (no se elimina físicamente).
// =============================================================================
router.put('/:id/estado', authorize('PLANES.ELIMINAR'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const id = Number(req.params.id);
        const { Activo } = req.body;

        if (Activo === undefined) {
            return res.status(400).json({ ok: false, mensaje: 'Activo es obligatorio' });
        }

        const [actual] = await pool.query(
            `SELECT IdPlan, NombrePlan, Activo FROM planes WHERE IdPlan = ?`,
            [id]
        );
        if (actual.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Plan no encontrado' });
        }

        await conn.beginTransaction();

        await conn.query(
            `UPDATE planes SET Activo = ?, FechaModificacion = NOW(), UsuarioIdModificacion = ?
             WHERE IdPlan = ?`,
            [Activo ? 1 : 0, req.auth.UsuarioId, id]
        );

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'planes',
            RegistroId: id,
            Accion: Activo ? 'ACTIVAR' : 'INACTIVAR',
            DireccionIP: obtenerIP(req),
            DatosAnteriores: { Activo: actual[0].Activo },
            DatosNuevos: { Activo: Activo ? 1 : 0 },
            Descripcion: `${Activo ? 'Activación' : 'Inactivación'} del plan ${actual[0].NombrePlan}`
        }, conn);

        await conn.commit();

        res.json({ ok: true, mensaje: 'Estado del plan actualizado correctamente' });
    } catch (error) {
        await conn.rollback();
        console.error('Error estado plan:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando estado del plan', error: error.message });
    } finally {
        conn.release();
    }
});

// =============================================================================
// PUT /api/planes/:id/modulos  (PROTEGIDO - PLANES.CONFIGURAR)
// Reemplaza el conjunto de módulos incluidos en el plan.
// Expectativa: body { modulos: [1, 2, 3] } (array de idModulos).
// =============================================================================
router.put('/:id/modulos', authorize('PLANES.CONFIGURAR'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const id = Number(req.params.id);
        const { modulos } = req.body;

        if (!Array.isArray(modulos)) {
            return res.status(400).json({ ok: false, mensaje: 'Debe enviar un array de idModulos' });
        }

        const [plan] = await pool.query(`SELECT NombrePlan FROM planes WHERE IdPlan = ?`, [id]);
        if (plan.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Plan no encontrado' });
        }

        await conn.beginTransaction();

        const [anterior] = await pool.query(
            `SELECT m.Codigo FROM plan_modulos pm INNER JOIN modulos m ON m.idModulos = pm.IdModulo
             WHERE pm.IdPlan = ?`,
            [id]
        );

        await conn.query(`DELETE FROM plan_modulos WHERE IdPlan = ?`, [id]);

        if (modulos.length > 0) {
            const valores = modulos.map(mId => [id, mId]);
            await conn.query(
                `INSERT INTO plan_modulos (IdPlan, IdModulo) VALUES ?`,
                [valores]
            );
        }

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'plan_modulos',
            RegistroId: id,
            Accion: 'EDITAR',
            DireccionIP: obtenerIP(req),
            DatosAnteriores: { modulos: anterior.map(m => m.Codigo) },
            DatosNuevos: { modulos },
            Descripcion: `Configuración de módulos del plan ${plan[0].NombrePlan}`
        }, conn);

        await conn.commit();

        res.json({ ok: true, mensaje: 'Módulos del plan actualizados correctamente' });
    } catch (error) {
        await conn.rollback();
        console.error('Error módulos plan:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando módulos del plan', error: error.message });
    } finally {
        conn.release();
    }
});

// =============================================================================
// PUT /api/planes/:id/limites  (PROTEGIDO - PLANES.CONFIGURAR)
// Reemplaza los límites del plan.
// Expectativa: body { limites: [{ IdTipoLimite: 1, ValorLimite: 500 }, ...] }
// =============================================================================
router.put('/:id/limites', authorize('PLANES.CONFIGURAR'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const id = Number(req.params.id);
        const { limites } = req.body;

        if (!Array.isArray(limites)) {
            return res.status(400).json({ ok: false, mensaje: 'Debe enviar un array de límites' });
        }

        const [plan] = await pool.query(`SELECT NombrePlan FROM planes WHERE IdPlan = ?`, [id]);
        if (plan.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Plan no encontrado' });
        }

        await conn.beginTransaction();

        const [anterior] = await pool.query(`SELECT * FROM plan_limites WHERE IdPlan = ?`, [id]);

        await conn.query(`DELETE FROM plan_limites WHERE IdPlan = ?`, [id]);

        if (limites.length > 0) {
            const valores = limites
                .filter(l => l.IdTipoLimite && l.ValorLimite !== undefined)
                .map(l => [id, l.IdTipoLimite, l.ValorLimite]);
            if (valores.length > 0) {
                await conn.query(
                    `INSERT INTO plan_limites (IdPlan, IdTipoLimite, ValorLimite) VALUES ?`,
                    [valores]
                );
            }
        }

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'plan_limites',
            RegistroId: id,
            Accion: 'EDITAR',
            DireccionIP: obtenerIP(req),
            DatosAnteriores: anterior,
            DatosNuevos: limites,
            Descripcion: `Configuración de límites del plan ${plan[0].NombrePlan}`
        }, conn);

        await conn.commit();

        res.json({ ok: true, mensaje: 'Límites del plan actualizados correctamente' });
    } catch (error) {
        await conn.rollback();
        console.error('Error límites plan:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando límites del plan', error: error.message });
    } finally {
        conn.release();
    }
});

module.exports = router;