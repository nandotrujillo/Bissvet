const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql');


// =====================================================
// LISTAR CATEGORÍAS DE SERVICIO
// =====================================================

router.get('/', async (req, res) => {

    console.log('GET /api/categorias-servicio');

    try {

        const [rows] = await pool.query(`
            SELECT
                IdCategoriaServicio,
                Nombre,
                Descripcion,
                Activo,idModulos
            FROM categoriasservicio
            ORDER BY Nombre
        `);

        res.json({
            ok: true,
            datos: rows
        });

    } catch (error) {

        console.error(
            'Error obteniendo categorías de servicio:',
            error
        );

        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo categorías de servicio',
            error: error.message
        });

    }

});


module.exports = router;