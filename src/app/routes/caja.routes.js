const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql');
const { registrarAuditoria } = require('../../middleware/auditoria.js');

function obtenerIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket?.remoteAddress
        || req.ip
        || null;
}

// =============================================================================
// GET /api/caja/tipos   (PROTEGIDO - CAJA.CONSULTAR)
// Tipos de movimiento de caja de la empresa.
// =============================================================================
router.get('/tipos', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, DescTipoMovCaja, Signo, Ventas, Gastos,
                    ProvisionCaja, Prestamo, AplicaProveedores
             FROM tipomovcaja
             WHERE idEmpresa = ? AND Estatus = 1
             ORDER BY id`,
            [req.auth.IdEmpresa]
        );
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando tipos de movimiento:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando tipos de movimiento', error: error.message });
    }
});

// =============================================================================
// GET /api/caja   (PROTEGIDO - CAJA.CONSULTAR)
// Jornadas de caja. Filtros: ?desde&hasta (diaProceso), ?estado=ABIERTA/CERRADA
// =============================================================================
router.get('/', async (req, res) => {
    try {
        const condiciones = ['cm.idEmpresa = ?'];
        const params = [req.auth.IdEmpresa];

        if (req.query.desde) { condiciones.push('cm.diaProceso >= ?'); params.push(req.query.desde); }
        if (req.query.hasta) { condiciones.push('cm.diaProceso <= ?'); params.push(req.query.hasta); }
        if (req.query.estado) {
            const estado = req.query.estado.toUpperCase();
            condiciones.push(estado === 'ABIERTA' ? 'cm.Cierre = 0' : 'cm.Cierre = 1');
        }

        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

        const [rows] = await pool.query(`
            SELECT
                cm.Id,
                cm.cajaMesa,
                cm.diaProceso,
                cm.Apertura,
                cm.Cierre,
                cm.Valor AS ValorApertura,
                cm.valorEntregado,
                cm.Descuadre,
                cm.FechaCreacion,
                cm.FechaCierre,
                cm.IdBodega,
                b.NombreBodega,
                u.PrimerNombre, u.PrimerApellido,
                CASE WHEN cm.Cierre = 0 THEN 'ABIERTA' ELSE 'CERRADA' END AS EstadoJornada,
                COALESCE((SELECT SUM(d.ValorMov)
                          FROM cajeromovdet d
                          INNER JOIN tipomovcaja t ON d.TipoMov = t.id
                          WHERE d.IdCajaMov = cm.Id AND t.Signo = '+'), 0) AS Ingresos,
                COALESCE((SELECT SUM(d.ValorMov)
                          FROM cajeromovdet d
                          INNER JOIN tipomovcaja t ON d.TipoMov = t.id
                          WHERE d.IdCajaMov = cm.Id AND t.Signo = '-'), 0) AS Egresos,
                (SELECT COUNT(*) FROM cajeromovdet d WHERE d.IdCajaMov = cm.Id) AS TotalMovimientos
            FROM cajeromov cm
            LEFT JOIN bodegas b   ON b.Id = cm.IdBodega
            LEFT JOIN Usuarios u  ON u.UsuarioId = cm.idUsuario
            ${where}
            ORDER BY cm.diaProceso DESC, cm.Id DESC
        `, params);

        const datos = rows.map(r => ({
            ...r,
            Saldo: Number(r.ValorApertura || 0) + Number(r.Ingresos || 0) - Number(r.Egresos || 0)
        }));

        res.json({ ok: true, datos });
    } catch (error) {
        console.error('Error listando caja:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando caja', error: error.message });
    }
});

// =============================================================================
// GET /api/caja/arqueo   (PROTEGIDO - CAJA.CONSULTAR)
// Arqueo por rango de fechas: totales por tipo de movimiento + saldo neto.
// =============================================================================
router.get('/arqueo', async (req, res) => {
    try {
        const condiciones = ['cm.idEmpresa = ?'];
        const params = [req.auth.IdEmpresa];

        if (req.query.desde) { condiciones.push('cm.diaProceso >= ?'); params.push(req.query.desde); }
        if (req.query.hasta) { condiciones.push('cm.diaProceso <= ?'); params.push(req.query.hasta); }

        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

        const [porTipo] = await pool.query(`
            SELECT
                t.id AS IdTipo,
                t.DescTipoMovCaja,
                t.Signo,
                COUNT(*) AS Cantidad,
                COALESCE(SUM(d.ValorMov), 0) AS Total
            FROM cajeromovdet d
            INNER JOIN tipomovcaja t ON d.TipoMov = t.id
            INNER JOIN cajeromov cm ON cm.Id = d.IdCajaMov
            ${where}
            GROUP BY t.id, t.DescTipoMovCaja, t.Signo
            ORDER BY t.Signo DESC, t.DescTipoMovCaja
        `, params);

        const [totales] = await pool.query(`
            SELECT
                COALESCE(SUM(CASE WHEN t.Signo = '+' THEN d.ValorMov END), 0) AS TotalIngresos,
                COALESCE(SUM(CASE WHEN t.Signo = '-' THEN d.ValorMov END), 0) AS TotalEgresos,
                COALESCE(SUM(CASE WHEN t.Signo = '+' THEN d.ValorMov END), 0)
              - COALESCE(SUM(CASE WHEN t.Signo = '-' THEN d.ValorMov END), 0) AS SaldoNeto
            FROM cajeromovdet d
            INNER JOIN tipomovcaja t ON d.TipoMov = t.id
            INNER JOIN cajeromov cm ON cm.Id = d.IdCajaMov
            ${where}
        `, params);

        res.json({
            ok: true,
            datos: {
                porTipo,
                totales: totales[0]
            }
        });
    } catch (error) {
        console.error('Error en arqueo:', error);
        res.status(500).json({ ok: false, mensaje: 'Error generando arqueo', error: error.message });
    }
});

// =============================================================================
// GET /api/caja/:id/movimientos   (PROTEGIDO - CAJA.CONSULTAR)
// Detalle de movimientos de una jornada.
// =============================================================================
router.get('/:id/movimientos', async (req, res) => {
    try {
        const id = Number(req.params.id);

        const [jornada] = await pool.query(
            `SELECT Id FROM cajeromov WHERE Id = ? AND idEmpresa = ?`,
            [id, req.auth.IdEmpresa]
        );
        if (jornada.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Jornada de caja no encontrada' });
        }

        const [detalle] = await pool.query(`
            SELECT
                d.Id, d.TipoMov, t.DescTipoMovCaja, t.Signo,
                d.ValorMov, d.FechaRegistro, d.DescMov,
                d.idProveedor, d.NroDocumentoProveedor,
                d.UsuarioIdCreacion,
                CONCAT_WS(' ', u.PrimerNombre, u.SegundoNombre,
                          u.PrimerApellido, u.SegundoApellido) AS NombreUsuario
            FROM cajeromovdet d
            INNER JOIN tipomovcaja t ON d.TipoMov = t.id
            LEFT JOIN Usuarios u ON u.UsuarioId = d.UsuarioIdCreacion
            WHERE d.IdCajaMov = ?
            ORDER BY d.FechaRegistro ASC, d.Id ASC
        `, [id]);

        res.json({ ok: true, datos: detalle });
    } catch (error) {
        console.error('Error consultando movimientos:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando movimientos', error: error.message });
    }
});

// =============================================================================
// POST /api/caja/apertura   (PROTEGIDO - CAJA.ABRIR, RF-00X)
// Abre una jornada de caja para el día. Valida que no exista otra abierta sin cerrar.
// =============================================================================
router.post('/apertura', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { cajaMesa, ValorApertura, IdBodega, diaProceso } = req.body;

        const valor = Number(ValorApertura) || 0;
        const caja = Number(cajaMesa) || 1;
        const dia = diaProceso || new Date().toISOString().slice(0, 10);

        if (valor < 0) {
            return res.status(400).json({ ok: false, mensaje: 'Valor de apertura no puede ser negativo' });
        }

        const [abierta] = await pool.query(
            `SELECT Id, diaProceso FROM cajeromov
             WHERE idEmpresa = ? AND Apertura = 1 AND (Cierre = 0 OR Cierre IS NULL)
             ORDER BY Id DESC LIMIT 1`,
            [req.auth.IdEmpresa]
        );
        if (abierta.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: `Ya existe una jornada abierta del ${abierta[0].diaProceso.toISOString().slice(0, 10)}. Debe cerrarla antes de abrir una nueva.`
            });
        }

        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO cajeromov
               (cajaMesa, diaProceso, Apertura, Cierre, Valor, idUsuario, idEmpresa,
                FechaCreacion, valorEntregado, IdBodega)
             VALUES (?, ?, 1, 0, ?, ?, ?, NOW(), NULL, ?)`,
            [caja, dia, valor, req.auth.UsuarioId, req.auth.IdEmpresa, IdBodega || null]
        );

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'cajeromov',
            RegistroId: result.insertId,
            Accion: 'APERTURA',
            DireccionIP: obtenerIP(req),
            DatosNuevos: { cajaMesa: caja, diaProceso: dia, ValorApertura: valor, IdBodega: IdBodega || null },
            Descripcion: `Apertura de caja ${caja} el ${dia}`
        }, conn);

        await conn.commit();

        res.status(201).json({
            ok: true,
            mensaje: `Caja ${caja} abierta el ${dia}`,
            Id: result.insertId
        });
    } catch (error) {
        await conn.rollback();
        console.error('Error aperturando caja:', error);
        res.status(500).json({ ok: false, mensaje: 'Error abriendo caja', error: error.message });
    } finally {
        conn.release();
    }
});

// =============================================================================
// POST /api/caja/movimiento   (PROTEGIDO - CAJA.CONSULTAR)
// Registra un movimiento (ingreso/egreso) en la jornada abierta.
// =============================================================================
router.post('/movimiento', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { TipoMov, ValorMov, DescMov, idProveedor, NroDocumentoProveedor } = req.body;

        const tipo = Number(TipoMov);
        const valor = Number(ValorMov);
        const desc = (DescMov || '').trim();

        if (!tipo || valor <= 0) {
            return res.status(400).json({ ok: false, mensaje: 'TipoMov y ValorMov (mayor a 0) son obligatorios' });
        }
        if (desc.length === 0) {
            return res.status(400).json({ ok: false, mensaje: 'La descripción del movimiento es obligatoria' });
        }

        const [tipoInfo] = await pool.query(
            `SELECT id, DescTipoMovCaja FROM tipomovcaja WHERE id = ? AND idEmpresa = ? AND Estatus = 1`,
            [tipo, req.auth.IdEmpresa]
        );
        if (tipoInfo.length === 0) {
            return res.status(400).json({ ok: false, mensaje: 'Tipo de movimiento inválido' });
        }

        const [jornada] = await pool.query(
            `SELECT Id FROM cajeromov
             WHERE idEmpresa = ? AND Apertura = 1 AND (Cierre = 0 OR Cierre IS NULL)
             ORDER BY Id DESC LIMIT 1`,
            [req.auth.IdEmpresa]
        );
        if (jornada.length === 0) {
            return res.status(409).json({ ok: false, mensaje: 'No hay una jornada de caja abierta. Debe abrir caja primero.' });
        }

        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO cajeromovdet
               (IdCajaMov, TipoMov, ValorMov, FechaRegistro, DescMov, idProveedor, NroDocumentoProveedor,
                UsuarioIdCreacion, IdEmpresa)
             VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?)`,
            [
                jornada[0].Id,
                tipo,
                valor,
                desc,
                idProveedor != null && idProveedor !== '' ? Number(idProveedor) : null,
                NroDocumentoProveedor || null,
                req.auth.UsuarioId,
                req.auth.IdEmpresa
            ]
        );

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'cajeromovdet',
            RegistroId: result.insertId,
            Accion: 'CREAR',
            DireccionIP: obtenerIP(req),
            DatosNuevos: { IdCajaMov: jornada[0].Id, TipoMov: tipo, ValorMov: valor, DescMov: desc },
            Descripcion: `Movimiento de caja ${tipoInfo[0].DescTipoMovCaja}: ${desc}`
        }, conn);

        await conn.commit();

        res.status(201).json({ ok: true, mensaje: 'Movimiento registrado', Id: result.insertId });
    } catch (error) {
        await conn.rollback();
        console.error('Error registrando movimiento de caja:', error);
        res.status(500).json({ ok: false, mensaje: 'Error registrando movimiento', error: error.message });
    } finally {
        conn.release();
    }
});

// =============================================================================
// POST /api/caja/cierre   (PROTEGIDO - CAJA.CERRAR)
// Cierra la jornada abierta: valor entregado y cálculo del descuadre.
// =============================================================================
router.post('/cierre', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { valorEntregado } = req.body;

        const entregado = Number(valorEntregado);

        if (!Number.isFinite(entregado)) {
            return res.status(400).json({ ok: false, mensaje: 'El valor entregado es obligatorio y debe ser un número' });
        }

        if (entregado < 0) {
            return res.status(400).json({ ok: false, mensaje: 'El valor entregado no puede ser negativo' });
        }

        const [jornada] = await pool.query(
            `SELECT Id, diaProceso, Valor
             FROM cajeromov
             WHERE idEmpresa = ? AND Apertura = 1 AND (Cierre = 0 OR Cierre IS NULL)
             ORDER BY Id DESC LIMIT 1`,
            [req.auth.IdEmpresa]
        );
        if (jornada.length === 0) {
            return res.status(409).json({ ok: false, mensaje: 'No hay una jornada de caja abierta para cerrar' });
        }
        const id = jornada[0].Id;

        const [totales] = await pool.query(
            `SELECT
                COALESCE(SUM(CASE WHEN t.Signo = '+' THEN d.ValorMov END), 0) AS Ingresos,
                COALESCE(SUM(CASE WHEN t.Signo = '-' THEN d.ValorMov END), 0) AS Egresos
             FROM cajeromovdet d
             INNER JOIN tipomovcaja t ON d.TipoMov = t.id
             WHERE d.IdCajaMov = ?`,
            [id]
        );

        const esperado = Number(jornada[0].Valor || 0) + Number(totales[0].Ingresos) - Number(totales[0].Egresos);
        const descuadre = Number((entregado - esperado).toFixed(2));

        await conn.beginTransaction();

        await conn.query(
            `UPDATE cajeromov
             SET Cierre = 1, valorEntregado = ?, Descuadre = ?, FechaCierre = NOW()
             WHERE Id = ? AND idEmpresa = ?`,
            [entregado, descuadre, id, req.auth.IdEmpresa]
        );

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'cajeromov',
            RegistroId: id,
            Accion: 'CIERRE',
            DireccionIP: obtenerIP(req),
            DatosNuevos: { valorEntregado: entregado, valorEsperado: esperado, Descuadre: descuadre },
            Descripcion: `Cierre de caja del ${jornada[0].diaProceso.toISOString().slice(0, 10)}`
        }, conn);

        await conn.commit();

        res.json({ ok: true, mensaje: 'Caja cerrada correctamente', Descuadre: descuadre, ValorEsperado: esperado });
    } catch (error) {
        await conn.rollback();
        console.error('Error cerrando caja:', error);
        res.status(500).json({ ok: false, mensaje: 'Error cerrando caja', error: error.message });
    } finally {
        conn.release();
    }
});

module.exports = router;