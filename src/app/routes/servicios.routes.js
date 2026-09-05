const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql');


// =====================================================
// LISTAR SERVICIOS
// =====================================================

router.get('/', async (req, res) => {

    console.log('GET /api/servicios');

    try {

        const [rows] = await pool.query(`
            SELECT
                IdServicio,
                IdCategoriaServicio,
                Nombre, Descripcion,
                Precio
            FROM servicios
            ORDER BY IdServicio
        `);

        res.json({
            ok: true,
            datos: rows
        });

    } catch (error) {

        console.error('Error obteniendo servicios:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo servicios',
            error: error.message
        });

    }

});


module.exports = router;