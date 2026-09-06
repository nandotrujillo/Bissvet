const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');

// =====================================================
// LISTAR UNIDADES DE MEDIDA  (GET /api/unidades-medida)
// =====================================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT Id, Unidad, Descripcion, Activo,
                   FechaCreacion, FechaModificacion
            FROM unidades_medida
            WHERE Activo = 1 AND IdEmpresa = ?
            ORDER BY Unidad
        `, [req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando unidades de medida:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando unidades de medida', error: error.message });
    }
});

module.exports = router;