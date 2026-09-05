const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');

// =====================================================
// CONSULTAR KARDEX  (GET /api/kardex)
// Filtros: ?producto=1, ?bodega=1, ?desde=2025-01-01, ?hasta=2025-12-31, ?tipo=COMPRA
// =====================================================
router.get('/', async (req, res) => {
    try {
        const condiciones = [];
        const params = [];

        if (req.query.producto) { condiciones.push('k.IdProducto = ?'); params.push(Number(req.query.producto)); }
        if (req.query.bodega)   { condiciones.push('k.IdBodega = ?');   params.push(Number(req.query.bodega)); }
        if (req.query.tipo)     { condiciones.push('k.TipoMovimiento = ?'); params.push(req.query.tipo); }
        if (req.query.documentoTipo) { condiciones.push('k.DocumentoTipo = ?'); params.push(req.query.documentoTipo); }
        if (req.query.desde) { condiciones.push('k.Fecha >= ?'); params.push(req.query.desde); }
        if (req.query.hasta) { condiciones.push('k.Fecha <= ?'); params.push(req.query.hasta + ' 23:59:59'); }

        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

        const [rows] = await pool.query(`
            SELECT
                k.IdKardex, k.Fecha,
                k.IdProducto, p.CodigoProducto, p.NombreProducto,
                k.IdBodega, b.CodigoBodega, b.NombreBodega,
                k.TipoMovimiento, k.DocumentoTipo, k.IdDocumento,
                k.EntradaCantidad, k.EntradaCostoUnitario, k.EntradaCostoTotal,
                k.SalidaCantidad, k.SalidaCostoUnitario, k.SalidaCostoTotal,
                k.SaldoCantidad, k.CostoPromedio, k.SaldoValor,
                k.Observaciones
            FROM kardex k
            INNER JOIN productos p ON p.IdProducto = k.IdProducto
            INNER JOIN bodegas b   ON b.Id = k.IdBodega
            ${where}
            ORDER BY k.Fecha DESC, k.IdKardex DESC
        `, params);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error consultando Kardex:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando Kardex', error: error.message });
    }
});

// =====================================================
// RESUMEN DE KARDEX POR PRODUCTO  (GET /api/kardex/resumen)
// Consolidado de movimientos en un rango de fechas
// =====================================================
router.get('/resumen', async (req, res) => {
    try {
        const condiciones = [];
        const params = [];
        if (req.query.producto) { condiciones.push('k.IdProducto = ?'); params.push(Number(req.query.producto)); }
        if (req.query.bodega)   { condiciones.push('k.IdBodega = ?');   params.push(Number(req.query.bodega)); }
        if (req.query.desde) { condiciones.push('k.Fecha >= ?'); params.push(req.query.desde); }
        if (req.query.hasta) { condiciones.push('k.Fecha <= ?'); params.push(req.query.hasta + ' 23:59:59'); }
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

        const [rows] = await pool.query(`
            SELECT
                k.IdProducto, p.CodigoProducto, p.NombreProducto,
                k.IdBodega, b.NombreBodega,
                SUM(k.EntradaCantidad) AS TotalEntradas,
                SUM(k.EntradaCostoTotal) AS ValorEntradas,
                SUM(k.SalidaCantidad) AS TotalSalidas,
                SUM(k.SalidaCostoTotal) AS ValorSalidas,
                (SELECT k2.SaldoCantidad FROM kardex k2
                 WHERE k2.IdProducto = k.IdProducto AND k2.IdBodega = k.IdBodega
                 ORDER BY k2.Fecha DESC, k2.IdKardex DESC LIMIT 1) AS SaldoActual,
                (SELECT k3.CostoPromedio FROM kardex k3
                 WHERE k3.IdProducto = k.IdProducto AND k3.IdBodega = k.IdBodega
                 ORDER BY k3.Fecha DESC, k3.IdKardex DESC LIMIT 1) AS CostoPromedio
            FROM kardex k
            INNER JOIN productos p ON p.IdProducto = k.IdProducto
            INNER JOIN bodegas b   ON b.Id = k.IdBodega
            ${where}
            GROUP BY k.IdProducto, p.CodigoProducto, p.NombreProducto, k.IdBodega, b.NombreBodega
            ORDER BY p.NombreProducto
        `, params);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error consultando resumen Kardex:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando resumen Kardex', error: error.message });
    }
});

module.exports = router;