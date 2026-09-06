const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');
const invBusiness = require('../services/inventarioBusiness');

// =====================================================
// CONSULTAR INVENTARIO POR BODEGA  (GET /api/inventario)
// Filtros: ?bodega=1, ?producto=1, ?buscar=nombre
// =====================================================
router.get('/', async (req, res) => {
    try {
        const condiciones = [];
        const params = [];
        if (req.query.bodega)   { condiciones.push('i.IdBodega = ?'); params.push(Number(req.query.bodega)); }
        if (req.query.producto) { condiciones.push('i.IdProducto = ?'); params.push(Number(req.query.producto)); }
        if (req.query.buscar) {
            condiciones.push('(p.NombreProducto LIKE ? OR p.CodigoProducto LIKE ?)');
            const t = `%${req.query.buscar}%`; params.push(t, t);
        }
        condiciones.push('i.IdEmpresa = ?');
        params.push(req.auth?.IdEmpresa ?? null);
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

        const [rows] = await pool.query(`
            SELECT
                i.IdInventario, i.IdProducto, p.CodigoProducto, p.NombreProducto,
                p.CodigoBarras,
                i.IdBodega, b.CodigoBodega, b.NombreBodega,
                i.Cantidad, i.CostoPromedio, i.CostoTotal,
                p.PrecioVenta,
                CASE WHEN p.PrecioVenta > 0 AND i.CostoPromedio > 0
                     THEN ROUND(p.PrecioVenta - i.CostoPromedio, 4) ELSE 0 END AS MargenUnitario,
                CASE WHEN i.CostoPromedio > 0 AND p.PrecioVenta > 0
                     THEN ROUND(((p.PrecioVenta - i.CostoPromedio) / p.CostoPromedio) * 100, 2) ELSE 0 END AS MargenPorcentaje,
                CASE WHEN i.Cantidad <= 0 THEN 'AGOTADO'
                     WHEN p.StockMinimo > 0 AND i.Cantidad <= p.StockMinimo THEN 'STOCK BAJO'
                     WHEN p.StockMaximo > 0 AND i.Cantidad >= p.StockMaximo THEN 'STOCK ALTO'
                     ELSE 'OK' END AS Alerta,
                p.StockMinimo, p.StockMaximo,
                i.FechaUltimoMovimiento
            FROM inventario i
            INNER JOIN productos p ON p.IdProducto = i.IdProducto
            INNER JOIN bodegas b   ON b.Id = i.IdBodega
            ${where}
            ORDER BY p.NombreProducto, b.NombreBodega
        `, params);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error consultando inventario:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando inventario', error: error.message });
    }
});

// =====================================================
// INVENTARIO CONSOLIDADO POR PRODUCTO  (GET /api/inventario/consolidado)
// =====================================================
router.get('/consolidado', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                p.IdProducto, p.CodigoProducto, p.NombreProducto,
                SUM(i.Cantidad) AS TotalExistencia,
                CASE WHEN SUM(i.Cantidad) > 0 THEN ROUND(SUM(i.CostoTotal) / SUM(i.Cantidad), 4) ELSE 0 END AS CostoPromedioConsolidado,
                ROUND(SUM(i.CostoTotal), 2) AS ValorTotal,
                p.PrecioVenta,
                p.StockMinimo, p.StockMaximo,
                CASE WHEN SUM(i.Cantidad) <= 0 THEN 'AGOTADO'
                     WHEN p.StockMinimo > 0 AND SUM(i.Cantidad) <= p.StockMinimo THEN 'STOCK BAJO'
                     ELSE 'OK' END AS Alerta
            FROM inventario i
            INNER JOIN productos p ON p.IdProducto = i.IdProducto
            WHERE p.Activo = 1 AND i.IdEmpresa = ?
            GROUP BY p.IdProducto, p.CodigoProducto, p.NombreProducto,
                     p.PrecioVenta, p.StockMinimo, p.StockMaximo
            ORDER BY p.NombreProducto
        `, [req.auth?.IdEmpresa ?? null]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error consultando inventario consolidado:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando inventario consolidado', error: error.message });
    }
});

// =====================================================
// INVENTARIO INICIAL  (POST /api/inventario/inicial)
// Registra el stock inicial de múltiples productos en una bodega.
// Solo permite si el producto+bodega NO tiene movimientos previos en Kardex.
// Body: { IdBodega, UsuarioId, Items: [{ IdProducto, Cantidad, CostoUnitario }] }
// =====================================================
router.post('/inicial', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const { IdBodega, Items } = req.body;
        // Usuario y empresa provienen de la sesión, no del body.
        const UsuarioId = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        if (!IdBodega)
            return res.status(400).json({ ok: false, mensaje: 'El IdBodega es obligatorio' });
        if (!Items || !Items.length)
            return res.status(400).json({ ok: false, mensaje: 'Debe agregar al menos un producto' });

        for (const item of Items) {
            if (!item.IdProducto)
                return res.status(400).json({ ok: false, mensaje: 'Cada producto debe tener IdProducto' });
            if (!item.Cantidad || item.Cantidad <= 0)
                return res.status(400).json({ ok: false, mensaje: `Cantidad inválida para producto ${item.IdProducto}` });
            if (item.CostoUnitario === undefined || item.CostoUnitario < 0)
                return res.status(400).json({ ok: false, mensaje: `Costo unitario inválido para producto ${item.IdProducto}` });

            // Verificar que no existan movimientos previos para este producto+bodega
            const [movs] = await conn.query(
                `SELECT COUNT(*) AS total FROM kardex WHERE IdProducto = ? AND IdBodega = ?`,
                [item.IdProducto, IdBodega]
            );
            if (movs[0].total > 0) {
                await conn.rollback();
                return res.status(409).json({
                    ok: false,
                    mensaje: `El producto ${item.IdProducto} ya tiene movimientos en esta bodega. Use ajustes para modificar.`
                });
            }
        }

        const resultados = [];
        for (const item of Items) {
            const resultado = await invBusiness.registrarEntrada(conn, {
                IdProducto: item.IdProducto,
                IdBodega,
                TipoMovimiento: 'INVENTARIO_INICIAL',
                DocumentoTipo: 'INVENTARIO_INICIAL',
                IdDocumento: null,
                cantidad: item.Cantidad,
                costoUnitario: item.CostoUnitario,
                costoTotal: item.Cantidad * item.CostoUnitario,
                UsuarioId,
                IdEmpresa,
                Observaciones: 'Inventario inicial del sistema'
            });
            resultados.push(resultado);
        }

        await conn.commit();
        res.status(201).json({ ok: true, mensaje: 'Inventario inicial registrado', datos: resultados });
    } catch (error) {
        await conn.rollback();
        console.error('Error en inventario inicial:', error);
        res.status(500).json({ ok: false, mensaje: 'Error registrando inventario inicial', error: error.message });
    } finally {
        conn.release();
    }
});

module.exports = router;