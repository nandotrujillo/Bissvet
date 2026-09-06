const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');
const invBusiness = require('../services/inventarioBusiness');

// =====================================================
// LISTAR TRASLADOS  (GET /api/traslados)
// Filtros: ?doc=1, ?estado=CONFIRMADA, ?origen=1, ?destino=1, ?desde&hasta
// =====================================================
router.get('/', async (req, res) => {
    try {
        const condiciones = [];
        const params = [];
        if (req.query.doc)      { condiciones.push('t.IdTraslado = ?'); params.push(Number(req.query.doc)); }
        if (req.query.estado)   { condiciones.push('t.Estado = ?'); params.push(req.query.estado); }
        if (req.query.origen)   { condiciones.push('t.IdBodegaOrigen = ?'); params.push(Number(req.query.origen)); }
        if (req.query.destino)  { condiciones.push('t.IdBodegaDestino = ?'); params.push(Number(req.query.destino)); }
        if (req.query.desde) { condiciones.push('t.Fecha >= ?'); params.push(req.query.desde); }
        if (req.query.hasta) { condiciones.push('t.Fecha <= ?'); params.push(req.query.hasta); }
        condiciones.push('t.IdEmpresa = ?');
        params.push(req.auth?.IdEmpresa ?? null);
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

        const [rows] = await pool.query(`
            SELECT
                t.IdTraslado, t.Numero, t.Fecha, t.Estado,
                t.IdBodegaOrigen, bo.NombreBodega AS BodegaOrigen,
                t.IdBodegaDestino, bd.NombreBodega AS BodegaDestino,
                t.Observaciones, t.UsuarioIdCreacion,
                t.FechaCreacion, t.FechaConfirmacion, t.FechaAnulacion,
                (SELECT COUNT(*) FROM traslados_detalle td WHERE td.IdTraslado = t.IdTraslado) AS TotalItems
            FROM traslados t
            INNER JOIN bodegas bo ON bo.Id = t.IdBodegaOrigen
            INNER JOIN bodegas bd ON bd.Id = t.IdBodegaDestino
            ${where}
            ORDER BY t.Fecha DESC, t.IdTraslado DESC
        `, params);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando traslados:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando traslados', error: error.message });
    }
});

// =====================================================
// OBTENER TRASLADO CON DETALLE  (GET /api/traslados/:id)
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [cabecera] = await pool.query(`
            SELECT
                t.IdTraslado, t.Numero, t.Fecha, t.Estado,
                t.IdBodegaOrigen, bo.NombreBodega AS BodegaOrigen,
                t.IdBodegaDestino, bd.NombreBodega AS BodegaDestino,
                t.Observaciones, t.UsuarioIdCreacion, t.FechaCreacion,
                t.UsuarioIdConfirmacion, t.FechaConfirmacion,
                t.UsuarioIdAnulacion, t.FechaAnulacion
            FROM traslados t
            INNER JOIN bodegas bo ON bo.Id = t.IdBodegaOrigen
            INNER JOIN bodegas bd ON bd.Id = t.IdBodegaDestino
            WHERE t.IdTraslado = ? AND t.IdEmpresa = ?
        `, [req.params.id, req.auth?.IdEmpresa ?? null]);
        if (cabecera.length === 0)
            return res.status(404).json({ ok: false, mensaje: 'Traslado no encontrado' });

        const [detalle] = await pool.query(`
            SELECT
                td.IdTrasladoDetalle, td.IdTraslado, td.IdProducto,
                p.CodigoProducto, p.NombreProducto,
                td.Cantidad, td.CostoUnitario
            FROM traslados_detalle td
            INNER JOIN productos p ON p.IdProducto = td.IdProducto
            WHERE td.IdTraslado = ?
        `, [req.params.id]);

        res.json({ ok: true, datos: { ...cabecera[0], Detalle: detalle } });
    } catch (error) {
        console.error('Error obteniendo traslado:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando traslado', error: error.message });
    }
});

// =====================================================
// CREAR TRASLADO (BORRADOR)  (POST /api/traslados)
// Body: { Numero, IdBodegaOrigen, IdBodegaDestino, Fecha, Observaciones,
//         UsuarioIdCreacion, Detalle: [{ IdProducto, Cantidad }] }
// CostoUnitario se congela del CPP de origen al momento de CONFIRMAR.
// No afecta inventario hasta CONFIRMAR.
// =====================================================
router.post('/', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const {
            Numero, IdBodegaOrigen, IdBodegaDestino, Fecha, Observaciones,
            Detalle
        } = req.body;
        // Usuario y empresa provienen de la sesión, no del body.
        const UsuarioIdCreacion = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        if (!Numero || !Numero.trim())
            return res.status(400).json({ ok: false, mensaje: 'El número de documento es obligatorio' });
        if (!IdBodegaOrigen)
            return res.status(400).json({ ok: false, mensaje: 'La bodega de origen es obligatoria' });
        if (!IdBodegaDestino)
            return res.status(400).json({ ok: false, mensaje: 'La bodega de destino es obligatoria' });
        if (Number(IdBodegaOrigen) === Number(IdBodegaDestino))
            return res.status(400).json({ ok: false, mensaje: 'La bodega origen y destino deben ser diferentes' });
        if (!Detalle || !Detalle.length)
            return res.status(400).json({ ok: false, mensaje: 'Debe agregar al menos un producto' });

        const [duplicado] = await conn.query(
            `SELECT IdTraslado FROM traslados WHERE Numero = ? AND IdEmpresa = ?`,
            [Numero.trim(), IdEmpresa]
        );
        if (duplicado.length > 0)
            return res.status(409).json({ ok: false, mensaje: 'Ya existe un traslado con ese número' });

        for (const item of Detalle) {
            if (!item.IdProducto) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: 'Cada detalle debe tener IdProducto' }); }
            if (!item.Cantidad || item.Cantidad <= 0) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: `Cantidad inválida para producto ${item.IdProducto}` }); }
        }

        const [cabecera] = await conn.query(
            `INSERT INTO traslados (
                Numero, IdBodegaOrigen, IdBodegaDestino, Fecha, Estado,
                Observaciones, UsuarioIdCreacion, IdEmpresa
            ) VALUES (?, ?, ?, ?, 'BORRADOR', ?, ?, ?)`,
            [
                Numero.trim(), IdBodegaOrigen, IdBodegaDestino, Fecha || new Date(),
                Observaciones || null, UsuarioIdCreacion, IdEmpresa
            ]
        );
        const IdTraslado = cabecera.insertId;

        for (const item of Detalle) {
            await conn.query(
                `INSERT INTO traslados_detalle (IdTraslado, IdProducto, Cantidad, CostoUnitario, IdEmpresa)
                 VALUES (?, ?, ?, 0, ?)`,
                [IdTraslado, item.IdProducto, item.Cantidad, IdEmpresa]
            );
        }

        await conn.commit();
        res.status(201).json({ ok: true, mensaje: 'Traslado creado en estado BORRADOR', IdTraslado });
    } catch (error) {
        await conn.rollback();
        console.error('Error creando traslado:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando traslado', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ACTUALIZAR TRASLADO (solo BORRADOR)  (PUT /api/traslados/:id)
// =====================================================
router.put('/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const { Numero, IdBodegaOrigen, IdBodegaDestino, Fecha, Observaciones, UsuarioIdModificacion, Detalle } = req.body;
        const IdTraslado = Number(req.params.id);

        const [actual] = await conn.query(`SELECT Estado FROM traslados WHERE IdTraslado = ?`, [IdTraslado]);
        if (actual.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Traslado no encontrado' }); }
        if (actual[0].Estado !== 'BORRADOR') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden editar traslados en BORRADOR' }); }

        if (!Numero || !Detalle || !Detalle.length)
            return res.status(400).json({ ok: false, mensaje: 'Número y detalle son obligatorios' });
        if (Number(IdBodegaOrigen) === Number(IdBodegaDestino))
            return res.status(400).json({ ok: false, mensaje: 'La bodega origen y destino deben ser diferentes' });

        await conn.query(
            `UPDATE traslados SET Numero=?, IdBodegaOrigen=?, IdBodegaDestino=?, Fecha=?, Observaciones=?
             WHERE IdTraslado=?`,
            [Numero.trim(), IdBodegaOrigen, IdBodegaDestino, Fecha || new Date(), Observaciones || null, IdTraslado]
        );
        await conn.query(`DELETE FROM traslados_detalle WHERE IdTraslado = ?`, [IdTraslado]);
        for (const item of Detalle) {
            await conn.query(
                `INSERT INTO traslados_detalle (IdTraslado, IdProducto, Cantidad, CostoUnitario)
                 VALUES (?, ?, ?, 0)`,
                [IdTraslado, item.IdProducto, item.Cantidad]
            );
        }

        await conn.commit();
        res.json({ ok: true, mensaje: 'Traslado actualizado' });
    } catch (error) {
        await conn.rollback();
        console.error('Error actualizando traslado:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando traslado', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// CONFIRMAR TRASLADO  (POST /api/traslados/:id/confirmar)
// Transaction:
//   1. Verifica estado BORRADOR
//   2. Por cada detalle: SALIDA en origen (TRASLADO_SALIDA) al CPP vigente de origen
//   3. ENTRADA en destino (TRASLADO_ENTRADA) al mismo costo (CPP del origen)
//   4. Congela el costo en traslados_detalle
//   5. Marca traslado CONFIRMADO
// =====================================================
router.post('/:id/confirmar', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const IdTraslado = Number(req.params.id);
        // El usuario que confirma proviene de la sesión, no del body.
        const UsuarioIdConfirmacion = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        const [traslado] = await conn.query(
            `SELECT IdTraslado, IdBodegaOrigen, IdBodegaDestino, Estado
             FROM traslados WHERE IdTraslado = ? AND IdEmpresa = ? FOR UPDATE`, [IdTraslado, IdEmpresa]
        );
        if (traslado.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Traslado no encontrado' }); }
        if (traslado[0].Estado === 'CONFIRMADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'El traslado ya está confirmado' }); }
        if (traslado[0].Estado === 'ANULADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'No se puede confirmar un traslado anulado' }); }

        const [detalle] = await conn.query(
            `SELECT IdTrasladoDetalle, IdProducto, Cantidad FROM traslados_detalle WHERE IdTraslado = ?`, [IdTraslado]
        );

        const movimientos = [];
        for (const item of detalle) {
            const salida = await invBusiness.registrarSalida(conn, {
                IdProducto: item.IdProducto,
                IdBodega: traslado[0].IdBodegaOrigen,
                TipoMovimiento: 'TRASLADO_SALIDA',
                DocumentoTipo: 'TRASLADO',
                IdDocumento: IdTraslado,
                cantidad: item.Cantidad,
                UsuarioId: UsuarioIdConfirmacion,
                IdEmpresa: IdEmpresa,
                Observaciones: 'Salida por traslado a otra bodega'
            });

            const costoUnitario = Number(salida.costoUnitario);
            const entrada = await invBusiness.registrarEntrada(conn, {
                IdProducto: item.IdProducto,
                IdBodega: traslado[0].IdBodegaDestino,
                TipoMovimiento: 'TRASLADO_ENTRADA',
                DocumentoTipo: 'TRASLADO',
                IdDocumento: IdTraslado,
                cantidad: item.Cantidad,
                costoUnitario,
                costoTotal: item.Cantidad * costoUnitario,
                UsuarioId: UsuarioIdConfirmacion,
                IdEmpresa: IdEmpresa,
                Observaciones: 'Entrada por traslado desde otra bodega'
            });

            await conn.query(
                `UPDATE traslados_detalle SET CostoUnitario = ? WHERE IdTrasladoDetalle = ?`,
                [costoUnitario, item.IdTrasladoDetalle]
            );

            movimientos.push({ salida, entrada });
        }

        await conn.query(
            `UPDATE traslados SET Estado = 'CONFIRMADA',
                UsuarioIdConfirmacion = ?, FechaConfirmacion = NOW()
             WHERE IdTraslado = ?`,
            [UsuarioIdConfirmacion || null, IdTraslado]
        );

        await conn.commit();
        res.json({ ok: true, mensaje: 'Traslado confirmado, inventario actualizado en ambas bodegas', movimientos });
    } catch (error) {
        await conn.rollback();
        console.error('Error confirmando traslado:', error);
        res.status(500).json({ ok: false, mensaje: error.codigo === 'INSUFICIENTE' ? error.message : 'Error confirmando traslado', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ANULAR TRASLADO  (POST /api/traslados/:id/anular)
// Transaction:
//   1. Verifica estado CONFIRMADA
//   2. Revierte la salida (entrada en origen) al costo congelado
//   3. Revierte la entrada (salida en destino) al costo congelado
//   4. Marca traslado ANULADO
// =====================================================
router.post('/:id/anular', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const IdTraslado = Number(req.params.id);
        const { MotivoAnulacion } = req.body;
        // El usuario que anula proviene de la sesión, no del body.
        const UsuarioIdAnulacion = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        const [traslado] = await conn.query(
            `SELECT IdTraslado, IdBodegaOrigen, IdBodegaDestino, Estado
             FROM traslados WHERE IdTraslado = ? AND IdEmpresa = ? FOR UPDATE`, [IdTraslado, IdEmpresa]
        );
        if (traslado.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Traslado no encontrado' }); }
        if (traslado[0].Estado !== 'CONFIRMADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden anular traslados CONFIRMADOS' }); }

        const [detalle] = await conn.query(
            `SELECT IdProducto, Cantidad, CostoUnitario FROM traslados_detalle WHERE IdTraslado = ?`, [IdTraslado]
        );

        const movimientos = [];
        const notaOrigen = MotivoAnulacion || 'Anulación de traslado (reversa origen)';
        const notaDestino = MotivoAnulacion || 'Anulación de traslado (reversa destino)';

        for (const item of detalle) {
            // Devuelve al origen la cantidad que salió, al costo congelado
            const entradaOrigen = await invBusiness.registrarEntrada(conn, {
                IdProducto: item.IdProducto,
                IdBodega: traslado[0].IdBodegaOrigen,
                TipoMovimiento: 'OTRO',
                DocumentoTipo: 'TRASLADO',
                IdDocumento: IdTraslado,
                cantidad: item.Cantidad,
                costoUnitario: item.CostoUnitario,
                costoTotal: item.Cantidad * item.CostoUnitario,
                UsuarioId: UsuarioIdAnulacion,
                IdEmpresa: IdEmpresa,
                Observaciones: notaOrigen
            });

            // Retira del destino la entrada que recibió, al costo congelado
            const salidaDestino = await invBusiness.revertirEntrada(conn, {
                IdProducto: item.IdProducto,
                IdBodega: traslado[0].IdBodegaDestino,
                TipoMovimiento: 'OTRO',
                DocumentoTipo: 'TRASLADO',
                IdDocumento: IdTraslado,
                cantidad: item.Cantidad,
                costoUnitario: item.CostoUnitario,
                UsuarioId: UsuarioIdAnulacion,
                IdEmpresa: IdEmpresa,
                Observaciones: notaDestino
            });

            movimientos.push({ entradaOrigen, salidaDestino });
        }

        await conn.query(
            `UPDATE traslados SET Estado = 'ANULADA',
                UsuarioIdAnulacion = ?, FechaAnulacion = NOW()
             WHERE IdTraslado = ?`,
            [UsuarioIdAnulacion || null, IdTraslado]
        );

        await conn.commit();
        res.json({ ok: true, mensaje: 'Traslado anulado, inventario revertido en ambas bodegas', movimientos });
    } catch (error) {
        await conn.rollback();
        console.error('Error anulando traslado:', error);
        res.status(500).json({ ok: false, mensaje: 'Error anulando traslado', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ELIMINAR TRASLADO (solo BORRADOR, sin movimientos)
// DELETE /api/traslados/:id
// =====================================================
router.delete('/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const IdTraslado = Number(req.params.id);

        const [actual] = await conn.query(`SELECT Estado FROM traslados WHERE IdTraslado = ?`, [IdTraslado]);
        if (actual.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Traslado no encontrado' }); }
        if (actual[0].Estado !== 'BORRADOR') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden eliminar traslados en BORRADOR' }); }

        await conn.query(`DELETE FROM traslados_detalle WHERE IdTraslado = ?`, [IdTraslado]);
        await conn.query(`DELETE FROM traslados WHERE IdTraslado = ?`, [IdTraslado]);

        await conn.commit();
        res.json({ ok: true, mensaje: 'Traslado eliminado' });
    } catch (error) {
        await conn.rollback();
        console.error('Error eliminando traslado:', error);
        res.status(500).json({ ok: false, mensaje: 'Error eliminando traslado', error: error.message });
    } finally {
        conn.release();
    }
});

module.exports = router;