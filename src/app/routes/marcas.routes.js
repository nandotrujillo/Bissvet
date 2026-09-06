const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');

// =====================================================
// LISTAR MARCAS  (GET /api/marcas)
// =====================================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT Id, Nombre, Descripcion, Activo,
                   FechaCreacion, FechaModificacion
            FROM marcas
            WHERE Activo = 1 AND IdEmpresa = ?
            ORDER BY Nombre
        `, [req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando marcas:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando marcas', error: error.message });
    }
});

module.exports = router;