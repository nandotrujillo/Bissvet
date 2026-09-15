const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');
const invBusiness = require('../Services/inventarioBusiness');

// =====================================================
// LISTAR AJUSTES  (GET /api/ajustes)
// Filtros: ?doc=1, ?estado=CONFIRMADA, ?bodega=1, ?tipo=POSITIVO, ?desde&hasta
// =====================================================
router.get('/', async (req, res) => {
    try {
        const condiciones = [];
        const params = [];
        if (req.query.doc)    { condiciones.push('a.IdAjuste = ?'); params.push(Number(req.query.doc)); }
        if (req.query.estado) { condiciones.push('a.Estado = ?'); params.push(req.query.estado); }
        if (req.query.bodega) { condiciones.push('a.IdBodega = ?'); params.push(Number(req.query.bodega)); }
        if (req.query.tipo)   { condiciones.push('a.TipoAjuste = ?'); params.push(req.query.tipo); }
        if (req.query.desde) { condiciones.push('a.Fecha >= ?'); params.push(req.query.desde); }
        if (req.query.hasta) { condiciones.push('a.Fecha <= ?'); params.push(req.query.hasta); }
        condiciones.push('a.IdEmpresa = ?');
        params.push(req.auth?.IdEmpresa ?? null);
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

        const [rows] = await pool.query(`
            SELECT
                a.IdAjuste, a.Numero, a.Fecha, a.TipoAjuste, a.Estado,
                a.IdBodega, b.NombreBodega,
                a.Motivo, a.Observaciones, a.UsuarioIdCreacion,
                a.FechaCreacion, a.FechaConfirmacion, a.FechaAnulacion,
                (SELECT COUNT(*) FROM ajustes_inventario_detalle ad WHERE ad.IdAjuste = a.IdAjuste) AS TotalItems
            FROM ajustes_inventario a
            INNER JOIN bodegas b ON b.Id = a.IdBodega
            ${where}
            ORDER BY a.Fecha DESC, a.IdAjuste DESC
        `, params);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando ajustes:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando ajustes', error: error.message });
    }
});

// =====================================================
// OBTENER AJUSTE CON DETALLE  (GET /api/ajustes/:id)
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [cabecera] = await pool.query(`
            SELECT
                a.IdAjuste, a.Numero, a.Fecha, a.TipoAjuste, a.Estado,
                a.IdBodega, b.NombreBodega,
                a.Motivo, a.Observaciones, a.UsuarioIdCreacion, a.FechaCreacion,
                a.UsuarioIdConfirmacion, a.FechaConfirmacion,
                a.UsuarioIdAnulacion, a.FechaAnulacion
            FROM ajustes_inventario a
            INNER JOIN bodegas b ON b.Id = a.IdBodega
            WHERE a.IdAjuste = ? AND a.IdEmpresa = ?
        `, [req.params.id, req.auth?.IdEmpresa ?? null]);
        if (cabecera.length === 0)
            return res.status(404).json({ ok: false, mensaje: 'Ajuste no encontrado' });

        const [detalle] = await pool.query(`
            SELECT
                ad.IdAjusteDetalle, ad.IdAjuste, ad.IdProducto,
                p.CodigoProducto, p.NombreProducto,
                ad.Cantidad, ad.CostoUnitario
            FROM ajustes_inventario_detalle ad
            INNER JOIN productos p ON p.IdProducto = ad.IdProducto
            WHERE ad.IdAjuste = ?
        `, [req.params.id]);

        res.json({ ok: true, datos: { ...cabecera[0], Detalle: detalle } });
    } catch (error) {
        console.error('Error obteniendo ajuste:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando ajuste', error: error.message });
    }
});

// =====================================================
// CREAR AJUSTE (BORRADOR)  (POST /api/ajustes)
// Body: { Numero, IdBodega, Fecha, TipoAjuste, Motivo, Observaciones,
//         UsuarioIdCreacion, Detalle: [{ IdProducto, Cantidad, CostoUnitario }] }
// CostoUnitario es obligatorio en POSITIVO; en NEGATIVO se usa el CPP vigente.
// No afecta inventario hasta CONFIRMAR.
// =====================================================
router.post('/', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const {
            Numero, IdBodega, Fecha, TipoAjuste, Motivo, Observaciones,
            Detalle
        } = req.body;
        // Usuario y empresa provienen de la sesión, no del body.
        const UsuarioIdCreacion = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        if (!Numero || !Numero.trim())
            return res.status(400).json({ ok: false, mensaje: 'El número de documento es obligatorio' });
        if (!IdBodega)
            return res.status(400).json({ ok: false, mensaje: 'La bodega es obligatoria' });
        if (!TipoAjuste || !['POSITIVO', 'NEGATIVO'].includes(TipoAjuste))
            return res.status(400).json({ ok: false, mensaje: 'El tipo de ajuste debe ser POSITIVO o NEGATIVO' });
        if (!Motivo || !Motivo.trim())
            return res.status(400).json({ ok: false, mensaje: 'El motivo del ajuste es obligatorio' });
        if (!Detalle || !Detalle.length)
            return res.status(400).json({ ok: false, mensaje: 'Debe agregar al menos un producto' });

        const [duplicado] = await conn.query(
            `SELECT IdAjuste FROM ajustes_inventario WHERE Numero = ? AND IdEmpresa = ?`,
            [Numero.trim(), IdEmpresa]
        );
        if (duplicado.length > 0)
            return res.status(409).json({ ok: false, mensaje: 'Ya existe un ajuste con ese número' });

        for (const item of Detalle) {
            if (!item.IdProducto) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: 'Cada detalle debe tener IdProducto' }); }
            if (!item.Cantidad || item.Cantidad <= 0) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: `Cantidad inválida para producto ${item.IdProducto}` }); }
            if (TipoAjuste === 'POSITIVO' && (item.CostoUnitario === undefined || item.CostoUnitario < 0))
                return res.status(400).json({ ok: false, mensaje: `Costo unitario inválido para producto ${item.IdProducto}` });
        }

        const [cabecera] = await conn.query(
            `INSERT INTO ajustes_inventario (
                Numero, IdBodega, Fecha, TipoAjuste, Estado, Motivo,
                Observaciones, UsuarioIdCreacion, IdEmpresa
            ) VALUES (?, ?, ?, ?, 'BORRADOR', ?, ?, ?, ?)`,
            [
                Numero.trim(), IdBodega, Fecha || new Date(), TipoAjuste,
                Motivo.trim(), Observaciones || null, UsuarioIdCreacion, IdEmpresa
            ]
        );
        const IdAjuste = cabecera.insertId;

        for (const item of Detalle) {
            await conn.query(
                `INSERT INTO ajustes_inventario_detalle (IdAjuste, IdProducto, Cantidad, CostoUnitario, IdEmpresa)
                 VALUES (?, ?, ?, ?, ?)`,
                [IdAjuste, item.IdProducto, item.Cantidad, item.CostoUnitario ?? 0, IdEmpresa]
            );
        }

        await conn.commit();
        res.status(201).json({ ok: true, mensaje: 'Ajuste creado en estado BORRADOR', IdAjuste });
    } catch (error) {
        await conn.rollback();
        console.error('Error creando ajuste:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando ajuste', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ACTUALIZAR AJUSTE (solo BORRADOR)  (PUT /api/ajustes/:id)
// =====================================================
router.put('/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const { Numero, IdBodega, Fecha, TipoAjuste, Motivo, Observaciones, UsuarioIdModificacion, Detalle } = req.body;
        const IdAjuste = Number(req.params.id);

        const [actual] = await conn.query(`SELECT Estado FROM ajustes_inventario WHERE IdAjuste = ?`, [IdAjuste]);
        if (actual.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Ajuste no encontrado' }); }
        if (actual[0].Estado !== 'BORRADOR') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden editar ajustes en BORRADOR' }); }

        if (!Numero || !Detalle || !Detalle.length)
            return res.status(400).json({ ok: false, mensaje: 'Número y detalle son obligatorios' });
        if (!TipoAjuste || !['POSITIVO', 'NEGATIVO'].includes(TipoAjuste))
            return res.status(400).json({ ok: false, mensaje: 'El tipo de ajuste debe ser POSITIVO o NEGATIVO' });

        await conn.query(
            `UPDATE ajustes_inventario SET Numero=?, IdBodega=?, Fecha=?, TipoAjuste=?, Motivo=?, Observaciones=?
             WHERE IdAjuste=?`,
            [Numero.trim(), IdBodega, Fecha || new Date(), TipoAjuste, Motivo, Observaciones || null, IdAjuste]
        );
        await conn.query(`DELETE FROM ajustes_inventario_detalle WHERE IdAjuste = ?`, [IdAjuste]);
        for (const item of Detalle) {
            await conn.query(
                `INSERT INTO ajustes_inventario_detalle (IdAjuste, IdProducto, Cantidad, CostoUnitario)
                 VALUES (?, ?, ?, ?)`,
                [IdAjuste, item.IdProducto, item.Cantidad, item.CostoUnitario ?? 0]
            );
        }

        await conn.commit();
        res.json({ ok: true, mensaje: 'Ajuste actualizado' });
    } catch (error) {
        await conn.rollback();
        console.error('Error actualizando ajuste:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando ajuste', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// CONFIRMAR AJUSTE  (POST /api/ajustes/:id/confirmar)
// Transaction:
//   1. Verifica estado BORRADOR
//   2. POSITIVO  -> ENTRADA en Kardex (AJUSTE_POSITIVO) con el costo indicado
//   3. NEGATIVO  -> SALIDA en Kardex (AJUSTE_NEGATIVO) al CPP vigente
//   4. Actualiza el costo unitario efectivo del detalle
//   5. Marca ajuste CONFIRMADO
// =====================================================
router.post('/:id/confirmar', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const IdAjuste = Number(req.params.id);
        // El usuario que confirma proviene de la sesión, no del body.
        const UsuarioIdConfirmacion = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        const [ajuste] = await conn.query(
            `SELECT IdAjuste, IdBodega, TipoAjuste, Estado FROM ajustes_inventario WHERE IdAjuste = ? AND IdEmpresa = ? FOR UPDATE`,
            [IdAjuste, IdEmpresa]
        );
        if (ajuste.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Ajuste no encontrado' }); }
        if (ajuste[0].Estado === 'CONFIRMADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'El ajuste ya está confirmado' }); }
        if (ajuste[0].Estado === 'ANULADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'No se puede confirmar un ajuste anulado' }); }

        const [detalle] = await conn.query(
            `SELECT IdAjusteDetalle, IdProducto, Cantidad, CostoUnitario
             FROM ajustes_inventario_detalle WHERE IdAjuste = ?`, [IdAjuste]
        );

        const esPositivo = ajuste[0].TipoAjuste === 'POSITIVO';
        const movimientos = [];
        for (const item of detalle) {
            let movimiento;
            if (esPositivo) {
                const costoUnitario = Number(item.CostoUnitario);
                movimiento = await invBusiness.registrarEntrada(conn, {
                    IdProducto: item.IdProducto,
                    IdBodega: ajuste[0].IdBodega,
                    TipoMovimiento: 'AJUSTE_POSITIVO',
                    DocumentoTipo: 'AJUSTE',
                    IdDocumento: IdAjuste,
                    cantidad: item.Cantidad,
                    costoUnitario,
                    costoTotal: item.Cantidad * costoUnitario,
                    UsuarioId: UsuarioIdConfirmacion,
                    IdEmpresa: IdEmpresa,
                    Observaciones: 'Entrada por ajuste positivo de inventario'
                });
            } else {
                movimiento = await invBusiness.registrarSalida(conn, {
                    IdProducto: item.IdProducto,
                    IdBodega: ajuste[0].IdBodega,
                    TipoMovimiento: 'AJUSTE_NEGATIVO',
                    DocumentoTipo: 'AJUSTE',
                    IdDocumento: IdAjuste,
                    cantidad: item.Cantidad,
                    UsuarioId: UsuarioIdConfirmacion,
                    IdEmpresa: IdEmpresa,
                    Observaciones: 'Salida por ajuste negativo de inventario'
                });

                await conn.query(
                    `UPDATE ajustes_inventario_detalle SET CostoUnitario = ?
                     WHERE IdAjusteDetalle = ?`,
                    [movimiento.costoUnitario, item.IdAjusteDetalle]
                );
            }

            movimientos.push(movimiento);
        }

        await conn.query(
            `UPDATE ajustes_inventario SET Estado = 'CONFIRMADA',
                UsuarioIdConfirmacion = ?, FechaConfirmacion = NOW()
             WHERE IdAjuste = ?`,
            [UsuarioIdConfirmacion || null, IdAjuste]
        );

        await conn.commit();
        res.json({ ok: true, mensaje: `Ajuste ${ajuste[0].TipoAjuste} confirmado, inventario actualizado`, movimientos });
    } catch (error) {
        await conn.rollback();
        console.error('Error confirmando ajuste:', error);
        res.status(500).json({ ok: false, mensaje: error.codigo === 'INSUFICIENTE' ? error.message : 'Error confirmando ajuste', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ANULAR AJUSTE  (POST /api/ajustes/:id/anular)
// Transaction:
//   1. Verifica estado CONFIRMADA
//   2. POSITIVO -> revierte la entrada (salida al costo congelado)
//   3. NEGATIVO -> repone la salida (entrada al costo congelado)
//   4. Marca ajuste ANULADO
// =====================================================
router.post('/:id/anular', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const IdAjuste = Number(req.params.id);
        const { MotivoAnulacion } = req.body;
        // El usuario que anula proviene de la sesión, no del body.
        const UsuarioIdAnulacion = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        const [ajuste] = await conn.query(
            `SELECT IdAjuste, IdBodega, TipoAjuste, Estado FROM ajustes_inventario WHERE IdAjuste = ? AND IdEmpresa = ? FOR UPDATE`,
            [IdAjuste, IdEmpresa]
        );
        if (ajuste.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Ajuste no encontrado' }); }
        if (ajuste[0].Estado !== 'CONFIRMADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden anular ajustes CONFIRMADOS' }); }

        const [detalle] = await conn.query(
            `SELECT IdProducto, Cantidad, CostoUnitario
             FROM ajustes_inventario_detalle WHERE IdAjuste = ?`, [IdAjuste]
        );

        const nota = MotivoAnulacion || 'Anulación de ajuste de inventario';
        const movimientos = [];
        for (const item of detalle) {
            const costoUnitario = Number(item.CostoUnitario);

            if (ajuste[0].TipoAjuste === 'POSITIVO') {
                const reversa = await invBusiness.revertirEntrada(conn, {
                    IdProducto: item.IdProducto,
                    IdBodega: ajuste[0].IdBodega,
                    TipoMovimiento: 'OTRO',
                    DocumentoTipo: 'AJUSTE',
                    IdDocumento: IdAjuste,
                    cantidad: item.Cantidad,
                    costoUnitario,
                    UsuarioId: UsuarioIdAnulacion,
                    IdEmpresa: IdEmpresa,
                    Observaciones: nota
                });
                movimientos.push(reversa);
            } else {
                const reposicion = await invBusiness.registrarEntrada(conn, {
                    IdProducto: item.IdProducto,
                    IdBodega: ajuste[0].IdBodega,
                    TipoMovimiento: 'OTRO',
                    DocumentoTipo: 'AJUSTE',
                    IdDocumento: IdAjuste,
                    cantidad: item.Cantidad,
                    costoUnitario,
                    costoTotal: item.Cantidad * costoUnitario,
                    UsuarioId: UsuarioIdAnulacion,
                    IdEmpresa: IdEmpresa,
                    Observaciones: nota
                });
                movimientos.push(reposicion);
            }
        }

        await conn.query(
            `UPDATE ajustes_inventario SET Estado = 'ANULADA',
                UsuarioIdAnulacion = ?, FechaAnulacion = NOW()
             WHERE IdAjuste = ?`,
            [UsuarioIdAnulacion || null, IdAjuste]
        );

        await conn.commit();
        res.json({ ok: true, mensaje: 'Ajuste anulado, inventario revertido', movimientos });
    } catch (error) {
        await conn.rollback();
        console.error('Error anulando ajuste:', error);
        res.status(500).json({ ok: false, mensaje: 'Error anulando ajuste', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ELIMINAR AJUSTE (solo BORRADOR, sin movimientos)
// DELETE /api/ajustes/:id
// =====================================================
router.delete('/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const IdAjuste = Number(req.params.id);

        const [actual] = await conn.query(`SELECT Estado FROM ajustes_inventario WHERE IdAjuste = ?`, [IdAjuste]);
        if (actual.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Ajuste no encontrado' }); }
        if (actual[0].Estado !== 'BORRADOR') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden eliminar ajustes en BORRADOR' }); }

        await conn.query(`DELETE FROM ajustes_inventario_detalle WHERE IdAjuste = ?`, [IdAjuste]);
        await conn.query(`DELETE FROM ajustes_inventario WHERE IdAjuste = ?`, [IdAjuste]);

        await conn.commit();
        res.json({ ok: true, mensaje: 'Ajuste eliminado' });
    } catch (error) {
        await conn.rollback();
        console.error('Error eliminando ajuste:', error);
        res.status(500).json({ ok: false, mensaje: 'Error eliminando ajuste', error: error.message });
    } finally {
        conn.release();
    }
});

module.exports = router;