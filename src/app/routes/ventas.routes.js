const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');
const invBusiness = require('../services/inventarioBusiness');

// =====================================================
// LISTAR VENTAS  (GET /api/ventas)
// Filtros: ?doc=1, ?estado=CONFIRMADA, ?cliente=1, ?bodega=1, ?desde&hasta
// =====================================================
router.get('/', async (req, res) => {
    try {
        const condiciones = [];
        const params = [];
        if (req.query.doc)      { condiciones.push('v.IdVenta = ?'); params.push(Number(req.query.doc)); }
        if (req.query.estado)   { condiciones.push('v.Estado = ?'); params.push(req.query.estado); }
        if (req.query.cliente)  { condiciones.push('v.IdCliente = ?'); params.push(Number(req.query.cliente)); }
        if (req.query.mascota)  { condiciones.push('v.IdMascota = ?'); params.push(Number(req.query.mascota)); }
        if (req.query.bodega)   { condiciones.push('v.IdBodega = ?'); params.push(Number(req.query.bodega)); }
        if (req.query.desde) { condiciones.push('v.Fecha >= ?'); params.push(req.query.desde); }
        if (req.query.hasta) { condiciones.push('v.Fecha <= ?'); params.push(req.query.hasta); }
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

        const [rows] = await pool.query(`
            SELECT
                v.IdVenta, v.NumeroVenta, v.Fecha, v.Estado,
                v.IdCliente,
                CONCAT_WS(' ', c.PrimerNombre, c.SegundoNombre,
                          c.PrimerApellido, c.SegundoApellido) AS NombreCliente,
                v.IdMascota, m.Nombre AS NombreMascota,
                v.IdBodega, b.NombreBodega,
                v.Subtotal, v.Descuento, v.Impuesto, v.Total,
                v.CostoTotal, v.Utilidad,
                v.Observaciones, v.UsuarioIdCreacion,
                v.FechaCreacion, v.FechaConfirmacion, v.FechaAnulacion,
                (SELECT COUNT(*) FROM ventas_detalle vd WHERE vd.IdVenta = v.IdVenta) AS TotalItems
            FROM ventas v
            INNER JOIN clientes c    ON c.ClienteId = v.IdCliente
            LEFT JOIN mascotas m     ON m.IdMascota = v.IdMascota
            INNER JOIN bodegas b     ON b.Id = v.IdBodega
            ${where}
            ORDER BY v.Fecha DESC, v.IdVenta DESC
        `, params);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando ventas:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando ventas', error: error.message });
    }
});

// =====================================================
// OBTENER VENTA CON DETALLE  (GET /api/ventas/:id)
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [cabecera] = await pool.query(`
            SELECT
                v.IdVenta, v.NumeroVenta, v.Fecha, v.Estado,
                v.IdCliente,
                CONCAT_WS(' ', c.PrimerNombre, c.SegundoNombre,
                          c.PrimerApellido, c.SegundoApellido) AS NombreCliente,
                v.IdMascota, m.Nombre AS NombreMascota,
                v.IdBodega, b.NombreBodega,
                v.Subtotal, v.Descuento, v.Impuesto, v.Total,
                v.CostoTotal, v.Utilidad,
                v.Observaciones, v.UsuarioIdCreacion, v.FechaCreacion,
                v.UsuarioIdConfirmacion, v.FechaConfirmacion,
                v.UsuarioIdAnulacion, v.FechaAnulacion
            FROM ventas v
            INNER JOIN clientes c    ON c.ClienteId = v.IdCliente
            LEFT JOIN mascotas m     ON m.IdMascota = v.IdMascota
            INNER JOIN bodegas b     ON b.Id = v.IdBodega
            WHERE v.IdVenta = ?
        `, [req.params.id]);
        if (cabecera.length === 0)
            return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada' });

        const [detalle] = await pool.query(`
            SELECT
                vd.IdDetalleVenta, vd.IdVenta, vd.IdProducto,
                p.CodigoProducto, p.NombreProducto,
                vd.Cantidad, vd.PrecioUnitario, vd.Descuento, vd.Impuesto, vd.Total,
                vd.CostoUnitario, vd.CostoTotal, vd.Utilidad
            FROM ventas_detalle vd
            INNER JOIN productos p ON p.IdProducto = vd.IdProducto
            WHERE vd.IdVenta = ?
        `, [req.params.id]);

        res.json({ ok: true, datos: { ...cabecera[0], Detalle: detalle } });
    } catch (error) {
        console.error('Error obteniendo venta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando venta', error: error.message });
    }
});

// =====================================================
// CREAR VENTA (BORRADOR)  (POST /api/ventas)
// Body: { NumeroVenta, IdCliente, IdMascota, IdBodega, Fecha, Observaciones,
//         UsuarioIdCreacion,
//         Detalle: [{ IdProducto, Cantidad, PrecioUnitario, Descuento, Impuesto }] }
// No afecta inventario hasta CONFIRMAR.
// =====================================================
router.post('/', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const {
            NumeroVenta, IdCliente, IdMascota, IdBodega, Fecha, Observaciones,
            UsuarioIdCreacion, Detalle
        } = req.body;

        if (!NumeroVenta || !NumeroVenta.trim())
            return res.status(400).json({ ok: false, mensaje: 'El número de venta es obligatorio' });
        if (!IdCliente)
            return res.status(400).json({ ok: false, mensaje: 'El cliente es obligatorio' });
        if (!IdBodega)
            return res.status(400).json({ ok: false, mensaje: 'La bodega es obligatoria' });
        if (!Detalle || !Detalle.length)
            return res.status(400).json({ ok: false, mensaje: 'Debe agregar al menos un producto' });

        const [duplicado] = await conn.query(`SELECT IdVenta FROM ventas WHERE NumeroVenta = ?`, [NumeroVenta.trim()]);
        if (duplicado.length > 0)
            return res.status(409).json({ ok: false, mensaje: 'Ya existe una venta con ese número' });

        let Subtotal = 0, Descuento = 0, Impuesto = 0, Total = 0;
        for (const item of Detalle) {
            if (!item.IdProducto) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: 'Cada detalle debe tener IdProducto' }); }
            if (!item.Cantidad || item.Cantidad <= 0) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: `Cantidad inválida para producto ${item.IdProducto}` }); }

            const [producto] = await conn.query(
                `SELECT PrecioVenta FROM productos WHERE IdProducto = ?`, [item.IdProducto]
            );
            if (producto.length === 0) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: `Producto ${item.IdProducto} no encontrado` }); }

            const precio = item.PrecioUnitario ?? producto[0].PrecioVenta;
            const base = item.Cantidad * precio;
            const desc = item.Descuento ?? 0;
            const imp = item.Impuesto ?? 0;
            const subLinea = base - desc;
            Subtotal += subLinea;
            Descuento += desc;
            Impuesto += imp;
            Total += subLinea + imp;
        }

        const [cabecera] = await conn.query(
            `INSERT INTO ventas (
                NumeroVenta, IdCliente, IdMascota, IdBodega, Fecha,
                Subtotal, Descuento, Impuesto, Total,
                CostoTotal, Utilidad, Estado, Observaciones, UsuarioIdCreacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'BORRADOR', ?, ?)`,
            [
                NumeroVenta.trim(), IdCliente, IdMascota || null, IdBodega, Fecha || new Date(),
                Subtotal, Descuento, Impuesto, Total,
                Observaciones || null, UsuarioIdCreacion || null
            ]
        );
        const IdVenta = cabecera.insertId;

        for (const item of Detalle) {
            const [producto] = await conn.query(
                `SELECT PrecioVenta FROM productos WHERE IdProducto = ?`, [item.IdProducto]
            );
            const precio = item.PrecioUnitario ?? producto[0].PrecioVenta;
            const base = item.Cantidad * precio;
            const desc = item.Descuento ?? 0;
            const imp = item.Impuesto ?? 0;
            const subLinea = base - desc;
            await conn.query(
                `INSERT INTO ventas_detalle (
                    IdVenta, IdProducto, Cantidad, PrecioUnitario,
                    Descuento, Impuesto, Total, CostoUnitario, CostoTotal, Utilidad
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
                [
                    IdVenta, item.IdProducto, item.Cantidad, precio, desc, imp, subLinea + imp
                ]
            );
        }

        await conn.commit();
        res.status(201).json({ ok: true, mensaje: 'Venta creada en estado BORRADOR', IdVenta });
    } catch (error) {
        await conn.rollback();
        console.error('Error creando venta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando venta', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ACTUALIZAR VENTA (solo BORRADOR)  (PUT /api/ventas/:id)
// Reemplaza cabecera y detalle.
// =====================================================
router.put('/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const { NumeroVenta, IdCliente, IdMascota, IdBodega, Fecha, Observaciones, UsuarioIdModificacion, Detalle } = req.body;
        const IdVenta = Number(req.params.id);

        const [actual] = await conn.query(`SELECT Estado FROM ventas WHERE IdVenta = ?`, [IdVenta]);
        if (actual.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada' }); }
        if (actual[0].Estado !== 'BORRADOR') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden editar ventas en BORRADOR' }); }

        if (!NumeroVenta || !Detalle || !Detalle.length)
            return res.status(400).json({ ok: false, mensaje: 'Número y detalle son obligatorios' });

        let Subtotal = 0, Descuento = 0, Impuesto = 0, Total = 0;
        for (const item of Detalle) {
            if (!item.IdProducto) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: 'Detalle inválido' }); }
            const [producto] = await conn.query(
                `SELECT PrecioVenta FROM productos WHERE IdProducto = ?`, [item.IdProducto]
            );
            const precio = item.PrecioUnitario ?? producto[0].PrecioVenta;
            const base = item.Cantidad * precio;
            const desc = item.Descuento ?? 0;
            const imp = item.Impuesto ?? 0;
            const subLinea = base - desc;
            Subtotal += subLinea; Descuento += desc; Impuesto += imp; Total += subLinea + imp;
        }

        await conn.query(
            `UPDATE ventas SET NumeroVenta=?, IdCliente=?, IdMascota=?, IdBodega=?, Fecha=?,
                Subtotal=?, Descuento=?, Impuesto=?, Total=?, Observaciones=?
             WHERE IdVenta=?`,
            [NumeroVenta.trim(), IdCliente, IdMascota || null, IdBodega, Fecha || new Date(), Subtotal, Descuento, Impuesto, Total, Observaciones || null, IdVenta]
        );
        await conn.query(`DELETE FROM ventas_detalle WHERE IdVenta = ?`, [IdVenta]);
        for (const item of Detalle) {
            const [producto] = await conn.query(
                `SELECT PrecioVenta FROM productos WHERE IdProducto = ?`, [item.IdProducto]
            );
            const precio = item.PrecioUnitario ?? producto[0].PrecioVenta;
            const base = item.Cantidad * precio;
            const desc = item.Descuento ?? 0;
            const imp = item.Impuesto ?? 0;
            const subLinea = base - desc;
            await conn.query(
                `INSERT INTO ventas_detalle (
                    IdVenta, IdProducto, Cantidad, PrecioUnitario,
                    Descuento, Impuesto, Total, CostoUnitario, CostoTotal, Utilidad
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
                [IdVenta, item.IdProducto, item.Cantidad, precio, desc, imp, subLinea + imp]
            );
        }

        await conn.commit();
        res.json({ ok: true, mensaje: 'Venta actualizada' });
    } catch (error) {
        await conn.rollback();
        console.error('Error actualizando venta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando venta', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// CONFIRMAR VENTA  (POST /api/ventas/:id/confirmar)
// Transaction:
//   1. Verifica estado BORRADOR
//   2. Para cada detalle: registra SALIDA en Kardex (VENTA) al costo CPP vigente
//   3. Actualiza CostoUnitario/CostoTotal/Utilidad del detalle y cabecera
//   4. Marca venta como CONFIRMADA
// =====================================================
router.post('/:id/confirmar', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const IdVenta = Number(req.params.id);
        const { UsuarioIdConfirmacion } = req.body;

        const [venta] = await conn.query(
            `SELECT IdVenta, IdBodega, Estado FROM ventas WHERE IdVenta = ? FOR UPDATE`,
            [IdVenta]
        );
        if (venta.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada' }); }
        if (venta[0].Estado === 'CONFIRMADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'La venta ya está confirmada' }); }
        if (venta[0].Estado === 'ANULADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'No se puede confirmar una venta anulada' }); }

        const [detalle] = await conn.query(
            `SELECT IdProducto, Cantidad, PrecioUnitario, Descuento, Impuesto, Total
             FROM ventas_detalle WHERE IdVenta = ?`, [IdVenta]
        );

        let CostoTotal = 0, Utilidad = 0;
        const movimientos = [];
        for (const item of detalle) {
            const salida = await invBusiness.registrarSalida(conn, {
                IdProducto: item.IdProducto,
                IdBodega: venta[0].IdBodega,
                TipoMovimiento: 'VENTA',
                DocumentoTipo: 'VENTA',
                IdDocumento: IdVenta,
                cantidad: item.Cantidad,
                UsuarioId: UsuarioIdConfirmacion,
                Observaciones: 'Salida por venta confirmada'
            });

            const CostoUnitario = Number(salida.costoUnitario);
            const CostoTotalLinea = Number(salida.costoTotal);
            const UtilidadLinea = Number(item.Total) - CostoTotalLinea;

            await conn.query(
                `UPDATE ventas_detalle
                 SET CostoUnitario = ?, CostoTotal = ?, Utilidad = ?
                 WHERE IdVenta = ? AND IdProducto = ?`,
                [CostoUnitario, CostoTotalLinea, UtilidadLinea, IdVenta, item.IdProducto]
            );

            CostoTotal += CostoTotalLinea;
            Utilidad += UtilidadLinea;
            movimientos.push(salida);
        }

        await conn.query(
            `UPDATE ventas SET Estado = 'CONFIRMADA', CostoTotal = ?, Utilidad = ?,
                UsuarioIdConfirmacion = ?, FechaConfirmacion = NOW()
             WHERE IdVenta = ?`,
            [CostoTotal, Utilidad, UsuarioIdConfirmacion || null, IdVenta]
        );

        await conn.commit();
        res.json({ ok: true, mensaje: 'Venta confirmada, inventario actualizado (CPP vigente)', movimientos });
    } catch (error) {
        await conn.rollback();
        console.error('Error confirmando venta:', error);
        res.status(500).json({ ok: false, mensaje: error.codigo === 'INSUFICIENTE' ? error.message : 'Error confirmando venta', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ANULAR VENTA  (POST /api/ventas/:id/anular)
// Transaction:
//   1. Verifica estado CONFIRMADA
//   2. Registra ENTRADA reversa en Kardex por cada detalle (costo congelado)
//   3. Recalcula CPP en inventario
//   4. Marca venta ANULADA y resetea costo/utilidad
// =====================================================
router.post('/:id/anular', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const IdVenta = Number(req.params.id);
        const { UsuarioIdAnulacion, MotivoAnulacion } = req.body;

        const [venta] = await conn.query(
            `SELECT IdVenta, IdBodega, Estado FROM ventas WHERE IdVenta = ? FOR UPDATE`,
            [IdVenta]
        );
        if (venta.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada' }); }
        if (venta[0].Estado !== 'CONFIRMADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden anular ventas CONFIRMADAS' }); }

        const [detalle] = await conn.query(
            `SELECT IdProducto, Cantidad, CostoUnitario FROM ventas_detalle WHERE IdVenta = ?`, [IdVenta]
        );

        const movimientos = [];
        for (const item of detalle) {
            const entrada = await invBusiness.registrarEntrada(conn, {
                IdProducto: item.IdProducto,
                IdBodega: venta[0].IdBodega,
                TipoMovimiento: 'OTRO',
                DocumentoTipo: 'VENTA',
                IdDocumento: IdVenta,
                cantidad: item.Cantidad,
                costoUnitario: item.CostoUnitario,
                costoTotal: item.Cantidad * item.CostoUnitario,
                UsuarioId: UsuarioIdAnulacion,
                Observaciones: MotivoAnulacion || 'Anulación de venta'
            });
            movimientos.push(entrada);
        }

        await conn.query(
            `UPDATE ventas SET Estado = 'ANULADA', CostoTotal = 0, Utilidad = 0,
                UsuarioIdAnulacion = ?, FechaAnulacion = NOW()
             WHERE IdVenta = ?`,
            [UsuarioIdAnulacion || null, IdVenta]
        );

        await conn.commit();
        res.json({ ok: true, mensaje: 'Venta anulada, inventario restaurado', movimientos });
    } catch (error) {
        await conn.rollback();
        console.error('Error anulando venta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error anulando venta', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ELIMINAR VENTA (solo BORRADOR, sin movimientos)
// DELETE /api/ventas/:id
// =====================================================
router.delete('/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const IdVenta = Number(req.params.id);

        const [actual] = await conn.query(`SELECT Estado FROM ventas WHERE IdVenta = ?`, [IdVenta]);
        if (actual.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada' }); }
        if (actual[0].Estado !== 'BORRADOR') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden eliminar ventas en BORRADOR' }); }

        await conn.query(`DELETE FROM ventas_detalle WHERE IdVenta = ?`, [IdVenta]);
        await conn.query(`DELETE FROM ventas WHERE IdVenta = ?`, [IdVenta]);

        await conn.commit();
        res.json({ ok: true, mensaje: 'Venta eliminada' });
    } catch (error) {
        await conn.rollback();
        console.error('Error eliminando venta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error eliminando venta', error: error.message });
    } finally {
        conn.release();
    }
});

module.exports = router;