const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');
const invBusiness = require('../services/inventarioBusiness');

// =====================================================
// LISTAR COMPRAS  (GET /api/compras)
// Filtros: ?doc=1, ?estado=CONFIRMADA, ?proveedor=1, ?bodega=1, ?desde&hasta
// =====================================================
router.get('/', async (req, res) => {
    try {
        const condiciones = [];
        const params = [];
        if (req.query.doc)        { condiciones.push('c.IdCompra = ?'); params.push(Number(req.query.doc)); }
        if (req.query.estado)     { condiciones.push('c.Estado = ?'); params.push(req.query.estado); }
        if (req.query.proveedor)  { condiciones.push('c.IdProveedor = ?'); params.push(Number(req.query.proveedor)); }
        if (req.query.bodega)     { condiciones.push('c.IdBodega = ?'); params.push(Number(req.query.bodega)); }
        if (req.query.desde) { condiciones.push('c.Fecha >= ?'); params.push(req.query.desde); }
        if (req.query.hasta) { condiciones.push('c.Fecha <= ?'); params.push(req.query.hasta); }
        condiciones.push('c.IdEmpresa = ?');
        params.push(req.auth?.IdEmpresa ?? null);
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

        const [rows] = await pool.query(`
            SELECT
                c.IdCompra, c.Numero, c.Fecha, c.Estado,
                c.IdProveedor, pr.Nombre AS NombreProveedor, pr.Nit,
                c.IdBodega, b.NombreBodega,
                c.Subtotal, c.Descuento, c.Impuesto, c.Total,
                c.Observaciones, c.UsuarioIdCreacion,
                c.FechaCreacion, c.FechaConfirmacion, c.FechaAnulacion,
                (SELECT COUNT(*) FROM compras_detalle cd WHERE cd.IdCompra = c.IdCompra) AS TotalItems,
                (SELECT COUNT(*) FROM compras_detalle cd WHERE cd.IdCompra = c.IdCompra) AS TotalLineas
            FROM compras c
            INNER JOIN proveedores pr ON pr.IdProveedor = c.IdProveedor
            INNER JOIN bodegas b      ON b.Id = c.IdBodega
            ${where}
            ORDER BY c.Fecha DESC, c.IdCompra DESC
        `, params);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando compras:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando compras', error: error.message });
    }
});

// =====================================================
// OBTENER COMPRA CON DETALLE  (GET /api/compras/:id)
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [cabecera] = await pool.query(`
            SELECT
                c.IdCompra, c.Numero, c.Fecha, c.Estado,
                c.IdProveedor, pr.Nombre AS NombreProveedor, pr.Nit,
                c.IdBodega, b.NombreBodega,
                c.Subtotal, c.Descuento, c.Impuesto, c.Total,
                c.Observaciones, c.UsuarioIdCreacion, c.FechaCreacion,
                c.UsuarioIdConfirmacion, c.FechaConfirmacion,
                c.UsuarioIdAnulacion, c.FechaAnulacion
            FROM compras c
            INNER JOIN proveedores pr ON pr.IdProveedor = c.IdProveedor
            INNER JOIN bodegas b      ON b.Id = c.IdBodega
            WHERE c.IdCompra = ? AND c.IdEmpresa = ?
        `, [req.params.id, req.auth?.IdEmpresa ?? null]);
        if (cabecera.length === 0)
            return res.status(404).json({ ok: false, mensaje: 'Compra no encontrada' });

        const [detalle] = await pool.query(`
            SELECT
                cd.IdDetalleCompra, cd.IdCompra, cd.IdProducto,
                p.CodigoProducto, p.NombreProducto,
                cd.IdLote, l.NumeroLote, l.FechaVencimiento,
                cd.Cantidad, cd.CostoUnitario, cd.Descuento, cd.Impuesto, cd.Total,
                ROUND(cd.Cantidad * cd.CostoUnitario, 4) AS TotalSinImpuesto
            FROM compras_detalle cd
            INNER JOIN productos p ON p.IdProducto = cd.IdProducto
            LEFT JOIN lotes l      ON l.IdLote = cd.IdLote
            WHERE cd.IdCompra = ?
        `, [req.params.id]);

        res.json({ ok: true, datos: { ...cabecera[0], Detalle: detalle } });
    } catch (error) {
        console.error('Error obteniendo compra:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando compra', error: error.message });
    }
});

// =====================================================
// CREAR COMPRA (BORRADOR)  (POST /api/compras)
// Body: { Numero, IdProveedor, IdBodega, Fecha, Observaciones, UsuarioIdCreacion,
//         Detalle: [{ IdProducto, Cantidad, CostoUnitario, Descuento, Impuesto }] }
// No afecta inventario hasta CONFIRMAR.
// =====================================================
router.post('/', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const {
            Numero, IdProveedor, IdBodega, Fecha, Observaciones,
            Detalle
        } = req.body;
        // Usuario y empresa provienen de la sesión, no del body.
        const UsuarioIdCreacion = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        if (!Numero || !Numero.trim())
            return res.status(400).json({ ok: false, mensaje: 'El número de documento es obligatorio' });
        if (!IdProveedor)
            return res.status(400).json({ ok: false, mensaje: 'El proveedor es obligatorio' });
        if (!IdBodega)
            return res.status(400).json({ ok: false, mensaje: 'La bodega es obligatoria' });
        if (!Detalle || !Detalle.length)
            return res.status(400).json({ ok: false, mensaje: 'Debe agregar al menos un producto' });

        // Verificar duplicado de número (dentro de la misma empresa)
        const [duplicado] = await conn.query(
            `SELECT IdCompra FROM compras WHERE Numero = ? AND IdEmpresa = ?`,
            [Numero.trim(), IdEmpresa]
        );
        if (duplicado.length > 0)
            return res.status(409).json({ ok: false, mensaje: 'Ya existe una compra con ese número' });

        // Calcular totales
        let Subtotal = 0, Descuento = 0, Impuesto = 0, Total = 0;
        for (const item of Detalle) {
            if (!item.IdProducto) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: 'Cada detalle debe tener IdProducto' }); }
            if (!item.Cantidad || item.Cantidad <= 0) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: `Cantidad inválida para producto ${item.IdProducto}` }); }
            if (item.CostoUnitario === undefined || item.CostoUnitario < 0) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: `Costo inválido para producto ${item.IdProducto}` }); }

            const base = item.Cantidad * item.CostoUnitario;
            const desc = item.Descuento ?? 0;
            const imp = item.Impuesto ?? 0;
            const subLinea = base - desc;
            Subtotal += subLinea;
            Descuento += desc;
            Impuesto += imp;
            Total += subLinea + imp;
        }

        const [cabecera] = await conn.query(
            `INSERT INTO compras (
                Numero, IdProveedor, IdBodega, Fecha, Subtotal, Descuento,
                Impuesto, Total, Estado, Observaciones, UsuarioIdCreacion, IdEmpresa
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'BORRADOR', ?, ?, ?)`,
            [
                Numero.trim(), IdProveedor, IdBodega, Fecha || new Date(),
                Subtotal, Descuento, Impuesto, Total,
                Observaciones || null, UsuarioIdCreacion, IdEmpresa
            ]
        );
        const IdCompra = cabecera.insertId;

        for (const item of Detalle) {
            const base = item.Cantidad * item.CostoUnitario;
            const desc = item.Descuento ?? 0;
            const imp = item.Impuesto ?? 0;
            const subLinea = base - desc;
            await conn.query(
                `INSERT INTO compras_detalle (
                    IdCompra, IdProducto, IdLote, Cantidad, CostoUnitario,
                    Descuento, Impuesto, Total, IdEmpresa
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    IdCompra, item.IdProducto, item.IdLote || null,
                    item.Cantidad, item.CostoUnitario, desc, imp, subLinea + imp,
                    IdEmpresa
                ]
            );
        }

        await conn.commit();
        res.status(201).json({ ok: true, mensaje: 'Compra creada en estado BORRADOR', IdCompra });
    } catch (error) {
        await conn.rollback();
        console.error('Error creando compra:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando compra', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ACTUALIZAR COMPRA (solo BORRADOR)  (PUT /api/compras/:id)
// Reemplaza cabecera y detalle.
// =====================================================
router.put('/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const { Numero, IdProveedor, IdBodega, Fecha, Observaciones, UsuarioIdModificacion, Detalle } = req.body;
        const IdCompra = Number(req.params.id);

        const [actual] = await conn.query(`SELECT Estado FROM compras WHERE IdCompra = ?`, [IdCompra]);
        if (actual.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Compra no encontrada' }); }
        if (actual[0].Estado !== 'BORRADOR') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden editar compras en BORRADOR' }); }

        if (!Numero || !Detalle || !Detalle.length)
            return res.status(400).json({ ok: false, mensaje: 'Número y detalle son obligatorios' });

        let Subtotal = 0, Descuento = 0, Impuesto = 0, Total = 0;
        for (const item of Detalle) {
            if (!item.IdProducto) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: 'Detalle inválido' }); }
            const base = item.Cantidad * item.CostoUnitario;
            const desc = item.Descuento ?? 0;
            const imp = item.Impuesto ?? 0;
            const subLinea = base - desc;
            Subtotal += subLinea; Descuento += desc; Impuesto += imp; Total += subLinea + imp;
        }

        await conn.query(
            `UPDATE compras SET Numero=?, IdProveedor=?, IdBodega=?, Fecha=?,
                Subtotal=?, Descuento=?, Impuesto=?, Total=?, Observaciones=?
             WHERE IdCompra=?`,
            [Numero.trim(), IdProveedor, IdBodega, Fecha || new Date(), Subtotal, Descuento, Impuesto, Total, Observaciones || null, IdCompra]
        );
        await conn.query(`DELETE FROM compras_detalle WHERE IdCompra = ?`, [IdCompra]);
        for (const item of Detalle) {
            const base = item.Cantidad * item.CostoUnitario;
            const desc = item.Descuento ?? 0;
            const imp = item.Impuesto ?? 0;
            const subLinea = base - desc;
            await conn.query(
                `INSERT INTO compras_detalle (IdCompra, IdProducto, IdLote, Cantidad, CostoUnitario, Descuento, Impuesto, Total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [IdCompra, item.IdProducto, item.IdLote || null, item.Cantidad, item.CostoUnitario, desc, imp, subLinea + imp]
            );
        }

        await conn.commit();
        res.json({ ok: true, mensaje: 'Compra actualizada' });
    } catch (error) {
        await conn.rollback();
        console.error('Error actualizando compra:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando compra', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// CONFIRMAR COMPRA  (POST /api/compras/:id/confirmar)
// Transaction:
//   1. Verifica estado BORRADOR
//   2. Para cada detalle: registra ENTRADA en Kardex (COMPRA)
//   3. Recalcula CPP en inventario del producto+bodega
//   4. Actualiza costo promedio del producto
//   5. Marca compra como CONFIRMADA
// =====================================================
router.post('/:id/confirmar', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const IdCompra = Number(req.params.id);
        // El usuario que confirma proviene de la sesión, no del body.
        const UsuarioIdConfirmacion = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        const [compra] = await conn.query(
            `SELECT IdCompra, IdBodega, Estado FROM compras WHERE IdCompra = ? AND IdEmpresa = ? FOR UPDATE`,
            [IdCompra, IdEmpresa]
        );
        if (compra.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Compra no encontrada' }); }
        if (compra[0].Estado === 'CONFIRMADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'La compra ya está confirmada' }); }
        if (compra[0].Estado === 'ANULADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'No se puede confirmar una compra anulada' }); }

        const [detalle] = await conn.query(
            `SELECT IdProducto, IdLote, Cantidad, CostoUnitario, Impuesto, Descuento, Total
             FROM compras_detalle WHERE IdCompra = ?`, [IdCompra]
        );

        const movimientos = [];
        for (const item of detalle) {
            const entrada = await invBusiness.registrarEntrada(conn, {
                IdProducto: item.IdProducto,
                IdBodega: compra[0].IdBodega,
                TipoMovimiento: 'COMPRA',
                DocumentoTipo: 'COMPRA',
                IdDocumento: IdCompra,
                cantidad: item.Cantidad,
                costoUnitario: item.CostoUnitario,
                costoTotal: item.Cantidad * item.CostoUnitario,
                UsuarioId: UsuarioIdConfirmacion,
                IdEmpresa: IdEmpresa,
                Observaciones: 'Entrada por compra confirmada'
            });

            // Actualizar costo promedio y costo actual del producto
            await conn.query(
                `UPDATE productos SET CostoActual = ?, CostoPromedio = ?
                 WHERE IdProducto = ?`,
                [item.CostoUnitario, entrada.CostoPromedio, item.IdProducto]
            );

            movimientos.push(entrada);
        }

        await conn.query(
            `UPDATE compras SET Estado = 'CONFIRMADA',
                UsuarioIdConfirmacion = ?, FechaConfirmacion = NOW()
             WHERE IdCompra = ?`,
            [UsuarioIdConfirmacion || null, IdCompra]
        );

        await conn.commit();
        res.json({ ok: true, mensaje: 'Compra confirmada, inventario actualizado (CPP recalculado)', movimientos });
    } catch (error) {
        await conn.rollback();
        console.error('Error confirmando compra:', error);
        res.status(500).json({ ok: false, mensaje: 'Error confirmando compra', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ANULAR COMPRA  (POST /api/compras/:id/anular)
// Transaction:
//   1. Verifica estado CONFIRMADA
//   2. Registra SALIDA reversa en Kardex por cada detalle
//   3. Disminuye existencias y CPP
//   4. Marca compra ANULADA
// =====================================================
router.post('/:id/anular', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const IdCompra = Number(req.params.id);
        const { MotivoAnulacion } = req.body;
        // El usuario que anula proviene de la sesión, no del body.
        const UsuarioIdAnulacion = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        const [compra] = await conn.query(
            `SELECT IdCompra, IdBodega, Estado FROM compras WHERE IdCompra = ? AND IdEmpresa = ? FOR UPDATE`,
            [IdCompra, IdEmpresa]
        );
        if (compra.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Compra no encontrada' }); }
        if (compra[0].Estado !== 'CONFIRMADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden anular compras CONFIRMADAS' }); }

        const [detalle] = await conn.query(
            `SELECT IdProducto, Cantidad, CostoUnitario FROM compras_detalle WHERE IdCompra = ?`, [IdCompra]
        );

        const movimientos = [];
        for (const item of detalle) {
            // Reversión: salida a costo del documento original
            const salida = await invBusiness.revertirEntrada(conn, {
                IdProducto: item.IdProducto,
                IdBodega: compra[0].IdBodega,
                TipoMovimiento: 'OTRO',
                DocumentoTipo: 'COMPRA',
                IdDocumento: IdCompra,
                cantidad: item.Cantidad,
                costoUnitario: item.CostoUnitario,
                UsuarioId: UsuarioIdAnulacion,
                IdEmpresa: IdEmpresa,
                Observaciones: MotivoAnulacion || 'Anulación de compra'
            });
            movimientos.push(salida);
        }

        await conn.query(
            `UPDATE compras SET Estado = 'ANULADA',
                UsuarioIdAnulacion = ?, FechaAnulacion = NOW()
             WHERE IdCompra = ?`,
            [UsuarioIdAnulacion || null, IdCompra]
        );

        await conn.commit();
        res.json({ ok: true, mensaje: 'Compra anulada, inventario revertido', movimientos });
    } catch (error) {
        await conn.rollback();
        console.error('Error anulando compra:', error);
        res.status(500).json({ ok: false, mensaje: 'Error anulando compra', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ELIMINAR COMPRA (solo BORRADOR, sin movimientos)
// DELETE /api/compras/:id
// =====================================================
router.delete('/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const IdCompra = Number(req.params.id);

        const [actual] = await conn.query(`SELECT Estado FROM compras WHERE IdCompra = ?`, [IdCompra]);
        if (actual.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Compra no encontrada' }); }
        if (actual[0].Estado !== 'BORRADOR') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden eliminar compras en BORRADOR' }); }

        await conn.query(`DELETE FROM compras_detalle WHERE IdCompra = ?`, [IdCompra]);
        await conn.query(`DELETE FROM compras WHERE IdCompra = ?`, [IdCompra]);

        await conn.commit();
        res.json({ ok: true, mensaje: 'Compra eliminada' });
    } catch (error) {
        await conn.rollback();
        console.error('Error eliminando compra:', error);
        res.status(500).json({ ok: false, mensaje: 'Error eliminando compra', error: error.message });
    } finally {
        conn.release();
    }
});

module.exports = router;