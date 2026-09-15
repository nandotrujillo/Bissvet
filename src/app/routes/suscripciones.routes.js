const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql.js');
const { authorize } = require('../../middleware/authorize.js');
const { registrarAuditoria } = require('../../middleware/auditoria.js');
const { obtenerConsumoEmpresa } = require('../../middleware/suscripcion.js');

function obtenerIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket?.remoteAddress
        || req.ip
        || null;
}

// =============================================================================
// GET /api/suscripciones  (PROTEGIDO - SUSCRIPCIONES.CONSULTAR)
// Listado de suscripciones con empresa y plan (administrador global).
// =============================================================================
router.get('/', authorize('SUSCRIPCIONES.CONSULTAR'), async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT s.IdSuscripcion, s.IdEmpresa, s.IdPlan, s.Estado,
                    s.FechaInicio, s.FechaFin, s.Periodicidad, s.AutoRenovacion,
                    s.FechaProximaFacturacion, s.FechaCreacion, s.FechaModificacion,
                    e.CodigoEmpresa, e.NombreComercial, e.Nit,
                    p.CodigoPlan, p.NombrePlan, p.PrecioMensual, p.Moneda,
                    (SELECT COUNT(*) FROM usuarios u
                      WHERE u.IdEmpresa = s.IdEmpresa AND u.Activo = 1) AS usuariosActuales,
                    (SELECT COUNT(*) FROM suscripcion_modulos sm
                      WHERE sm.IdSuscripcion = s.IdSuscripcion) AS addonsActuales
             FROM suscripciones s
             INNER JOIN empresas e ON e.IdEmpresa = s.IdEmpresa
             INNER JOIN planes p ON p.IdPlan = s.IdPlan
             ORDER BY s.FechaCreacion DESC`
        );
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando suscripciones:', error);
        res.status(500).json({ ok: false, mensaje: 'Error obteniendo suscripciones', error: error.message });
    }
});

// =============================================================================
// GET /api/suscripciones/:id  (PROTEGIDO - SUSCRIPCIONES.CONSULTAR)
// Detalle de una suscripción con módulos ADD-ON e historial.
// =============================================================================
router.get('/:id', authorize('SUSCRIPCIONES.CONSULTAR'), async (req, res) => {
    try {
        const id = Number(req.params.id);

        const [rows] = await pool.query(
            `SELECT s.*, e.CodigoEmpresa, e.NombreComercial, e.Nit,
                    p.CodigoPlan, p.NombrePlan, p.PrecioMensual, p.PrecioAnual, p.Moneda, p.Maxusuarios
             FROM suscripciones s
             INNER JOIN empresas e ON e.IdEmpresa = s.IdEmpresa
             INNER JOIN planes p ON p.IdPlan = s.IdPlan
             WHERE s.IdSuscripcion = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Suscripción no encontrada' });
        }

        const [addons] = await pool.query(
            `SELECT m.idModulos, m.Codigo, m.NombreModulo, sm.PrecioAdicional
             FROM suscripcion_modulos sm
             INNER JOIN modulos m ON m.idModulos = sm.IdModulo
             WHERE sm.IdSuscripcion = ?`,
            [id]
        );

        const [historial] = await pool.query(
            `SELECT hs.IdHistorial, hs.PlanAnterior, hs.PlanNuevo, hs.EstadoAnterior,
                    hs.EstadoNuevo, hs.PrecioAnterior, hs.PrecioNuevo, hs.Motivo,
                    hs.FechaCambio, u.Username
             FROM historial_suscripciones hs
             LEFT JOIN usuarios u ON u.UsuarioId = hs.UsuarioId
             WHERE hs.IdSuscripcion = ?
             ORDER BY hs.FechaCambio DESC`,
            [id]
        );

        res.json({
            ok: true,
            datos: {
                ...rows[0],
                addons,
                historial
            }
        });
    } catch (error) {
        console.error('Error detalle suscripción:', error);
        res.status(500).json({ ok: false, mensaje: 'Error obteniendo suscripción', error: error.message });
    }
});

// =============================================================================
// POST /api/suscripciones  (PROTEGIDO - SUSCRIPCIONES.ASIGNAR)
// Asigna un plan a una empresa creando su suscripción.
// Expectativa: { IdEmpresa, IdPlan, Estado, FechaInicio, FechaFin, Periodicidad }
// =============================================================================
router.post('/', authorize('SUSCRIPCIONES.ASIGNAR'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const {
            IdEmpresa, IdPlan, Estado = 'PRUEBA',
            FechaInicio, FechaFin, Periodicidad = 'MENSUAL',
            AutoRenovacion = 0, FechaProximaFacturacion
        } = req.body;

        if (!IdEmpresa || !IdPlan) {
            return res.status(400).json({ ok: false, mensaje: 'IdEmpresa e IdPlan son obligatorios' });
        }

        const [empresas] = await pool.query(`SELECT IdEmpresa, NombreComercial FROM empresas WHERE IdEmpresa = ?`, [IdEmpresa]);
        if (empresas.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Empresa no encontrada' });
        }

        const [planes] = await pool.query(`SELECT IdPlan, NombrePlan FROM planes WHERE IdPlan = ?`, [IdPlan]);
        if (planes.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Plan no encontrado' });
        }

        const [existentes] = await pool.query(
            `SELECT IdSuscripcion FROM suscripciones
             WHERE IdEmpresa = ? AND Estado IN ('ACTIVA','PRUEBA')`,
            [IdEmpresa]
        );
        if (existentes.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: 'La empresa ya tiene una suscripción activa o en prueba'
            });
        }

        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO suscripciones
               (IdEmpresa, IdPlan, Estado, FechaInicio, FechaFin, Periodicidad,
                AutoRenovacion, FechaProximaFacturacion, UsuarioIdCreacion)
             VALUES (?, ?, ?, COALESCE(?, NOW()), ?, ?, ?, ?, ?)`,
            [
                IdEmpresa, IdPlan, Estado,
                FechaInicio || null, FechaFin || null,
                Periodicidad, AutoRenovacion ? 1 : 0,
                FechaProximaFacturacion || null,
                req.auth.UsuarioId
            ]
        );

        await registrarAuditoria({
            IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'suscripciones',
            RegistroId: result.insertId,
            Accion: 'CREAR',
            DireccionIP: obtenerIP(req),
            DatosNuevos: { IdEmpresa, IdPlan, Estado, FechaInicio, FechaFin, Periodicidad },
            Descripcion: `Suscripción ${Estado} al plan ${planes[0].NombrePlan} para ${empresas[0].NombreComercial}`
        }, conn);

        await conn.commit();

        res.status(201).json({
            ok: true,
            mensaje: 'Suscripción creada correctamente',
            IdSuscripcion: result.insertId
        });
    } catch (error) {
        await conn.rollback();
        console.error('Error creando suscripción:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando suscripción', error: error.message });
    } finally {
        conn.release();
    }
});

// =============================================================================
// PUT /api/suscripciones/:id  (PROTEGIDO - SUSCRIPCIONES.SUSPENDER)
// Actualiza estado / fechas / renovación de la suscripción.
// =============================================================================
router.put('/:id', authorize('SUSCRIPCIONES.SUSPENDER'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const id = Number(req.params.id);
        const {
            Estado, FechaInicio, FechaFin, Periodicidad,
            AutoRenovacion, FechaProximaFacturacion
        } = req.body;

        const [actual] = await pool.query(`SELECT * FROM suscripciones WHERE IdSuscripcion = ?`, [id]);
        if (actual.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Suscripción no encontrada' });
        }
        const anterior = actual[0];

        await conn.beginTransaction();

        await conn.query(
            `UPDATE suscripciones
             SET Estado = COALESCE(?, Estado),
                 FechaInicio = COALESCE(?, FechaInicio),
                 FechaFin = COALESCE(?, FechaFin),
                 Periodicidad = COALESCE(?, Periodicidad),
                 AutoRenovacion = COALESCE(?, AutoRenovacion),
                 FechaProximaFacturacion = COALESCE(?, FechaProximaFacturacion),
                 FechaModificacion = NOW(),
                 UsuarioIdModificacion = ?
             WHERE IdSuscripcion = ?`,
            [
                Estado || null,
                FechaInicio || null,
                FechaFin || null,
                Periodicidad || null,
                AutoRenovacion !== undefined ? (AutoRenovacion ? 1 : 0) : null,
                FechaProximaFacturacion || null,
                req.auth.UsuarioId,
                id
            ]
        );

        if (Estado) {
            await conn.query(
                `INSERT INTO historial_suscripciones
                   (IdSuscripcion, IdEmpresa, PlanAnterior, PlanNuevo, EstadoAnterior, EstadoNuevo,
                    Motivo, UsuarioId)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id, anterior.IdEmpresa, anterior.IdPlan, anterior.IdPlan,
                    anterior.Estado, Estado,
                    req.body.Motivo || 'Cambio de estado de suscripción',
                    req.auth.UsuarioId
                ]
            );
        }

        await registrarAuditoria({
            IdEmpresa: anterior.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'suscripciones',
            RegistroId: id,
            Accion: 'EDITAR',
            DireccionIP: obtenerIP(req),
            DatosAnteriores: anterior,
            DatosNuevos: req.body,
            Descripcion: `Actualización de suscripción (estado ${Estado || 'sin cambio'})`
        }, conn);

        await conn.commit();

        res.json({ ok: true, mensaje: 'Suscripción actualizada correctamente' });
    } catch (error) {
        await conn.rollback();
        console.error('Error actualizando suscripción:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando suscripción', error: error.message });
    } finally {
        conn.release();
    }
});

// =============================================================================
// POST /api/suscripciones/:id/cambiar-plan  (PROTEGIDO - SUSCRIPCIONES.CAMBIAR_PLAN)
// Cambia el plan de la empresa (RF-MON-011, RFC-024/025).
// - Si el plan nuevo reduce límites, verifica que la empresa cumpla los nuevos límites.
// - Registra el historial de cambios (RF-MON-012).
// - Los módulos ADD-ON se conservan.
// =============================================================================
router.post('/:id/cambiar-plan', authorize('SUSCRIPCIONES.CAMBIAR_PLAN'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const id = Number(req.params.id);
        const { IdPlanNuevo, Motivo } = req.body;

        if (!IdPlanNuevo) {
            return res.status(400).json({ ok: false, mensaje: 'IdPlanNuevo es obligatorio' });
        }

        const [actual] = await pool.query(
            `SELECT s.*, p.NombrePlan AS NombrePlanActual, p.PrecioMensual AS PrecioActual
             FROM suscripciones s
             INNER JOIN planes p ON p.IdPlan = s.IdPlan
             WHERE s.IdSuscripcion = ?`,
            [id]
        );
        if (actual.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Suscripción no encontrada' });
        }

        const [planes] = await pool.query(
            `SELECT IdPlan, NombrePlan, PrecioMensual FROM planes WHERE IdPlan = ?`,
            [IdPlanNuevo]
        );
        if (planes.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Plan nuevo no encontrado' });
        }
        const planNuevo = planes[0];

        const actualRec = actual[0];

        // Validación de reducción (RF-025): si el nuevo plan es "menor"
        // (menos máximo de usuarios), verificar que no lo supere.
        if (planNuevo.IdPlan !== actualRec.IdPlan && planNuevo.PrecioMensual <= actualRec.PrecioActual) {
            const consumo = await obtenerConsumoEmpresa(actualRec.IdEmpresa);
            const limiteusuarios = consumo.Maxusuarios || 1;
            const usuariosActuales = consumo.consumos?.find(c => c.codigo === 'usuarios')?.actual || 0;

            if (usuariosActuales > planNuevo.Maxusuarios) {
                return res.status(409).json({
                    ok: false,
                    mensaje: `No puede cambiar al plan seleccionado porque actualmente tiene ${usuariosActuales} usuarios activos y el nuevo plan permite máximo ${planNuevo.Maxusuarios}.`
                });
            }
        }

        await conn.beginTransaction();

        await conn.query(
            `UPDATE suscripciones
             SET IdPlan = ?, FechaModificacion = NOW(), UsuarioIdModificacion = ?
             WHERE IdSuscripcion = ?`,
            [planNuevo.IdPlan, req.auth.UsuarioId, id]
        );

        await conn.query(
            `INSERT INTO historial_suscripciones
               (IdSuscripcion, IdEmpresa, PlanAnterior, PlanNuevo, EstadoAnterior, EstadoNuevo,
                PrecioAnterior, PrecioNuevo, Motivo, UsuarioId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, actualRec.IdEmpresa, actualRec.IdPlan, planNuevo.IdPlan,
                actualRec.Estado, actualRec.Estado,
                actualRec.PrecioActual, planNuevo.PrecioMensual,
                Motivo || 'Cambio de plan',
                req.auth.UsuarioId
            ]
        );

        await registrarAuditoria({
            IdEmpresa: actualRec.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'suscripciones',
            RegistroId: id,
            Accion: 'CAMBIAR_PLAN',
            DireccionIP: obtenerIP(req),
            DatosAnteriores: {
                IdPlan: actualRec.IdPlan,
                NombrePlan: actualRec.NombrePlanActual,
                Precio: actualRec.PrecioActual
            },
            DatosNuevos: {
                IdPlan: planNuevo.IdPlan,
                NombrePlan: planNuevo.NombrePlan,
                Precio: planNuevo.PrecioMensual
            },
            Descripcion: `Cambio de plan de ${actualRec.NombrePlanActual} a ${planNuevo.NombrePlan}`
        }, conn);

        await conn.commit();

        res.json({
            ok: true,
            mensaje: `Plan cambiado a ${planNuevo.NombrePlan} correctamente`
        });
    } catch (error) {
        await conn.rollback();
        console.error('Error cambiando plan:', error);
        res.status(500).json({ ok: false, mensaje: 'Error cambiando plan', error: error.message });
    } finally {
        conn.release();
    }
});

// =============================================================================
// PUT /api/suscripciones/:id/addons  (PROTEGIDO - SUSCRIPCIONES.ADDONS)
// Define los módulos ADD-ON de la suscripción (reemplaza).
// Expectativa: body { modulos: [{ IdModulo: 1, PrecioAdicional: 50000 }, ...] }
// =============================================================================
router.put('/:id/addons', authorize('SUSCRIPCIONES.ADDONS'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const id = Number(req.params.id);
        const { modulos } = req.body;

        if (!Array.isArray(modulos)) {
            return res.status(400).json({ ok: false, mensaje: 'Debe enviar un array de módulos' });
        }

        const [actual] = await pool.query(`SELECT IdEmpresa, IdPlan FROM suscripciones WHERE IdSuscripcion = ?`, [id]);
        if (actual.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Suscripción no encontrada' });
        }
        const suscripcion = actual[0];

        // No permitir añadir un módulo ya incluido en el plan (duplicado)
        const [planModulos] = await pool.query(
            `SELECT IdModulo FROM plan_modulos WHERE IdPlan = ?`,
            [suscripcion.IdPlan]
        );
        const yaIncluidos = new Set(planModulos.map(m => m.IdModulo));

        const duplicados = modulos.filter(m => yaIncluidos.has(m.IdModulo));
        if (duplicados.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: `Los módulos con id ${duplicados.map(d => d.IdModulo).join(', ')} ya están incluidos en el plan`
            });
        }

        await conn.beginTransaction();

        const [anterior] = await pool.query(
            `SELECT m.Codigo FROM suscripcion_modulos sm INNER JOIN modulos m ON m.idModulos = sm.IdModulo
             WHERE sm.IdSuscripcion = ?`,
            [id]
        );

        await conn.query(`DELETE FROM suscripcion_modulos WHERE IdSuscripcion = ?`, [id]);

        if (modulos.length > 0) {
            const valores = modulos.map(m => [id, m.IdModulo, m.PrecioAdicional || 0]);
            await conn.query(
                `INSERT INTO suscripcion_modulos (IdSuscripcion, IdModulo, PrecioAdicional) VALUES ?`,
                [valores]
            );
        }

        await registrarAuditoria({
            IdEmpresa: suscripcion.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'suscripcion_modulos',
            RegistroId: id,
            Accion: 'EDITAR',
            DireccionIP: obtenerIP(req),
            DatosAnteriores: { modulos: anterior.map(m => m.Codigo) },
            DatosNuevos: modulos,
            Descripcion: 'Configuración de módulos ADD-ON de la suscripción'
        }, conn);

        await conn.commit();

        res.json({ ok: true, mensaje: 'Módulos ADD-ON actualizados correctamente' });
    } catch (error) {
        await conn.rollback();
        console.error('Error addons:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando ADD-ONs', error: error.message });
    } finally {
        conn.release();
    }
});

module.exports = router;