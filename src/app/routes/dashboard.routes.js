const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql');


// =====================================================
// RESUMEN KPIs DEL DASHBOARD
// =====================================================

router.get('/resumen', async (req, res) => {

    console.log('GET /api/dashboard/resumen');

    const idEmpresa = req.auth.IdEmpresa;

    try {

        const [clientes] = await pool.query(
            'SELECT COUNT(*) AS total FROM clientes WHERE IdEmpresa = ? AND Activo = 1',
            [idEmpresa]
        );

        const [productos] = await pool.query(
            'SELECT COUNT(*) AS total FROM productos WHERE IdEmpresa = ? AND Activo = 1',
            [idEmpresa]
        );

        const [mascotas] = await pool.query(
            'SELECT COUNT(*) AS total FROM mascotas WHERE IdEmpresa = ?',
            [idEmpresa]
        );

        const [citas] = await pool.query(
            `SELECT COUNT(*) AS total FROM citas
             WHERE IdEmpresa = ? AND FechaCita = CURDATE()`,
            [idEmpresa]
        );

        const [ventasHoy] = await pool.query(
            `SELECT IFNULL(SUM(Total), 0) AS total, COUNT(*) AS cantidad
             FROM ventas
             WHERE IdEmpresa = ? AND DATE(Fecha) = CURDATE()
               AND Estado <> 'ANULADA'`,
            [idEmpresa]
        );

        const [inventario] = await pool.query(
            `SELECT IFNULL(SUM(Cantidad), 0) AS unidades
             FROM inventario
             WHERE IdEmpresa = ?`,
            [idEmpresa]
        );

        const [stockBajo] = await pool.query(
            `SELECT COUNT(DISTINCT i.IdProducto) AS total
             FROM inventario i
             INNER JOIN productos p ON i.IdProducto = p.IdProducto
             WHERE i.IdEmpresa = ? AND p.StockMinimo IS NOT NULL
               AND i.Cantidad <= p.StockMinimo`,
            [idEmpresa]
        );

        res.json({
            ok: true,
            datos: {
                clientes: clientes[0].total,
                productos: productos[0].total,
                mascotas: mascotas[0].total,
                citasHoy: citas[0].total,
                ventasHoy: {
                    total: Number(ventasHoy[0].total || 0),
                    cantidad: ventasHoy[0].cantidad
                },
                unidadesInventario: inventario[0].unidades,
                stockBajo: stockBajo[0].total
            }
        });

    } catch (error) {

        console.error('Error obteniendo resumen dashboard:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo resumen del dashboard',
            error: error.message
        });

    }

});


module.exports = router;
