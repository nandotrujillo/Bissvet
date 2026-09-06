const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');

// =====================================================
// LISTAR TIPOS DE IMPUESTO
// GET /api/tipos-impuesto  (?soloIva=1 para solo el IVA)
// =====================================================
router.get('/', async (req, res) => {
    try {
        const condiciones = ['IdEmpresa = ?'];
        const params = [req.auth.IdEmpresa];
        if (req.query.soloIva) {
            condiciones.push('EsIva = 1');
        }
        const where = condiciones.join(' AND ');
        const [rows] = await pool.query(`
            SELECT Id, NombreImpuesto, Porcentaje, EsIva, Signo
            FROM tipoimpuesto
            WHERE ${where}
            ORDER BY EsIva DESC, Id ASC
        `, params);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando tipos de impuesto:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando tipos de impuesto', error: error.message });
    }
});

// =====================================================
// IMPUESTO A LAS VENTAS (el que aplica por defecto)
// GET /api/tipos-impuesto/ventas
// Devuelve el porcentaje configurado para las ventas de la empresa.
// =====================================================
router.get('/ventas', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT NombreImpuesto, Porcentaje FROM tipoimpuesto
             WHERE IdEmpresa = ?
             ORDER BY EsIva DESC, Id ASC
             LIMIT 1`,
            [req.auth.IdEmpresa]
        );
        if (rows.length === 0) {
            return res.json({ ok: true, datos: { NombreImpuesto: null, Porcentaje: 0 } });
        }
        const pct = Math.min(100, Math.max(0, Number(rows[0].Porcentaje) || 0));
        res.json({ ok: true, datos: { ...rows[0], Porcentaje: pct } });
    } catch (error) {
        console.error('Error obteniendo impuesto a las ventas:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando impuesto a las ventas', error: error.message });
    }
});

module.exports = router;